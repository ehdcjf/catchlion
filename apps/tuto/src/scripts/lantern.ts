import {
  AnimationGroup,
  Color3,
  Color4,
  Mesh,
  PBRMetallicRoughnessMaterial,
  ParticleSystem,
  PointLight,
  Scene,
  Texture,
  Vector3,
} from '@babylonjs/core';

export class Lantern {
	public isLit: boolean = false;
	private light: PointLight;
	private stars: ParticleSystem;

	constructor(
		private lightmtl: PBRMetallicRoughnessMaterial,
		public mesh: Mesh,
		public scene: Scene,
		position: Vector3,
		private spinAnim: AnimationGroup
	) {
		this.loadLantern(this.mesh, position);

		this.loadStars();

		this.setLight();

		this.findNearestMeshes();
	}

	public setEmissiveTexture(): void {
		this.isLit = true;

		this.spinAnim.play();
		this.stars.start();
		this.mesh.material = this.lightmtl;
		this.light.intensity = 30;
	}

	private loadLantern(mesh: Mesh, position: Vector3) {
		this.mesh.scaling = new Vector3(0.8, 0.8, 0.8);
		this.mesh.setAbsolutePosition(position);
		this.mesh.isPickable = false;
	}

	private loadStars(): void {
		const particleSystem = new ParticleSystem('stars', 1000, this.scene);

		particleSystem.particleTexture = new Texture('textures/solidStar.png', this.scene);
		particleSystem.emitter = new Vector3(
			this.mesh.position.x,
			this.mesh.position.y + 1.5,
			this.mesh.position.z
		);
		particleSystem.createPointEmitter(new Vector3(0.6, 1, 0), new Vector3(0, 1, 0));
		particleSystem.color1 = new Color4(1, 1, 1);
		particleSystem.color2 = new Color4(1, 1, 1);
		particleSystem.colorDead = new Color4(1, 1, 1, 1);
		particleSystem.emitRate = 12;
		particleSystem.minEmitPower = 14;
		particleSystem.maxEmitPower = 14;
		particleSystem.addStartSizeGradient(0, 2);
		particleSystem.addStartSizeGradient(1, 0.8);
		particleSystem.minAngularSpeed = 0;
		particleSystem.maxAngularSpeed = 2;
		particleSystem.addDragGradient(0, 0.7, 0.7);
		particleSystem.targetStopDuration = 0.25;
		this.stars = particleSystem;
	}

	private setLight() {
		const light = new PointLight('lantern ligth', this.mesh.getAbsolutePosition(), this.scene);
		light.intensity = 0;
		light.radius = 2;
		light.diffuse = new Color3(0.45, 0.56, 0.8);
		this.light = light;
	}

	private findNearestMeshes() {
		if (this.mesh.name.includes('14') || this.mesh.name.includes('15')) {
			this.light.includedOnlyMeshes.push(this.scene.getMeshByName('festivalPlatform1'));
		} else if (this.mesh.name.includes('16') || this.mesh.name.includes('17')) {
			this.light.includedOnlyMeshes.push(this.scene.getMeshByName('festivalPlatform2'));
		} else if (this.mesh.name.includes('18') || this.mesh.name.includes('19')) {
			this.light.includedOnlyMeshes.push(this.scene.getMeshByName('festivalPlatform3'));
		} else if (this.mesh.name.includes('20') || this.mesh.name.includes('21')) {
			this.light.includedOnlyMeshes.push(this.scene.getMeshByName('festivalPlatform4'));
		}

		this.scene
			.getTransformNodeByName(this.mesh.name + 'lights')
			.getChildMeshes()
			.forEach((m) => {
				this.light.includedOnlyMeshes.push(m);
			});
	}
}

