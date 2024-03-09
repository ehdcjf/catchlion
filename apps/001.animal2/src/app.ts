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
} from '@babylonjs/core';
import { Game } from './game';
import { GameObserverTarget } from './const';

class App {
	private scene!: Scene;
	private engine!: Engine;
	game?: Game;
	camera!: ArcRotateCamera;
	light!: HemisphericLight;

	constructor() {
		this.init();
	}

	private async init() {
		const canvas = document.querySelector('#gameCanvas') as HTMLCanvasElement;
		this.engine = await EngineFactory.CreateAsync(canvas, undefined);
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
		this.game = new Game(this.scene, GameObserverTarget.AI);
		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
	}

	private setCamera() {
		const camera = new ArcRotateCamera(
			'camera',
			Tools.ToRadians(270),
			Tools.ToRadians(45),
			10,
			new Vector3(1, 0, 1.5),
			this.scene
		);

		camera.minZ = 0.1;
		camera.pinchDeltaPercentage = 40;
		// camera.wheelDeltaPercentage = 90;
		// camera.angularSensibilityX = 3000;
		// camera.angularSensibilityY = 3000;
		camera.upperBetaLimit = Tools.ToRadians(80);
		camera.lowerRadiusLimit = 5;
		camera.upperRadiusLimit = 30;
		camera.attachControl(true);
		this.camera = camera;
	}

	private setLight() {
		const light = new HemisphericLight('light', new Vector3(4, 1, 0));
		this.light = light;
	}
}

window.addEventListener('DOMContentLoaded', () => {
	new App();
});
