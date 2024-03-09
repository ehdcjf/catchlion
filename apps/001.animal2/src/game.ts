import {
	AbstractMesh,
	Axis,
	Color3,
	Matrix,
	MeshBuilder,
	Observable,
	SceneLoader,
	StandardMaterial,
	Texture,
	Tools,
	TransformNode,
	Vector3,
	type Mesh,
	type Scene,
} from '@babylonjs/core';
/**
 * 게임이 시작되면 선 플레이어부터 말 1개를 1칸 이동시킬 수 있다. 말을 이동시켜 상대방의 말을 잡은 경우, 해당 말을 포로로 잡게 되며 포로로 잡은 말은 다음 턴부터 자신의 말로 사용할 수 있다.
 *
 *
 * 게임 판에 포로로 잡은 말을 내려놓는 행동도 턴을 소모하는 것이며 이미 말이 놓여진 곳이나 상대의 진영에는 말을 내려놓을 수 없다.
 *
 *
 * 상대방의 후(侯)를 잡아 자신의 말로 사용할 경우에는 자(子)로 뒤집어서 사용해야 한다.
 *
 *
 * 게임은 한 플레이어가 상대방의 왕(王)을 잡으면 해당 플레이어의 승리로 종료된다.
 *
 *
 * 만약 자신의 왕(王)이 상대방의 진영에 들어가 자신의 턴이 다시 돌아올 때까지 한 턴을 버틸 경우 해당 플레이어의 승리로 게임이 종료된다.
 * =>  사자가 끝에가면 종료
 *
 *
 * 또한, 결승전 십이장기는 한 턴을 90초로 제한하며 90초안에 말을 놓아야 한다. 만약 90초 안에 아무 말도 놓지 못한다면 해당 플레이어가 패배한다.
 *
 *
 */

import { Grid, ANIMAL_ROUTE, type GameEvent, GameObserverTarget } from './const';
import { Animals } from './animal';
import { mirrorLocation, positionToLoc } from './utils';
import { Observers } from './observer';
import { ArtificialIdiot } from './ai';

type BoardItem = { tile: Mesh; animal?: null | Animals };
export class Game {
	board: BoardItem[];
	animalMeshes!: {
		Chick: AbstractMesh;
		Rooster: AbstractMesh;
		Lion: AbstractMesh;
		Elephant: AbstractMesh;
		Giraffe: AbstractMesh;
	};
	private src: number | null = null;
	private gameEventObserver: Observable<GameEvent>;
	ai?: ArtificialIdiot;
	first?: string | null;
	turn?: string | null;
	constructor(private scene: Scene, private gameObserverTarget: GameObserverTarget, private player = 'player') {
		if (gameObserverTarget == GameObserverTarget.AI) {
			this.ai = new ArtificialIdiot();
		}

		this.board = Array.from(Array(24), () => {
			return {} as BoardItem;
		});
		this.gameEventObserver = Observers.getInstance().gameEventObserver;
		this.init();
	}

	async init() {
		this.buildTable(); // 테이블 만들기
		this.buildTile(); // 타일 만들기
		this.buildStore(); // 창고 만들기
		this.resetTileOverlay(); // 타일 오버레이
		await this.loadAnimalAsync(); // 동물가져오기
		this.setInitialBoard(); // 초기화
		this.setPointerDownEvent(); // 마우스 이벤트 관리
		this.receiveGameEvent(); // 통신 이벤트 관리
		this.gameEventObserver.notifyObservers({ cmd: 'start', data: {} }, this.gameObserverTarget);
	}

	/**
	 * 커서가 메시에 닿았을 때 작동하는 이벤트 정의
	 *
	 * 일단 메시가 닿으면 해당 위치를 가져옴 => location
	 * 카메라 각도에 따라 동물 메시가 자신이 위치한 타일을 벗어나는 경우가 있음.
	 * 예를 들어서 동물의 위치는 1 이지만 클릭된 타일의 위치는 4일 수 있음.
	 * 그런 때에도 사용자 입장에서는 동물을 선택한 것이라 판단하기로 함.
	 * ∴ location의 우선 순위는  동물 > 타일
	 *
	 * location 이 정해지면
	 *
	 *
	 *
	 * 이미 선택된 내 메시가 있는 경우:
	 * 	내 메시면 선택된 메시를 변경하고 경로 보여주기
	 *
	 */
	private setPointerDownEvent() {
		this.scene.onPointerDown = (evt, pickInfo) => {
			if (this.turn != this.player) return;

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

			const location = hitAnimal?.pickedMesh
				? positionToLoc((hitAnimal?.pickedMesh?.parent?.parent as Mesh)?.position)
				: hitTile?.pickedMesh
				? +hitTile?.pickedMesh?.id
				: null;
			if (location === null) return;
			this.pick(location);
		};
	}

