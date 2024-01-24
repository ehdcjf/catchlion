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
} from '@babylonjs/core';
import { UI } from './ui';

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
		this.buildSphere();

		// this.ui.addSimpleSlider(this.ui.main);

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
}

new App();
