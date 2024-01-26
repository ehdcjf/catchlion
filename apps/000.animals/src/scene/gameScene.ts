import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';
import { Engine, Scene, Vector3, ArcRotateCamera, Tools, HemisphericLight } from '@babylonjs/core';
import { Board } from '../board';
import { AdvancedDynamicTexture, Button, Control, StackPanel } from '@babylonjs/gui';
import { Observers } from '../observer';
import { SceneName, type GameType } from '../const';

export class GameScene extends Scene {
	private board!: Board;
	camera!: ArcRotateCamera;
	light!: HemisphericLight;

	constructor(engine: Engine, private gameType: GameType) {
		super(engine);
		this.createScene();
		Observers.getInstance().sendMsgObserver.notifyObservers(
			{ cmd: 'test', data: { hello: 'world' } },
			this.gameType
		);
	}

	private async createScene() {
		// this.engine.displayLoadingUI();

		this.setCamera();
		this.setLight();
		this.setBackButton();
		// this.scene.createDefaultEnvironment();

		this.board = new Board(this);
		await this.board.ready();
	}

	private setCamera() {
		const camera = new ArcRotateCamera(
			'camera',
			Tools.ToRadians(270),
			Tools.ToRadians(45),
			10,
			new Vector3(3 / 2, 0, 3 / 2 - 0.5),
			this
		);

		camera.minZ = 0.1;
		// camera.wheelDeltaPercentage = 90;
		camera.pinchDeltaPercentage = 40;
		// camera.angularSensibilityX = 3000;
		// camera.angularSensibilityY = 3000;
		camera.upperBetaLimit = Tools.ToRadians(80);
		camera.lowerRadiusLimit = 5;
		camera.upperRadiusLimit = 30;
		camera.attachControl(true);
		this.camera = camera;
	}

	private setLight() {
		const light = new HemisphericLight('light', new Vector3(4, 1, 0));
		this.light = light;
	}

	private setBackButton() {
		const gui = AdvancedDynamicTexture.CreateFullscreenUI('UI');
		const panel = new StackPanel();
		panel.spacing = 5;
		panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
		panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
		panel.paddingLeftInPixels = 10;
		panel.paddingTopInPixels = 10;
		panel.width = '30%';
		gui.addControl(panel);

		const backBtn = Button.CreateSimpleButton('backBtn', 'Back');
		backBtn.width = '100%';
		backBtn.height = '40px';
		backBtn.background = 'green';
		backBtn.color = 'white';
		backBtn.onPointerUpObservable.add(() => {
			Observers.getInstance().sceneChanger.notifyObservers({ sceneName: SceneName.HOME });
		});

		panel.addControl(backBtn);
	}
}