	pick(location: number) {
		if (this.src == location) return;

		if (this.src) {
			if (this.isMine(location)) {
				this.src = location;
				this.routeOverlay(location);
				return;
			}

			if (this.getPossilbePath(this.src).includes(location)) {
				this.sendMoveEvent(this.src, location);
			} else {
				this.src = null;
				this.resetTileOverlay();
			}
		} else {
			if (this.isMine(location)) {
				this.src = location;
				this.routeOverlay(location);
				return;
			}
		}
	}

	private receiveGameEvent() {
		this.gameEventObserver.add(async (event) => {
			switch (event.cmd) {
				case 'start':
					return this.startAction(event.data);
				case 'move':
					return this.moveAction(event.data);
				case 'end':
					return this.endAction(event.data);
				default:
					return;
			}
		}, GameObserverTarget.PLAYER);
	}

	private sendMoveEvent(src: number, dest: number) {
		this.gameEventObserver.notifyObservers(
			{ cmd: 'move', data: { src, dest, turn: this.player } },
			this.gameObserverTarget
		);
	}

	private startAction(data: any) {
		this.first = data.first;
		this.turn = this.first;
	}
	private moveAction(data: any) {
		const { src, dest } = this.calcMyboardLocation(data);

		if (!this.isEmptyTile(dest)) {
			const srcAnimal = this.board[src].animal!;
			const destAnimal = this.board[dest].animal!;
			const storedAnimalName = destAnimal.name == 'Rooster' ? 'Chick' : destAnimal.name;
			const storedAnimalOwner = srcAnimal.isMine() ? 'my' : 'enemy';
			const storeIndex = srcAnimal?.isMine() ? 12 : 18;
			let storedAnimalLocation: number;

			for (let i = storeIndex; i < storeIndex + 6; i++) {
				if (!this.board[i].animal) {
					storedAnimalLocation = i;
					break;
				}
			}

			this.createAnimal(storedAnimalName, storedAnimalLocation!, storedAnimalOwner);
			destAnimal.death();
		}

		this.board[src].animal!.move(dest);
		this.board[dest].animal = this.board[src].animal;
		this.board[src].animal = null;

		this.evolveChick(src, dest);
		this.resetTileOverlay();
	}
	private endAction(data: any) {}

	/**
	 * 게임테이블 만드는 메서드
	 */
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

	/**
	 * 게임 타일 만드는 메서드
	 *
	 */
	private buildTile() {
		const originTile = MeshBuilder.CreateBox('tile', { width: 0.85, height: 0.1, depth: 0.85 });
		const tileMat = new StandardMaterial('tileMat', this.scene);
		const tileTexture = new Texture('./textures/tile.jpeg');
		originTile.receiveShadows = true;
		originTile.metadata = 'tile';
		for (let i = 0; i < Grid.width * Grid.depth; i++) {
			const tile = originTile.clone('tile');
			const texture = tileTexture.clone();
			const mat = tileMat.clone('tilemat' + i);
			texture.vScale = 0.1;
			texture.uScale = 0.1;
			texture.uOffset = Math.random();
			texture.vOffset = Math.random();
			mat.diffuseTexture = texture;
			tile.material = mat;

			tile.id = `${i}`;
			this.board[i].tile = tile;
			const x = i % Grid.width;
			const z = Math.floor(i / Grid.width);
			tile.position = new Vector3(x, 0.55, z);
		}
		originTile.dispose();
	}

	/**
	 * 저장소 만드는 메서드
	 *
	 */
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

