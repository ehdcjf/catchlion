import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';
import * as GUI from '@babylonjs/gui';
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
	CubeTexture,
	SpotLight,
} from '@babylonjs/core';
import { AdvancedDynamicTexture, Control, StackPanel } from '@babylonjs/gui';

class App {
	private scene: Scene;
	private engine: Engine;
	private light: HemisphericLight;

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
		const camera = new ArcRotateCamera('camera', -Math.PI / 2.2, Math.PI / 2.2, 15, Vector3.Zero());
		camera.attachControl(true);
		this.light = new HemisphericLight('light', new Vector3(1, 1, 0));
		this.light.intensity = 1;

		await SceneLoader.ImportMeshAsync('', './models/', 'valleyvillage.glb', this.scene);
		await SceneLoader.ImportMeshAsync('', './models/', 'car.glb', this.scene);
		await SceneLoader.ImportMeshAsync('', './models/', 'lamp.babylon', this.scene);

		this.setSkyBox();
		this.setLamp();
		this.setGui();

		(this.scene.getMeshByName('ground').material as StandardMaterial).maxSimultaneousLights = 5;
		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
		this.engine.runRenderLoop(() => {
			this.scene.render();
		});
	}

	private setGui() {
		const adt = AdvancedDynamicTexture.CreateFullscreenUI('UI');

		const panel = new StackPanel();
		panel.width = '220px';
		panel.top = '-25px';

		panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
		panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
		adt.addControl(panel);

		const header = new GUI.TextBlock();
		header.text = 'Night to Day';
		header.height = '30px';
		header.color = 'white';
		panel.addControl(header);

		const slider = new GUI.Slider();
		slider.minimum = 0;
		slider.maximum = 1;
		slider.borderColor = 'black';
		slider.color = 'gray';
		slider.value = 1;
		slider.height = '20px';
		slider.width = '200px';
		slider.onValueChangedObservable.add((value) => {
			if (this.light) {
				this.light.intensity = value;
			}
		});
		panel.addControl(slider);
	}

	private setSkyBox() {
		const skybox = MeshBuilder.CreateBox('skybox', { size: 150 }, this.scene);
		const skyboxMaterial = new StandardMaterial('skyboxMat', this.scene);
		skyboxMaterial.backFaceCulling = false;
		skyboxMaterial.reflectionTexture = new CubeTexture('./textures/skybox', this.scene);

		skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
		skyboxMaterial.diffuseColor = Color3.White();
		skyboxMaterial.specularColor = Color3.White();
		skybox.material = skyboxMaterial;
	}

	private setLamp() {
		const lampLight = new SpotLight(
			'lampLight',
			Vector3.Zero(),
			new Vector3(0, -1, 0),
			0.8 * Math.PI,
			0.01,
			this.scene
		);

		lampLight.diffuse = Color3.Yellow();
		lampLight.parent = this.scene.getMeshByName('bulb');

		const lamp = this.scene.getMeshByName('lamp');
		lamp.position = new Vector3(2, 0, 2);
		lamp.rotation = Vector3.Zero();
		lamp.rotation.y = -Math.PI / 4;

		const lamp3 = lamp.clone('lamp3', lamp.parent);
		lamp3.position.z = -8;

		const lamp1 = lamp.clone('lamp1', lamp.parent);
		lamp1.position.x = -8;
		lamp1.position.z = 1.2;
		lamp1.rotation.y = Math.PI / 2;

		const lamp2 = lamp.clone('lamp2', lamp.parent);
		lamp2.position.x = -2.7;
		lamp2.position.z = 0.8;
		lamp2.position.x = -Math.PI / 2;
	}
}

new App();
