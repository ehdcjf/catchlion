import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';

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
	PointLight,
	GroundMesh,
	PointerEventTypes,
} from '@babylonjs/core';

class App {
	private scene!: Scene;
	private engine!: Engine;
	private startPoint?: Vector3 | null;
	private currentMesh?: Mesh | null;
	private camera!: ArcRotateCamera;
	private ground!: GroundMesh;

	constructor() {
		this.init();
	}

	private async init() {
		const canvas = document.querySelector('#gameCanvas') as HTMLCanvasElement;
		this.engine = (await EngineFactory.CreateAsync(canvas, undefined)) as Engine;

		this.createScene();
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
		this.setEnvironment();
		this.scene.onPointerObservable.add((pointerInfo) => {
			switch (pointerInfo.type) {
				case PointerEventTypes.POINTERDOWN:
					if (
						pointerInfo.pickInfo?.hit &&
						pointerInfo.pickInfo.pickedMesh != this.ground
					) {
						this.pointerDown(pointerInfo.pickInfo.pickedMesh as Mesh);
					}
					break;
				case PointerEventTypes.POINTERUP:
					this.pointerUp();
					break;
				case PointerEventTypes.POINTERMOVE:
					this.pointerMove();
					break;
			}
		});

		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
	}

	private setCamera() {
		const camera = new ArcRotateCamera('camera', 0, 0, 10, new Vector3(0, 0, 0), this.scene);
		camera.setPosition(new Vector3(20, 200, 400));
		camera.attachControl(true);
		camera.upperBetaLimit = (Math.PI / 2) * 0.99;
		this.camera = camera;
	}

	private setLight() {
		const light = new PointLight('omni', new Vector3(50, 200, 0), this.scene);
		light.intensity = 0.7;
	}

	private setEnvironment() {
		const groundMat = new StandardMaterial('groundMat', this.scene);
		groundMat.specularColor = Color3.Black();

		const redMat = new StandardMaterial('redMat', this.scene);
		redMat.diffuseColor = new Color3(0.4, 0.4, 0.4);
		redMat.specularColor = new Color3(0.4, 0.4, 0.4);
		redMat.emissiveColor = Color3.Red();

		const blueMat = new StandardMaterial('blueMat', this.scene);
		blueMat.diffuseColor = new Color3(0.4, 0.4, 0.4);
		blueMat.specularColor = new Color3(0.4, 0.4, 0.4);
		blueMat.emissiveColor = Color3.Blue();

		const yelloMat = new StandardMaterial('yellowMat', this.scene);
		yelloMat.diffuseColor = new Color3(0.4, 0.4, 0.4);
		yelloMat.specularColor = new Color3(0.4, 0.4, 0.4);
		yelloMat.emissiveColor = Color3.Yellow();

		const greenMat = new StandardMaterial('greenMat', this.scene);
		greenMat.diffuseColor = new Color3(0.4, 0.4, 0.4);
		greenMat.specularColor = new Color3(0.4, 0.4, 0.4);
		greenMat.emissiveColor = Color3.Green();

		const ground = MeshBuilder.CreateGround(
			'ground',
			{ width: 1000, height: 1000, updatable: false },
			this.scene
		);
		ground.material = groundMat;

		this.ground = ground;

		const redSphere = MeshBuilder.CreateSphere('redSphere', { diameter: 20 }, this.scene);
		redSphere.position.y = 10;
		redSphere.position.x -= 100;
		redSphere.material = redMat;

		const greenBox = MeshBuilder.CreateBox('greenBox', { size: 20 }, this.scene);
		greenBox.position.z -= 100;
		greenBox.position.y = 10;
		greenBox.material = greenMat;

		const blueBox = MeshBuilder.CreateBox('blueBox', { size: 20 }, this.scene);
		blueBox.position.x += 100;
		blueBox.position.y = 10;
		blueBox.material = blueMat;

		const yellowDounut = MeshBuilder.CreateTorus(
			'yelllowDounut',
			{ diameter: 30, thickness: 10 },
			this.scene
		);

		yellowDounut.position.y = 10;
		yellowDounut.position.z += 100;
		yellowDounut.material = yelloMat;
	}

	private getGroundPosition() {
		const pickInfo = this.scene.pick(
			this.scene.pointerX,
			this.scene.pointerY,
			(mesh) => mesh == this.ground
		);
		if (pickInfo.hit) {
			return pickInfo.pickedPoint;
		}
		return null;
	}

	private pointerDown(mesh: Mesh) {
		this.currentMesh = mesh;
		this.startPoint = this.getGroundPosition();
		if (this.startPoint) {
			setInterval(() => {
				this.camera.detachControl();
			}, 0);
		}
	}

	private pointerUp() {
		console.log(this.scene.activeCamera);
		if (this.startPoint) {
			console.log('xx');
			this.camera.attachControl();
			this.startPoint = null;
			return;
		}
	}

	private pointerMove() {
		if (!this.startPoint) return;
		const current = this.getGroundPosition();
		if (!current) return;

		const diff = current.subtract(this.startPoint);
		this.currentMesh?.position.addInPlace(diff);
		this.startPoint = current;
	}
}

new App();
