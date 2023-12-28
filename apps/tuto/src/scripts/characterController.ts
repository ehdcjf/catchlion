import {
	Scene,
	Vector3,
	Ray,
	TransformNode,
	Mesh,
	Color3,
	Color4,
	UniversalCamera,
	Quaternion,
	AnimationGroup,
	ExecuteCodeAction,
	ActionManager,
	ParticleSystem,
	Texture,
	SphereParticleEmitter,
	Sound,
	Observable,
	ShadowGenerator,
	MeshBuilder,
} from '@babylonjs/core';
import { PlayerInput } from './inputController';

export class Player extends TransformNode {
	public camera: UniversalCamera;
	private input: PlayerInput;
	private scene: Scene;
	// Player
	public mesh: Mesh;

	// Camera
	private camRoot: TransformNode;
	private yTilt: TransformNode;

	//animation
	private run: AnimationGroup;
	private idle: AnimationGroup;
	private jump: AnimationGroup;
	private land: AnimationGroup;
	private dash: AnimationGroup;

	// animation trackers
	private currentAnim: AnimationGroup = null;
	private prevAnim: AnimationGroup;
	private isFalling: boolean = false;
	private jumped: boolean = false;

	// const values
	private static readonly PLAYER_SPEED: number = 0.45;
	private static readonly JUMP_FORCE: number = 0.8;
	private static readonly GRAVITY: number = -2.8;
	private static readonly DASH_FACTOR: number = 2.5;
	private static readonly DASH_TIME: number = 10;
	private static readonly DOWN_TILT: Vector3 = new Vector3(0.8290313946973066, 0, 0);
	private static readonly ORIGINAL_TILT: Vector3 = new Vector3(0.5934119456780721, 0, 0);
	public dashTime: number = 0;

	// player movement vars
	private deltaTime: number = 0;
	private h: number;
	private v: number;

	private moveDirection: Vector3 = new Vector3();
	private inputAmt: number;

	//dashing
	private dashPressed: boolean;
	private canDash: boolean = true;

	//gravity, ground detection, jumping
	private gravity: Vector3 = new Vector3();
	private lastGroundPos: Vector3 = Vector3.Zero();
	private grounded: boolean;
	private jumpCount: number = 1;

	// player variables
	public lanternLit: number = 1;
	public totalLanterns: number;
	public win: boolean = false;

	//sparkler
	public sparkler: ParticleSystem;
	public sparkLit: boolean = true;
	public sparkReset: boolean = false;

	//moving platform
	public raisePlatform: boolean;

	//sfx
	public lightSfx: Sound;
	public sparkResetSfx: Sound;
	private resetSfx: Sound;
	private walkingSfx: Sound;
	private jumpingSfx: Sound;
	private dashingSfx: Sound;

	// observables
	public onRun = new Observable();

	// tutorial
	public tutorialMove: boolean;
	public tutorialDash: boolean;
	public tutorialJump: boolean;

	constructor(
		assets: { mesh: Mesh; animationGroups: any },
		scene: Scene,
		shadowGenerator: ShadowGenerator,
		input?: PlayerInput
	) {
		super('player', scene);
		this.scene = scene;

		//set up sounds
		this.loadSounds();

		//camera
		this.setPlayerCamera();
		this.mesh = assets.mesh;
		this.mesh.parent = this;

		this.scene.getLightByName('sparklight').parent = this.scene.getTransformNodeByName('Empty');

		this.dash = assets.animationGroups[0];
		this.idle = assets.animationGroups[1];
		this.jump = assets.animationGroups[2];
		this.land = assets.animationGroups[3];
		this.run = assets.animationGroups[4];

		this.mesh.actionManager = new ActionManager(this.scene);

		this.mesh.actionManager.registerAction(
			new ExecuteCodeAction(
				{
					trigger: ActionManager.OnIntersectionEnterTrigger,
					parameter: this.scene.getMeshByName('destination'),
				},
				() => {
					if (this.lanternLit == 22) {
						this.win = true;
						this.yTilt.rotation = new Vector3(
							5.689773361501514,
							0.23736477827122882,
							0
						);
						this.yTilt.position = new Vector3(0, 6, 0);
						this.camera.position.y = 17;
					}
				}
			)
		);

		this.mesh.actionManager.registerAction(
			new ExecuteCodeAction(
				{
					trigger: ActionManager.OnIntersectionEnterTrigger,
					parameter: this.scene.getMeshByName('ground'),
				},
				() => {
					this.mesh.position.copyFrom(this.lastGroundPos);
					this.resetSfx.play();
				}
			)
		);

		this.onRun.add((play) => {
			if (play && !this.walkingSfx.isPlaying) {
				this.walkingSfx.play();
			} else if (!play && this.walkingSfx.isPlaying) {
				this.walkingSfx.stop();
				this.walkingSfx.isPlaying = false;
			}
		});

		this.createSparkles();
		this.setUpAnimations();
		shadowGenerator.addShadowCaster(assets.mesh);

		this.input = input;
	}

