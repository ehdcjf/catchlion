import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';
import HavokPhysics from '@babylonjs/havok';

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
		await this.setPhysicsAsync();
		this.buildSpheres();
		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
	}

	private setCamera() {
		const camera = new FreeCamera('camera', new Vector3(0, 10, -30), this.scene);
		camera.setTarget(Vector3.Zero());
		camera.attachControl(true);
	}

	private setLight() {
		const light = new HemisphericLight('light', Vector3.Zero());
		light.intensity = 0.7;
	}

	private async setPhysicsAsync() {
		const wasmBinary = await fetch('./havok/HavokPhysics.wasm');
		const wasmBinaryArrayBuffer = await wasmBinary.arrayBuffer();
		const havokInterface = await HavokPhysics({
			wasmBinary: wasmBinaryArrayBuffer,
		});
		const hk = new HavokPlugin(true, havokInterface);
		this.scene.enablePhysics(new Vector3(0, -9.8, 0), hk);
	}

	private buildSpheres() {
		const positions = [
			new Vector3(0, 0, 0),
			new Vector3(2, 0, 0),
			new Vector3(0, 2, 0),
			new Vector3(0, 0, 2),
		];

		for (let i = 0; i < 4; i++) {
			const sphere = MeshBuilder.CreateSphere(
				'sphere_' + i,
				{ diameter: 2, segments: 32 },
				this.scene
			);
			const mat = new StandardMaterial('sphereMat_' + i);
			sphere.position = positions[i];
			mat.specularColor = Color3.Black();
			mat.diffuseColor = Color3.Random();
			sphere.material = mat;
		}
	}
}

new App();
