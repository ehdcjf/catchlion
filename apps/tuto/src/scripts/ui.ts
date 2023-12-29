import {
	TextBlock,
	StackPanel,
	AdvancedDynamicTexture,
	Image,
	Button,
	Rectangle,
	Control,
	Grid,
} from '@babylonjs/gui';
import {
	Scene,
	Sound,
	ParticleSystem,
	PostProcess,
	Effect,
} from '@babylonjs/core';

export class Hud {
	// Game Timer
	public time: number;
	private prevTime: number = 0;
	private clockTime: TextBlock = null;
	private startTime: number;
	private stopTimer: boolean;
	private sString: string = '00';
	private mString: number = 11;
	private lanternCnt: TextBlock;

	// Animated UI sprites
	private sparklerLife: Image;
	private spark: Image;

	// Timer Handlers
	public stopSpark: boolean;
	private handle;
	private sparkhandle;

	//Pause Toggle
	public gamePaused: boolean;

	//Quit game
	public quit: boolean;
	public transition: boolean = false;

	//UI Elements
	public pauseBtn: Button;
	public fadeLevel: number;
	private playerUI: AdvancedDynamicTexture;
	private pauseMenu: Rectangle;
	private controls: Rectangle;
	public tutorial: Rectangle;
	public hint: Rectangle;

	// Mobile
	public isMobile: boolean;
	public jumpBtn: Button;
	public dashBtn: Button;
	public leftBtn: Button;
	public rightBtn: Button;
	public upBtn: Button;
	public downBtn: Button;

	// Sounds
	public quitSfx: Sound;
	private sfx: Sound;
	private pause: Sound;
	private sparkWarningSfx: Sound;