	public activatePlayerCamera(): UniversalCamera {
		this.scene.registerBeforeRender(() => {
			this.beforeRenderUpdate();
			this.updateCamera();
		});
		return this.camera;
	}

	private beforeRenderUpdate() {
		this.updateFromControls();
		this.updateGroundDetection();
		this.animatePlayer();
	}

	private updateFromControls(): void {
		this.deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;

		this.moveDirection = Vector3.Zero();
		this.h = this.input.horizontal;
		this.v = this.input.vertical;

		if ((this.h != 0 || this.v != 0) && !this.tutorialMove) {
			this.tutorialMove = true;
		}

		if (this.input.dashing && !this.dashPressed && this.canDash && !this.grounded) {
			this.canDash = false;
			this.dashPressed = true;
			this.currentAnim = this.dash;
			this.dashingSfx.play();

			if (!this.tutorialDash) this.tutorialDash = true;
		}

		let dashFactor = 1;
		if (this.dashPressed) {
			if (this.dashTime > Player.DASH_TIME) {
				this.dashTime = 0;
				this.dashPressed = false;
			} else {
				dashFactor = Player.DASH_FACTOR;
			}
			this.dashTime++;
		}

		const forward = this.camRoot.forward;
		const right = this.camRoot.right;
		const correctedVertical = forward.scaleInPlace(this.v);
		const correctedHorizontal = right.scaleInPlace(this.h);

		const move = correctedHorizontal.addInPlace(correctedVertical);

		this.moveDirection = new Vector3(move.normalize().x * dashFactor, 0, move.normalize().z * dashFactor);

		const inputMag = Math.abs(this.h) + Math.abs(this.v);
		if (inputMag < 0) this.inputAmt = 0;
		else if (inputMag > 1) this.inputAmt = 1;
		else this.inputAmt = inputMag;

		this.moveDirection = this.moveDirection.scaleInPlace(this.inputAmt * Player.PLAYER_SPEED);

		const input = new Vector3(this.input.horizontalAxis, 0, this.input.verticalAxis);
		if (input.length() == 0) return;

		const angle = Math.atan2(this.input.horizontalAxis, this.input.verticalAxis) + this.camRoot.rotation.y;

		const targ = Quaternion.FromEulerAngles(0, angle, 0);
		this.mesh.rotationQuaternion = Quaternion.Slerp(
			this.mesh.rotationQuaternion,
			targ,
			10 * this.deltaTime
		);
	}

	private updateGroundDetection() {
		this.deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;

		if (!this.isGrounded()) {
			if (this.checkSlope() && this.gravity) {
				this.gravity.y = 0;
				this.jumpCount = 1;
				this.grounded = true;
			} else {
				this.gravity = this.gravity.addInPlace(
					Vector3.Up().scale(this.deltaTime * Player.GRAVITY)
				);
				this.grounded = false;
			}
		}

		if (this.gravity.y < -Player.JUMP_FORCE) this.gravity.y = -Player.JUMP_FORCE;

		if (this.gravity.y < 0 && this.jumped) this.isFalling = true;

		this.mesh.moveWithCollisions(this.moveDirection.addInPlace(this.gravity));

		if (this.isGrounded()) {
			this.gravity.y = 0;
			this.grounded = true;
			this.lastGroundPos.copyFrom(this.mesh.position);

			this.jumpCount = 1;
			this.canDash = true;

			this.dashTime = 0;
			this.dashPressed = false;

			this.jumped = false;
			this.isFalling = false;
		}

		if (this.input.jumpKeyDown && this.jumpCount > 0) {
			this.gravity.y = Player.JUMP_FORCE;
			this.jumpCount--;

			this.jumped = true;
			this.isFalling = false;
			this.jumpingSfx.play();

			if (!this.tutorialJump) this.tutorialJump = true;
		}
	}

	private isGrounded() {
		return !this.floorRaycast(0, 0, 6).equals(Vector3.Zero());
	}

	private floorRaycast(offestx: number, offsetz: number, raycastlen: number): Vector3 {
		const raycastFloorPos = new Vector3(
			this.mesh.position.x + offestx,
			this.mesh.position.y + 0.5,
			this.mesh.position.z + offsetz
		);
		const ray = new Ray(raycastFloorPos, Vector3.Up().scale(-1), raycastlen);

		const pradicate = (mesh: Mesh) => mesh.isPickable && mesh.isEnabled();

		const pick = this.scene.pickWithRay(ray, pradicate);
		if (pick.hit) return pick.pickedPoint;
		else Vector3.Zero();
	}

