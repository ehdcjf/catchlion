import { PhysicsViewer, Scene } from '@babylonjs/core';
import { AdvancedDynamicTexture, Button, Checkbox, Control, StackPanel, TextBlock } from '@babylonjs/gui';

export class UI {
	private panel: StackPanel;
	public viewer: PhysicsViewer | null;
	constructor(private scene: Scene) {
		this.panel = this.createPanel();
		this.addDebugToggle(this.panel);
	}

	private createPanel() {
		const gui = AdvancedDynamicTexture.CreateFullscreenUI('UI');
		const panel = new StackPanel();
		panel.spacing = 5;
		panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
		panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
		panel.paddingLeftInPixels = 10;
		panel.paddingTopInPixels = 10;
		panel.width = '30%';
		gui.addControl(panel);
		return panel;
	}

	private addDebugToggle(panel: StackPanel) {
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

	public addButton(name: string, title: string, callback: any) {
		const addBtn = Button.CreateSimpleButton(name, title);
		addBtn.width = '100%';
		addBtn.height = '40px';
		addBtn.background = 'green';
		addBtn.color = 'white';
		addBtn.onPointerUpObservable.add(callback);
		this.panel.addControl(addBtn);
	}
}
