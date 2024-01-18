import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';
import HavokPhysics from '@babylonjs/havok';

import { AdvancedDynamicTexture, Button } from '@babylonjs/gui';
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
	GroundMesh,
	PhysicsAggregate,
	PhysicsShapeType,
	DynamicTexture,
	Mesh,
	PBRMaterial,
} from '@babylonjs/core';

class App {
	private scene: Scene;
	private engine: Engine;
	private ground: GroundMesh;

	constructor() {
		this.init();
	}

	private async init() {
		const canvas = document.querySelector(
			'#gameCanvas'
		) as HTMLCanvasElement;
		this.engine = (await EngineFactory.CreateAsync(
			canvas,
			undefined
		)) as Engine;

		this.createScene();
		this.engine.runRenderLoop(() => {
			if (this.scene) this.scene.render();
		});
		window.addEventListener('resize', () => {
			this.engine.resize();
		});
		// this.engine.displayLoadingUI();
		// await this.scene.whenReadyAsync();
		// this.engine.hideLoadingUI();
	}

	private async createScene() {
		this.scene = new Scene(this.engine);
		this.setCamera();
		this.setLight();
		await this.importHavokAsync();
		this.buildGround();

		const boxesSize = 1;
		const boxesHeight = 3;
		const yOffset = 0.5;

		this.createBoxes(
			boxesSize,
			boxesHeight,
			true,
			new Vector3(-2, 0, 0),
			yOffset
		);

		this.createLabel(new Vector3(-3, 3, 0), 'Start asleep');

		this.createBoxes(
			boxesSize,
			boxesHeight,
			false,
			new Vector3(2, 0, 0),
			yOffset
		);

		this.createLabel(new Vector3(1, 3, 0), 'Start awake');

		const ui = AdvancedDynamicTexture.CreateFullscreenUI('UI');

		const btn = Button.CreateSimpleButton(
			'btn',
			'Drop Object on towers'
		);

		btn.widthInPixels = 300;
		btn.heightInPixels = 40;
		btn.background = 'green';
		btn.top = '-40%';
		btn.onPointerClickObservable.add(() => {
			this.createBoxes(
				0.2,
				1,
				false,
				new Vector3(-2, 5, 0),
				0
			);

			this.createBoxes(
				0.2,
				1,
				false,
				new Vector3(2, 5, 0),
				0
			);
		});

		ui.addControl(btn);
	}

	private setCamera() {
		const camera = new FreeCamera(
			'camera',
			new Vector3(0, 3, -15),
			this.scene
		);
		camera.setTarget(new Vector3(0, 3, 0));
		camera.attachControl(true);
	}

	private setLight() {
		const light = new HemisphericLight(
			'light',
			new Vector3(0, 1, 0),
			this.scene
		);
		light.intensity = 0.9;
	}

	private buildGround() {
		const ground = MeshBuilder.CreateGround(
			'ground',
			{ width: 10, height: 10 },
			this.scene
		);
		this.ground = ground;
		new PhysicsAggregate(
			this.ground,
			PhysicsShapeType.BOX,
			{ mass: 0 },
			this.scene
		);
	}

	private async importHavokAsync() {
		const wasmBinary = await fetch('./havok/HavokPhysics.wasm');
		const wasmBinaryArrayBuffer = await wasmBinary.arrayBuffer();
		const havokInterface = await HavokPhysics({
			wasmBinary: wasmBinaryArrayBuffer,
		});
		// const havokInterface = await HavokPhysics();
		const hk = new HavokPlugin(true, havokInterface);
		this.scene.enablePhysics(new Vector3(0, -0.98, 0), hk);
	}

	private createLabel(position: Vector3, text: string) {
		const dynamicTexture = new DynamicTexture(
			'dynamicTexture' + text,
			512,
			this.scene,
			true
		);

		dynamicTexture.hasAlpha = true;
		dynamicTexture.drawText(
			text,
			null,
			null,
			'32px Arial',
			'white',
			'transparent'
		);

		const plane = MeshBuilder.CreatePlane(
			'label' + text,
			{ size: 2 },
			this.scene
		);

		plane.scaling.scaleInPlace(3);
		plane.position.copyFrom(position);
		plane.position.y += 2.5;
		plane.position.x += 1.4;
		plane.rotation.z += 1;
		const planeMat = new PBRMaterial('material' + text, this.scene);
		planeMat.unlit = true;
		planeMat.backFaceCulling = false;
		planeMat.albedoTexture = dynamicTexture;
		planeMat.useAlphaFromAlbedoTexture = true;
		plane.material = planeMat;
	}

	private createBoxes(
		size: number,
		numBoxes: number,
		startAsleep: boolean,
		pos: Vector3,
		yOffset: number
	) {
		for (let i = 0; i < numBoxes; i++) {
			const box = MeshBuilder.CreateBox(
				'box',
				{ size },
				this.scene
			);
			const boxMat = new StandardMaterial(
				'boxMat',
				this.scene
			);
			boxMat.diffuseColor = Color3.Random();
			box.position = pos.clone();
			box.position.y += i * (yOffset + size) + 0.5;
			new PhysicsAggregate(
				box,
				PhysicsShapeType.BOX,
				{ mass: 1, startAsleep },
				this.scene
			);
		}
	}
}

new App();
