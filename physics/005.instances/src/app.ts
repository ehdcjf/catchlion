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
	Matrix,
	DistanceConstraint,
} from '@babylonjs/core';

import { AdvancedDynamicTexture, Button, Checkbox, Control, StackPanel, TextBlock } from '@babylonjs/gui';
import { UI } from './ui';

class App {
	private scene!: Scene;
	private engine!: Engine;
	private ground!: GroundMesh;
	private dirLight!: DirectionalLight;
	private instance!: Mesh;
	private ui!: UI;
	private shadowGen!: ShadowGenerator;

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
		await this.setPhysicsAsync();
		this.setCamera();
		this.setLight();
		this.ui = new UI(this.scene);

		this.buildGround(Vector3.Zero(), 40);
		this.instance = this.buildBox(new Vector3(0, 10, 0));

		this.addButtons();

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

		const shadowGen = new ShadowGenerator(1024, this.dirLight);
		shadowGen.bias = 0.01;
		shadowGen.usePercentageCloserFiltering = true;
		this.shadowGen = shadowGen;
	}

	private async setPhysicsAsync() {
		const wasmBinary = await fetch('./havok/HavokPhysics.wasm');
		const wasmBinaryArrayBuffer = await wasmBinary.arrayBuffer();
		const havokInterface = await HavokPhysics({
			wasmBinary: wasmBinaryArrayBuffer,
		});
		const hk = new HavokPlugin(true, havokInterface);
		this.scene.enablePhysics(new Vector3(0, -9.8, 0), hk);
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
		});

		ground.receiveShadows = true;
		this.ground = ground;

		if (this.ui.viewer) this.ui.viewer.showBody(this.ground.physicsBody!);
	}

	private buildBox(position: Vector3) {
		const box = MeshBuilder.CreateBox('root', {
			size: 1,
		});
		this.shadowGen.addShadowCaster(box);

		const numPerSide = 2;
		const size = 2;
		const offset = 2;

		const m = Matrix.Identity();
		const rm = Matrix.Identity();
		const r = Quaternion.Identity();
		const ridx = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
		let index = 0;

		const instanceCount = numPerSide * numPerSide * numPerSide;

		const matricesData = new Float32Array(16 * instanceCount);

		const colorData = new Float32Array(4 * instanceCount);

		for (let x = 0; x < numPerSide; x++) {
			// (m.m as any)[12] = -size / 2 + offset * x + position.x;
			m.multiplyAtIndex(12, 0);
			m.addAtIndex(12, -size / 2 + offset * x + position.x);
			for (let y = 0; y < numPerSide; y++) {
				m.multiplyAtIndex(13, 0);
				m.addAtIndex(13, -size / 2 + offset * y + position.y);

				for (let z = 0; z < numPerSide; z++) {
					m.multiplyAtIndex(14, 0);
					m.addAtIndex(14, -size / 2 + offset * z + position.z);

					const xr = Math.random() * Math.PI;
					const yr = Math.random() * Math.PI;
					const zr = Math.random() * Math.PI;

					Quaternion.FromEulerAnglesToRef(xr, yr, zr, r);

					r.toRotationMatrix(rm);

					for (const i of ridx) {
						m.multiplyAtIndex(i, 0);
						m.addAtIndex(i, rm.m[i]);
					}

					colorData[index * 4] = 0;
					colorData[index * 4 + 1] = 0;
					colorData[index * 4 + 2] = 1;
					colorData[index * 4 + 3] = 1;

					m.copyToArray(matricesData, index * 16);
					index++;
				}
			}
		}
		box.thinInstanceSetBuffer('matrix', matricesData, 16, false);
		box.thinInstanceSetBuffer('color', colorData, 4);

		const boxShape = new PhysicsShapeBox(
			Vector3.Zero(),
			Quaternion.Identity(),
			new Vector3(1, 1, 1),
			this.scene
		);

		const boxMat = new StandardMaterial('boxMat', this.scene);
		box.material = boxMat;

		if (box.getDescendants && box.getDescendants().length) {
			box.getDescendants().forEach((b: any) => {
				if (b.material) b.material = boxMat;
			});
		}

		const boxBody = new PhysicsBody(box, PhysicsMotionType.DYNAMIC, false, this.scene);
		boxBody.setMassProperties({ mass: 1 });
		boxShape.material = { friction: 0.2, restitution: 0.3 };

		boxBody.shape = boxShape;

		if (this.ui.viewer) {
			this.ui.viewer.showBody(box.physicsBody!);
		}

		return box;
	}

	addButtons() {
		this.ui.addButton('addBtn', 'Add instance', () => {
			const posotionMatrix = Matrix.Identity();
			posotionMatrix.setTranslationFromFloats(0, 10, 0);
			this.instance.thinInstanceAdd(posotionMatrix);
			const color = [Math.random(), Math.random(), Math.random(), 1];
			this.instance.thinInstanceSetAttributeAt('color', this.instance.thinInstanceCount - 1, color);
		});

		this.ui.addButton('removeBtn', 'Remove instance', () => {
			this.instance.thinInstanceCount--;
		});

		this.ui.addButton('syncBtn', 'Synchronize instance', () => {
			this.instance.physicsBody?.updateBodyInstances();
		});

		this.ui.addButton('applyForceBtn1', 'Apply force up to all instances', () => {
			this.instance.physicsBody?.applyForce(new Vector3(0, 200, 0), Vector3.Zero());
		});

		this.ui.addButton('applyForceBtn2', 'Apply force up to random instasnce', () => {
			const index = Math.floor(Math.random() * this.instance.thinInstanceCount);
			this.instance.physicsBody?.applyForce(new Vector3(0, 200, 0), Vector3.Zero(), index);
		});

		this.ui.addButton('ramdomizeBtn', 'Ramdomize mass', () => {
			for (let i = 0; i < this.instance.thinInstanceCount; i++) {
				const mass = Math.floor(Math.random() * 9) + 1; // maxMass = 10
				this.instance.physicsBody?.setMassProperties({ mass }, i);
			}
		});

		this.ui.addButton('lockBtn', 'Add constraint between two random instances', () => {
			const indexA = Math.floor(Math.random() * this.instance.thinInstanceCount);
			let indexB;
			do {
				indexB = Math.floor(Math.random() * this.instance.thinInstanceCount);
			} while (indexA === indexB);

			const distanceJoint = new DistanceConstraint(2, this.scene);
			this.instance.physicsBody?.addConstraint(
				this.instance.physicsBody,
				distanceJoint,
				indexA,
				indexB
			);

			const pairColor = [Math.random(), Math.random(), Math.random(), 1];

			this.instance.thinInstanceSetAttributeAt('color', indexA, pairColor);
			this.instance.thinInstanceSetAttributeAt('color', indexB, pairColor);
		});

		this.ui.addButton('randomMotionBtn', 'Randomize motion type', () => {
			for (let i = 0; i < this.instance.thinInstanceCount; i++) {
				const motionType =
					Math.random() > 0.5 ? PhysicsMotionType.STATIC : PhysicsMotionType.DYNAMIC;
				this.instance.physicsBody?.setMotionType(motionType, i);
			}
		});
	}
}

new App();
