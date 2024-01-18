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
		const canvas: HTMLCanvasElement = document.querySelector('#gameCanvas');
		this.engine = (await EngineFactory.CreateAsync(canvas, undefined)) as Engine;
		this.scene = new Scene(this.engine);
		await this.main();
	}

	private async main() {
		const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 2.5, 200, Vector3.Zero());
		camera.attachControl(true);
		const light = new HemisphericLight('light', new Vector3(4, 1, 0));

		const ground = MeshBuilder.CreateGround('ground', { width: 24, height: 24 });
		const groundMat = new StandardMaterial('groundMat');
		groundMat.diffuseTexture = new Texture('./textures/villagegreen.png');

		ground.material = groundMat;

		const largeGround = MeshBuilder.CreateGroundFromHeightMap(
			'largeGround',
			'./textures/villageheightmap.png',
			{
				width: 150,
				height: 150,
				subdivisions: 20,
				minHeight: 0,
				maxHeight: 10,
			}
		);

		const largeGroundMat = new StandardMaterial('largeGroundMat');
		largeGroundMat.diffuseTexture = new Texture('./textures/valleygrass.png');
		largeGround.material = largeGroundMat;
		largeGround.position.y = -0.01;

		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
		this.engine.runRenderLoop(() => {
			this.scene.render();
		});
	}
}

new App();