	constructor(private scene: Scene) {
		this.playerUI = AdvancedDynamicTexture.CreateFullscreenUI('UI');
		this.playerUI.idealHeight = 720;

		this.lanternCnt = new TextBlock();
		this.lanternCnt.name = 'lantern count';
		this.lanternCnt.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_CENTER;
		this.lanternCnt.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
		this.lanternCnt.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
		this.lanternCnt.fontSize = '22px';
		this.lanternCnt.color = 'white';
		this.lanternCnt.text = 'Lanterns: 1 / 22';
		this.lanternCnt.top = '32px';
		this.lanternCnt.left = '-64px';
		this.lanternCnt.width = '25%';
		this.lanternCnt.fontFamily = 'Viga';
		this.lanternCnt.resizeToFit = true;
		this.playerUI.addControl(this.lanternCnt);

		const stackPanel = new StackPanel();
		stackPanel.height = '100%';
		stackPanel.width = '100%';
		stackPanel.top = '14px';
		stackPanel.verticalAlignment = 0;
		this.playerUI.addControl(stackPanel);

		this.clockTime = new TextBlock();
		this.clockTime.name = 'clock';
		this.clockTime.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
		this.clockTime.fontSize = '48px';
		this.clockTime.color = 'white';
		this.clockTime.text = '11:00';
		this.clockTime.resizeToFit = true;
		this.clockTime.width = '220px';
		this.clockTime.height = '96px';
		this.clockTime.fontFamily = 'Viga';
		stackPanel.addControl(this.clockTime);

		//sparkler bar animation
		this.sparklerLife = new Image('sparkLife', './sprites/sparkLife.png');
		this.sparklerLife.width = '54px';
		this.sparklerLife.height = '162px';
		this.sparklerLife.cellId = 0;
		this.sparklerLife.cellWidth = 36;
		this.sparklerLife.cellHeight = 108;
		this.sparklerLife.sourceWidth = 36;
		this.sparklerLife.sourceHeight = 108;
		this.sparklerLife.horizontalAlignment = 0;
		this.sparklerLife.verticalAlignment = 0;
		this.sparklerLife.left = '14px';
		this.sparklerLife.top = '14px';
		this.playerUI.addControl(this.sparklerLife);

		this.spark = new Image('spark', './sprites/spark.png');
		this.spark.width = '40px';
		this.spark.height = '40px';
		this.spark.cellId = 0;
		this.spark.cellHeight = 20;
		this.spark.cellWidth = 20;
		this.spark.sourceHeight = 20;
		this.spark.sourceWidth = 20;
		this.spark.horizontalAlignment = 0;
		this.spark.verticalAlignment = 0;
		this.spark.left = '21px';
		this.spark.top = '20px';
		this.playerUI.addControl(this.spark);

		this.pauseBtn = Button.CreateImageOnlyButton('pauseBtn', './sprites/pauseBtn.png');
		this.pauseBtn.width = '48px';
		this.pauseBtn.height = '86px';
		this.pauseBtn.thickness = 0;
		this.pauseBtn.verticalAlignment = 0;
		this.pauseBtn.horizontalAlignment = 1;
		this.pauseBtn.top = '-16px';
		this.playerUI.addControl(this.pauseBtn);
		this.pauseBtn.zIndex = 10;

		this.pauseBtn.onPointerDownObservable.add(() => {
			this.pauseMenu.isVisible = true;
			this.playerUI.addControl(this.pauseMenu);
			this.pauseBtn.isHitTestVisible = false;

			this.gamePaused = true;
			this.prevTime = this.time;

			this.scene.getSoundByName('gameSong').pause();
			this.pause.play();
		});

		this.tutorial = new Rectangle();
		this.tutorial.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
		this.tutorial.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
		this.tutorial.top = '12%';
		this.tutorial.left = '-1%';
		this.tutorial.height = 0.2;
		this.tutorial.width = 0.2;
		this.tutorial.thickness = 0;
		this.tutorial.alpha = 0.6;
		this.playerUI.addControl(this.tutorial);

		const movementPC = new Image('pause', 'sprites/tutorial.jpeg');
		this.tutorial.addControl(movementPC);

		this.hint = new Rectangle();
		this.hint.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
		this.hint.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
		this.hint.top = '14%';
		this.hint.left = '-4%';
		this.hint.height = 0.08;
		this.hint.thickness = 0;
		this.hint.alpha = 0.6;
		this.hint.isVisible = false;
		this.playerUI.addControl(this.hint);

		const lanternHint = new Image('lantern1', 'sprites/arrowBtn.png');
		lanternHint.rotation = Math.PI / 2;
		lanternHint.stretch = Image.STRETCH_UNIFORM;
		lanternHint.height = 0.8;
		lanternHint.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
		this.hint.addControl(lanternHint);

		const moveHint = new TextBlock('move', 'Move Right');
		moveHint.color = 'white';
		moveHint.fontSize = '12px';
		moveHint.fontFamily = 'Viga';
		moveHint.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
		moveHint.textWrapping = true;
		moveHint.resizeToFit = true;
		this.hint.addControl(moveHint);

		this.createPauseMenue();
		this.createControlMenu();
		this.loadSound();

		if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
			this.isMobile = true;

			movementPC.isVisible = false;
			const movementMobile = new Image('pause', 'sprites/tutorialMobile.jpeg');
			this.tutorial.addControl(movementMobile);

			const actionContainer = new Rectangle();
			actionContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
			actionContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
			actionContainer.height = 0.4;
			actionContainer.width = 0.2;
			actionContainer.left = '-2%';
			actionContainer.top = '-2%';
			actionContainer.thickness = 0;
			this.playerUI.addControl(actionContainer);

			const actionGrid = new Grid();
			actionGrid.addColumnDefinition(0.5);
			actionGrid.addColumnDefinition(0.5);
			actionGrid.addRowDefinition(0.5);
			actionGrid.addRowDefinition(0.5);
			actionContainer.addControl(actionGrid);
			this.playerUI.addControl(actionContainer);

			const dashBtn = Button.CreateImageOnlyButton('dash', './sprites/aBtn.png');
			dashBtn.thickness = 0;
			dashBtn.alpha = 0.8;
			dashBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
			this.dashBtn = dashBtn;

			const jumpBtn = Button.CreateImageOnlyButton('jump', './sprites/bBtn.png');
			jumpBtn.thickness = 0;
			jumpBtn.alpha = 0.8;
			dashBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
			this.jumpBtn = jumpBtn;

			actionGrid.addControl(dashBtn, 0, 1);
			actionGrid.addControl(jumpBtn, 1, 0);

			const moveContainer = new Rectangle();
			moveContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
			moveContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
			moveContainer.height = 0.4;
			moveContainer.width = 0.4;
			moveContainer.left = '2%';
			moveContainer.top = '-2%';
			moveContainer.thickness = 0;
			this.playerUI.addControl(moveContainer);

			const grid = new Grid();
			grid.addColumnDefinition(0.4);
			grid.addColumnDefinition(0.4);
			grid.addColumnDefinition(0.4);
			grid.addColumnDefinition(0.4);
			grid.addRowDefinition(0.5);
			grid.addRowDefinition(0.5);

			const leftBtn = Button.CreateImageOnlyButton('left', './sprites/arrowBtn.png');
			leftBtn.thickness = 0;
			leftBtn.rotation = -Math.PI / 2;
			leftBtn.color = 'white';
			leftBtn.alpha = 0.8;
			leftBtn.width = 0.8;
			leftBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
			this.leftBtn = leftBtn;

			const rightBtn = Button.CreateImageOnlyButton('right', './sprites/arrowBtn.png');
			rightBtn.thickness = 0;
			rightBtn.rotation = Math.PI / 2;
			rightBtn.color = 'white';
			rightBtn.alpha = 0.8;
			rightBtn.width = 0.8;
			rightBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
			this.rightBtn = rightBtn;

			const upBtn = Button.CreateImageOnlyButton('up', './sprits/arrowBtn.png');
			upBtn.thickness = 0;
			upBtn.alpha = 0.8;
			upBtn.color = 'white';
			this.upBtn = upBtn;

			const downBtn = Button.CreateImageOnlyButton('down', './sprites/arrowBtn.png');
			downBtn.thickness = 0;
			downBtn.rotation = Math.PI;
			downBtn.color = 'white';
			downBtn.alpha = 0.8;
			this.downBtn = downBtn;

			grid.addControl(leftBtn, 1, 0);
			grid.addControl(rightBtn, 1, 2);
			grid.addControl(upBtn, 0, 1);
			grid.addControl(downBtn, 1, 1);

			moveContainer.addControl(grid);
		}
	}

	public updateHud(): void {
		if (!this.stopTimer && this.startTime != null) {
			const curTime = Math.floor((new Date().getTime() - this.startTime) / 1000) + this.prevTime;
			this.time = curTime;
			this.clockTime.text = this.formatTime(curTime);
		}
	}

	public updateLanternCount(numLanterns: number): void {
		this.lanternCnt.text = `Lanterns: ${numLanterns} / 22`;
	}

	public setStartTimer(): void {
		this.startTime = new Date().getTime();
		this.stopTimer = false;
	}

	public setStopTimer(): void {
		this.stopTimer = true;
	}

	private formatTime(time: number): string {
		const minsPassed = Math.floor(time / 60);
		const secPassed = time % 240;
		if (secPassed % 4 == 0) {
			this.mString = Math.floor(minsPassed / 4) + 11;
			this.sString = (secPassed / 4 < 10 ? '0' : '') + secPassed / 4;
		}
		const day = this.mString == 11 ? 'PM' : 'AM';
		return `${this.mString}:${this.sString + day}`;
	}

	public startSparkTimer(sparkler: ParticleSystem): void {
		this.stopSpark = false;
		this.sparklerLife.cellId = 0;
		this.spark.cellId = 0;
		if (this.handle) {
			clearInterval(this.handle);
		}

		if (this.sparkhandle) {
			clearInterval(this.sparkhandle);
		}

		this.sparkWarningSfx.stop();

		if (sparkler != null) {
			sparkler.start();
			this.scene.getLightByName('sparklight').intensity = 35;
		}

		this.handle = setInterval(() => {
			if (!this.gamePaused) {
				if (this.sparklerLife.cellId < 10) {
					this.sparklerLife.cellId++;
				}
				if (this.sparklerLife.cellId == 9) {
					this.sparkWarningSfx.play();
				}
				if (this.sparklerLife.cellId == 10) {
					this.stopSpark = true;
					clearInterval(this.handle);
					this.sparkWarningSfx.stop();
				}
			} else {
				this.sparkWarningSfx.pause();
			}
		}, 2000);

		this.sparkhandle = setInterval(() => {
			if (!this.gamePaused) {
				if (this.sparklerLife.cellId < 10 && this.spark.cellId < 5) {
					this.spark.cellId++;
				} else if (this.sparklerLife.cellId < 10 && this.spark.cellId >= 5) {
					this.spark.cellId = 0;
				} else {
					this.spark.cellId = 0;
					clearInterval(this.sparkhandle);
				}
			}
		}, 185);
	}

	public stopSparklerTimer(sparkler: ParticleSystem): void {
		this.stopSpark = true;
		if (sparkler != null) {
			sparkler.stop();
			this.scene.getLightByName('sparklight').intensity = 0;
		}
	}

	private createPauseMenue(): void {
		this.gamePaused = false;

		this.pauseMenu = new Rectangle();
		this.pauseMenu.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
		this.pauseMenu.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
		this.pauseMenu.height = 0.8;
		this.pauseMenu.width = 0.5;
		this.pauseMenu.thickness = 0;
		this.pauseMenu.isVisible = false;

		//background image
		const image = new Image('pause', 'sprites/pause.jpeg');
		this.pauseMenu.addControl(image);

		const stackPanel = new StackPanel();
		stackPanel.width = 0.83;
		this.pauseMenu.addControl(stackPanel);

		const resumeBtn = Button.CreateSimpleButton('resume', 'RESUME');
		resumeBtn.width = 0.18;
		resumeBtn.height = '44px';
		resumeBtn.color = 'white';
		resumeBtn.fontFamily = 'Viga';
		resumeBtn.paddingBottom = '14px';
		resumeBtn.cornerRadius = 14;
		resumeBtn.fontSize = '12px';
		resumeBtn.textBlock.resizeToFit = true;
		resumeBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
		resumeBtn.horizontalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

		stackPanel.addControl(resumeBtn);

		resumeBtn.onPointerDownObservable.add(() => {
			this.pauseMenu.isVisible = false;
			this.playerUI.removeControl(this.pauseMenu);
			this.pauseBtn.isHitTestVisible = true;

			this.gamePaused = false;
			this.startTime = new Date().getTime();

			this.scene.getSoundByName('gameSong').play();
			this.pause.stop();

			if (this.sparkWarningSfx.isPaused) {
				this.sparkWarningSfx.play();
			}
			this.sfx.play();
		});

		const controlsBtn = Button.CreateSimpleButton('controls', 'CONTROLS');
		controlsBtn.width = 0.18;
		controlsBtn.height = '44px';
		controlsBtn.color = 'white';
		controlsBtn.fontFamily = 'Viga';
		controlsBtn.paddingBottom = '14px';
		controlsBtn.fontSize = '12px';
		resumeBtn.textBlock.resizeToFit = true;
		controlsBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
		controlsBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

		stackPanel.addControl(controlsBtn);

		controlsBtn.onPointerDownObservable.add(() => {
			this.controls.isVisible = true;
			this.pauseMenu.isVisible = false;

			this.sfx.play();
		});

		const quitBtn = Button.CreateSimpleButton('quit', 'QUIT');
		quitBtn.width = 0.18;
		quitBtn.height = '44px';
		quitBtn.color = 'white';
		quitBtn.fontFamily = 'Viga';
		quitBtn.paddingBottom = '12px';
		quitBtn.cornerRadius = 14;
		quitBtn.fontSize = '12px';
		resumeBtn.textBlock.resizeToFit = true;
		quitBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
		quitBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
		stackPanel.addControl(quitBtn);

		Effect.RegisterShader(
			'fade',
			`
			precision highp float;
			varying vec2 vUV;
			uniform sampler2D textureSampler;
			uniform float fadeLevel;
			void main(void) {
				vec4 baseColor = texture2D(textureSampler, vUV)* fadeLevel;
				baseColor.a = 1.0;
				gl_FragColor = baseColor;
			};
		`
		);
		this.fadeLevel = 1.0;

		quitBtn.onPointerDownObservable.add(() => {
			const postProcess = new PostProcess(
				'Fade',
				'fade',
				['fadeLevel'],
				null,
				1.0,
				this.scene.getCameraByName('cam')
			);
			postProcess.onApply = (effect) => {
				effect.setFloat('fadeLevel', this.fadeLevel);
			};
			this.transition = true;

			this.quitSfx.play();
			if (this.pause.isPlaying) {
				this.pause.stop();
			}
		});
	}

	private createControlMenu(): void {
		this.controls = new Rectangle();
		this.controls.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
		this.controls.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
		this.controls.height = 0.8;
		this.controls.width = 0.5;
		this.controls.thickness = 0;
		this.controls.color = 'white';
		this.controls.isVisible = false;
		this.playerUI.addControl(this.controls);

		const image = new Image('controls', 'sprites/controls.jpeg');
		this.controls.addControl(image);

		const title = new TextBlock('title', 'CONTROLS');
		title.resizeToFit = true;
		title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
		title.fontFamily = 'Viga';
		title.fontSize = '32px';
		title.top = '14px';
		this.controls.addControl(title);

		const backBtn = Button.CreateImageOnlyButton('back', './sprites/lanternbutton.jpeg');
		backBtn.width = '40px';
		backBtn.height = '40px';
		backBtn.top = '14px';
		backBtn.thickness = 0;
		backBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
		backBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
		this.controls.addControl(backBtn);

		backBtn.onPointerDownObservable.add(() => {
			this.pauseBtn.isVisible = true;
			this.controls.isVisible = false;
			this.sfx.play();
		});
	}

	private loadSound() {
		this.pause = new Sound('pauseSong', './sounds/Snowland.wav', this.scene, () => {}, { volume: 0.2 });
		this.sfx = new Sound('selection', './sounds/vgmenuselect.wav', this.scene, () => {});
		this.quitSfx = new Sound('quit', './sounds/Retro Event UI 13.wav', this.scene, () => {});
		this.sparkWarningSfx = new Sound(
			'sparkWarning',
			'./sounds/Retro Water Drop 01.wav',
			this.scene,
			() => {},
			{ loop: true, volume: 0.5, playbackRate: 0.6 }
		);
	}
}
