export const ANIMAL_ROUTE = {
	Chick: [[3], [4], [5], [6], [7], [8], [9], [10], [11], [], [], []],
	Rooster: [
		[1, 3, 4],
		[0, 2, 3, 4, 5],
		[1, 4, 5],
		[0, 4, 6, 7],
		[1, 3, 5, 6, 7, 8],
		[2, 4, 7, 8],
		[3, 7, 9, 10],
		[4, 6, 8, 9, 10, 11],
		[5, 7, 10, 11],
		[6, 10],
		[9, 11, 7],
		[8, 10],
	],
	Lion: [
		[1, 3, 4],
		[0, 2, 3, 4, 5],
		[1, 4, 5],
		[0, 1, 4, 6, 7],
		[0, 1, 2, 3, 5, 6, 7, 8],
		[1, 2, 4, 7, 8],
		[3, 4, 7, 9, 10],
		[3, 4, 5, 6, 8, 9, 10, 11],
		[4, 5, 7, 10, 11],
		[6, 7, 10],
		[6, 7, 8, 9, 11],
		[7, 8, 10],
	],
	Giraffe: [
		[1, 3],
		[0, 2, 4],
		[1, 5],
		[0, 4, 6],
		[1, 3, 5, 7],
		[2, 4, 8],
		[3, 7, 9],
		[4, 6, 8, 10],
		[5, 7, 11],
		[6, 10],
		[7, 9, 11],
		[8, 10],
	],
	Elephant: [[4], [3, 5], [4], [1, 7], [0, 2, 6, 8], [1, 7], [4, 10], [3, 5, 9, 11], [4, 10], [7], [6, 8], [7]],
} as const;

export enum GameObserverTarget {
	AI = 0b01,
	WS = 0b10,
	PLAYER = 0b100,
}

export const Grid = {
	width: 3,
	depth: 4,
} as const;

export enum SceneName {
	HOME,
	SINGLE_GAME,
	MULTI_GAME,
}

export type SceneEvent = {
	sceneName: SceneName;
};

export type GameEvent = {
	cmd: 'start' | 'move' | 'end';
	data: Record<string, any>;
};

export type BaseBoard = { animal?: { name: keyof typeof ANIMAL_ROUTE; owner: string } }[];
