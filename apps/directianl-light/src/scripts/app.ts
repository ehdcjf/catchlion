import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';

import * as Babylon from '@babylonjs/core';

class Walk {
	constructor(public turn: number, public dist: number) {}
}

class App {
	private scene: Babylon.Scene;
	private engine: Babylon.Engine;
	light: Babylon.DirectionalLight;

	constructor() {
		this.init();
	}

	private async init() {
		const canvas = document.querySelector('#gameCanvas') as HTMLCanvasElement;
		this.engine = (await Babylon.EngineFactory.CreateAsync(canvas, undefined)) as Babylon.Engine;
		this.scene = new Babylon.Scene(this.engine);
		await this.main();
	}

	private async main() {
		const camera = new Babylon.ArcRotateCamera('camera', 0, Math.PI / 4, 15, new Babylon.Vector3(0, 0, 0));
		camera.attachControl(true);

		this.light = new Babylon.DirectionalLight('dir01', new Babylon.Vector3(0, -1, 1), this.scene);
		this.light.position = new Babylon.Vector3(0, 50, -100);
		const shadowGenerator = new Babylon.ShadowGenerator(1024, this.light);

		await Babylon.SceneLoader.ImportMeshAsync('', './models/', 'valleyvillage.glb', this.scene);
		const result = await Babylon.SceneLoader.ImportMeshAsync(
			'him',
			'./scenes/',
			'Dude.babylon',
			this.scene
		);

		const track = [
			new Walk(86, 7),
			new Walk(-85, 14.8),
			new Walk(-93, -16.5),
			new Walk(48, 25.5),
			new Walk(-122, 30.5),
			new Walk(-72, 33.2),
			new Walk(42, 37.5),
			new Walk(-98, 45.2),
			new Walk(0, 47),
		];

		const dude = result.meshes[0];
		dude.scaling = new Babylon.Vector3(0.008, 0.008, 0.008);
		shadowGenerator.addShadowCaster(dude, true);
		dude.position = new Babylon.Vector3(-6, 0, 0);

		dude.rotate(Babylon.Axis.Y, Babylon.Tools.ToRadians(-95), Babylon.Space.LOCAL);
		const startRotation = dude.rotationQuaternion.clone();
		this.scene.beginAnimation(result.skeletons[0], 0, 100, true, 1.0);

		let distance = 0;
		const step = 0.01;
		let p = 0;

		this.scene.onBeforeRenderObservable.add(() => {
			dude.movePOV(0, 0, step);
			distance += step;

			if (distance > track[p].dist) {
				dude.rotate(
					Babylon.Axis.Y,
					Babylon.Tools.ToRadians(track[p].turn),
					Babylon.Space.LOCAL
				);
				p += 1;
				p %= track.length;
				if (p == 0) {
					distance = 0;
					dude.position = new Babylon.Vector3(-6, 0, 0);
					dude.rotationQuaternion = startRotation.clone();
				}
			}
		});

		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
		this.engine.runRenderLoop(() => {
			this.scene.render();
		});
	}

	private setSkyBox() {
		const skybox = Babylon.MeshBuilder.CreateBox('skybox', { size: 150 }, this.scene);
		const skyboxMaterial = new Babylon.StandardMaterial('skyboxMat', this.scene);
		skyboxMaterial.backFaceCulling = false;
		skyboxMaterial.reflectionTexture = new Babylon.CubeTexture('./textures/skybox', this.scene);

		skyboxMaterial.reflectionTexture.coordinatesMode = Babylon.Texture.SKYBOX_MODE;
		skyboxMaterial.diffuseColor = Babylon.Color3.White();
		skyboxMaterial.specularColor = Babylon.Color3.White();
		skybox.material = skyboxMaterial;
	}
}

new App();
