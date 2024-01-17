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
import HavokPhysics from '@babylonjs/havok';

class App {
	private scene: Scene;
	private engine: Engine;
	sphere: Mesh;
	gound: Mesh;

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
		this.sphere = this.buildSphere();
		this.gound = this.buildGround();
		await this.initHavok();

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
		return sphere;
	}

	private buildGround() {
		const ground = MeshBuilder.CreateGround('ground', { width: 10, height: 10 }, this.scene);
		return ground;
	}

	private async initHavok() {
		/**
		 *  node_modules에서 havok을 불러오는 과정에 문제가 있는 거 같음.
		 *
		 *  아마도   vite 가 최적화하는 과정에서 wasm 파일에 문제가 생기는 거 같음.
		 *
		 * vite.config에  optimizeDeps.exclude 설정을 했는데  잘 안됨.
		 *
		 * 그래서 그냥 public 모듈에 넣어놓고 불러오기로함.
		 *
		 * 모노레포 버리고 나중에 진짜로 만들 때,  설정하면 될 수도 있음.
		 */
		const wasmBinary = await fetch('./havok/HavokPhysics.wasm');
		const wasmBinaryArrayBuffer = await wasmBinary.arrayBuffer();
		const havokInterface = await HavokPhysics({ wasmBinary: wasmBinaryArrayBuffer });
		// const havokInterface = await HavokPhysics();

		const hk = new HavokPlugin(true, havokInterface);
		this.scene.enablePhysics(new Vector3(0, -9.8, 0), hk);

		const sphereAggregate = new PhysicsAggregate(
			this.sphere,
			PhysicsShapeType.SPHERE,
			{
				mass: 100,
				restitution: 0.75,
			},
			this.scene
		);

		const groundAggragate = new PhysicsAggregate(this.gound, PhysicsShapeType.BOX, { mass: 0 }, this.scene);
	}
}

new App();
