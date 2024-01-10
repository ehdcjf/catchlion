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
	DirectionalLight,
	Animation,
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
		const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 4, 10, new Vector3(0, 0, 0));

		camera.attachControl(true);

		const light1 = new DirectionalLight('directionLight', new Vector3(0, -1, 1));
		const light2 = new HemisphericLight('HemiLight', new Vector3(0, 1, 0));

		light1.intensity = 0.75;
		light2.intensity = 0.5;

		const box = MeshBuilder.CreateBox('box', {});
		box.position.x = 2;

		// const frameRate = 10;

		// const xSlideAnimation = new Animation(
		// 	'xSlide',
		// 	'position.x',
		// 	frameRate,
		// 	Animation.ANIMATIONTYPE_FLOAT,
		// 	Animation.ANIMATIONLOOPMODE_CYCLE
		// );

		// const keyFrames = [
		// 	{ frame: 0, value: 2 },
		// 	{ frame: frameRate, value: -2 },
		// 	{ frame: frameRate * 2, value: 2 },
		// ];

		// xSlideAnimation.setKeys(keyFrames);
		// box.animations.push(xSlideAnimation);
		// this.scene.beginAnimation(box, 0, 2 * frameRate, true);

		// 초당 프레임 수를 지정한다.
		// 1초에 10frame이 찍힌다.
		const frameRate = 10;
		const startFrame = 0;
		const endFrame = 10;
		//  startFrame 부터 endFrame 이 1초라는 뜻.

		// 만약 이 값을 1로 바꾼다면 1초에 1개의 프레임이 표시된다는 뜻이고,
		// startFrame 부터 endFrame 은 10개의 frame 이기 때문에 10초가 걸림.

		// 애니메이션을 만든다.
		// name: 애니메이션 이름은 xSlide
		// targetProperty: 애니메이션 대상이 되는 속성은 position.x
		// framePerSecond: 애니메이션의 초당 프레임 수는 frameRate = 10
		// dataType: ANIMATIONTYPE_FLOAT  잘은 모르겠지만 축을 따라 움직이는 애니메이션을 지정하는 듯
		// loopMode  반복여부
		const xSlide = new Animation(
			'xSlide',
			'position.x',
			frameRate,
			Animation.ANIMATIONTYPE_FLOAT,
			Animation.ANIMATIONLOOPMODE_CYCLE
		);

		// 키프레임을 구성한다.
		// startFrame = 0 .   최초 시작 지점의 position.x 가 2 이고
		// endFrame = 10 .  10개의 프레임이 지나간 다음에는 position.x 가 -2 위치.

		const keyFrames = [
			{ frame: startFrame, value: 2 },
			{ frame: endFrame, value: -2 },
		];

		xSlide.setKeys(keyFrames);
		box.animations.push(xSlide);

		this.scene.beginAnimation(box, startFrame, endFrame, false);

		this.scene.beginAnimation(box, endFrame, startFrame, false);

		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
		this.engine.runRenderLoop(() => {
			this.scene.render();
		});
	}
}

new App();
