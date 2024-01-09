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
	Mesh,
	ParticleSystem,
	Color4,
	PointerEventTypes,
	AbstractMesh,
} from '@babylonjs/core';

class App {
	private scene: Scene;
	private engine: Engine;
	private switched: boolean;
	private fountain: Mesh;
	private particleSystem: ParticleSystem;

	constructor() {
		this.init();
	}

	private async init() {
		const canvas = document.querySelector('#gameCanvas') as HTMLCanvasElement;
		this.engine = (await EngineFactory.CreateAsync(canvas, undefined)) as Engine;
		this.scene = new Scene(this.engine);
		await this.main();
	}

	private async main() {
		const camera = new ArcRotateCamera('camera', (3 * Math.PI) / 2, Math.PI / 2, 70, Vector3.Zero());
		camera.attachControl(true);

		const light = new HemisphericLight('hemilight', new Vector3(0, 1, 0));

		const fountainProfile = [
			new Vector3(0, 0, 0),
			new Vector3(10, 0, 0),
			new Vector3(10, 4, 0),
			new Vector3(8, 4, 0),
			new Vector3(8, 1, 0),
			new Vector3(1, 2, 0),
			new Vector3(1, 15, 0),
			new Vector3(3, 17, 0),
		];

		this.switched = false;

		this.fountain = MeshBuilder.CreateLathe(
			'fountain',
			{
				shape: fountainProfile,
				sideOrientation: Mesh.DOUBLESIDE,
			},
			this.scene
		);
		this.fountain.position.y = -5;

		const particleSystem = new ParticleSystem('particles', 5000, this.scene);

		particleSystem.particleTexture = new Texture('./textures/flare.png');

		particleSystem.emitter = new Vector3(0, 10, 0);
		particleSystem.minEmitBox = new Vector3(-1, 0, 0);
		particleSystem.maxEmitBox = new Vector3(1, 0, 0);

		particleSystem.color1 = new Color4(0.7, 0.8, 1.0, 1.0);
		particleSystem.color2 = new Color4(0.2, 0.5, 1.0, 1.0);
		particleSystem.colorDead = new Color4(0, 0, 0.2, 0.0);

		particleSystem.minSize = 0.1;
		particleSystem.maxSize = 0.5;

		particleSystem.minLifeTime = 2;
		particleSystem.maxLifeTime = 3.5;

		particleSystem.emitRate = 1500;
		particleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE;

		particleSystem.gravity = new Vector3(0, -9.81, 0);

		particleSystem.direction1 = new Vector3(-2, 8, 2);
		particleSystem.direction2 = new Vector3(2, 8, -2);

		particleSystem.minAngularSpeed = 0;
		particleSystem.maxAngularSpeed = Math.PI;

		particleSystem.minEmitPower = 1;
		particleSystem.maxEmitPower = 3;
		particleSystem.updateSpeed = 0.025;

		this.particleSystem = particleSystem;

		this.scene.onPointerObservable.add((pointerInfo) => {
			switch (pointerInfo.type) {
				case PointerEventTypes.POINTERDOWN:
					if (pointerInfo.pickInfo.hit) {
						this.pointerDownFountain(pointerInfo.pickInfo.pickedMesh);
					}
			}
		});

		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
		this.engine.runRenderLoop(() => {
			this.scene.render();
		});
	}

	private pointerDownFountain = (mesh: AbstractMesh) => {
		if (mesh == this.fountain) {
			this.switched = !this.switched;
			this.switched ? this.particleSystem.start() : this.particleSystem.stop();
		}
	};
}

new App();
