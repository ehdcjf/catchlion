import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';
import { AdvancedDynamicTexture } from '@babylonjs/gui';
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
	PointLight,
	Mesh,
	GroundMesh,
	ShadowGenerator,
	Axis,
	Space,
	AbstractMesh,
} from '@babylonjs/core';

enum PieceType {
	pawn,
	knight,
	bishop,
	tower,
	queen,
	king,
}

class App {
	private scene: Scene;
	private engine: Engine;
	camera: ArcRotateCamera;
	gui: AdvancedDynamicTexture;
	light: PointLight;
	material: Record<string, StandardMaterial>;
	ground: GroundMesh;
	private readonly squareSize = 1;
	private readonly gridWidth = 3;
	private readonly tileSize = 1;
	chick: AbstractMesh;

	constructor() {
		this.init();
	}

	private async init() {
		const canvas = document.querySelector(
			'#gameCanvas'
		) as HTMLCanvasElement;
		this.engine = (await EngineFactory.CreateAsync(canvas, {
			preserveDrawingBuffer: true,
			stencil: true,
		})) as Engine;

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

		await this.loadChessModelAsync();
		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
	}

	setCamera() {
		const camera = new ArcRotateCamera(
			'camera',
			Tools.ToRadians(0),
			Tools.ToRadians(10),
			16,
			new Vector3(
				this.gridWidth / 2,
				0,
				this.gridWidth / 2 - 0.5
			),
			this.scene
		);

		camera.minZ = 0.1;
		// camera.wheelDeltaPercentage = 80;
		// camera.pinchDeltaPercentage = 30;
		// camera.angularSensibilityX = 6000;
		// camera.angularSensibilityY = 6000;
		camera.upperBetaLimit = Tools.ToRadians(80);
		camera.lowerRadiusLimit = 5;
		camera.upperRadiusLimit = 30;
		camera.attachControl(true);
	}

	setLight() {
		const hemiLight = new HemisphericLight(
			'hlight',
			new Vector3(0, 1, 0),
			this.scene
		);
		hemiLight.intensity = 0.3;

		const plight = new PointLight(
			'plight',
			new Vector3(3, 3, -3),
			this.scene
		);
		plight.position = new Vector3(3, 10, 3);
		plight.intensity = 0.5;

		const shadowGenerator = new ShadowGenerator(1024, plight);
		shadowGenerator.useExponentialShadowMap = true;
	}

	buildGround() {
		const ground = MeshBuilder.CreateBox('table', {
			width: this.gridWidth + 1,
			depth: this.gridWidth + 1,
			height: 1,
		});

		const groundMat = new StandardMaterial('groundMat', this.scene);
		groundMat.diffuseTexture = new Texture(
			`https://images.pexels.com/photos/172276/pexels-photo-172276.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1`
		);
		ground.material = groundMat;
		ground.receiveShadows = true;
		ground.position = new Vector3(
			this.gridWidth / 2 - this.squareSize / 2,
			0,
			this.gridWidth / 2 - this.squareSize / 2
		);
	}

	buildTile() {
		const originTile = MeshBuilder.CreateBox('tile', {
			width: 0.85,
			height: 0.1,
			depth: 0.85,
		});
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
		for (
			let index = 0;
			index < this.gridWidth * this.gridWidth;
			index++
		) {
			const tile = originTile.clone('tile');
			tile.id = `${index}`;
			tile.position = new Vector3(
				Math.floor(index / this.gridWidth),
				0.55,
				index % this.gridWidth
			);
		}
		originTile.dispose();
	}

	async loadChessModelAsync() {
		const chessImportResult = await SceneLoader.ImportMeshAsync(
			'',
			'./models/',
			'chick.glb'
		);
		const originChick = chessImportResult.meshes[0];
		originChick.scalingDeterminant = 0.008;
		// originChick.position.y = 0.6;
		originChick.addRotation(
			Tools.ToRadians(90),
			Tools.ToRadians(180),
			Tools.ToRadians(90)
		);
		this.chick = originChick;
		for (
			let index = 0;
			index < this.gridWidth * this.gridWidth;
			index++
		) {
			const chick = originChick.clone(
				'chick',
				null
			) as AbstractMesh;
			chick.id = `chick${index}`;
			chick.position = new Vector3(
				Math.floor(index / this.gridWidth),
				0.6,
				index % this.gridWidth
			);
		}
		// originChick.dispose();
	}

	rotate(gridPosition: number, count: number, isClockwise = true) {
		const gridSize = this.gridWidth * this.gridWidth;

		for (let index = 0; index < count; index++) {
			const x = gridPosition % this.gridWidth;
			const y = Math.floor(gridPosition / this.gridWidth);
			if (isClockwise) {
				gridPosition =
					x * this.gridWidth +
					(this.gridWidth - 1 - y);
			} else {
				gridPosition =
					(this.gridWidth - 1 - x) *
						this.gridWidth +
					y;
			}

			return (
				((gridPosition % gridSize) + gridSize) %
				gridSize
			);
		}
	}
}

new App();
