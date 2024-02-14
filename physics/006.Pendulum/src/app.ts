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
	HingeConstraint,
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
		this.instance = this.buildBoxes(new Vector3(0, 10, 0));

		this.instance.physicsBody?.setMotionType(PhysicsMotionType.STATIC, 0);
		this.instance.physicsBody?.setMassProperties({ mass: 0 }, 0);

		const distance = 2;
		const axis = new Vector3(0, 1, 0);

		for (let i = 1; i < this.instance.thinInstanceCount; i++) {
			const constraint = new HingeConstraint(
				axis,
				axis.scale(distance * (i + 1) - 1),
				axis,
				axis,
				this.scene
			);

			this.instance.physicsBody?.addConstraint(this.instance.physicsBody, constraint, 0, i);
		}

		this.ui.addButton('impulseBtn', 'Apply impulse', () => {
			this.instance.physicsBody?.applyImpulse(new Vector3(-1, 0, 0).scale(500), Vector3.Zero());
		});

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
		const ground = MeshBuilder.CreateGround(
			'ground',
			{ width: size, height: size, subdivisions: 2 },
			this.scene
		);
		ground.position = position;
		ground.receiveShadows = true;

		const groundBody = new PhysicsBody(ground, PhysicsMotionType.STATIC, false, this.scene);

		const groundShape = new PhysicsShapeBox(
			Vector3.Zero(),
			Quaternion.Identity(),
			new Vector3(size, 0.1, size),
			this.scene
		);

		groundShape.material = { friction: 0.2, restitution: 0.3 };
		groundBody.shape = groundShape;
		groundBody.setMassProperties({
			mass: 0,
		});

		ground.receiveShadows = true;
		this.ground = ground;

		if (this.ui.viewer) this.ui.viewer.showBody(this.ground.physicsBody!);
	}

	private buildBoxes(position: Vector3) {
		const box = MeshBuilder.CreateBox('root', {
			size: 1,
		});
		this.shadowGen.addShadowCaster(box);

		const m = Matrix.Identity();
		const rm = Matrix.Identity();
		const r = Quaternion.Identity();
		const ridx = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
		let index = 0;

		const instanceCount = 5;
		const spacing = 2;

		const matricesData = new Float32Array(16 * instanceCount);
		const colorData = new Float32Array(4 * instanceCount);

		for (let x = 0; x < instanceCount; x++) {
			// (m.m as any)[12] = -size / 2 + offset * x + position.x;
			m.multiplyAtIndex(12, 0);
			m.addAtIndex(12, spacing * x + position.x);
			m.multiplyAtIndex(13, 0);
			m.addAtIndex(13, position.y);
			m.multiplyAtIndex(14, 0);
			m.addAtIndex(14, position.z);

			const xr = 0;
			const yr = 0;
			const zr = 0;

			Quaternion.FromEulerAnglesToRef(xr, yr, zr, r);

			r.toRotationMatrix(rm);

			for (const i of ridx) {
				m.multiplyAtIndex(i, 0);
				m.addAtIndex(i, rm.m[i]);
			}

			colorData[index * 4] = Math.random();
			colorData[index * 4 + 1] = Math.random();
			colorData[index * 4 + 2] = Math.random();
			colorData[index * 4 + 3] = 1;

			m.copyToArray(matricesData, index * 16);
			index++;
		}
		box.thinInstanceSetBuffer('matrix', matricesData, 16, false);
		box.thinInstanceSetBuffer('color', colorData, 4);

		new PhysicsAggregate(box, PhysicsShapeType.BOX, { mass: 1 }, this.scene);

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
}

new App();