	private checkSlope(): boolean {
		const predicate = (mesh: Mesh) => mesh.isPickable && mesh.isEnabled();

		const raycast = new Vector3(
			this.mesh.position.x,
			this.mesh.position.y + 0.5,
			this.mesh.position.z + 0.25
		);
		const ray = new Ray(raycast, Vector3.Up().scale(-1), 1.5);
		const pick = this.scene.pickWithRay(ray, predicate);

		const raycast2 = new Vector3(
			this.mesh.position.x,
			this.mesh.position.y + 0.5,
			this.mesh.position.z - 0.25
		);
		const ray2 = new Ray(raycast2, Vector3.Up().scale(-1), 1.5);
		const pick2 = this.scene.pickWithRay(ray2, predicate);

		const raycast3 = new Vector3(
			this.mesh.position.x + 0.25,
			this.mesh.position.y + 0.5,
			this.mesh.position.z
		);
		const ray3 = new Ray(raycast3, Vector3.Up().scale(-1), 1.5);
		const pick3 = this.scene.pickWithRay(ray3, predicate);

		const raycast4 = new Vector3(
			this.mesh.position.x - 0.25,
			this.mesh.position.y + 0.5,
			this.mesh.position.z
		);
		const ray4 = new Ray(raycast4, Vector3.Up().scale(-1), 1.5);
		const pick4 = this.scene.pickWithRay(ray4, predicate);

		if (pick.hit && !pick.getNormal().equals(Vector3.Up()) && pick.pickedMesh.name.includes('stair'))
			return true;
		else if (
			pick2.hit &&
			!pick2.getNormal().equals(Vector3.Up()) &&
			pick2.pickedMesh.name.includes('stair')
		)
			return true;
		else if (
			pick3.hit &&
			!pick3.getNormal().equals(Vector3.Up()) &&
			pick3.pickedMesh.name.includes('stair')
		)
			return true;
		else if (
			pick4.hit &&
			!pick4.getNormal().equals(Vector3.Up()) &&
			pick4.pickedMesh.name.includes('stair')
		)
			return true;
		return false;
	}

	private animatePlayer() {
		if (
			!this.dashPressed &&
			!this.isFalling &&
			!this.jumped &&
			(this.input.inputMap['ArrowUp'] ||
				this.input.inputMap['ArrowDown'] ||
				this.input.inputMap['ArrowLeft'] ||
				this.input.inputMap['ArrowRight'] ||
				this.input.mobileUp ||
				this.input.mobileDown ||
				this.input.mobileLeft ||
				this.input.mobileRight)
		) {
			this.currentAnim = this.run;
			this.onRun.notifyObservers(true);
		} else if (this.jumped && !this.isFalling && !this.dashPressed) {
			this.currentAnim = this.jump;
		} else if (!this.isFalling && this.grounded) {
			this.currentAnim = this.idle;
			if (this.scene.getSoundByName('walking').isPlaying) {
				this.onRun.notifyObservers(false);
			}
		} else if (this.isFalling) {
			this.currentAnim = this.land;
		}

		if (this.currentAnim != null && this.prevAnim !== this.currentAnim) {
			this.prevAnim.stop();
			this.currentAnim.play(this.currentAnim.loopAnimation);
			this.prevAnim = this.currentAnim;
		}
	}

	private updateCamera() {
		if (this.mesh.intersectsMesh(this.scene.getMeshByName('cornerTrigger'))) {
			if (this.input.horizontalAxis > 0) {
				this.camRoot.rotation = Vector3.Lerp(
					this.camRoot.rotation,
					new Vector3(this.camRoot.rotation.x, Math.PI / 2, this.camRoot.rotation.z),
					0.4
				);
			} else if (this.input.horizontalAxis < 0) {
				this.camRoot.rotation = Vector3.Lerp(
					this.camRoot.rotation,
					new Vector3(this.camRoot.rotation.x, Math.PI, this.camRoot.rotation.z),
					0.4
				);
			}
		}

		if (this.mesh.intersectsMesh(this.scene.getMeshByName('festivalTrigger'))) {
			if (this.input.verticalAxis > 0) {
				this.yTilt.rotation = Vector3.Lerp(this.yTilt.rotation, Player.DOWN_TILT, 0.4);
			} else if (this.input.verticalAxis < 0) {
				this.yTilt.rotation = Vector3.Lerp(this.yTilt.rotation, Player.ORIGINAL_TILT, 0.4);
			}
		}

		if (this.mesh.intersectsMesh(this.scene.getMeshByName('destinationTrigger'))) {
			if (this.input.verticalAxis > 0) {
				this.yTilt.rotation = Vector3.Lerp(this.yTilt.rotation, Player.ORIGINAL_TILT, 0.4);
			} else if (this.input.verticalAxis < 0) {
				this.yTilt.rotation = Vector3.Lerp(this.yTilt.rotation, Player.DOWN_TILT, 0.4);
			}
		}

		const centerPlayer = this.mesh.position.y + 2;
		this.camRoot.position = Vector3.Lerp(
			this.camRoot.position,
			new Vector3(this.mesh.position.x, centerPlayer, this.mesh.position.z),
			0.4
		);
	}

