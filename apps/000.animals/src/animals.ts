import { Axis, AbstractMesh, type Mesh, Tools, Vector3, Animation } from '@babylonjs/core';
import { Grid } from './const';

type Owner = 'my' | 'enemy';
export class Animals {
	public name: string;
	private mesh: AbstractMesh;
	constructor(mesh: AbstractMesh, public pos: number, private owner: Owner) {
		this.name = mesh.name;
		this.mesh = mesh.clone(mesh.name, null)!;

		this.mesh.visibility = 1;
		this.mesh.getChildMeshes().forEach((d) => {
			d.visibility = 1;
		});

		if (owner === 'enemy') {
			this.mesh.rotate(Axis.Y, Tools.ToRadians(180));
		}
		this.move(pos);
	}

	isMine() {
		return this.owner == 'my';
	}

	getGrid() {
		return { x: this.pos % Grid.width, z: Math.floor(this.pos / Grid.width) };
	}

	positionToBoard(pos: number): Vector3 {
		return new Vector3(pos % Grid.width, 0.6, Math.floor(pos / Grid.width));
	}

	move(pos: number) {
		this.pos = pos;
		this.mesh.position = this.positionToBoard(pos);
	}

	death() {
		this.mesh.dispose();
	}
}
