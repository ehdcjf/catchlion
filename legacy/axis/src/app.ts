import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';
import * as BABYLON from '@babylonjs/core';

class App {
	private scene: BABYLON.Scene;
	private engine: BABYLON.Engine;

	constructor() {
		this.init();
	}

	private async init() {
		const canvas = this.createCanvas();
		this.engine = (await BABYLON.EngineFactory.CreateAsync(
			canvas,
			undefined
		)) as BABYLON.Engine;
		this.scene = new BABYLON.Scene(this.engine);
		await this.main();
	}

	private async main() {
		this.setCamera();
		this.setLight();

		const { boxParent, boxChild } = this.buildBox();

		const boxChildAxis = this.buildLocalAxis(1);
		boxChildAxis.parent = boxChild;
		this.showAxis(6);

		this.engine.displayLoadingUI();
		await this.scene.whenReadyAsync();
		this.engine.hideLoadingUI();
		this.engine.runRenderLoop(() => {
			this.scene.render();
		});
	}

	private createCanvas() {
		document.documentElement.style['overflow'] = 'hidden';
		document.documentElement.style.overflow = 'hidden';
		document.documentElement.style.width = '100%';
		document.documentElement.style.height = '100%';
		document.documentElement.style.margin = '0';
		document.documentElement.style.padding = '0';
		document.body.style.overflow = 'hidden';
		document.body.style.width = '100%';
		document.body.style.height = '100%';
		document.body.style.margin = '0';
		document.body.style.padding = '0';

		//create the canvas html element and attach it to the webpage
		const canvas = document.createElement('canvas');
		canvas.style.width = '100%';
		canvas.style.height = '100%';
		canvas.id = 'gameCanvas';
		document.body.appendChild(canvas);
		return canvas;
	}

	private setCamera() {
		const camera = new BABYLON.ArcRotateCamera(
			'camera',
			-Math.PI / 2.2,
			Math.PI / 2.5,
			15,
			BABYLON.Vector3.Zero()
		);
		camera.attachControl(true);
	}

	private setLight() {
		const light = new BABYLON.HemisphericLight(
			'light',
			new BABYLON.Vector3(0, 1, 0)
		);
	}

	private buildBox() {
		const faceColors: any = [];
		faceColors[0] = BABYLON.Color3.Blue();
		faceColors[1] = BABYLON.Color3.Teal();
		faceColors[2] = BABYLON.Color3.Red();
		faceColors[3] = BABYLON.Color3.Purple();
		faceColors[4] = BABYLON.Color3.Green();
		faceColors[5] = BABYLON.Color3.Yellow();

		const boxParent = BABYLON.MeshBuilder.CreateBox('Box', {
			faceColors: faceColors,
		});
		const boxChild = BABYLON.MeshBuilder.CreateBox('Box', {
			size: 0.5,
			faceColors: faceColors,
		});
		boxChild.setParent(boxParent);

		boxChild.position.x = 0;
		boxChild.position.y = 2;
		boxChild.position.z = 0;

		boxChild.rotation.x = Math.PI / 4;
		boxChild.rotation.y = Math.PI / 4;
		boxChild.rotation.z = Math.PI / 4;

		boxParent.position.x = 2;
		boxParent.position.y = 0;
		boxParent.position.z = 0;

		boxParent.rotation.x = 0;
		boxParent.rotation.y = 0;
		boxParent.rotation.z = -Math.PI / 4;

		return { boxParent, boxChild };
	}

