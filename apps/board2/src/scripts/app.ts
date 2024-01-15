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
	AbstractMesh,
} from '@babylonjs/core';

class App {
	private scene: Scene;
	private engine: Engine;

	private readonly squareSize = 1;
	private readonly gridWidth = 3;
	private readonly gridDepth = 6;
	private readonly tileSize = 1;
	chick: AbstractMesh;

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
		this.buildGround();
		this.buildTile();
		await this.loadChickAsync();
		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
	}

	private setCamera() {
		const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 2.5, 10, new Vector3(0, 0, 0));
		camera.attachControl(true);
	}

	private setLight() {
		const light = new HemisphericLight('light', new Vector3(4, 1, 0));
	}

	private buildGround() {
		const ground = MeshBuilder.CreateBox('table', {
			width: this.gridWidth + 1, // x
			depth: this.gridDepth + 1, // z
			height: 1, // y
		});

		const groundMat = new StandardMaterial('groundMat', this.scene);
		groundMat.diffuseTexture = new Texture(
			`https://images.pexels.com/photos/172276/pexels-photo-172276.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1`
		);
		ground.material = groundMat;
		ground.receiveShadows = true;

		ground.position = new Vector3(this.gridWidth / 2 - 0.5, 0, this.gridDepth / 2 - 0.5);
	}

	private buildTile() {
		const originTile = MeshBuilder.CreateBox('tile', { width: 0.85, height: 0.1, depth: 0.85 });
		const tileMat = new StandardMaterial('groundMat', this.scene);
		const tileTexture = new Texture(
			`https://images.pexels.com/photos/2824173/pexels-photo-2824173.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1`
		);

		tileTexture.vScale = 0.1;
		tileTexture.uScale = 0.1;
		tileTexture.uOffset = Math.random();
		tileTexture.vOffset = Math.random();
		tileMat.diffuseTexture = tileTexture;
		originTile.material = tileMat;
		originTile.receiveShadows = true;
		for (let index = 0; index < this.gridWidth * this.gridDepth; index++) {
			const tile = originTile.clone('tile');
			tile.id = `${index}`;
			tile.position = new Vector3(index % this.gridWidth, 0.55, Math.floor(index / this.gridWidth));
		}
		originTile.dispose();
	}

	async loadChickAsync() {
		const chessImportResult = await SceneLoader.ImportMeshAsync('', './models/', 'chick.glb');
		const originChick = chessImportResult.meshes[0];
		originChick.scalingDeterminant = 0.008;
		// originChick.position.y = 0.6;
		originChick.addRotation(Tools.ToRadians(90), Tools.ToRadians(90), Tools.ToRadians(90));
		this.chick = originChick;
		for (let index = 0; index < this.gridWidth * this.gridWidth; index++) {
			const chick = originChick.clone('chick', null);
			chick.id = `chick${index}`;
			chick.position = new Vector3(Math.floor(index / this.gridWidth), 0.6, index % this.gridWidth);
		}
		originChick.dispose();
	}

	setChick() {}
}

new App();
