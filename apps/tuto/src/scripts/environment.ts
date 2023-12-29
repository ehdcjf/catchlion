import {
	Scene,
	Mesh,
	Vector3,
	Color3,
	TransformNode,
	SceneLoader,
	ParticleSystem,
	Color4,
	Texture,
	PBRMetallicRoughnessMaterial,
	VertexBuffer,
	AnimationGroup,
	Sound,
	ExecuteCodeAction,
	ActionManager,
	Tags,
	MeshBuilder,
} from '@babylonjs/core';
import { Lantern } from './lantern';
import { Player } from './characterController';

export class Environment {
	public lanternArray: Array<Lantern>;
	private lightmtl: PBRMetallicRoughnessMaterial;

	private fireworkArray: Array<Firework> = [];
	private startFireworks: boolean = false;

	constructor(private scene: Scene) {
		this.scene = scene;
		this.lanternArray = [];

		this.lightmtl = new PBRMetallicRoughnessMaterial('lantern mesh light', this.scene);
		this.lightmtl.emissiveTexture = new Texture('/textures/litLantern.png', this.scene, true, false);
		this.lightmtl.emissiveColor = new Color3(0.8784313725490196, 0.7568627450980392, 0.6235294117647059);
	}

	public async load() {
		const assets = await this.loadAsset();

		assets.allMeshes.forEach((m) => {
			m.receiveShadows = true;
			m.checkCollisions = true;

			if (m.name == 'ground') {
				m.checkCollisions = false;
				m.isPickable = false;
			}

			if (
				m.name.includes('stairs') ||
				m.name == 'cityentranceground' ||
				m.name == 'fishingground.001' ||
				m.name.includes('lilyflwr')
			) {
				m.checkCollisions = false;
				m.isPickable = false;
			}

			if (m.name.includes('collision')) {
				m.isVisible = false;
				m.isPickable = true;
			}

			if (m.name.includes('Trigger')) {
				m.isVisible = false;
				m.isPickable = false;
				m.checkCollisions = false;
			}
		});

		assets.lantern.isVisible = false;
		const lanternHolder = new TransformNode('lanternHolder', this.scene);
		for (let i = 0; i < 22; i++) {
			const lanternInstance = assets.lantern.clone('lantern' + i);
			lanternInstance.isVisible = true;
			lanternInstance.setParent(lanternHolder);

			const animGroupClone = new AnimationGroup('lanternAnimGroup' + i);
			animGroupClone.addTargetedAnimation(
				assets.animationGroups.targetedAnimations[0].animation,
				lanternInstance
			);

			const newLantern = new Lantern(
				this.lightmtl,
				lanternInstance,
				this.scene,
				assets.env
					.getChildTransformNodes(false)
					.find((m) => m.name == 'lantern ' + i)
					.getAbsolutePosition(),
				animGroupClone
			);
			this.lanternArray.push(newLantern);
		}

		assets.lantern.dispose();
		assets.animationGroups.dispose();

		for (let i = 0; i < 20; i++) {
			this.fireworkArray.push(new Firework(this.scene, i));
		}

		this.scene.onBeforeRenderObservable.add(() => {
			this.fireworkArray.forEach((f) => {
				if (this.startFireworks) {
					f.startFirework();
				}
			});
		});
	}

	private async loadAsset() {
		const result = await SceneLoader.ImportMeshAsync(null, './models/', 'envSetting.glb', this.scene);

		const env = result.meshes[0];
		const allMeshes = env.getChildMeshes();

		const res = await SceneLoader.ImportMeshAsync('', './models/', 'lantern.glb', this.scene);

		const lantern = res.meshes[0].getChildren()[0];
		lantern.parent = null;
		res.meshes[0].dispose();

		const importedAnims = res.animationGroups;
		const animation = [];
		animation.push(importedAnims[0].targetedAnimations[0].animation);
		importedAnims[0].dispose();

		const animGroup = new AnimationGroup('lanternAnimGroup');
		animGroup.addTargetedAnimation(animation[0], res.meshes[1]);

		return {
			env: env,
			allMeshes: allMeshes,
			lantern: lantern as Mesh,
			animationGroups: animGroup,
		};
	}

	public checkLanterns(player: Player) {
		if (!this.lanternArray[0].isLit) {
			this.lanternArray[0].setEmissiveTexture();
		}
		this.lanternArray.forEach((lantern) => {
			player.mesh.actionManager.registerAction(
				new ExecuteCodeAction(
					{
						trigger: ActionManager.OnIntersectionEnterTrigger,
						parameter: lantern.mesh,
					},
					() => {
						if (!lantern.isLit && player.sparkLit) {
							player.lanternLit += 1;
							lantern.setEmissiveTexture();
							player.sparkReset = true;
							player.sparkLit = true;

							player.lightSfx.play();
						} else if (lantern.isLit) {
							player.sparkReset = true;
							player.sparkLit = true;

							player.sparkResetSfx.play();
						}
					}
				)
			);
		});
	}
}

