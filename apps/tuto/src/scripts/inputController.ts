import { Scene, ActionManager, ExecuteCodeAction, Scalar } from '@babylonjs/core';
import { Hud } from './ui';

export class PlayerInput {
	public inputMap: Record<string, boolean>;

	//simple movement
	public horizontal: number = 0;
	public vertical: number = 0;

	public horizontalAxis: number = 0;
	public verticalAxis: number = 0;

	public jumpKeyDown: boolean = false;
	public dashing: boolean = false;

	public mobileLeft: boolean;
	public mobileRight: boolean;
	public mobileUp: boolean;
	public mobileDown: boolean;
	private mobileJump: boolean;
	private mobileDash: boolean;

	constructor(private scene: Scene, private ui: Hud) {
		this.scene.actionManager = new ActionManager(this.scene);

		this.inputMap = {};

		this.scene.actionManager.registerAction(
			new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (event) => {
				this.inputMap[event.sourceEvent.key] = event.sourceEvent.type == 'keydown';
			})
		);

		this.scene.actionManager.registerAction(
			new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (event) => {
				this.inputMap[event.sourceEvent.key] = event.sourceEvent.type == 'keydown';
			})
		);

		this.scene.onBeforeRenderObservable.add(() => {
			this.updateFromKeyboard();
		});

		if (this.ui.isMobile) {
			this.setUpMobile();
		}
	}

	private updateFromKeyboard(): void {
		if ((this.inputMap['ArrowUp'] || this.mobileUp) && !this.ui.gamePaused) {
			this.verticalAxis = 1;
			this.vertical = Scalar.Lerp(this.vertical, 1, 0.2);
		} else if ((this.inputMap['ArrowDown'] || this.mobileDown) && !this.ui.gamePaused) {
			this.verticalAxis = -1;
			this.vertical = Scalar.Lerp(this.vertical, -1, 0.2);
		} else {
			this.vertical = 0;
			this.verticalAxis = 0;
		}

		if ((this.inputMap['ArrowLeft'] || this.mobileLeft) && !this.ui.gamePaused) {
			this.horizontal = Scalar.Lerp(this.horizontal, -1, 0.2);
			this.horizontalAxis = -1;
		} else if ((this.inputMap['ArrowRight'] || this.mobileRight) && !this.ui.gamePaused) {
			this.horizontal = Scalar.Lerp(this.horizontal, 1, 0.2);
			this.horizontalAxis = 1;
		} else {
			this.horizontal = 0;
			this.horizontalAxis = 0;
		}

		if ((this.inputMap['Shift'] || this.mobileDash) && !this.ui.gamePaused) {
			this.dashing = true;
		} else {
			this.dashing = false;
		}

		if ((this.inputMap[' '] || this.mobileJump) && !this.ui.gamePaused) {
			this.jumpKeyDown = true;
		} else {
			this.jumpKeyDown = false;
		}
	}

	private setUpMobile(): void {
		this.ui.jumpBtn.onPointerDownObservable.add(() => {
			this.mobileJump = true;
		});

		this.ui.jumpBtn.onPointerUpObservable.add(() => {
			this.mobileJump = false;
		});

		this.ui.dashBtn.onPointerDownObservable.add(() => {
			this.mobileDash = true;
		});
		this.ui.dashBtn.onPointerUpObservable.add(() => {
			this.mobileDash = false;
		});

		//Arrow Keys
		this.ui.leftBtn.onPointerDownObservable.add(() => {
			this.mobileLeft = true;
		});
		this.ui.leftBtn.onPointerUpObservable.add(() => {
			this.mobileLeft = false;
		});

		this.ui.rightBtn.onPointerDownObservable.add(() => {
			this.mobileRight = true;
		});
		this.ui.rightBtn.onPointerUpObservable.add(() => {
			this.mobileRight = false;
		});

		this.ui.upBtn.onPointerDownObservable.add(() => {
			this.mobileUp = true;
		});
		this.ui.upBtn.onPointerUpObservable.add(() => {
			this.mobileUp = false;
		});

		this.ui.downBtn.onPointerDownObservable.add(() => {
			this.mobileDown = true;
		});
		this.ui.downBtn.onPointerUpObservable.add(() => {
			this.mobileDown = false;
		});
	}
}
