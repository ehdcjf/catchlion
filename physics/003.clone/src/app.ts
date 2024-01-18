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
	private scene: Scene;
	private engine: Engine;
	sphere: Mesh;
	ground: Mesh;

	constructor() {
		this.init();
	}

	private async init() {
		const canvas = document.querySelector('#gameCanvas') as HTMLCanvasElement;
		this.engine = (await EngineFactory.CreateAsync(canvas, undefined)) as Engine;

		await this.createScene();

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

		this.buildSphere();
		this.buildGround();
		await this.setPhysicsAsync();

		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
	}

	private setCamera() {
		const camera = new FreeCamera('camera', new Vector3(0, 5, -10));
		camera.setTarget(Vector3.Zero());
		camera.attachControl(true);
	}

	private setLight() {
		const light = new HemisphericLight('light', new Vector3(0, 1, 0));
		light.intensity = 0.7;
	}

	private buildSphere() {
		const sphere = MeshBuilder.CreateSphere('sphere', { diameter: 2, segments: 32 }, this.scene);
		sphere.position.y = 4;
		sphere.position.x = -2;
		this.sphere = sphere;
	}

	private buildGround() {
		const ground = MeshBuilder.CreateGround('ground', { width: 10, height: 10 }, this.scene);
		this.ground = ground;
	}

	private async setPhysicsAsync() {
		const wasmBinary = await fetch('./havok/HavokPhysics.wasm');
		const wasmBinaryArrayBuffer = await wasmBinary.arrayBuffer();
		const havokInterface = await HavokPhysics({
			wasmBinary: wasmBinaryArrayBuffer,
		});
		// const havokInterface = await HavokPhysics();
		const hk = new HavokPlugin(true, havokInterface);
		this.scene.enablePhysics(new Vector3(0, -0.98, 0), hk);

		new PhysicsAggregate(this.sphere, PhysicsShapeType.SPHERE, { mass: 1, radius: 1 }, this.scene);
		new PhysicsAggregate(this.ground, PhysicsShapeType.BOX, { mass: 0 }, this.scene);

		const sphere2 = this.sphere.clone();
		sphere2.physicsBody!.disablePreStep = false;
		sphere2.position.x = 2;
	}
}

new App();
