import { Color3, PhysicsViewer, Scene } from '@babylonjs/core';
import {
	AdvancedDynamicTexture,
	Button,
	Checkbox,
	Container,
	Control,
	SelectionPanel,
	Slider,
	StackPanel,
	TextBlock,
} from '@babylonjs/gui';

export class UI {
	public panel?: StackPanel;
	public viewer: PhysicsViewer | null | undefined;
	public main: AdvancedDynamicTexture;
	public selectBox?: SelectionPanel;

	constructor(private scene: Scene) {
		this.main = AdvancedDynamicTexture.CreateFullscreenUI('UI');
		this.panel = this.createPanel();
		// this.addSelectBox(this.main);
	}

	private createPanel() {
		const panel = new StackPanel();
		panel.spacing = 5;
		panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
		panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
		panel.paddingLeftInPixels = 10;
		panel.paddingTopInPixels = 10;
		panel.width = '30%';
		panel.color = 'white';
		this.main.addControl(panel);
		return panel;
	}

	private addDebugToggle(panel: Container) {
		//toggle
		const toggleViewLine = new StackPanel('toggleViewLine');
		toggleViewLine.isVertical = false;
		toggleViewLine.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
		toggleViewLine.spacing = 5;
		toggleViewLine.height = '25px';
		toggleViewLine.paddingTop = 2;
		panel.addControl(toggleViewLine);

		//toggle checkbox
		const checkbox = new Checkbox();
		checkbox.verticalAlignment = 0;
		checkbox.width = '20px';
		checkbox.height = '20px';
		checkbox.isChecked = false;
		checkbox.color = 'green';
		checkbox.onIsCheckedChangedObservable.add((value) => {
			if (value) {
				this.viewer = new PhysicsViewer(this.scene);
				for (const mesh of this.scene.meshes) {
					if (mesh.physicsBody) {
						this.viewer.showBody(mesh.physicsBody);
					}
				}
			} else {
				if (this.viewer) {
					this.viewer.dispose();
					this.viewer = null;
				}
			}
		});
		toggleViewLine.addControl(checkbox);

		const checkboxText = new TextBlock('checkbox', 'Debug Viewer');
		checkboxText.resizeToFit = true;
		checkboxText.color = 'white';
		toggleViewLine.addControl(checkboxText);
	}

	public addCheckBox(target: Container | AdvancedDynamicTexture, text: string, startValue: boolean, fn: any) {
		const checkbox = new Checkbox('check');
		checkbox.width = '20px';
		checkbox.height = '20px';
		checkbox.isChecked = startValue;
		checkbox.color = 'white';
		checkbox.onIsCheckedChangedObservable.add(fn);
		const selector = Control.AddHeader(checkbox, text, '300px', { isHorizontal: true, controlFirst: true });
		selector.width = '100%';
		selector.height = '40px';
		selector.color = 'white';
		target.addControl(selector);
	}

	public addButton(target: Container | AdvancedDynamicTexture, name: string, title: string, fn: any) {
		const addBtn = Button.CreateSimpleButton(name, title);
		addBtn.width = '100%';
		addBtn.height = '40px';
		addBtn.background = 'green';
		addBtn.color = 'white';
		addBtn.onPointerUpObservable.add(fn);
		target.addControl(addBtn);
	}

	public addText(
		target: StackPanel | Container | AdvancedDynamicTexture,
		updateFn: (c: TextBlock) => void,
		initialText = ''
	) {
		const bodiesCounter = new TextBlock('bodiesCounter', initialText);
		bodiesCounter.color = 'white';
		bodiesCounter.resizeToFit = true;
		bodiesCounter.fontSize = '20px';
		target.addControl(bodiesCounter);
		if (updateFn) {
			this.scene.onAfterRenderObservable.add(() => {
				updateFn(bodiesCounter);
			});
		}
	}

	addSimpleSlider(target: Container | AdvancedDynamicTexture, fn: (value: number) => void) {
		const slider = new Slider();
		slider.minimum = 0.1;
		slider.maximum = 20;
		slider.value = 5;
		slider.height = '20px';
		slider.width = '150px';
		slider.color = '#003399';
		slider.background = 'grey';
		slider.left = '120px';
		slider.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
		slider.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
		slider.onValueChangedObservable.add(fn);
		target.addControl(slider);
		return;
	}

	addSelectBox(target: StackPanel | Container | AdvancedDynamicTexture, name = 'sp') {
		const selectBox = new SelectionPanel(name);
		selectBox.width = 0.25;
		selectBox.height = 0.48;
		selectBox.color = 'white';
		selectBox.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
		selectBox.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
		target.addControl(selectBox);
		this.selectBox = selectBox;
	}
}