	private createSparkles(): void {
		const sphere = MeshBuilder.CreateSphere('sparkles', { segments: 4, diameter: 1 }, this.scene);
		sphere.position = new Vector3(0, 0, 0);
		sphere.parent = this.scene.getTransformNodeByName('Empty');
		sphere.isVisible = false;

		const particleSystem = new ParticleSystem('sparkles', 1000, this.scene);
		particleSystem.particleTexture = new Texture('textures/flwr.png', this.scene);
		particleSystem.emitter = sphere;
		particleSystem.particleEmitterType = new SphereParticleEmitter(0);

		particleSystem.updateSpeed = 0.014;
		particleSystem.minAngularSpeed = 0;
		particleSystem.maxAngularSpeed = 360;
		particleSystem.minEmitPower = 1;
		particleSystem.maxEmitPower = 3;

		particleSystem.minSize = 0.5;
		particleSystem.maxSize = 2;
		particleSystem.minScaleX = 0.5;
		particleSystem.minScaleY = 0.5;
		particleSystem.color1 = new Color4(0.8, 0.8549019607843137, 1, 1);
		particleSystem.color2 = new Color4(0.8509803921568627, 0.7647058823529411, 1, 1);

		particleSystem.addRampGradient(0, Color3.White());
		particleSystem.addRampGradient(1, Color3.Black());
		particleSystem.getRampGradients()[0].color = Color3.FromHexString('#BBC1FF');
		particleSystem.getRampGradients()[1].color = Color3.FromHexString('#FFFFFF');
		particleSystem.maxAngularSpeed = 0;
		particleSystem.maxInitialRotation = 360;
		particleSystem.minAngularSpeed = -10;
		particleSystem.maxAngularSpeed = 10;

		particleSystem.start();

		this.sparkler = particleSystem;
	}

	private setUpAnimations() {
		this.scene.stopAllAnimations();
		this.run.loopAnimation = true;
		this.idle.loopAnimation = true;

		this.currentAnim = this.idle;
		this.prevAnim = this.land;
	}

	private loadSounds(): void {
		this.lightSfx = new Sound('light', './sounds/Rise03.mp3', this.scene, () => {});
		this.sparkResetSfx = new Sound('sparkReset', './sounds/Rise04.mp3', this.scene, () => {});
		this.jumpingSfx = new Sound(
			'jumping',
			'./sounds/187024__lloydevans09__jump2.wav',
			this.scene,
			() => {},
			{
				volume: 0.25,
			}
		);

		this.dashingSfx = new Sound(
			'dashing',
			'./sounds/194081__potentjello__woosh-noise-1.wav',
			this.scene,
			() => {}
		);

		this.walkingSfx = new Sound('walking', './sounds/Concrete 2.wav', this.scene, () => {}, {
			loop: true,
			volume: 0.2,
			playbackRate: 0.6,
		});

		this.resetSfx = new Sound('reset', './sounds/Retro Magic Protection 25.wav', this.scene, () => {}, {
			volume: 0.25,
		});
	}

	private setPlayerCamera(): UniversalCamera {
		this.camRoot = new TransformNode('root');
		this.camRoot.position = new Vector3(0, 0, 0);
		this.camRoot.rotation = new Vector3(0, Math.PI, 0);

		const yTilt = new TransformNode('ytilt');
		yTilt.rotation = Player.ORIGINAL_TILT;
		yTilt.parent = this.camRoot;
		this.yTilt = yTilt;

		this.camera = new UniversalCamera('cam', new Vector3(0, 0, -30), this.scene);
		this.camera.lockedTarget = this.camRoot.position;
		this.camera.fov = 0.47350045992678597;
		this.camera.parent = yTilt;

		this.scene.activeCamera = this.camera;
		return this.camera;
	}
}
