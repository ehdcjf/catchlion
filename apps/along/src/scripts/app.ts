import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';

import {
	Engine,
	Scene,
	Vector3,
	Mesh,
	Color3,
	Color4,
	ShadowGenerator,
	GlowLayer,
	PointLight,
	FreeCamera,
	CubeTexture,
	Sound,
	PostProcess,
	Effect,
	SceneLoader,
	Matrix,
	MeshBuilder,
	Quaternion,
	AssetsManager,
	EngineFactory,
	ArcRotateCamera,
	Tools,
	HemisphericLight,
	StandardMaterial,
	Texture,
	MultiMaterial,
	SubMesh,
	Axis,
	Space,
} from '@babylonjs/core';

class App {
	private scene: Scene;
	private engine: Engine;

	constructor() {
		this.init();
	}

	private async init() {
		const canvas = this.createCanvas();
		this.engine = (await EngineFactory.CreateAsync(canvas, undefined)) as Engine;
		this.scene = new Scene(this.engine);
		await this.main();
	}

	private async main() {
		const camera = new ArcRotateCamera('camera', -Math.PI / 1.5, Math.PI / 5, 15, new Vector3(0, 0, 0));
		camera.attachControl(true);
		const light = new HemisphericLight('light', new Vector3(1, 1, 0));

		const sphere = MeshBuilder.CreateSphere('sphere', { diameter: 0.25 });
		sphere.position = new Vector3(2, 0, 2);

		const points = [
			new Vector3(2, 0, 2),
			new Vector3(2, 0, -2),
			new Vector3(-2, 0, -2),
			new Vector3(2, 0, 2),
		];

		MeshBuilder.CreateLines('triangle', { points: points });

		const track = [
			{
				turn: Math.PI / 2,
				dist: 4,
			},
			{
				turn: (3 * Math.PI) / 4,
				dist: 8,
			},
			{
				turn: (3 * Math.PI) / 4,
				dist: 8 + 4 * Math.sqrt(2),
			},
		];

		let distance = 0;
		const step = 0.05;
		let p = 0;

		this.scene.onBeforeRenderObservable.add(() => {
			sphere.movePOV(0, 0, step);
			distance += step;

			if (distance > track[p].dist) {
				sphere.rotate(Axis.Y, track[p].turn, Space.LOCAL);
				p += 1;
				p %= track.length;
				if (p == 0) {
					distance = 0;
					sphere.position = new Vector3(2, 0, 2);
					sphere.rotation = Vector3.Zero();
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

	private createCanvas() {
		document.documentElement.style['overflow'] = 'hidden';
		document.documentElement.style.overflow = 'hidden';
		document.documentElement.style.width = '100%';
		document.documentElement.style.height = '100%';
		document.documentElement.style.margin = '0';
		document.documentElement.style.padding = '0';
		document.body.style.overflow = 'hidden';
		document.body.style.width = '100%';
		document.body.style.height = '100%';
		document.body.style.margin = '0';
		document.body.style.padding = '0';

		//create the canvas html element and attach it to the webpage
		const canvas = document.createElement('canvas');
		canvas.style.width = '100%';
		canvas.style.height = '100%';
		canvas.id = 'gameCanvas';
		document.body.appendChild(canvas);
		return canvas;
	}
}

new App();
