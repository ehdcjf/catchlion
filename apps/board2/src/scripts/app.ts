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
	Matrix,
	Mesh,
	TransformNode,
	DynamicTexture,
	Axis,
} from '@babylonjs/core';
import { threadId } from 'worker_threads';
import { PieceType } from './types';

class App {
	private scene: Scene;
	private engine: Engine;

	private readonly squareSize = 1;
	private readonly gridWidth = 3;
	private readonly gridDepth = 4;
	private readonly tileSize = 1;
	chick: AbstractMesh;
	camera: ArcRotateCamera;
	chicken: AbstractMesh;
	lion: AbstractMesh;

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
		this.setAction();
		// this.showAxis(10);
		await this.loadChickenAsync();
		await this.loadLion();
		// this.tempMyPiece();

		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
	}

	private setCamera() {
		const camera = new ArcRotateCamera(
			'camera',
			Tools.ToRadians(0),
			Tools.ToRadians(10),
			16,
			new Vector3(this.gridWidth / 2, 0, this.gridWidth / 2 - 0.5),
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
		this.camera = camera;
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

	async loadChickenAsync() {
		await SceneLoader.ImportMeshAsync('', './models/', 'chicken3.glb');
		// console.log(chickenImportResult.meshes[1]);
		const originChicken = this.scene.getMeshByName('Chicken');
		originChicken.scaling = new Vector3(0.1, 0.1, 0.1);
		originChicken.rotate(Axis.Y, Tools.ToRadians(180));
		originChicken.position.y = 0.6;
		const chickenMat = new StandardMaterial(`chickenMat`);
		chickenMat.diffuseColor = new Color3(Math.random(), Math.random(), Math.random());
		this.chicken = originChicken;
		this.chicken.material = chickenMat;
		this.chicken.position = this.gridToWorld(1);
		this.chicken.metadata = 'sculpture';

		// for (let index = 0; index < this.gridWidth * this.gridWidth; index++) {
		// 	const chickenMat = new StandardMaterial(`chickenMat${index}`);
		// 	chickenMat.diffuseColor = new Color3(Math.random(), Math.random(), Math.random());

		// 	const chicken = originChicken.clone(`chick`, null);
		// 	chicken.id = `chick${index}`;
		// 	chicken.position = new Vector3(
		// 		-(index % this.gridWidth),
		// 		0.6,
		// 		Math.floor(index / this.gridWidth)
		// 	);
		// 	chicken.material = chickenMat;
		// 	const boxChildAxis = this.buildLocalAxis(3);
		// 	boxChildAxis.parent = chicken;
		// }
		// originChicken.dispose();
	}

	async loadLion() {
		await SceneLoader.ImportMeshAsync('', './models/', 'lion3.glb');
		const lionNode = this.scene.getNodeByName('Lion');
		lionNode.name = 'LionNode';
		lionNode.parent.name = 'Lion';

		const lion = this.scene.getMeshByName('Lion');
		lion.metadata = 'sculpture';
		// // console.log(chickenImportResult.meshes[1]);
		// console.log(lion);
		lion.scaling = new Vector3(0.3, 0.3, 0.3);
		lion.position.y = 0.6;
		// this.chicken = lion;
		this.lion = lion;
	}

	setChick() {}

	setAction() {
		// this.scene.onPointerUp = this.castRay.bind(this);
		this.scene.onPointerPick = (evt, pickInfo) => {
			const ray = this.scene.createPickingRay(
				this.scene.pointerX,
				this.scene.pointerY,
				Matrix.Identity(),
				this.camera
			);
			const hit = this.scene.pickWithRay(ray, (mesh) => {
				return mesh && mesh.name == 'tile';
			});

			if (hit?.pickedMesh !== undefined && hit?.pickedPoint != undefined) {
				this.onSelection(hit.pickedMesh.id);
			}
		};
	}

	private onSelection(tileId: string) {
		this.chicken.position = this.gridToWorld(+tileId);
	}

	private showAxis(size: number) {
		const axisX = MeshBuilder.CreateLines('axisX', {
			points: [
				Vector3.Zero(),
				new Vector3(size, 0, 0),
				new Vector3(size * 0.95, size * 0.05, 0),
				new Vector3(size, 0, 0),
				new Vector3(size * 0.95, -size * 0.05, 0),
			],
		});

		axisX.color = Color3.Red();
		const xChar = this.makeTextPlane('X', 'red', size / 10);
		xChar.position = new Vector3(0.9 * size, -0.05 * size, 0);

		const axisY = MeshBuilder.CreateLines('axisY', {
			points: [
				Vector3.Zero(),
				new Vector3(0, size, 0),
				new Vector3(-0.05 * size, size * 0.95, 0),
				new Vector3(0, size, 0),
				new Vector3(0.05 * size, size * 0.95, 0),
			],
		});

		axisY.color = Color3.Green();
		const yChar = this.makeTextPlane('Y', 'green', size / 10);
		yChar.position = new Vector3(0, 0.9 * size, -0.05 * size);

		const axisZ = MeshBuilder.CreateLines('axisZ', {
			points: [
				Vector3.Zero(),
				new Vector3(0, 0, size),
				new Vector3(0, -0.05 * size, size * 0.95),
				new Vector3(0, 0, size),
				new Vector3(0, 0.05 * size, size * 0.95),
			],
		});
		axisZ.color = Color3.Blue();
		const zChar = this.makeTextPlane('Z', 'blue', size / 10);
		zChar.position = new Vector3(0, 0.05 * size, 0.9 * size);
	}

	private makeTextPlane(text: string, color: string, size: number) {
		const dynamicTexture = new DynamicTexture('dynamicTexture', 50, this.scene, true);
		dynamicTexture.hasAlpha = true;
		dynamicTexture.drawText(text, 5, 40, 'bold 36px Arial', color, 'transparent', true);
		const plane = MeshBuilder.CreatePlane('textPlain', { size, updatable: true }, this.scene);
		const mat = new StandardMaterial('textPlaneMaterial', this.scene);
		mat.backFaceCulling = false;
		mat.specularColor = Color3.Black();
		mat.diffuseTexture = dynamicTexture;
		plane.material = mat;
		return plane;
	}

	private buildLocalAxis(size: number) {
		const axisX = MeshBuilder.CreateLines('axisX', {
			points: [
				Vector3.Zero(),
				new Vector3(size, 0, 0),
				new Vector3(size * 0.95, size * 0.05, 0),
				new Vector3(size, 0, 0),
				new Vector3(size * 0.95, -size * 0.05, 0),
			],
		});

		axisX.color = Color3.Red();

		const axisY = MeshBuilder.CreateLines('axisY', {
			points: [
				Vector3.Zero(),
				new Vector3(0, size, 0),
				new Vector3(-0.05 * size, size * 0.95, 0),
				new Vector3(0, size, 0),
				new Vector3(0.05 * size, size * 0.95, 0),
			],
		});

		axisY.color = Color3.Green();

		const axisZ = MeshBuilder.CreateLines('axisZ', {
			points: [
				Vector3.Zero(),
				new Vector3(0, 0, size),
				new Vector3(0, -0.05 * size, size * 0.95),
				new Vector3(0, 0, size),
				new Vector3(0, 0.05 * size, size * 0.95),
			],
		});
		axisZ.color = Color3.Blue();

		const localOrigin = new TransformNode('localOrigin');

		axisX.parent = localOrigin;
		axisY.parent = localOrigin;
		axisZ.parent = localOrigin;
		return localOrigin;
	}

	gridToWorld(gridPosition: number): Vector3 {
		return new Vector3(-(gridPosition % this.gridWidth), 0.6, Math.floor(gridPosition / this.gridWidth));
	}

	getStartPosition() {
		const pieces = {
			chick: { type: PieceType.chick, pos: 4 },
			elephant: { type: PieceType.elephant, pos: 2 },
			giraffe: { type: PieceType.giraffe, pos: 0 },
			lion: { type: PieceType.lion, pos: 1 },
		};
	}

	tempMyPiece() {
		const pieces = {
			chick: { type: PieceType.chick, pos: 4 },
			elephant: { type: PieceType.elephant, pos: 2 },
			giraffe: { type: PieceType.giraffe, pos: 0 },
			lion: { type: PieceType.lion, pos: 1 },
		};

		Object.entries(pieces).forEach((v) => {
			const [name, value] = v;

			const p = this.chicken.clone(name, null);
			p.id = name;
			p.position = this.gridToWorld(value.pos);

			const mat = new StandardMaterial(name + 'Mat');
			switch (value.type) {
				case PieceType.chick:
					mat.diffuseColor = Color3.Blue();
					break;
				case PieceType.chicken:
					mat.diffuseColor = Color3.Red();
					break;
				case PieceType.elephant:
					mat.diffuseColor = Color3.Purple();
					break;
				case PieceType.giraffe:
					mat.diffuseColor = Color3.Green();
					break;
				case PieceType.lion:
					mat.diffuseColor = Color3.Yellow();
					break;
			}
			p.material = mat;
		});

		this.chicken.dispose();
	}
}

new App();
