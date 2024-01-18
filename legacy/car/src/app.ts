import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';

import {
	Engine,
	Scene,
	Vector3,
	Mesh,
	Color3,
	Color4,
	ShadowGenerator,
	GlowLayer,
	PointLight,
	FreeCamera,
	CubeTexture,
	Sound,
	PostProcess,
	Effect,
	SceneLoader,
	Matrix,
	MeshBuilder,
	Quaternion,
	AssetsManager,
	EngineFactory,
	ArcRotateCamera,
	Tools,
	HemisphericLight,
	StandardMaterial,
	Texture,
	MultiMaterial,
	SubMesh,
	Vector4,
	Animation,
} from '@babylonjs/core';
import earcut from 'earcut';
class App {
	private scene: Scene;
	private engine: Engine;

	constructor() {
		this.init();
	}

	private async init() {
		const canvas = this.createCanvas();
		this.engine = (await EngineFactory.CreateAsync(canvas, undefined)) as Engine;
		this.scene = new Scene(this.engine);
		await this.main();
	}

	private async main() {
		const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 2.5, 3, Vector3.Zero());
		camera.attachControl(true);
		const light = new HemisphericLight('light', new Vector3(0, 1, 0));

		this.buildCar();

		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
		this.engine.runRenderLoop(() => {
			this.scene.render();
		});
	}

	private buildCar() {
		const outline = [new Vector3(-0.3, 0, -0.1), new Vector3(0.2, 0, -0.1)];

		for (let i = 0; i < 20; i++) {
			outline.push(
				new Vector3(
					0.2 * Math.cos((i * Math.PI) / 40),
					0,
					0.2 * Math.sin((i * Math.PI) / 40) - 0.1
				)
			);
		}

		outline.push(new Vector3(0, 0, 0.1));
		outline.push(new Vector3(-0.3, 0, 0.1));

		const faceUV = [];
		faceUV[0] = new Vector4(0, 0.5, 0.38, 1);
		faceUV[1] = new Vector4(0, 0, 1, 0.5);
		faceUV[2] = new Vector4(0.38, 1, 0, 0.5);

		const carMat = new StandardMaterial('carMat');
		carMat.diffuseTexture = new Texture('./textures/car.png');

		const car = MeshBuilder.ExtrudePolygon(
			'car',
			{ shape: outline, depth: 0.2, faceUV: faceUV, wrap: true },
			this.scene,
			earcut
		);
		this.buildWheel(car);
		car.material = carMat;
		car.rotation.x = -Math.PI / 2;

		const animCar = new Animation(
			'carAnimation',
			'position.x',
			30,
			Animation.ANIMATIONTYPE_FLOAT,
			Animation.ANIMATIONLOOPMODE_CYCLE
		);

		const carKeys = [];
		carKeys.push({ frame: 0, value: -4 });
		carKeys.push({ frame: 150, value: 4 });
		animCar.setKeys(carKeys);
		car.animations.push(animCar);
		this.scene.beginAnimation(car, 0, 150, true);

		return car;
	}

	private buildWheel(car: Mesh) {
		const wheelUV = [];
		wheelUV[0] = new Vector4(0, 0, 1, 1);
		wheelUV[1] = new Vector4(0, 0.5, 0, 0.5);
		wheelUV[2] = new Vector4(0, 0, 1, 1);

		//car material
		const wheelMat = new StandardMaterial('wheelMat');
		wheelMat.diffuseTexture = new Texture('./textures/wheel.png');

		const wheelRB = MeshBuilder.CreateCylinder('wheelRB', {
			diameter: 0.125,
			height: 0.05,
			faceUV: wheelUV,
		});
		wheelRB.material = wheelMat;
		const aniWheel = new Animation(
			'wheelAnimation',
			'rotation.y',
			30,
			Animation.ANIMATIONTYPE_FLOAT,
			Animation.ANIMATIONLOOPMODE_CYCLE
		);
		const wheelKeys = [];

		wheelKeys.push({ frame: 0, value: 0 });
		wheelKeys.push({ frame: 30, value: 2 * Math.PI });

		aniWheel.setKeys(wheelKeys);
		wheelRB.animations.push(aniWheel);
		wheelRB.parent = car;
		wheelRB.position.z = -0.1;
		wheelRB.position.x = -0.2;
		wheelRB.position.y = 0.035;

		const wheelRF = wheelRB.clone('whellRF');
		wheelRF.position.x = 0.1;

		const wheelLB = wheelRB.clone('whellLB');
		wheelLB.position.y = -0.2 - 0.035;

		const wheelLF = wheelRF.clone('whellLF');
		wheelLF.position.y = -0.2 - 0.035;

		this.scene.beginAnimation(wheelRB, 0, 30, true);
		this.scene.beginAnimation(wheelRF, 0, 30, true);
		this.scene.beginAnimation(wheelLB, 0, 30, true);
		this.scene.beginAnimation(wheelLF, 0, 30, true);
	}

	private createCanvas() {
		document.documentElement.style['overflow'] = 'hidden';
		document.documentElement.style.overflow = 'hidden';
		document.documentElement.style.width = '100%';
		document.documentElement.style.height = '100%';
		document.documentElement.style.margin = '0';
		document.documentElement.style.padding = '0';
		document.body.style.overflow = 'hidden';
		document.body.style.width = '100%';
		document.body.style.height = '100%';
		document.body.style.margin = '0';
		document.body.style.padding = '0';

		//create the canvas html element and attach it to the webpage
		const canvas = document.createElement('canvas');
		canvas.style.width = '100%';
		canvas.style.height = '100%';
		canvas.id = 'gameCanvas';
		document.body.appendChild(canvas);
		return canvas;
	}
}

new App();
