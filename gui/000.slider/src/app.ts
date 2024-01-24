import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';
import { Inspector } from '@babylonjs/inspector';
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
	HavokPlugin,
	PhysicsAggregate,
	Mesh,
	PhysicsShapeType,
	Sprite,
	GreasedLineTools,
	CreateGreasedLine,
	SpriteManager,
	Color4,
} from '@babylonjs/core';

class App {
	private scene!: Scene;
	private engine!: Engine;
	visibility: number;
	spriteManager!: SpriteManager;
	flowers: { targetSize: number; flower: Sprite }[];

	constructor() {
		this.visibility = 0;
		this.flowers = [];
		this.init();
	}

	private async init() {
		const canvas = document.querySelector('#gameCanvas') as HTMLCanvasElement;
		this.engine = (await EngineFactory.CreateAsync(canvas, undefined)) as Engine;

		await this.createScene();

		// this.engine.displayLoadingUI();
		// await this.scene.whenReadyAsync();
		// this.engine.hideLoadingUI();

		this.engine.runRenderLoop(() => {
			if (this.scene) this.scene.render();
		});
		window.addEventListener('resize', () => {
			this.engine.resize();
		});
	}

	private async createScene() {
		this.scene = new Scene(this.engine);
		this.scene.createDefaultCamera(true, true, true);
		this.scene.activeCamera!.detachControl();
		this.scene.clearColor = new Color4(0, 0, 0, 1.0);

		this.spriteManager = new SpriteManager(
			'flowerSprite',
			'./sprites/flowers.png',
			2000,
			{
				width: 105,
				height: 103,
			},
			this.scene
		);

		const fontData = await (
			await fetch('https://assets.babylonjs.com/fonts/Droid Sans_Regular.json')
		).json();

		const points = GreasedLineTools.GetPointsFromText('Catch Lion', 16, 2, fontData);
		const textLines = CreateGreasedLine('textLines', { points });
		const pointsInfo = points.map((line) => {
			const pointsVectors = GreasedLineTools.ToVector3Array(line) as Vector3[];
			const lineSegments = GreasedLineTools.GetLineSegments(pointsVectors);
			const lineLength = GreasedLineTools.GetLineLength(pointsVectors);
			return { pointsVectors, lineSegments, lineLength };
		});

		textLines.visibility = 0;
		this.scene.onBeforeRenderObservable.add(() => {
			textLines.greasedLineMaterial!.visibility = this.visibility;
			this.visibility += 0.001 * this.scene.getAnimationRatio();

			for (const pi of pointsInfo) {
				const drawingPosition = GreasedLineTools.GetPositionOnLineByVisibility(
					pi.lineSegments,
					pi.lineLength,
					this.visibility
				);
				if (this.visibility <= 1 && Math.random() < 0.2) {
					this.addFlower(drawingPosition);
				}
			}
			this.animateFlowers();
		});
	}

	private animateFlowers() {
		for (const f of this.flowers) {
			if (f.flower.width < f.targetSize) {
				f.flower.width += 0.01 * this.scene.getAnimationRatio();
				f.flower.height += 0.01 * this.scene.getAnimationRatio();
			}
		}
	}

	private addFlower(position: Vector3) {
		const flower = new Sprite('flower', this.spriteManager);
		flower.width = 0;
		flower.height = 0;
		flower.cellIndex = (Math.round(Math.random() * 69) * 100) / 100;
		position.z = Math.random();
		position.x += Math.random() * 2 - 1;
		flower.position = position;
		this.flowers.push({ targetSize: Math.random() * 2 + 1, flower });
	}
}

new App();
