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
	PointLight,
	CubeTexture,
} from '@babylonjs/core';
import { UI } from './ui';
import { SliderGroup } from '@babylonjs/gui';

class App {
	private scene!: Scene;
	private engine!: Engine;
	unitVec: Vector3;
	ui!: UI;
	sphere!: Mesh;
	camera!: ArcRotateCamera;

	constructor() {
		this.init();
		this.unitVec = new Vector3(1, 1, 1);
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
		this.ui = new UI(this.scene);
		// this.addGroup();
		this.addText();
		this.buildSphere();
		this.buildGround();
		this.buildSkybox();
		this.camera.upperBetaLimit = Tools.ToRadians(75);
		this.camera.lowerBetaLimit = 0;

		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
	}

	private setCamera() {
		const camera = new ArcRotateCamera('arcCamera', 0, 0.8, 100, Vector3.Zero(), this.scene);
		camera.attachControl(true);
		this.camera = camera;
	}

	private setLight() {
		const light = new PointLight('omni', new Vector3(0, 100, 100));
	}

	private buildSphere() {
		const sphere = MeshBuilder.CreateSphere('sphere', {}, this.scene);
		sphere.scaling = this.unitVec.scale(5);
		this.sphere = sphere;
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

	private addGroup() {
		const alpha = new SliderGroup('alphaSG');
		alpha.addSlider(
			'Alpha',
			(angle) => {
				this.camera.alpha = angle;
			},
			'degs',
			0,
			2 * Math.PI,
			0,
			(value) => {
				return Tools.ToDegrees(value) | 0;
			}
		);

		const beta = new SliderGroup('betaSG');
		beta.addSlider(
			'Beta',
			(angle) => {
				this.camera.beta = angle;
			},
			'degs',
			0,
			Math.PI,
			0,
			(value) => {
				return Tools.ToDegrees(value) | 0;
			}
		);

		const radius = new SliderGroup('radiusSG');
		radius.addSlider(
			'Alpha',
			(angle) => {
				this.camera.radius = angle;
			},
			'size',
			0,
			1000,
			0,
			(value) => {
				return value;
			}
		);

		this.ui.selectBox?.addGroup(alpha);
		this.ui.selectBox?.addGroup(beta);
		this.ui.selectBox?.addGroup(radius);

		// const lowerAlphaLimit = new SliderGroup('lowerAlphaLimitSG');
		// const upperAlphaLimit = new SliderGroup('upperAlphaLimitSG');

		const lowerBetaLimit = new SliderGroup('lowerBetaLimitSG');
		const upperBetaLimit = new SliderGroup('upperBetaLimitSG');

		// const lowerRadiusLimit = new SliderGroup('lowerRadiusLimitSG');
		// const upperRadiusLimit = new SliderGroup('upperRadiusLimitSG');

		// const wheelDeltaPercentage = new SliderGroup('wheelDeltaPercentageSG');
		// const pinchDeltaPercentage = new SliderGroup('pinchDeltaPercentageSG');
		// const angularSensibilityX = new SliderGroup('angularSensibilityXSG');
		// const angularSensibilityY = new SliderGroup('angularSensibilityYSG');
	}

	private addText() {
		this.ui.addText(this.ui.panel!, (c) => {
			c.text = `alpha: ${Tools.ToDegrees(this.camera.alpha)}`;
		});
		this.ui.addText(this.ui.panel!, (c) => {
			c.text = `beta: ${Tools.ToDegrees(this.camera.beta)}`;
		});
		this.ui.addText(this.ui.panel!, (c) => {
			c.text = `radius: ${this.camera.radius}`;
		});
	}
}

new App();
