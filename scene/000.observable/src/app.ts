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
	PointerEventTypes,
	KeyboardEventTypes,
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

		const sphere = MeshBuilder.CreateSphere('sphere', { diameter: 2, segments: 16 }, this.scene);
		sphere.position.y = 1;

		const ground = MeshBuilder.CreateGround('ground', { width: 6, height: 6, subdivisions: 2 }, this.scene);

		this.scene.onPointerObservable.add((pointerInfo) => {
			switch (pointerInfo.type) {
				case PointerEventTypes.POINTERDOWN:
					console.log('POINTER DOWN');
					break;
				case PointerEventTypes.POINTERUP:
					console.log('POINTER UP');
					break;
				case PointerEventTypes.POINTERMOVE:
					console.log('POINTER MOVE');
					break;
				case PointerEventTypes.POINTERWHEEL:
					console.log('POINTER WHEEL');
					break;
				case PointerEventTypes.POINTERPICK:
					console.log('POINTER PICK');
					break;
				case PointerEventTypes.POINTERTAP:
					console.log('POINTER TAP');
					break;
				case PointerEventTypes.POINTERDOUBLETAP:
					console.log('POINTER DOUBLETAP');
					break;
			}
		});

		this.scene.onKeyboardObservable.add((kbInfo) => {
			switch (kbInfo.type) {
				case KeyboardEventTypes.KEYDOWN:
					console.log('KEY DOWN: ', kbInfo.event.code);
					break;
				case KeyboardEventTypes.KEYUP:
					console.log('KEY UP: ', kbInfo.event.code);
					break;
			}
		});

		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
	}

	private setCamera() {
		const camera = new FreeCamera('camera', new Vector3(0, 5, -10), this.scene);
		camera.setTarget(Vector3.Zero());
		camera.attachControl(true);
	}

	private setLight() {
		const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
		light.intensity = 0.7;
	}
}

new App();
