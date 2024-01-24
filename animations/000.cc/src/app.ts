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
	HavokPlugin,
	PhysicsAggregate,
	Mesh,
	PhysicsShapeType,
	DirectionalLight,
	CubeTexture,
} from '@babylonjs/core';

class App {
	private scene!: Scene;
	private engine!: Engine;

	constructor() {
		this.init();
	}

	private async init() {
		const canvas = document.querySelector('#gameCanvas') as HTMLCanvasElement;
		this.engine = (await EngineFactory.CreateAsync(canvas, undefined)) as Engine;

		this.createScene();
		this.engine.runRenderLoop(() => {
			if (this.scene) this.scene.render();
		});
		window.addEventListener('resize', () => {
			this.engine.resize();
		});
	}

	private async createScene() {
		this.scene = new Scene(this.engine);
		this.setCamera();
		this.setLight();
		this.buildSkybox();
		this.buildGround();
		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
	}

	private setCamera() {
		const camera = new ArcRotateCamera(
			'camera',
			Math.PI / 2,
			Math.PI / 4,
			10,
			new Vector3(0, -5, 0),
			this.scene
		);
		camera.lowerRadiusLimit = 2;
		camera.upperRadiusLimit = 10;
		camera.wheelDeltaPercentage = 0.01;
		this.scene.activeCamera = camera;
		this.scene.activeCamera.attachControl(true);
	}

	private setLight() {
		const light = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), this.scene);
		light.intensity = 0.6;
		light.specular = Color3.Black();

		const light2 = new DirectionalLight('dirLight', new Vector3(0, -0.5, -1.0), this.scene);
		light2.position = new Vector3(0, 5, 5);
	}

	private buildSkybox() {
		const skybox = MeshBuilder.CreateBox('skyBox', { size: 1000 }, this.scene);
		const skyboxMaterial = new StandardMaterial('skyMat', this.scene);
		skyboxMaterial.backFaceCulling = false;
		skyboxMaterial.reflectionTexture = new CubeTexture('./textures/skybox2', this.scene);
		skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
		skyboxMaterial.specularColor = Color3.Black();
		skyboxMaterial.diffuseColor = Color3.Black();
		skybox.material = skyboxMaterial;
		return skybox;
	}

	private buildGround() {
		const ground = MeshBuilder.CreateGround(
			'ground',
			{ height: 40, width: 50, subdivisions: 4 },
			this.scene
		);

		const groundMat = new StandardMaterial('groundMat', this.scene);
		const groundTexture = new Texture('./textures/wood.jpg', this.scene);

		groundTexture.uScale = 30;
		groundTexture.vScale = 30;

		groundMat.diffuseTexture = groundTexture;
		groundMat.specularColor = new Color3(0.1, 0.1, 0.1);

		ground.material = groundMat;
		return ground;
	}
}

new App();
