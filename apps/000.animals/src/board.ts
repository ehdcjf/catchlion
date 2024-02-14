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
	TransformNode,
	GlowLayer,
} from '@babylonjs/core';
import { Grid } from './const';
import { Animals } from './animals';

export const ANIMAL = {
	Lion: [
		[0, 1],
		[0, -1],
		[-1, 0],
		[1, 0],
		[1, 1],
		[-1, -1],
		[-1, 1],
		[1, -1],
	],
	Chick: [[1, 0]],
	Elephant: [
		[1, 1],
		[-1, -1],
		[-1, 1],
		[1, -1],
	],
	Giraffe: [
		[0, 1],
		[0, -1],
		[-1, 0],
		[1, 0],
	],
	Rooster: [
		[0, 1],
		[0, -1],
		[-1, 0],
		[1, 0],
		[1, 1],
		[1, -1],
	],
} as const;

export class Board {
	public lion!: AbstractMesh;
	public elephant!: AbstractMesh;
	public giraffe!: AbstractMesh;
	public chick!: AbstractMesh;
	public rooster!: AbstractMesh;

	private board: { animal: Animals | null; tile: Mesh | null }[];
	private enemyStore: Animals[];
	private myStore: Animals[];
	private selected: Animals | undefined | null;
	private animals!: {
		Chick: AbstractMesh;
		Rooster: AbstractMesh;
		Lion: AbstractMesh;
		Elephant: AbstractMesh;
		Giraffe: AbstractMesh;
	};

	constructor(private scene: Scene) {
		this.board = Array.from(Array(12), () => {
			return { animal: null, tile: null };
		});

		this.enemyStore = new Array();
		this.myStore = new Array();

		this.scene.onPointerDown = (evt, pickInfo) => {
			/**
			 * 내 턴 아니면 무시하는 코드
			 */

			const ray = this.scene.createPickingRay(
				this.scene.pointerX,
				this.scene.pointerY,
				Matrix.Identity(),
				this.scene.activeCamera
			);

			const hitTile = this.scene.pickWithRay(ray, (mesh) => {
				return mesh && mesh.metadata == 'tile';
			});
			console.log(hitTile?.pickedMesh);

			if (this.selected) {
				// 이미 내 말이 선택 되었을 때.

				if (!hitTile?.pickedMesh) {
					// 타일 말고 다른 곳 누르면
					this.selected = null; // 선택 해제
					this.hidOverlay(); // lay 지우기
					return;
				}

				// 타일 누르면
				const target = +hitTile.pickedMesh.id;

				// 타일에  내 말이 있으면
				if (this.board[target].animal && this.board[target].animal!.isMine()) {
					// selected 변경
					this.selected = this.board[target].animal!;
					this.hidOverlay();
					this.rayTile(this.selected);
					return;
					// 적의 말이 있으면?
				}

				// 타일이 비어있고, 이동 가능한 타일이면
				if (this.isPossiblePath(target)) {
					// 이동가능한 영역이면 이동
					if (this.board[target].animal && this.isEnemy(target)) {
						this.kill(target);
					}
					this.move(this.selected.pos, target);
				} else {
					// 이동 불가능하면 아무것도 안함.
					console.log('impossible');
				}
			} else {
				// 아직 내 말을 선택하지 않았을 때.
				if (!hitTile?.pickedMesh) return; // 엉뚱한거 클릭하면 무시
				const id = +hitTile.pickedMesh.id; // 타일을 제대로 클릭하면 pos 가져옴.
				if (!this.board[id].animal) return; // 거기에 애니멀 없으면 무시
				if (!this.board[id].animal?.isMine()) return; // 내 애니멀 아니면 무시
				this.selected = this.board[id].animal!;
				this.rayTile(this.selected);
			}
		};
	}

	private move(src: number, dest: number) {
		// 메시 position 이동해주고.
		this.selected!.move(dest);
		// 시작 칸 animal 지우고.
		this.board[src].animal = null;

		// 도착 칸 animal 추가
		this.board[dest].animal = this.selected!;

		if (this.selected?.name == 'Chick' && dest > 8) {
		}
		// 선택 초기화
		this.selected = null;
		this.evolveChick(dest);
		//ray 끄기
		this.hidOverlay();
	}

