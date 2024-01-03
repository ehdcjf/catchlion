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
		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
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
