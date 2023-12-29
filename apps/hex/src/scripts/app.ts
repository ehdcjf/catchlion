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

		this.setCamera();
		this.setLight();
		this.setGround();

		await this.main();
	}

	private async main() {
		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
		// this.scene.dispose();
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

	private setCamera() {
		const camera = new FreeCamera('camera', new Vector3(0, 5, -12), this.scene);
		camera.setTarget(Vector3.Zero());
		camera.attachControl(true);
	}

	private setLight() {
		const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
		light.intensity = 0.7;
	}

	private async setTile() {
		const tile = await SceneLoader.ImportMeshAsync('hexTile', './models/', 'hexTile.glb', this.scene);
		this.scene.onPointerDown = (evt, pickResult) => {
			if (pickResult.pickedMesh) {
				alert('You Picked a hex tile!');
			}
		};
		return tile;
	}

	private setGround() {
		const grid = {
			h: 4,
			w: 3,
		};

		const tiledGround = MeshBuilder.CreateTiledGround('Tiled Ground', {
			xmin: -3,
			zmin: -3,
			xmax: 3,
			zmax: 3,
			subdivisions: grid,
		});

		const whiteMaterial = new StandardMaterial('white');
		whiteMaterial.diffuseColor = Color3.White();

		const lightGreenMaterial = new StandardMaterial('lightgreen');
		lightGreenMaterial.diffuseColor = new Color3(0.565, 0.933, 0.565);

		const multimat = new MultiMaterial('multi', this.scene);
		multimat.subMaterials.push(whiteMaterial);
		multimat.subMaterials.push(lightGreenMaterial);

		tiledGround.material = multimat;

		const verticesCount = tiledGround.getTotalVertices();
		const tileIndicesLength = tiledGround.getIndices().length / (grid.w * grid.h);

		tiledGround.subMeshes = [];
		let base = 0;
		for(let row = 0; row<grid.h; row++){
			for(let col = 0; col<grid.w; col++){
				tiledGround.subMeshes.push(new SubMesh(row%2^col%))
			}
		}
	}
}

new App();


