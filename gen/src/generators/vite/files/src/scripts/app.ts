/* eslint-disable @typescript-eslint/no-unused-vars */
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
} from '@babylonjs/core';

class App {
	private scene: Scene;
	private engine: Engine;

	constructor() {
		this.init();
	}

	private async init() {
		const canvas = document.querySelector(
			'#gameCanvas'
		) as HTMLCanvasElement;
		this.engine = (await EngineFactory.CreateAsync(
			canvas,
			undefined
		)) as Engine;

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

		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
	}

	private setCamera() {
		const camera = new ArcRotateCamera(
			'camera',
			-Math.PI / 2,
			Math.PI / 2.5,
			200,
			new Vector3(0, 0, 0)
		);
		camera.attachControl(true);
	}

	private setLight() {
		const light = new HemisphericLight(
			'light',
			new Vector3(4, 1, 0)
		);
	}
}

new App();
