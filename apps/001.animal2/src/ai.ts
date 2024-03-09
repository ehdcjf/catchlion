import type { Observable } from '@babylonjs/core';
import { Observers } from './observer';
import { GameObserverTarget, type BaseBoard, type GameEvent } from './const';
import { getPossilbePath, mirrorLocation } from './utils';

function getRandomInt(min: number, max: number) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min; //최댓값은 제외, 최솟값은 포함
}

export class ArtificialIdiot {
	private gameEventObserver: Observable<GameEvent>;
	board: BaseBoard = [
		{ animal: { name: 'Elephant', owner: 'my' } },
		{ animal: { name: 'Lion', owner: 'my' } },
		{ animal: { name: 'Giraffe', owner: 'my' } },
		{},
		{ animal: { name: 'Chick', owner: 'my' } },
		{},
		//////////////
		{},
		{ animal: { name: 'Chick', owner: 'enemy' } },
		{},
		{ animal: { name: 'Giraffe', owner: 'enemy' } },
		{ animal: { name: 'Lion', owner: 'enemy' } },
		{ animal: { name: 'Elephant', owner: 'enemy' } },
		//////////////
		{},
		{},
		{},
		{},
		{},
		{},
		//////////////
		{},
		{},
		{},
		{},
		{},
		{},
		{},
	];
	first?: 'player' | 'ai';
	turn?: 'player' | 'ai';

	constructor() {
		this.gameEventObserver = Observers.getInstance().gameEventObserver;
		this.gameEventObserver.add(async (event) => {
			switch (event.cmd) {
				case 'start':
					return this.startAction();
				case 'move':
					return this.moveAction(event.data);
				case 'end':
					return this.endAction(event.data);
				default:
					return;
			}
		}, GameObserverTarget.AI);
	}

	private send(event: GameEvent) {
		this.gameEventObserver.notifyObservers(event, GameObserverTarget.PLAYER);
	}

	private startAction() {
		const first = Math.random() > 0.5 ? 'player' : 'ai';
		this.first = first;
		this.turn = first;
		setTimeout(() => {
			this.send({ cmd: 'start', data: { first } });
		}, 1000);

		if (first == 'ai') this.aiRandomMove();
	}

	private aiRandomMove(time?: number) {
		const possiblePaths: { src: number; dest: number }[] = this.board.reduce((result, v, src) => {
			if (v.animal?.owner !== 'my') return result;
			const possilbeDest = getPossilbePath(this.board, src);
			possilbeDest.forEach((dest) => {
				result.push({ src, dest });
			});
			return result;
		}, [] as { src: number; dest: number }[]);

		const randPath = getRandomInt(0, possiblePaths.length);

		const { src, dest } = possiblePaths[randPath];

		setTimeout(() => {
			this.move(src, dest, 'ai');
			this.send({ cmd: 'move', data: { src, dest, turn: 'ai' } });
		}, time ?? getRandomInt(1000, 3000));
	}

	private move(src: number, dest: number, turn: 'player' | 'ai') {
		if (turn == 'player') {
			src = mirrorLocation(src);
			dest = mirrorLocation(dest);
		}

		if (this.board[dest]?.animal) {
			const srcAnimal = this.board[src].animal!;
			const destAnimal = this.board[dest].animal!;

			if (destAnimal.name == 'Lion') {
			}
			const storedAnimalName = destAnimal.name == 'Rooster' ? 'Chick' : destAnimal.name;
			const storedAnimalOwner = srcAnimal.owner;
			const storeIndex = srcAnimal.owner == 'my' ? 12 : 18;
			let storedAnimalLocation: number;

			for (let i = storeIndex; i < storeIndex + 6; i++) {
				if (!this.board[i].animal) {
					storedAnimalLocation = i;
					break;
				}
			}
			this.board[storedAnimalLocation!] = {
				animal: { name: storedAnimalName, owner: storedAnimalOwner },
			};
		}

		this.board[dest].animal = this.board[src].animal;
		this.board[src] = {};

		const animal = this.board[dest].animal;

		if (animal?.name !== 'Chick') return;
		if (src < 0 || src > 11) return;

		if (
			(animal.owner == 'my' && [9, 10, 11].includes(dest)) || // 내 병아리
			(animal.owner == 'enemy' && [0, 1, 2].includes(dest)) // 적 병아리
		) {
			this.board[dest].animal!.name = 'Rooster';
		}
	}

	private moveAction(data: any) {
		const { src, dest, turn } = data;
		if (data.turn != this.turn) return;
		this.move(src, dest, turn);
		this.send({ cmd: 'move', data: { ...data, turn: 'player' } });
		this.aiRandomMove();
	}

	private endAction(data: any) {
		console.log(data);
	}
}
