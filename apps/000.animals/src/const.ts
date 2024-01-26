export const Grid = {
	width: 3,
	depth: 4,
} as const;

export type AnimalNames = 'Chick' | 'Rooster' | 'Lion' | 'Giraffe' | 'Elephant';


export enum GameType {
	SINGLE = 0,
	MULTI = 1,
}

export enum SceneName {
	HOME,
	SINGLE_GAME,
	MULTI_GAME,
}

export type SceneEvent = {
	sceneName: SceneName;
};

export type Message = {
	cmd: string;
	data: any;
};