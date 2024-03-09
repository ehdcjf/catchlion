import { Vector3 } from '@babylonjs/core';
import { ANIMAL_ROUTE, Grid, type BaseBoard } from './const';

export function locationToPosition(loc: number) {
	if (loc < 0 || loc >= 24) {
		throw new Error('Fail: Location to Position');
	} else if (loc < 12) {
		return new Vector3(loc % Grid.width, 0.6, Math.floor(loc / Grid.width));
	} else if (loc < 18) {
		return new Vector3(loc - 13.5, 0, -2.5);
	} else if (loc < 24) {
		return new Vector3(loc - 19.5, 0, 5.5);
	}
}

export function positionToLoc(position: Vector3): number {
	const { x, z } = position;
	switch (z) {
		case 0:
		case 1:
		case 2:
		case 3:
			return z * 3 + x;
		case -2.5:
			return x + 13.5;
		case 5.5:
			return x + 19.5;
		default:
			throw new Error('Fail: Position to location');
	}
}

export const getPossilbePath = (board: BaseBoard, location: number) => {
	const { animal } = board[location];
	const { name } = animal!;
	if (location < 12) {
		return ANIMAL_ROUTE[name][location].filter((location) => {
			return !board[location].animal || !(board[location].animal?.owner == 'my');
		});
	} else {
		const emptyTiles: number[] = [];
		for (let i = 0; i < 6; i++) {
			const { animal } = board[i];
			if (!animal) emptyTiles.push(i);
		}
		return emptyTiles;
	}
};

export const mirrorLocation = (location: number) => {
	if (location < 12) {
		return 11 - location;
	} else if (location < 18) {
		return location + 6;
	} else {
		return location - 6;
	}
};
