import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';
import fontData from './Droid_Sans_Regular.json';
import {
	Engine,
	Scene,
	Vector3,
	Color3,
	SpriteManager,
	Color4,
	GreasedLineTools,
	CreateGreasedLine,
	Sprite,
	AbstractMesh,
} from '@babylonjs/core';
import { GUI3DManager, HolographicButton, TextBlock } from '@babylonjs/gui';
import { Observers } from '../observer';
import { SceneName } from '../const';

export class HomeScene extends Scene {
	private visibility: number;
	private spriteManager!: SpriteManager;
	private flowers: { targetSize: number; flower: Sprite }[];

	constructor(engine: Engine) {
		super(engine);
		this.visibility = 0;
		this.flowers = [];
		this.createScene();
	}
	private async createScene() {
		this.clearColor = new Color4(0, 0, 0);

		// catch lion flowers
		this.spriteManager = new SpriteManager(
			'spriteManager',
			'./sprites/flowers.png',
			2000,
			{ width: 105, height: 103 },
			this
		);

		const manager = new GUI3DManager(this);
		const playButton = new HolographicButton('playBtn');
		manager.addControl(playButton);
		const anchor = new AbstractMesh('anchor', this);
		playButton.linkToTransformNode(anchor);
		playButton.position.x += 50;
		playButton.position.y -= 30;
		playButton.scaling.x = 20;
		playButton.scaling.y = 10;
		playButton.scaling.z = 10;
		playButton.frontMaterial.albedoColor = Color3.Green();
		playButton.backMaterial.albedoColor = new Color3(0.3, 0.35, 0.4);

		const playButtonText = new TextBlock();
		playButtonText.text = 'Play';
		playButtonText.fontWeight = 'bold';
		playButtonText.color = 'white';
		playButtonText.fontSize = 72;
		playButton.content = playButtonText;
		// playButton.isVisible = false;
		playButton.onPointerClickObservable.add(() => {
			Observers.getInstance().sceneChanger.notifyObservers({ sceneName: SceneName.MULTI_GAME });
		});

		const singlePlayButton = new HolographicButton('joinBtn');
		manager.addControl(singlePlayButton);
		const joinAnchor = new AbstractMesh('anchor', this);
		singlePlayButton.linkToTransformNode(joinAnchor);
		singlePlayButton.position.x += 20;
		singlePlayButton.position.y -= 30;
		singlePlayButton.scaling.x = 20;
		singlePlayButton.scaling.y = 10;
		singlePlayButton.scaling.z = 10;
		singlePlayButton.frontMaterial.albedoColor = Color3.Green();
		singlePlayButton.backMaterial.albedoColor = new Color3(0.3, 0.35, 0.4);

		const singlePlayButtonText = new TextBlock();
		singlePlayButtonText.text = 'join';
		singlePlayButtonText.fontWeight = 'bold';
		singlePlayButtonText.color = 'white';
		singlePlayButtonText.fontSize = 72;
		singlePlayButton.content = singlePlayButtonText;
		// singlePlayButton.isVisible = false;
		singlePlayButton.onPointerClickObservable.add(() => {
			Observers.getInstance().sceneChanger.notifyObservers({ sceneName: SceneName.SINGLE_GAME });
		});

		const points = GreasedLineTools.GetPointsFromText('Catch Lion', 16, 2, fontData);

		const textLines = CreateGreasedLine('textLines', { points });
		const pointsInfo = points.map((line) => {
			const pointsVectors = GreasedLineTools.ToVector3Array(line) as Vector3[];
			const lineSegments = GreasedLineTools.GetLineSegments(pointsVectors);
			const lineLength = GreasedLineTools.GetLineLength(pointsVectors);
			return { pointsVectors, lineSegments, lineLength };
		});

		this.createDefaultCameraOrLight(true, true, true);
		this.activeCamera!.detachControl();

		textLines.visibility = 0;
		this.onBeforeRenderObservable.add(() => {
			if (this.visibility > 1) return;
			textLines.greasedLineMaterial!.visibility = this.visibility;
			this.visibility += 0.001 * this.getAnimationRatio();

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
				f.flower.width += 0.01 * this.getAnimationRatio();
				f.flower.height += 0.01 * this.getAnimationRatio();
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