	private showAxis(size: number) {
		const axisX = BABYLON.MeshBuilder.CreateLines('axisX', {
			points: [
				BABYLON.Vector3.Zero(),
				new BABYLON.Vector3(size, 0, 0),
				new BABYLON.Vector3(
					size * 0.95,
					size * 0.05,
					0
				),
				new BABYLON.Vector3(size, 0, 0),
				new BABYLON.Vector3(
					size * 0.95,
					-size * 0.05,
					0
				),
			],
		});

		axisX.color = BABYLON.Color3.Red();
		const xChar = this.makeTextPlane('X', 'red', size / 10);
		xChar.position = new BABYLON.Vector3(
			0.9 * size,
			-0.05 * size,
			0
		);

		const axisY = BABYLON.MeshBuilder.CreateLines('axisY', {
			points: [
				BABYLON.Vector3.Zero(),
				new BABYLON.Vector3(0, size, 0),
				new BABYLON.Vector3(
					-0.05 * size,
					size * 0.95,
					0
				),
				new BABYLON.Vector3(0, size, 0),
				new BABYLON.Vector3(
					0.05 * size,
					size * 0.95,
					0
				),
			],
		});

		axisY.color = BABYLON.Color3.Green();
		const yChar = this.makeTextPlane('Y', 'green', size / 10);
		yChar.position = new BABYLON.Vector3(
			0,
			0.9 * size,
			-0.05 * size
		);

		const axisZ = BABYLON.MeshBuilder.CreateLines('axisZ', {
			points: [
				BABYLON.Vector3.Zero(),
				new BABYLON.Vector3(0, 0, size),
				new BABYLON.Vector3(
					0,
					-0.05 * size,
					size * 0.95
				),
				new BABYLON.Vector3(0, 0, size),
				new BABYLON.Vector3(
					0,
					0.05 * size,
					size * 0.95
				),
			],
		});
		axisZ.color = BABYLON.Color3.Blue();
		const zChar = this.makeTextPlane('Z', 'blue', size / 10);
		zChar.position = new BABYLON.Vector3(
			0,
			0.05 * size,
			0.9 * size
		);
	}

	private makeTextPlane(text: string, color: string, size: number) {
		const dynamicTexture = new BABYLON.DynamicTexture(
			'dynamicTexture',
			50,
			this.scene,
			true
		);
		dynamicTexture.hasAlpha = true;
		dynamicTexture.drawText(
			text,
			5,
			40,
			'bold 36px Arial',
			color,
			'transparent',
			true
		);
		const plane = BABYLON.MeshBuilder.CreatePlane(
			'textPlain',
			{ size, updatable: true },
			this.scene
		);
		const mat = new BABYLON.StandardMaterial(
			'textPlaneMaterial',
			this.scene
		);
		mat.backFaceCulling = false;
		mat.specularColor = BABYLON.Color3.Black();
		mat.diffuseTexture = dynamicTexture;
		plane.material = mat;
		return plane;
	}

	private buildLocalAxis(size: number) {
		const axisX = BABYLON.MeshBuilder.CreateLines('axisX', {
			points: [
				BABYLON.Vector3.Zero(),
				new BABYLON.Vector3(size, 0, 0),
				new BABYLON.Vector3(
					size * 0.95,
					size * 0.05,
					0
				),
				new BABYLON.Vector3(size, 0, 0),
				new BABYLON.Vector3(
					size * 0.95,
					-size * 0.05,
					0
				),
			],
		});

		axisX.color = BABYLON.Color3.Red();

		const axisY = BABYLON.MeshBuilder.CreateLines('axisY', {
			points: [
				BABYLON.Vector3.Zero(),
				new BABYLON.Vector3(0, size, 0),
				new BABYLON.Vector3(
					-0.05 * size,
					size * 0.95,
					0
				),
				new BABYLON.Vector3(0, size, 0),
				new BABYLON.Vector3(
					0.05 * size,
					size * 0.95,
					0
				),
			],
		});

		axisY.color = BABYLON.Color3.Green();

		const axisZ = BABYLON.MeshBuilder.CreateLines('axisZ', {
			points: [
				BABYLON.Vector3.Zero(),
				new BABYLON.Vector3(0, 0, size),
				new BABYLON.Vector3(
					0,
					-0.05 * size,
					size * 0.95
				),
				new BABYLON.Vector3(0, 0, size),
				new BABYLON.Vector3(
					0,
					0.05 * size,
					size * 0.95
				),
			],
		});
		axisZ.color = BABYLON.Color3.Blue();

		const localOrigin = new BABYLON.TransformNode('localOrigin');

		axisX.parent = localOrigin;
		axisY.parent = localOrigin;
		axisZ.parent = localOrigin;
		return localOrigin;
	}
}

new App();