	private kill(pos: number) {
		const animal = this.board[pos].animal!;
		animal.death();
		this.board[pos].animal = null;
	}

	private capture(pos: number) {}

	private evolveChick(pos: number) {
		const target = this.board[pos].animal!;
		const owner = target.isMine() ? 'my' : 'enemy';
		if (target.name != 'Chick') return;
		if (owner == 'my' && pos <= 8) return;
		if (owner == 'enemy' && pos >= 3) return;
		this.kill(pos);
		this.createAnimal('Rooster', pos, owner);
	}

	private isEnemy(pos: number) {
		return !this.board[pos].animal?.isMine();
	}

	private rayTile(animal: Animals, alpha = 0.2) {
		const pos = animal.pos;
		const { x, z } = animal.getGrid();
		const name = animal.name;
		const allPath = ANIMAL[name as keyof typeof ANIMAL]
			.map(([dz, dx]) => {
				return [z + dz, x + dx];
			})
			.filter(([z, x]) => z >= 0 && z < 4 && x >= 0 && x < 3)
			.map(([z, x]) => z * Grid.width + x);

		// yellow
		this.showOverlay(pos, Color3.Yellow(), alpha);
		//green
		allPath.filter((p) => {
			return !(this.board[p].animal && this.board[p].animal?.isMine());
		}).forEach((p) => {
			this.showOverlay(p, Color3.Green(), alpha);
		});
	}

	async ready() {
		this.buildTable();
		this.buildTile();
		this.buildStore();
		await this.loadAnimalAsync();
		this.setInitialBoard();
	}

	private buildTable() {
		const ground = MeshBuilder.CreateBox('table', {
			width: Grid.width + 1,
			depth: Grid.depth + 1,

			height: 1,
		});
		const groundMat = new StandardMaterial('tableMat', this.scene);
		groundMat.diffuseTexture = new Texture('./textures/wood.jpeg');
		ground.material = groundMat;
		ground.receiveShadows = true;
		ground.position = new Vector3(Grid.width / 2 - 0.5, 0, Grid.depth / 2 - 0.5);
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

		for (let i = 0; i < Grid.width * Grid.depth; i++) {
			const tile = originTile.clone('tile');
			tile.id = `${i}`;
			const x = i % Grid.width;
			const z = Math.floor(i / Grid.width);
			tile.position = new Vector3(x, 0.55, z);
			this.board[i].tile = tile;
		}
		originTile.dispose();
	}

	private buildStore() {
		const ground = MeshBuilder.CreateBox('table', {
			width: 6,
			depth: 1,
			height: 1,
		});
		const groundMat = new StandardMaterial('tableMat', this.scene);
		groundMat.diffuseTexture = new Texture('./textures/wood.jpeg');
		ground.material = groundMat;
		ground.receiveShadows = true;
		ground.position = new Vector3(Grid.width / 2 - 0.5, -0.55, Grid.depth / 2 + 3.5);

		const ground2 = ground.clone();
		ground2.position = new Vector3(Grid.width / 2 - 0.5, -0.55, Grid.depth / 2 - 4.5);

		const originStore = MeshBuilder.CreateBox('tile', { width: 0.85, height: 0.1, depth: 0.85 });
		const tileMat = new StandardMaterial('tileMat', this.scene);
		const tileTexture = new Texture('./textures/tile.jpeg');

		tileTexture.vScale = 0.1;
		tileTexture.uScale = 0.1;
		tileTexture.uOffset = Math.random();
		tileTexture.vOffset = Math.random();
		tileMat.diffuseTexture = tileTexture;
		originStore.material = tileMat;
		originStore.receiveShadows = true;
		originStore.metadata = 'tile';

		for (let i = 0; i < 6; i++) {
			const tile = originStore.clone('tile');
			tile.id = `${i}`;
			const x = i - 1.5;
			tile.position = new Vector3(x, -0.05, -2.5);
			this.board[i].tile = tile;
		}
		originStore.dispose();
	}

