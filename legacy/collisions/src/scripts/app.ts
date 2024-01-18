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
	private hitBox: Mesh;
	private carReady: boolean;

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
		const camera = new ArcRotateCamera('camera', -Math.PI / 2.2, Math.PI / 2.2, 15, new Vector3(0, 0, 0));

		camera.attachControl(true);
		const light = new HemisphericLight('light', new Vector3(1, 1, 0));

		const wireMat = new StandardMaterial('wireMat');
		wireMat.alpha = 0;

		this.hitBox = MeshBuilder.CreateBox('car', { width: 0.5, height: 0.6, depth: 4.5 });
		this.hitBox.material = wireMat;
		this.hitBox.position.x = 3.1;
		this.hitBox.position.y = 0.3;
		this.hitBox.position.z = -5;

		this.carReady = false;

		await SceneLoader.ImportMeshAsync('', './models/', 'village.glb', this.scene);
		await SceneLoader.ImportMeshAsync('', './models/', 'car.glb', this.scene);

		const { meshes, skeletons } = await SceneLoader.ImportMeshAsync(
			'him',
			'./scenes/',
			'Dude.babylon',
			this.scene
		);

		const track: Array<Walk> = [];
		track.push(new Walk(180, 2.5));
		track.push(new Walk(0, 5));

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
		this.carReady = true;
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

		mesh.position = new Vector3(1.5, 0, -6.9);
		mesh.rotate(Axis.Y, Tools.ToRadians(-90), Space.LOCAL);
		const startRotation = mesh.rotationQuaternion.clone();

		this.scene.beginAnimation(skeleton, 0, 100, true, 1.0);

		let distance = 0;
		const step = 0.015;
		let p = 0;

		this.scene.onBeforeRenderObservable.add(() => {
			if (this.carReady) {
				if (
					!(mesh.getChildren()[1] as Mesh).intersectsMesh(this.hitBox) &&
					this.scene.getMeshByName('car').intersectsMesh(this.hitBox)
				) {
					return;
				}
			}
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
