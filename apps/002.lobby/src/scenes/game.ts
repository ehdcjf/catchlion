import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';
import fontData from './Droid_Sans_Regular.json';
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
	SpriteManager,
	Color4,
	GreasedLineTools,
	CreateGreasedLine,
	Sprite,
	Plane,
	TransformNode,
	AbstractMesh,
} from '@babylonjs/core';
import {
	AdvancedDynamicTexture,
	GUI3DManager,
	HolographicButton,
	InputText,
	PlanePanel,
	StackPanel,
	TextBlock,
} from '@babylonjs/gui';

export class Game {
	private scene!: Scene;
	constructor() {}
}

class Home {
	private scene!: Scene;
	private visibility: number;
	private spriteManager!: SpriteManager;
	private flowers: { targetSize: number; flower: Sprite }[];

	constructor(private engine: Engine) {
		this.visibility = 0;
		this.flowers = [];
		this.createScene();
	}
	private async createScene() {
		this.scene = new Scene(this.engine);
		this.scene.clearColor = new Color4(0, 0, 0);

		const manager = new GUI3DManager(this.scene);
		const playButton = new HolographicButton('playBtn');
		manager.addControl(playButton);
		const anchor = new AbstractMesh('anchor', this.scene);
		playButton.linkToTransformNode(anchor);
		playButton.position.x += 50;
		playButton.position.y -= 30;
		playButton.scaling.x = 20;
		playButton.scaling.y = 10;
		playButton.scaling.z = 10;
		playButton.frontMaterial.albedoColor = Color3.Green();
		playButton.backMaterial.albedoColor = new Color3(0.3, 0.35, 0.4);
		var PlayButtonText = new TextBlock();
		PlayButtonText.text = 'Play';
		PlayButtonText.fontWeight = 'bold';
		PlayButtonText.color = 'white';
		PlayButtonText.fontSize = 72;
		playButton.content = PlayButtonText;
		// playButton.isVisible = false;
		playButton.onPointerClickObservable.add(() => {
			console.log('xxxx');
		});

		// catch lion flowers
		this.spriteManager = new SpriteManager(
			'spriteManager',
			'./sprites/flowers.png',
			2000,
			{ width: 105, height: 103 },
			this.scene
		);

		const points = GreasedLineTools.GetPointsFromText('Catch Lion', 16, 2, fontData);

		const textLines = CreateGreasedLine('textLines', { points });
		const pointsInfo = points.map((line) => {
			const pointsVectors = GreasedLineTools.ToVector3Array(line) as Vector3[];
			const lineSegments = GreasedLineTools.GetLineSegments(pointsVectors);
			const lineLength = GreasedLineTools.GetLineLength(pointsVectors);
			return { pointsVectors, lineSegments, lineLength };
		});

		this.scene.createDefaultCameraOrLight(true, true, true);
		this.scene.activeCamera!.detachControl();

		textLines.visibility = 0;
		this.scene.onBeforeRenderObservable.add(() => {
			if (this.visibility > 1) return;
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
