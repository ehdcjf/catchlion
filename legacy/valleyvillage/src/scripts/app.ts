import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';

import {
	Engine,
	Scene,
	Vector3,
	Color3,
	FreeCamera,
	Sound,
	SceneLoader,
	MeshBuilder,
	EngineFactory,
	ArcRotateCamera,
	Tools,
	HemisphericLight,
	StandardMaterial,
	Texture,
	Animation,
	CubeTexture,
	DynamicTexture,
	SpriteManager,
	Sprite,
	Mesh,
	ParticleSystem,
	Color4,
	PointerEventTypes,
} from '@babylonjs/core';

class App {
	private scene: Scene;
	private engine: Engine;
	private canvas: HTMLCanvasElement;
	private fountain: Mesh;
	private particleSystem: ParticleSystem;
	private switched: boolean;
	constructor() {
		this.init();
	}

	private async init() {
		this.canvas = document.querySelector('#gameCanvas') as HTMLCanvasElement;
		this.engine = (await EngineFactory.CreateAsync(this.canvas, undefined)) as Engine;
		this.scene = new Scene(this.engine);
		await this.main();
	}

	private async main() {
		const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 2.5, 15, new Vector3(0, 0, 0));
		camera.upperBetaLimit = Math.PI / 2.2;
		camera.attachControl(true);
		const light = new HemisphericLight('light', new Vector3(0, 2, 0));
		light.intensity = 0.7;
		this.setSkyBox();
		await SceneLoader.ImportMeshAsync('', './models/', 'valleyvillage.glb', this.scene);
		await SceneLoader.ImportMeshAsync('car', './models/', 'car.glb', this.scene);
		await SceneLoader.ImportMeshAsync('lamp', './models/', 'lamp.babylon', this.scene);

