import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';
import ammo from 'ammojs-typed';
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
	Color4,
	AmmoJSPlugin,
	ISceneLoaderAsyncResult,
	Mesh,
	AnimationGroup,
	ParticleHelper,
} from '@babylonjs/core';
import { Cannon } from './cannon';

class App {
	[x: string]: any;
	private scene: Scene;
	private engine: Engine;

	constructor() {
		this.init();
	}

	private async init() {
		const canvas = document.querySelector('#gameCanvas') as HTMLCanvasElement;
		this.engine = (await EngineFactory.CreateAsync(canvas, {})) as Engine;
		this.scene = new Scene(this.engine);
		this.scene.clearColor = new Color4(0.31, 0.48, 0.64, 1);
		const ImportedAmmo = await ammo.call({});
		this.scene.enablePhysics(new Vector3(0, -9.8, 0), new AmmoJSPlugin(true, ImportedAmmo));
		await this.main();
	}

	private async main() {
		const camera = new ArcRotateCamera(
			'camera',
			Tools.ToRadians(125),
			Tools.ToRadians(70),
			25,
			Vector3.Zero(),
			this.scene
		);
		camera.lowerRadiusLimit = 10;
		camera.attachControl(true);
		const light = new HemisphericLight('light', new Vector3(4, 1, 0));

		await this.setPirateFortAsync();
		const cannon = new Cannon(this.scene);
		await cannon.setUpAsync();

		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
		this.engine.runRenderLoop(() => {
			this.scene.render();
		});
	}

	private async setPirateFortAsync() {
		const pirateFortImport = await SceneLoader.ImportMeshAsync('', './models/', 'pirateFort.glb');
		pirateFortImport.meshes[0].name = 'pirateFort';
		this.scene.getMeshByName('sea').material.needDepthPrePass = true;
		this.scene.getLightByName('Sun').intensity = 12;
	}
}

new App();
