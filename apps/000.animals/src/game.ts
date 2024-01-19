import {
	MeshBuilder,
	StandardMaterial,
	type Scene,
	Texture,
	Vector3,
	SceneLoader,
	Axis,
	Tools,
	AbstractMesh,
	Color3,
	Node,
	Matrix,
	type Nullable,
	Mesh,
} from '@babylonjs/core';

export class Game {
	static readonly gridWidth = 3;
	static readonly gridDepth = 4;
	chicken!: AbstractMesh;
	public lion!: AbstractMesh;
	public elephant!: AbstractMesh;
	public giraffe!: AbstractMesh;
	private selected?: AbstractMesh | null;
	constructor(private scene: Scene) {
		this.buildGround();
		this.buildTile();
		this.loadAnimalAsync();

		this.scene.onPointerDown = (evt, pickInfo) => {
			const ray = this.scene.createPickingRay(
				this.scene.pointerX,
				this.scene.pointerY,
				Matrix.Identity(),
				this.scene.activeCamera
			);

			const hitTile = this.scene.pickWithRay(ray, (mesh) => {
				return mesh && mesh.metadata == 'tile';
			});

			const hitAnimal = this.scene.pickWithRay(ray, (mesh) => {
				return mesh && mesh.metadata == 'animal';
			});

			if (this.selected) {
				if (!hitTile?.pickedMesh && !hitAnimal?.pickedMesh) {
					this.changeOutLiner(this.selected);
					this.selected = null;
				} else if (hitTile?.pickedMesh) {
				}
			} else {
			}

			console.log(hitTile?.pickedMesh);
			console.log(hitAnimal?.pickedMesh?.getChildMeshes());
			console.log(hitAnimal?.pickedMesh);

			if (this.selected) {
				if (pickInfo.pickedMesh?.metadata === 'tile') {
					this.selected.position = this.gridToWorld(+pickInfo.pickedMesh.id);
					this.changeOutLiner(this.selected);
					this.selected = null;
				} else if (pickInfo.pickedMesh?.metadata == 'animal') {
					this.changeOutLiner(this.selected as Mesh);
					this.selected = pickInfo.pickedMesh!.parent!.parent as Mesh;
					this.changeOutLiner(this.selected);
				}
				// 타일이면 이동,
				// 적 애니멀이면 킬
				// 내 애니멀이면 selected 변경
			} else {
				if (pickInfo.pickedMesh?.metadata == 'animal') {
					this.selected = pickInfo.pickedMesh!.parent!.parent as AbstractMesh;
					this.changeOutLiner(this.selected);
				} else if (pickInfo.pickedMesh?.metadata == 'tile') {
				}
			}
		};
	}

	private buildGround() {
		const ground = MeshBuilder.CreateBox('table', {
			width: Game.gridWidth + 1,
			depth: Game.gridDepth + 1,
			height: 1,
		});

		const groundMat = new StandardMaterial('tableMat', this.scene);
		groundMat.diffuseTexture = new Texture('./textures/wood.jpeg');
		ground.material = groundMat;
		ground.receiveShadows = true;
		ground.position = new Vector3(Game.gridWidth / 2 - 0.5, 0, Game.gridDepth / 2 - 0.5);
	}

	private buildTile() {
		const originTile = MeshBuilder.CreateBox('tile', { width: 0.85, height: 0.1, depth: 0.85 });
		const tileMat = new StandardMaterial('tileMat', this.scene);
		const tileTexture = new Texture('./textures/tile.jpeg');

		tileTexture.vScale = 0.1;
		tileTexture.uScale = 0.1;
		tileTexture.uOffset = Math.random();
		tileTexture.vOffset = Math.random();
		tileMat.diffuseTexture = tileTexture;
		originTile.material = tileMat;
		originTile.receiveShadows = true;
		originTile.metadata = 'tile';

		for (let i = 0; i < Game.gridWidth * Game.gridDepth; i++) {
			const tile = originTile.clone('tile');
			tile.id = `${i}`;

			tile.position = new Vector3(i % Game.gridWidth, 0.55, Math.floor(i / Game.gridWidth));
		}
		originTile.dispose();
	}

	private async loadAnimalAsync() {
		await Promise.all([
			SceneLoader.ImportMeshAsync('', './models/', 'elephant3.glb'),
			SceneLoader.ImportMeshAsync('', './models/', 'lion3.glb'),
			SceneLoader.ImportMeshAsync('', './models/', 'giraffe.glb'),
		]);
		this.lion = this.loadAnimal('Lion', 0.3);
		this.elephant = this.loadAnimal('Elephant', 0.4);
		this.giraffe = this.loadAnimal('Giraffe', 0.3);
		this.lion.position = this.gridToWorld(1);
		this.elephant.position = this.gridToWorld(2);
		this.giraffe.position = this.gridToWorld(0);
	}

	private loadAnimal(name: string, scale: number): AbstractMesh {
		const animalNode = this.scene.getNodeByName(name);
		animalNode!.name = name + 'Node';
		animalNode!.parent!.name = name + 'Root';
		const animal = this.scene.getMeshByName(name + 'Root');
		animal!.rotate(Axis.Y, Tools.ToRadians(180));
		for (const d of animalNode!.getDescendants()) {
			(d as Mesh).metadata = 'animal';
			(d as Mesh).name = name;
			(d as Mesh).outlineColor = Color3.Green();
		}
		animal!.metadata = 'animalRoot';
		animal!.scaling = new Vector3(scale, scale, scale);
		animal!.position.y = 0.6;
		animal!.outlineColor = Color3.Green();
		return animal as AbstractMesh;
	}

	gridToWorld(gridPosition: number): Vector3 {
		return new Vector3(gridPosition % Game.gridWidth, 0.6, Math.floor(gridPosition / Game.gridWidth));
	}

	private changeOutLiner(mesh: AbstractMesh) {
		mesh.renderOutline = !mesh.renderOutline;
		for (const d of mesh.getDescendants()) {
			(d as Mesh).renderOutline = !(d as Mesh).renderOutline;
		}
	}
}