		const originStore = MeshBuilder.CreateBox('store', { width: 0.85, height: 0.1, depth: 0.85 });
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
			const myStore = originStore.clone('store');
			myStore.id = `${12 + i}`;
			myStore.position = new Vector3(i - 1.5, -0.05, -2.5);
			this.board[i + 12].tile = myStore;
			const enemyStore = originStore.clone('store');
			enemyStore.id = `${18 + i}`;
			enemyStore.position = new Vector3(i - 1.5, -0.05, 5.5);
			this.board[i + 18].tile = enemyStore;
		}
		originStore.dispose();
	}

	/**
	 *  동물 메시 불러오는 메서드
	 * */
	public async loadAnimalAsync() {
		await SceneLoader.ImportMeshAsync('', './models/', 'animals.glb');
		this.animalMeshes = {
			Chick: this.loadAnimal('Chick', 0.4),
			Rooster: this.loadAnimal('Rooster', 0.3),
			Lion: this.loadAnimal('Lion', 0.3),
			Elephant: this.loadAnimal('Elephant', 0.3),
			Giraffe: this.loadAnimal('Giraffe', 0.3),
		};
	}

	/**
	 *  동물 메시 불러오는 메서드
	 * */
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

	private createAnimal(name: keyof typeof ANIMAL_ROUTE, loc: number, owner: 'my' | 'enemy') {
		if (loc < 0 || loc > 23) throw new Error('Tlqkf');
		const animal = new Animals(this.animalMeshes[name], loc, owner);
		this.board[loc].animal = animal;
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

		// this.createAnimal('Rooster', 3, 'enemy');
		// this.createAnimal('Rooster', 5, 'enemy');
		// this.createAnimal('Rooster', 6, 'enemy');
		// this.createAnimal('Rooster', 8, 'enemy');

		// for (let i = 0; i < 6; i++) {
		// 	this.createAnimal('Rooster', 18 + i, 'enemy');
		// 	this.createAnimal('Rooster', 12 + i, 'my');
		// }
	}

	private isMine(location: number) {
		if (location >= 18) return false;
		if (!this.board[location].animal) return false;
		if (!this.board[location].animal!.isMine()) return false;
		return true;
	}

	private isSotred(location: number) {
		return (
			location >= 12 &&
			location < 18 &&
			this.board[location].animal &&
			this.board[location].animal!.isMine()
		);
	}

	isExistMyAnimal() {}

	private routeOverlay(location: number) {
		if (location < 0 || location >= 18) return;

		// 일단 전부 지우기
		this.resetTileOverlay();

		// 내 위치 칠하기
		this.renderTileOverlay(location, Color3.Yellow(), 0.2);

		let possilbePath: number[];
		// 갈 수 있는 위치 칠하기
		if (location >= 12) {
			// store
			// 비어있는 칸 찾기
			possilbePath = this.findEmptyTiles();
		} else {
			// board
			// 갈 수 있는 경로 찾기
			possilbePath = this.getPossilbePath(location);
		}
		// 초록색으로 칠하기
		possilbePath.forEach((tileLocation) => {
			this.renderTileOverlay(tileLocation, Color3.Green(), 0.2);
		});
		return;
	}

	private renderTileOverlay(location: number, color: Color3, alpha: number) {
		const tile = this.board[location].tile!;
		tile.overlayColor = color;
		tile.overlayAlpha = alpha;
		tile.renderOverlay = true;
	}
	private resetTileOverlay() {
		this.board.forEach(({ tile }, i) => {
			if (i > 17) {
				tile.overlayColor = Color3.Black();
				tile.renderOverlay = true;
			} else {
				tile.renderOverlay = false;
			}
		});
	}

	private findEmptyTiles() {
		const emptyTiles: number[] = [];
		for (let i = 0; i < 6; i++) {
			const { animal } = this.board[i];
			if (!animal) emptyTiles.push(i);
		}
		return emptyTiles;
	}

	private isEmptyTile(location: number) {
		const { animal } = this.board[location];
		return animal ? false : true;
	}

	private getPossilbePath(location: number): number[] {
		const { animal } = this.board[location];
		const { name } = animal!;
		if (location < 12) {
			return ANIMAL_ROUTE[name][location].filter((location) => {
				return !this.board[location].animal || !this.board[location].animal?.isMine();
			});
		} else {
			return this.findEmptyTiles();
		}
	}

	private evolveChick(src: number, dest: number) {
		const animal = this.board[dest].animal;

		if (animal?.name !== 'Chick') return;
		if (src < 0 || src > 11) return;

		if (
			(animal.isMine() && [9, 10, 11].includes(dest)) || // 내 병아리
			(!animal.isMine() && [0, 1, 2].includes(dest)) // 적 병아리
		) {
			animal.death();
			this.createAnimal('Rooster', dest, animal.isMine() ? 'my' : 'enemy');
		}
	}

	private calcMyboardLocation(data: { src: number; dest: number; turn: string }) {
		this.turn = this.turn == data.turn ? null : this.player;
		if (this.player == data.turn) {
			return { src: data.src, dest: data.dest };
		} else {
			return { src: mirrorLocation(data.src), dest: mirrorLocation(data.dest) };
		}
	}
}

/**
 * ==통신==
 * Move 요청하기!
 *
 * Move 응답 처리하기!
 *
 * ==클라==
 * src 선택하기..
 * 경로 보여주기
 * dest 선택하기.. or 다시 선택하기
 *
 *
 */
