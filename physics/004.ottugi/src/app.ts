import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';
import HavokPhysics from '@babylonjs/havok';

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
	DirectionalLight,
	PhysicsViewer,
	PhysicsShapeBox,
	Quaternion,
	PhysicsBody,
	GroundMesh,
	PhysicsMotionType,
	ShadowGenerator,
} from '@babylonjs/core';

import { AdvancedDynamicTexture, Button, Checkbox, Control, StackPanel, TextBlock } from '@babylonjs/gui';

class App {
	private scene: Scene;
	private engine: Engine;
	sphere: Mesh;
	ground: Mesh;
	viewer: PhysicsViewer | null;
	dirLight: DirectionalLight;
	instances: Mesh[];

	constructor() {
		this.init();
	}

	private async init() {
		const canvas = document.querySelector('#gameCanvas') as HTMLCanvasElement;
		this.engine = (await EngineFactory.CreateAsync(canvas, undefined)) as Engine;

		await this.createScene();

		this.engine.runRenderLoop(() => {
			if (this.scene) this.scene.render();
		});
		window.addEventListener('resize', () => {
			this.engine.resize();
		});
	}

	private async createScene() {
		this.scene = new Scene(this.engine);
		this.setCamera();
		this.setLight();
		await this.setPhysicsAsync();
		this.buildGround(Vector3.Zero(), 40);

		// this.addBody(new Vector3(0, 10, 0));
		const instance1 = this.buildBox(new Vector3(0, 10, 0), 1, new Vector3(0, 0, 0));
		const instance2 = this.buildBox(new Vector3(4, 10, 0), 1, new Vector3(0, 2, 0));
		const instance3 = this.buildBox(new Vector3(8, 10, 0), 1, new Vector3(0, -2, 0));

		this.instances = [instance1, instance2, instance3];
		this.setGui();

		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
	}

	private setCamera() {
		const camera = new FreeCamera('camera', new Vector3(0, 10, -30), this.scene);
		camera.setTarget(Vector3.Zero());
		camera.attachControl(true);
	}

	private setLight() {
		const light = new HemisphericLight('light', new Vector3(0, 1, 0));
		light.intensity = 0.7;

		const dirLight = new DirectionalLight('dirLight', new Vector3(0, -1, 1));
		dirLight.autoCalcShadowZBounds = true;
		dirLight.intensity = 0.2;
		this.dirLight = dirLight;
	}

	private setGui() {
		const gui = AdvancedDynamicTexture.CreateFullscreenUI('UI');
		const panel = new StackPanel();
		panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
		panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
		panel.paddingLeftInPixels = 10;
		panel.paddingTopInPixels = 10;
		panel.width = '30%';
		gui.addControl(panel);

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

		//Add Button
		const addBtn = Button.CreateSimpleButton('addBtn', 'Push bodies');
		addBtn.width = '100%';
		addBtn.height = '40px';
		addBtn.background = 'green';
		addBtn.color = 'white';
		addBtn.onPointerUpObservable.add(() => {
			for (const instance of this.instances) {
				instance.physicsBody?.applyForce(new Vector3(0, 0, 1).scale(100), instance.position);
			}
		});
		panel.addControl(addBtn);
	}

	private buildGround(position: Vector3, size: number) {
		const ground = MeshBuilder.CreateGround('ground', { width: size, height: size }, this.scene);
		ground.position = position;
		ground.receiveShadows = true;

		const groundShape = new PhysicsShapeBox(
			Vector3.Zero(),
			Quaternion.Identity(),
			new Vector3(size, 0.1, size),
			this.scene
		);

		groundShape.material = { friction: 0.2, restitution: 0.3 };

		const groundBody = new PhysicsBody(ground, PhysicsMotionType.STATIC, false, this.scene);
		groundBody.shape = groundShape;
		groundBody.setMassProperties({
			mass: 0,
			centerOfMass: Vector3.Zero(),
			inertia: new Vector3(1, 1, 1),
			inertiaOrientation: Quaternion.Identity(),
		});

		ground.metadata = { shape: groundShape };

		this.ground = ground;

		if (this.viewer) this.viewer.showBody(this.ground.physicsBody!);
	}

	private buildBox(position: Vector3, mass: number, centerOfMass: Vector3) {
		const box = MeshBuilder.CreateBox('root', {
			width: 1,
			height: 4,
			depth: 1,
		});
		box.position = position;

		const boxMat = new StandardMaterial('boxMat');
		boxMat.diffuseColor = new Color3(0, 0, 1);
		boxMat.alpha = 0.8;
		box.material = boxMat;

		const boxBody = new PhysicsBody(box, PhysicsMotionType.DYNAMIC, false, this.scene);

		const centerOfMassIndicator = MeshBuilder.CreateSphere('centerOfMassIndicator', { diameter: 0.2 });

		centerOfMassIndicator.position = centerOfMass;
		centerOfMassIndicator.parent = box;
		const centerMat = new StandardMaterial('centerOfMassMaterial');
		centerMat.diffuseColor = new Color3(1, 0, 0);
		centerOfMassIndicator.material = centerMat;

		const boxShape = new PhysicsShapeBox(
			Vector3.Zero(),
			Quaternion.Identity(),
			new Vector3(1, 4, 1),
			this.scene
		);

		boxShape.material = { friction: 0.2, restitution: 0.3 };

		boxBody.shape = boxShape;
		boxBody.setMassProperties({ centerOfMass, mass: 1 });

		if (this.viewer) {
			this.viewer.showBody(box.physicsBody!);
		}

		return box;
	}

	private async setPhysicsAsync() {
		const wasmBinary = await fetch('./havok/HavokPhysics.wasm');
		const wasmBinaryArrayBuffer = await wasmBinary.arrayBuffer();
		const havokInterface = await HavokPhysics({
			wasmBinary: wasmBinaryArrayBuffer,
		});
		// const havokInterface = await HavokPhysics();
		const hk = new HavokPlugin(true, havokInterface);
		this.scene.enablePhysics(new Vector3(0, -9.8, 0), hk);
	}
}

new App();