		this.setCar();
		this.setTrees();
		this.setUFO();
		this.setFountain();
		this.setFountainParticleSystem();
		this.setPointerDownFountainEvent();
		(this.scene.getMeshByName('ground').material as StandardMaterial).maxSimultaneousLights = 5;
		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
		this.engine.runRenderLoop(() => {
			this.scene.render();
		});
	}

	private setCar() {
		const car = this.scene.getMeshByName('car');
		car.rotation = new Vector3(Math.PI / 2, 0, -Math.PI / 2);
		car.position.y = 0.16;
		car.position.x = -3;
		car.position.z = 8;

		const animCar = new Animation(
			'carAnimation',
			'position.z',
			30,
			Animation.ANIMATIONTYPE_FLOAT,
			Animation.ANIMATIONLOOPMODE_CYCLE
		);

		const carKeys = [
			{ frame: 0, value: 10 },
			{ frame: 200, value: -15 },
		];

		animCar.setKeys(carKeys);

		car.animations.push(animCar);

		this.scene.beginAnimation(car, 0, 200, true);

		const wheelRB = this.scene.getMeshByName('wheelRB');
		const wheelRF = this.scene.getMeshByName('wheelRF');
		const wheelLB = this.scene.getMeshByName('wheelLB');
		const wheelLF = this.scene.getMeshByName('wheelLF');

		this.scene.beginAnimation(wheelRB, 0, 30, true);
		this.scene.beginAnimation(wheelRF, 0, 30, true);
		this.scene.beginAnimation(wheelLB, 0, 30, true);
		this.scene.beginAnimation(wheelLF, 0, 30, true);
	}

	private setSkyBox() {
		const skybox = MeshBuilder.CreateBox('skybox', { size: 150 }, this.scene);
		const skyboxMaterial = new StandardMaterial('skyboxMat', this.scene);
		skyboxMaterial.backFaceCulling = false;
		skyboxMaterial.reflectionTexture = new CubeTexture('./textures/skybox', this.scene);

		skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
		skyboxMaterial.diffuseColor = Color3.White();
		skyboxMaterial.specularColor = Color3.White();
		skybox.material = skyboxMaterial;
	}

	private setTrees() {
		const spriteManagerTrees = new SpriteManager(
			'treesManager',
			'./textures/palmtree.png',
			2000,
			{ width: 512, height: 1024 },
			this.scene
		);

		for (let i = 0; i < 500; i++) {
			const tree1 = new Sprite('tree', spriteManagerTrees);
			tree1.position.x = Math.random() * -30;
			tree1.position.z = Math.random() * 20 + 8;
			tree1.position.y = 0.5;

			const tree2 = new Sprite('tree', spriteManagerTrees);
			tree2.position.x = Math.random() * 25 + 7;
			tree2.position.z = Math.random() * -35 + 8;
			tree2.position.y = 0.5;
		}
	}

	private setUFO() {
		const spriteManagerUFO = new SpriteManager(
			'UFOManager',
			'./sprites/ufo.png',
			1,
			{ width: 128, height: 76 },
			this.scene
		);
		const ufo = new Sprite('ufo', spriteManagerUFO);
		ufo.playAnimation(0, 16, true, 125);
		ufo.position.y = 5;
		ufo.position.z = 0;
		ufo.width = 2;
		ufo.height = 1;
	}

	private setFountain() {
		const fountainProfile = [
			Vector3.Zero(),
			new Vector3(0.5, 0, 0),
			new Vector3(0.5, 0.2, 0),
			new Vector3(0.4, 0.2, 0),
			new Vector3(0.4, 0.05, 0),
			new Vector3(0.05, 0.1, 0),
			new Vector3(0.05, 0.75, 0),
			new Vector3(0.15, 0.85, 0),
		];

		this.fountain = MeshBuilder.CreateLathe(
			'fountain',
			{
				shape: fountainProfile,
				sideOrientation: Mesh.DOUBLESIDE,
			},
			this.scene
		);

		this.fountain.position.x = -4;
		this.fountain.position.z = -6;
	}

	private setFountainParticleSystem() {
		const particleSystem = new ParticleSystem('particles', 5000, this.scene);
		particleSystem.particleTexture = new Texture('./textures/flare.png');

		particleSystem.emitter = new Vector3(-4, 0.8, -6);
		particleSystem.minEmitBox = new Vector3(-0.01, 0, -0.01);
		particleSystem.maxEmitBox = new Vector3(0.01, 0, 0.01);

		particleSystem.color1 = new Color4(0.7, 0.8, 1.0, 1.0);
		particleSystem.color2 = new Color4(0.2, 0.5, 1.0, 1.0);
		particleSystem.colorDead = new Color4(0, 0, 0.2, 0.0);

		particleSystem.minSize = 0.01;
		particleSystem.maxSize = 0.05;

		particleSystem.minLifeTime = 0.3;
		particleSystem.maxLifeTime = 1.5;

		particleSystem.emitRate = 1500;
		particleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE;

		particleSystem.gravity = new Vector3(0, -9.81, 0);

		particleSystem.direction1 = new Vector3(-1, 8, 1);
		particleSystem.direction2 = new Vector3(1, 8, -1);

		particleSystem.minAngularSpeed = 0;
		particleSystem.maxAngularSpeed = Math.PI;

		particleSystem.minEmitPower = 0.2;
		particleSystem.maxEmitPower = 0.6;
		particleSystem.updateSpeed = 0.01;

		this.particleSystem = particleSystem;
	}

	private setPointerDownFountainEvent() {
		this.scene.onPointerObservable.add((pointerInfo) => {
			if (
				pointerInfo.type === PointerEventTypes.POINTERDOWN &&
				pointerInfo.pickInfo.hit &&
				pointerInfo.pickInfo.pickedMesh == this.fountain
			) {
				this.switched = !this.switched;
				this.switched ? this.particleSystem.start() : this.particleSystem.stop();
			}
		});
	}
}

new App();
