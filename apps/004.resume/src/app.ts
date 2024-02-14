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
	AnimationGroup,
} from '@babylonjs/core';

const RESUME_ANIM = 'resumeAnim' as const;

class App {
	private scene!: Scene;
	private engine!: Engine;

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
		this.engine.displayLoadingUI();
		this.scene = new Scene(this.engine);
		this.setCamera();
		this.setLight();

		// this.scene.onReadyObservable.addOnce(async () => {
		// 	setTimeout(() => {
		// 		const resumeAnim = this.scene.getAnimationGroupByName(RESUME_ANIM);
		// 		resumeAnim?.play();
		// 	}, 1500);
		// });

		await this.loadAssetAsync();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
	}

	private setCamera() {
		const camera = new FreeCamera('camera', new Vector3(0, 6, 20));
		camera.setTarget(Vector3.Zero());
		camera.inputs.addMouseWheel();
		camera.attachControl(true);
	}

	private setLight() {
		const light = new HemisphericLight('light', Vector3.Zero());
		light.intensity = 0.7;
	}

	private async loadAssetAsync() {
		const resume = await SceneLoader.ImportMeshAsync('', './models/', 'resume3.glb');
		const resumeAnimation = resume.animationGroups;

		const resumeAnim = new AnimationGroup(RESUME_ANIM);
		resumeAnimation.forEach((anim) => {
			anim.stop();
			const animName = anim.name;
			const meshName = animName.split('_')[0];
			anim.targetedAnimations.forEach((targetedAnimation) => {
				resumeAnim.addTargetedAnimation(
					targetedAnimation.animation,
					this.scene.getMeshByName(meshName)
				);
			});

			anim.dispose();
		});

		// this.scene.getMaterialById();
	}
}

new App();
