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
	Observer,
	Observable,
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

		const x = new Observer((e, s) => {
			console.log(e);
			console.log(s);
		}, 1);

		console.log('x.scope', x.scope);
		console.log('x.mask', x.mask);

		const y = new Observable();
		console.log(y._eventState);
		console.log(y.observers);
		const z = y.add((data) => {
			console.log('i am z ');
			console.log(data);
		}, 2);
		y.notifyObserver(z, 'tntnfktn', 2);

		// y.observers

		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
	}

	private setCamera() {
		const camera = new FreeCamera('camera', new Vector3(0, 1, 1));
		camera.setTarget(Vector3.Zero());
		camera.attachControl(true);
	}

	private setLight() {
		const light = new HemisphericLight('light', Vector3.Zero());
		light.intensity = 0.7;
	}
}

new App();