class Firework {
	private emitter: Mesh;
	private rocket: ParticleSystem;
	private exploded: boolean = false;
	private height: number;
	private delay: number;
	private started: boolean;

	private explosionSfx: Sound;
	private rocketSfx: Sound;

	constructor(private scene: Scene, i: number) {
		const sphere = MeshBuilder.CreateSphere('rocket', { segments: 4, diameter: 1 }, this.scene);
		sphere.isVisible = false;
		const randPos = Math.random() * 10;
		sphere.position = new Vector3(
			this.scene.getTransformNodeByName('fireworks').getAbsolutePosition().x + randPos * -1,
			this.scene.getTransformNodeByName('fireworks').getAbsolutePosition().y,
			this.scene.getTransformNodeByName('fireworks').getAbsolutePosition().z
		);
		this.emitter = sphere;

		const rocket = new ParticleSystem('rocket', 350, this.scene);
		rocket.particleTexture = new Texture('./textures/flare.png', this.scene);
		rocket.emitter = sphere;
		rocket.emitRate = 20;
		rocket.minEmitBox = new Vector3(0, 0, 0);
		rocket.maxEmitBox = new Vector3(0, 0, 0);
		rocket.color1 = new Color4(0.49, 0.57, 0.76);
		rocket.color2 = new Color4(0.29, 0.29, 0.66);
		rocket.colorDead = new Color4(0, 0, 0.2, 0.5);
		rocket.minSize = 1;
		rocket.maxSize = 1;
		rocket.addSizeGradient(0, 1);
		rocket.addSizeGradient(1, 0.01);
		this.rocket = rocket;

		this.height = sphere.position.y + Math.random() * (15 + 4) + 4;
		this.delay = (Math.random() * i + 1) * 60;
		this.loadSounds();
	}

	public startFirework(): void {
		if (this.started) {
			if (this.emitter.position.y >= this.height && !this.exploded) {
				this.explosionSfx.play();
				this.exploded = !this.exploded;
				this.explosions(this.emitter.position);
				this.emitter.dispose();
				this.rocket.stop();
			} else {
				this.emitter.position.y += 0.2;
			}
		} else {
			if (this.delay <= 0) {
				this.started = true;
				this.rocketSfx.play();
				this.rocket.start();
			} else {
				this.delay--;
			}
		}
	}

	private explosions(position: Vector3): void {
		const explosions = MeshBuilder.CreateSphere('explosion', { segments: 4, diameter: 1 }, this.scene);
		explosions.isVisible = false;
		explosions.position = position;

		explosions.useVertexColors = true;
		const vertPos = explosions.getVerticesData(VertexBuffer.PositionKind);
		const vertNorms = explosions.getVerticesData(VertexBuffer.NormalKind);
		const vertColors = [];

		for (let i = 0; i < vertPos.length; i += 3) {
			const vertPosition = new Vector3(vertPos[i], vertPos[i + 1], vertPos[i + 2]);
			const vertNormal = new Vector3(vertNorms[i], vertNorms[i + 1], vertNorms[i + 2]);

			const r = Math.random();
			const g = Math.random();
			const b = Math.random();
			const a = 1.0;
			const color = new Color4(r, g, b, a);
			vertColors.push(r);
			vertColors.push(g);
			vertColors.push(b);
			vertColors.push(a);

			const gizmo = MeshBuilder.CreateBox('gizmo', { size: 0.001 }, this.scene);
			gizmo.position = vertPosition;
			gizmo.parent = explosions;
			const direction = vertNormal.normalize().scale(1);

			const particleSystem = new ParticleSystem('particles', 500, this.scene);
			particleSystem.particleTexture = new Texture('textures/flare.png', this.scene);
			particleSystem.emitter = gizmo;
			particleSystem.minEmitBox = new Vector3(1, 0, 0);
			particleSystem.maxEmitBox = new Vector3(1, 0, 0);
			particleSystem.minSize = 0.1;
			particleSystem.maxSize = 0.1;
			particleSystem.color1 = color;
			particleSystem.color2 = color;
			particleSystem.colorDead = new Color4(0, 0, 0, 0.0);
			particleSystem.minLifeTime = 1;
			particleSystem.maxLifeTime = 2;
			particleSystem.emitRate = 500;
			particleSystem.gravity = new Vector3(0, -9.8, 0);
			particleSystem.direction1 = direction;
			particleSystem.direction2 = direction;
			particleSystem.minEmitPower = 10;
			particleSystem.maxEmitPower = 13;
			particleSystem.updateSpeed = 0.01;
			particleSystem.targetStopDuration = 0.2;
			particleSystem.disposeOnStop = true;
			particleSystem.start();
		}
		explosions.setVerticesData(VertexBuffer.ColorKind, vertColors);
	}

	private loadSounds(): void {
		this.rocketSfx = new Sound('selection', './sounds/fw_05.wav', this.scene, () => {}, { volume: 0.5 });
		this.explosionSfx = new Sound('selection', './sounds/fw_03.wav', this.scene, () => {}, { volume: 0.5 });
	}
}
