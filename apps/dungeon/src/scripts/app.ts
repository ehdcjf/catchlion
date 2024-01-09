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
	Mesh,
} from '@babylonjs/core';

class App {
	private scene: Scene;
	private engine: Engine;

	constructor() {
		this.init();
	}

	private async init() {
		const canvas = document.querySelector('#gameCanvas') as HTMLCanvasElement;
		this.engine = (await EngineFactory.CreateAsync(canvas, undefined)) as Engine;
		this.scene = new Scene(this.engine);
		await this.main();
	}

	private async main() {
		const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 2.5, 15, new Vector3(0, 0, 0));
		camera.upperBetaLimit = Math.PI / 2.2;
		camera.attachControl(true);
		const light = new HemisphericLight('light', new Vector3(0, 2, 0));
		light.intensity = 0.7;

		await SceneLoader.ImportMeshAsync('', './models/', 'dungeon.glb', this.scene);
		await SceneLoader.ImportMeshAsync('', './models/', 'car.glb', this.scene);

		console.log(this.scene.meshes.map((m) => m.name));
		console.log(this.scene.transformNodes.map((m) => m.name));

		const tempBarrel = this.scene.getNodeByName('Barrel');
		const barrel = <Mesh>(
			await Mesh.MergeMeshesAsync(tempBarrel.getChildMeshes(), true, false, null, false, true)
		);
		barrel.name = 'Barrel';
		barrel.position.y += 10;

		console.log(barrel);
		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
		this.engine.runRenderLoop(() => {
			this.scene.render();
		});
	}
}

new App();
