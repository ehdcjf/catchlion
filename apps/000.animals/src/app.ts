import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';
import { Inspector } from '@babylonjs/inspector';
import { Engine, Scene, EngineFactory, ArcRotateCamera, HemisphericLight, Observable } from '@babylonjs/core';
import { HomeScene } from './scene/homeScene';
import { GameScene } from './scene/gameScene';
import { Observers } from './observer';
import { GameType, SceneName, type SceneEvent } from './const';

class App {
	private scene!: Scene;
	private engine!: Engine;
	private state = SceneName.HOME;
	camera!: ArcRotateCamera;
	light!: HemisphericLight;
	home?: HomeScene;
	game?: GameScene;
	sceneChanger: Observable<SceneEvent>;

	constructor() {
		this.sceneChanger = Observers.getInstance().sceneChanger;
		this.init();
	}

	private async init() {
		const canvas = document.querySelector('#gameCanvas') as HTMLCanvasElement;
		this.engine = (await EngineFactory.CreateAsync(canvas, undefined)) as Engine;

		this.scene = new HomeScene(this.engine);

		// 씬 변화를 감지하는 옵저버
		this.sceneChanger.add(async (data) => {
			// 우선 원래 신에서 컨트롤 제거
			this.scene.detachControl();
			// 로딩창 보여주고,
			this.engine.displayLoadingUI();

			// 새로운 씬 만들기
			let newScene: Scene;
			switch (data.sceneName) {
				case SceneName.HOME:
					newScene = new HomeScene(this.engine);
					break;
				case SceneName.SINGLE_GAME:
					newScene = new GameScene(this.engine, GameType.SINGLE);
					break;
				case SceneName.MULTI_GAME:
					newScene = new GameScene(this.engine, GameType.MULTI);
					break;
			}

			// 새로운 신이 준비되면
			await newScene.whenReadyAsync();

			this.scene.dispose();
			this.scene = newScene;
			this.engine.hideLoadingUI();
			// const newScene = new
			// this.scene = new HomeScene();
		});

		// this.game = new Game(this.engine);
		this.engine.runRenderLoop(() => {
			this.scene.render();
		});
		window.addEventListener('resize', () => {
			this.engine.resize();
		});
	}
}

new App();
