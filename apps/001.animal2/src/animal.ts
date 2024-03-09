import { Axis, AbstractMesh, type Mesh, Tools, Vector3, Animation } from '@babylonjs/core';
import { Grid, ANIMAL_ROUTE } from './const';
import { locationToPosition } from './utils';

type Owner = 'my' | 'enemy';
export class Animals {
	public name: keyof typeof ANIMAL_ROUTE;
	private mesh: AbstractMesh;
	constructor(mesh: AbstractMesh, public loc: number, public owner: Owner) {
		this.name = mesh.name as keyof typeof ANIMAL_ROUTE;
		this.mesh = mesh.clone(mesh.name, null)!;

		this.mesh.visibility = 1;
		this.mesh.getChildMeshes().forEach((d) => {
			d.visibility = 1;
		});

		if (owner === 'enemy') {
			this.mesh.rotate(Axis.Y, Tools.ToRadians(180));
		}
		this.move(loc);
	}

	isMine() {
		return this.owner == 'my';
	}

	getGrid() {
		return { x: this.loc % Grid.width, z: Math.floor(this.loc / Grid.width) };
	}

	// positionToBoard(pos: number): Vector3 {
	// 	return new Vector3(pos % Grid.width, 0.6, Math.floor(pos / Grid.width));
	// }

	move(loc: number) {
		this.mesh.position = locationToPosition(loc)!;
	}

	death() {
		this.mesh.dispose();
	}
}
