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
	Animation,
	Skeleton,
	AbstractMesh,
	Axis,
	Space,
} from '@babylonjs/core';

class Walk {
	constructor(public turn: number, public dist: number) {}
}

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
		const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 2.5, 15, new Vector3(0, 0, 0));
		camera.attachControl(true);
		const light = new HemisphericLight('light', new Vector3(1, 1, 0));

		await SceneLoader.ImportMeshAsync('', './models/', 'village.glb', this.scene);
		await SceneLoader.ImportMeshAsync('', './models/', 'car.glb', this.scene);

		const { meshes, skeletons } = await SceneLoader.ImportMeshAsync(
			'him',
			'./scenes/',
			'Dude.babylon',
			this.scene
		);

		const track: Array<Walk> = [];
		track.push(new Walk(86, 7));
		track.push(new Walk(-85, 14.8));
		track.push(new Walk(-93, 16.5));
		track.push(new Walk(48, 25.5));
		track.push(new Walk(-112, 30.5));
		track.push(new Walk(-72, 33.2));
		track.push(new Walk(42, 37.5));
		track.push(new Walk(-98, 45.2));
		track.push(new Walk(0, 47));

		this.animateCar();
		this.animateDude(meshes[0], skeletons[0], track);

		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
		this.engine.runRenderLoop(() => {
			this.scene.render();
		});
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

	private animateCar() {
		const car = this.scene.getMeshByName('car');
		car.rotation = new Vector3(Math.PI / 2, 0, -Math.PI / 2);
		car.position.x = -3;
		car.position.y = 0.16;
		car.position.z = 8;

		const animCar = new Animation(
			'carAnimation',
			'position.z',
			30,
			Animation.ANIMATIONTYPE_FLOAT,
			Animation.ANIMATIONLOOPMODE_CYCLE
		);

		const carKeys = [];

		carKeys.push({
			frame: 0,
			value: 8,
		});

		carKeys.push({
			frame: 150,
			value: -7,
		});

		carKeys.push({
			frame: 200,
			value: -7,
		});

		animCar.setKeys(carKeys);

		car.animations.push(animCar);

		this.scene.beginAnimation(car, 0, 200, true);

		//wheel animation
		const wheelRB = this.scene.getMeshByName('wheelRB');
		const wheelRF = this.scene.getMeshByName('wheelRF');
		const wheelLB = this.scene.getMeshByName('wheelLB');
		const wheelLF = this.scene.getMeshByName('wheelLF');

		this.scene.beginAnimation(wheelRB, 0, 30, true);
		this.scene.beginAnimation(wheelRF, 0, 30, true);
		this.scene.beginAnimation(wheelLB, 0, 30, true);
		this.scene.beginAnimation(wheelLF, 0, 30, true);
	}

	private animateDude(mesh: AbstractMesh, skeleton: Skeleton, track: Array<Walk>) {
		mesh.scaling = new Vector3(0.008, 0.008, 0.008);

		mesh.position = new Vector3(-6, 0, 0);
		mesh.rotate(Axis.Y, Tools.ToRadians(-95), Space.LOCAL);
		const startRotation = mesh.rotationQuaternion.clone();

		this.scene.beginAnimation(skeleton, 0, 100, true, 1.0);

		let distance = 0;
		const step = 0.015;
		let p = 0;

		this.scene.onBeforeRenderObservable.add(() => {
			mesh.movePOV(0, 0, step);
			distance += step;
			if (distance > track[p].dist) {
				mesh.rotate(Axis.Y, Tools.ToRadians(track[p].turn), Space.LOCAL);
				p += 1;
				p %= track.length;
				if (p == 0) {
					distance = 0;
					mesh.position = new Vector3(-6, 0, 0);
					mesh.rotationQuaternion = startRotation.clone();
				}
			}
		});
	}
}

new App();
