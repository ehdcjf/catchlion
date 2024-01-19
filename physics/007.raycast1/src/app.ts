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
	Viewport,
	SceneInstrumentation,
} from '@babylonjs/core';
import { UI } from './ui';

class App {
	private scene!: Scene;
	private engine!: Engine;
	ui!: UI;
	hk!: HavokPlugin;
	camera!: ArcRotateCamera;
	camera2!: ArcRotateCamera;

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
		this.ui = new UI(this.scene);
		this.setCamera();
		this.setLight();
		await this.setPhysicsAsync();

		this.ui.addText((c) => {
			c.text = `bodies: ${this.hk.numBodies}`;
		});

		const sceneInstrumentation = new SceneInstrumentation(this.scene);
		sceneInstrumentation.captureFrameTime = true;
		sceneInstrumentation.capturePhysicsTime = true;

		this.ui.addText((c) => {
			const ft = sceneInstrumentation.frameTimeCounter.lastSecAverage;
			c.text = `absolute fps: ${(1000 / ft).toFixed(2)}`;
		});

		this.ui.addText((c) => {
			const pt = sceneInstrumentation.physicsTimeCounter.lastSecAverage;
			c.text = `physics time:${pt.toFixed(2)}ms`;
		});

		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
	}

	private setCamera() {
		const camera = new ArcRotateCamera(
			'camera',
			Math.PI / 2,
			Math.PI / 2.5,
			20,
			Vector3.Zero(),
			this.scene
		);

		camera.setTarget(Vector3.Zero());
		camera.attachControl(true);

		const camera2 = new ArcRotateCamera('camera2', 0.2, Math.PI / 2.5, 25, Vector3.Zero(), this.scene);
		camera2.viewport = new Viewport(0.75, 0.75, 0.25, 0.25);
		this.scene.activeCameras?.push(camera);
		this.scene.activeCameras?.push(camera2);
		this.scene.cameraToUseForPointers = camera;

		this.camera = camera;
		this.camera2 = camera2;
	}

	private setLight() {
		const light = new HemisphericLight('light', new Vector3(0, 1, 0));
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
		this.hk = hk;
	}
}

new App();