	public async loadAnimalAsync() {
		await SceneLoader.ImportMeshAsync('', './models/', 'animals.glb');

		this.animals = {
			Chick: this.loadAnimal('Chick', 0.4),
			Rooster: this.loadAnimal('Rooster', 0.3),
			Lion: this.loadAnimal('Lion', 0.3),
			Elephant: this.loadAnimal('Elephant', 0.3),
			Giraffe: this.loadAnimal('Giraffe', 0.3),
		};

		// const gl = new GlowLayer('glow', this.scene);
		// gl.customEmissiveColorSelector = function (mesh, subMesh, material, result) {

		// 	if (mesh.name === 'CHICK.Chick.Chick') {
		// 		console.log('xxxx');
		// 		result.set(1, 1, 0, 1);
		// 	} else {
		// 		result.set(0, 0, 0, 0);
		// 	}
		// };
	}

	private loadAnimal(name: string, scale: number): AbstractMesh {
		const animalRoot = this.scene.getMeshByName('__root__')!.clone(name, null, true) as AbstractMesh;
		const transformNode = this.scene.getTransformNodeByName(name) as TransformNode;
		transformNode.setAbsolutePosition(Vector3.Zero());
		transformNode.setParent(animalRoot);
		animalRoot.metadata = 'animal';
		animalRoot.outlineColor = Color3.Green();
		animalRoot.outlineWidth = 0.5;
		animalRoot.renderOutline = true;
		for (const d of animalRoot.getDescendants()) {
			if (d.metadata) d.metadata = 'animal';
			if (d.name) d.name = name;
		}
		animalRoot.rotate(Axis.Y, Tools.ToRadians(180));
		animalRoot.scaling = new Vector3(scale, scale, scale);
		animalRoot.position.y = 0.6;
		animalRoot.visibility = 0;
		animalRoot.getChildMeshes().forEach((d) => {
			d.visibility = 0;
		});
		return animalRoot as AbstractMesh;
	}

	private createAnimal(name: keyof typeof ANIMAL, pos: number, owner: 'my' | 'enemy') {
		const animal = new Animals(this.animals[name], pos, owner);
		this.board[animal.pos].animal = animal;
	}

	private setInitialBoard() {
		this.createAnimal('Chick', 4, 'my');
		this.createAnimal('Lion', 1, 'my');
		this.createAnimal('Giraffe', 2, 'my');
		this.createAnimal('Elephant', 0, 'my');
		this.createAnimal('Chick', 7, 'enemy');
		this.createAnimal('Lion', 10, 'enemy');
		this.createAnimal('Giraffe', 9, 'enemy');
		this.createAnimal('Elephant', 11, 'enemy');
	}

	positionToBoard(pos: number): Vector3 {
		return new Vector3(pos % Grid.width, 0.6, Math.floor(pos / Grid.width));
	}

	showOverlay(pos: number, color: Color3, alpha: number) {
		const tile = this.board[pos].tile as Mesh;
		tile.overlayColor = color;
		tile.overlayAlpha = alpha;
		tile.renderOverlay = true;
	}

	hidOverlay() {
		this.board.forEach(({ tile }) => {
			tile!.renderOverlay = false;
		});
	}

	isPossiblePath(pos: number) {
		const tile = this.board[pos].tile!;
		return (
			tile.renderOverlay &&
			tile.overlayColor.r == 0 &&
			tile.overlayColor.g == 1 &&
			tile.overlayColor.b == 0
		);
	}
}

/**
 * 서버로 부터 받는 명령은 move가 전부.
 *
 *
 * move 이후에 반드시 해야할 것은.
 * 1. target mesh의 position을 변경하기
 * 2. board 의 src 비우기
 * 3. board 의 dest로 target 집어넣기
 *
 *
 * if 병아리가 끝까지가면 닭으로 진화!
 *
 *
 * if 적이 있으면 생포.
 *
 */
