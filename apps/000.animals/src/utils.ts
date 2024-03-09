import type { Vector3 } from '@babylonjs/core';

export function positionToLoc(position: Vector3): number {
	const { x, z } = position;
	return z * 3 + x;
}
