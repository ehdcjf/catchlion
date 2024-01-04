import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';
import 'babylonjs-serializers';
import {
	Engine,
	Scene,
	Vector3,
	Mesh,
	Color3,
	Color4,
	ShadowGenerator,
	GlowLayer,
	PointLight,
	FreeCamera,
	CubeTexture,
	Sound,
	PostProcess,
	Effect,
	SceneLoader,
	Matrix,
	MeshBuilder,
	Quaternion,
	AssetsManager,
	EngineFactory,
	ArcRotateCamera,
	Tools,
	HemisphericLight,
	StandardMaterial,
	Texture,
	MultiMaterial,
	SubMesh,
	Vector4,
} from '@babylonjs/core';
import { GLTF2Export } from 'babylonjs-serializers';

class App {
	private scene: Scene;
	private engine: Engine;
	ground: any;

	constructor() {
		this.init();
	}

	private async init() {
		const canvas = this.createCanvas();
		this.engine = (await EngineFactory.CreateAsync(canvas, undefined)) as Engine;
		this.scene = new Scene(this.engine);
		await this.main();
	}

	private async main() {
		this.setCamera();
		this.setLight();
		this.setBgm();
		const ground = this.buildGround();

		const houses = this.buildDewllings();

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
		const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 2.5, 10, Vector3.Zero());
		camera.attachControl(true);
	}

	private setLight() {
		const light = new HemisphericLight('light', new Vector3(1, 1, 0));
	}

	private setBgm() {
		const bgm = new Sound('bgm', './sounds/Sakura-Girl-Beach-chosic.com_.mp3', this.scene, () => {}, {
			volume: 0.25,
			loop: true,
			autoplay: true,
		});

		bgm.play();
	}

	private buildDewllings() {
		const detachedHouse = this.buildHouse(1);
		detachedHouse.rotation.y = -Math.PI / 16;
		detachedHouse.position.x = -6.8;
		detachedHouse.position.z = 2.5;

		const semiHouse = this.buildHouse(2);
		semiHouse.rotation.y = -Math.PI / 16;
		semiHouse.position.x = -4.5;
		semiHouse.position.z = 3;

		const places = [];

		places.push([1, -Math.PI / 16, -6.8, 2.5]);
		places.push([2, -Math.PI / 16, -4.5, 3]);
		places.push([2, -Math.PI / 16, -1.5, 4]);
		places.push([2, -Math.PI / 3, 1.5, 6]);
		places.push([2, (15 * Math.PI) / 16, -6.4, -1.5]);
		places.push([1, (15 * Math.PI) / 16, -4.1, -1]);
		places.push([2, (15 * Math.PI) / 16, -2.1, -0.5]);
		places.push([1, (5 * Math.PI) / 4, 0, -1]);
		places.push([1, Math.PI + Math.PI / 2.5, 0.5, -3]);
		places.push([2, Math.PI + Math.PI / 2.1, 0.75, -5]);
		places.push([1, Math.PI + Math.PI / 2.25, 0.75, -7]);
		places.push([2, Math.PI / 1.9, 4.75, -1]);
		places.push([1, Math.PI / 1.95, 4.5, -3]);
		places.push([2, Math.PI / 1.9, 4.75, -5]);
		places.push([1, Math.PI / 1.9, 4.75, -7]);
		places.push([2, -Math.PI / 3, 5.25, 2]);
		places.push([1, -Math.PI / 3, 6, 4]);

		const houses = [];
		for (let i = 0; i < places.length; i++) {
			if (places[i][0] === 1) {
				houses[i] = detachedHouse.createInstance('house' + i);
			} else {
				houses[i] = semiHouse.createInstance('house' + i);
			}
			houses[i].rotation.y = places[i][1];
			houses[i].position.x = places[i][2];
			houses[i].position.z = places[i][3];
		}
		return houses;
	}

	private buildGround() {
		const groundMat = new StandardMaterial('groundMat');
		groundMat.diffuseColor = new Color3(0.565, 0.933, 0.565);

		const ground = MeshBuilder.CreateGround('ground', { width: 15, height: 16 });
		ground.material = groundMat;
		return ground;
	}

	private buildRoof(width: number) {
		const roof = MeshBuilder.CreateCylinder('roof', { diameter: 1.3, height: 1.2, tessellation: 3 });
		roof.scaling.x = 0.75;
		roof.scaling.y = width;
		roof.rotation.z = Math.PI / 2;
		roof.position.y = 1.22;
		const roofMat = new StandardMaterial('roofMat');
		roofMat.diffuseTexture = new Texture('./textures/roof.jpg');
		roof.material = roofMat;
		return roof;
	}

	private buildBox(width: number) {
		const boxMat = new StandardMaterial('boxMat');
		const faceUV = [];

		if (width == 2) {
			boxMat.diffuseTexture = new Texture('./textures/semihouse.png');
			faceUV[0] = new Vector4(0.6, 0, 1, 1); // back
			faceUV[1] = new Vector4(0, 0, 0.4, 1); // front
			faceUV[2] = new Vector4(0.4, 0, 0.6, 1); // right
			faceUV[3] = new Vector4(0.4, 0, 0.6, 1); // left
		} else {
			boxMat.diffuseTexture = new Texture('./textures/cubehouse.png');
			faceUV[0] = new Vector4(0.5, 0, 0.75, 1); // back
			faceUV[1] = new Vector4(0, 0, 0.25, 1); // front
			faceUV[2] = new Vector4(0.25, 0, 0.5, 1); // right
			faceUV[3] = new Vector4(0.75, 0, 1, 1); // left
		}

		const box = MeshBuilder.CreateBox('box', { width: width, faceUV: faceUV, wrap: true });
		box.position.y = 0.5;
		box.material = boxMat;

		return box;
	}

	private buildHouse(width: number) {
		const box = this.buildBox(width);
		const roof = this.buildRoof(width);

		const house = Mesh.MergeMeshes([box, roof], true, false, null, false, true);
		return house;
	}
}

new App();
