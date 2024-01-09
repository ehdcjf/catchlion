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
	SpotLight,
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
		const camera = new ArcRotateCamera(
			'camera',
			(3 * Math.PI) / 2,
			Math.PI / 2.2,
			50,
			Vector3.Zero(),
			this.scene
		);
		camera.attachControl(true);

		const light = new HemisphericLight('light', new Vector3(0, 50, 0));
		light.intensity = 0.5;

		this.setLamp();
		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
		this.engine.runRenderLoop(() => {
			this.scene.render();
		});
	}

	private setLamp() {
		const lampLight = new SpotLight(
			'lamplight',
			Vector3.Zero(),
			new Vector3(0, -1, 0),
			Math.PI,
			1,
			this.scene
		);
		lampLight.diffuse = Color3.Yellow();

		const lampShape = [];
		for (let i = 0; i < 20; i++) {
			lampShape.push(
				new Vector3(Math.cos(i * Math.PI) / 10),
				new Vector3(Math.sin(i * Math.PI) / 10),
				0
			);
		}
		lampShape.push(lampShape[0]);

		const lampPath = [];
		lampPath.push(Vector3.Zero());
		lampPath.push(new Vector3(0, 10, 0));
		for (let i = 0; i < 20; i++) {
			lampPath.push(
				new Vector3(
					1 + Math.cos(Math.PI - (i * Math.PI) / 40),
					10 + Math.sin(Math.PI - (i * Math.PI) / 40),
					0
				)
			);
		}

		lampPath.push(new Vector3(3, 11, 0));

		const yellowMat = new StandardMaterial('yellowMat');
		yellowMat.emissiveColor = Color3.Yellow();

		const lamp = MeshBuilder.ExtrudeShape('lamp', {
			cap: Mesh.CAP_END,
			shape: lampShape,
			path: lampPath,
			scale: 0.5,
		});

		const bulb = MeshBuilder.CreateSphere('bulb', {
			diameterX: 1.5,
			diameterZ: 0.8,
		});

		bulb.material = yellowMat;
		bulb.parent = lamp;
		bulb.position.x = 2;
		bulb.position.y = 10.5;

		lampLight.parent = bulb;

		const ground = MeshBuilder.CreateGround('ground', {
			width: 50,
			height: 50,
		});
	}
}

new App();
