import {
	ActionManager,
	AnimationGroup,
	Color3,
	ExecuteCodeAction,
	ISceneLoaderAsyncResult,
	Mesh,
	MeshBuilder,
	ParticleHelper,
	IParticleSystem,
	PhysicsImpostor,
	Scene,
	SceneLoader,
	Sound,
	StandardMaterial,
	Tools,
	Vector3,
} from '@babylonjs/core';

export class Cannon {
	private cannonBall: Mesh;
	private cannon: Mesh;
	private cannonAnimationPairings: Record<string, any>;
	private cannonReadyToPlay: Record<string, any>;
	private cannonBlastSound: Sound;
	private cannonAnimationGroup: AnimationGroup;
	private smokeBlast: IParticleSystem;
	private killBox: Mesh;

	constructor(private scene: Scene) {
		this.cannonAnimationPairings = {};
		this.cannonReadyToPlay = {};
	}

	public async setUpAsync() {
		//glb에서 캐논 모델 불러오기
		const cannonImportResult = await SceneLoader.ImportMeshAsync('', './models/', 'cannon.glb', this.scene);

		// 포탄 만들기
		this.setCannonBall();

		// 킬박스 만들기
		this.setKillBox();

		// 캐논 메시 추출
		this.setCannonMesh(cannonImportResult);

		// 발사 소리 불러오기
		this.setCannonBlastSound();

		// 폭발 및 연기 연출을 위한 파티클 시스템 설정
		await this.setSmokeBlastAsync();

		// 애니메이션 설정
		await this.setCannonAnimAsync(cannonImportResult);

		// 캐논 10개 만들기
		this.createTenConnons();

		// 캐논을 클릭했을 때 이벤트
		this.scene.onPointerDown = (evt, pickInfo) => {
			// 만약에 클릭된 지점이 메시가 아니거나.
			// 메타데이터가 캐논이 아니면  캐논이 아니니까 아무것도 안하고 종료
			if (!pickInfo.pickedMesh || pickInfo.pickedMesh.metadata != 'cannon') return;

			// 클릭된 캐논의 부모를 불러와야함.
			//  cannonMount 안에 cannon 이 있으니까 부모의 부모를 불어와야 할 수도 있음
			const topParent = pickInfo.pickedMesh.parent.parent ?? pickInfo.pickedMesh.parent;

			// 1 은 준비가 되었다는 거고, 0은 실행하고.. 아직 준비 완료되지 않았다는 거
			if (this.cannonReadyToPlay[topParent.name] !== 1) return;

			// 상태 변경하고.
			this.cannonReadyToPlay[topParent.name] = 0;

			// 애니메이션 가져온다.
			const animationPlay = this.cannonAnimationPairings[topParent.name];

			// 애니메이션 실행
			for (let i = 0; i < this.scene.animationGroups.length; i++) {
				if (this.scene.animationGroups[i].name == animationPlay) {
					this.scene.animationGroups[i].play();
					this.scene.animationGroups[i].onAnimationEndObservable.addOnce(() => {
						this.cannonReadyToPlay[topParent.name] = 1;
					});
				}
			}

			const childMeshes = pickInfo.pickedMesh.getChildMeshes();
			const smokeBlasts = this.scene.particleSystems;
			for (let i = 0; i < smokeBlasts.length; i++) {
				for (let j = 0; j < childMeshes.length; j++) {
					if (childMeshes[j] !== smokeBlasts[i].emitter) continue;

					// 연기, 폭발 관련 연출
					smokeBlasts[i].start();

					// 포탄 복제해서
					const cannonBallClone = this.cannonBall.clone('cannonBallClone');

					// 포탄 보여주고
					cannonBallClone.visibility = 1;

					// 포탄의 시작 위치 정해주고.
					cannonBallClone.position = childMeshes[j].absolutePosition;

					// PhysicsImpostor:  물리 엔진과의 통합을 담당하는 객체
					//
					cannonBallClone.physicsImpostor = new PhysicsImpostor(
						cannonBallClone,
						PhysicsImpostor.SphereImpostor,
						{
							mass: 2,
							friction: 0.5,
							restitution: 0,
						},
						this.scene
					);
					// applyImpulse 는 메시의 선형적인 운동량을 적용하는데 사용한다.
					cannonBallClone.physicsImpostor.applyImpulse(
						childMeshes[j].up.scale(40), // 힘의 방향과 크기 설정
						Vector3.Zero() // 힘을 가할 지점 설정
					);

					// 포탄에 액션을 추가하기 위해 액션 트리거를 생성한다.
					cannonBallClone.actionManager = new ActionManager(this.scene);

					// 포탄 액선 트리거에 액션을 등록한다.
					cannonBallClone.actionManager.registerAction(
						new ExecuteCodeAction(
							// 만약에 포탄이 킬박스로 들어갈 경우.해당 포탄을 릴리즈한다.
							{
								trigger: ActionManager.OnIntersectionEnterTrigger,
								parameter: this.killBox,
							},

							() => {
								cannonBallClone.dispose();
							}
						)
					);
				}
			}
			// 포탄 발사 소리 재생
			this.cannonBlastSound.play();
		};
	}

	// create the large box far underneath the tower, that will act as a trigger to destory the cannonballs.
	private setKillBox() {
		//킬박스를 만든다.
		// 이 킬박스는 발사된 포탄을 숨기기 위한 zone 이다.
		const killBox = MeshBuilder.CreateBox('killbox', { width: 400, depth: 400, height: 4 }, this.scene);
		killBox.position = new Vector3(0, -50, 0);

		// 보이지 않게 처리한다.
		killBox.visibility = 0;
		this.killBox = killBox;
	}

	// create cannomBall
	private setCannonBall() {
		// 포탄은 구형으로 만든다.
		const cannonBall = MeshBuilder.CreateSphere('cannonBall', { diameter: 0.3 }, this.scene);

		// 포탄 재질을 만든다.
		const cannonBallMat = new StandardMaterial('cannonBallMaterial', this.scene);

		// 검은색으로 만든다.
		cannonBallMat.diffuseColor = Color3.Black();

		// specularPower: 물체 표면에 빛이 반사될 때, 표면의 광택 정도.
		// 높을수록 표면이 더 광택이 난다.
		cannonBallMat.specularPower = 256;

		// 포탄에 위에서 만든 재질을 더해주고.
		cannonBall.material = cannonBallMat;
		// 일단은 포탄이 보이지 않게 한다.
		cannonBall.visibility = 0;

		this.cannonBall = cannonBall;
	}

	/**
	 * get cannon Mesh from glb
	 * @param imported glb 파일에서 불러온 모델
	 */
	private setCannonMesh(imported: ISceneLoaderAsyncResult) {
		// imported.meshes[0]  root
		// imported.meshes[1]  cannon  포신
		// imported.meshes[2]  cannonMount  포차
		// imported.meshes[0].getChildren()[0] :  캐논의 트랜스폼 노드
		const cannon = imported.meshes[0].getChildren()[0] as Mesh;

		// 캐논의 트랜스폼 노드를 루트에서 분리한다.
		cannon.setParent(null);

		// imported.meshes[0].getChildren()[0].getChildMeshes() : [cannonMount, cannon]
		const cannonMeshes = cannon.getChildMeshes();

		// 캐논 모델의 메시 계층 구조를 확인하기 위한 log
		// cannonMeshes.forEach((v) => {
		// 	console.log(v.name, v.getChildMeshes());
		// });

		// cannonMount: [cannon];
		// cannon: []
		// cannonMeshes[0].getChildMeshes()[0] == cannonMeshes[1]

		// cannonMeshes는 [cannonMount, cannon] 임.
		// cannonMount 가 포차,  cannon은 포신
		// glb 에서는 하나의 메시에 하나의 메테리얼만 허용
		//=> 즉 cannon은  두개의 메시로 이루어져 있음.
		// 두개의 메시로 이루어져 있기 때문에 둘이 한 세트로 이동하기 위해 메타데이터를 지정해준다.

		/**
		 *  cannon:TransformNode :[
		 * 	Mesh: {
		 * 		name: cannonMount,
		 * 		metadata: cannon
		 * 	},
		 * 	Mesh:{
		 * 		name: cannon,
		 * 		metadata: cannon
		 * 	}
		 * ]
		 *
		 */

		for (let i = 0; i < cannonMeshes.length; i++) {
			cannonMeshes[i].metadata = 'cannon';
		}

		this.cannon = cannon;
	}

	// 애니메이션 설정
	private async setCannonAnimAsync(imported: ISceneLoaderAsyncResult) {
		// glb에서 애니메이션 가져오기
		const importedAnimationGroups = imported.animationGroups;
		// console.log(importedAnimationGroups);
		// importedAnimationGroups = [cannon, cannonMount]
		// console.log(this.cannon.getChildMeshes());

		const animations = [];
		// 애니메이션을 가져온 다음 새로운 배열에 넣고, release 한다.
		for (let i = 0; i < importedAnimationGroups.length; i++) {
			importedAnimationGroups[i].stop();
			animations.push(importedAnimationGroups[i].targetedAnimations[0].animation);
			importedAnimationGroups[i].dispose();
		}

		// 애니메이션 그룹 만들기
		// this.cannon.getChildMeshes()  = [cannonMount, cannon, particleEmitter]
		// importedAnimationGroups = [cannon, cannonMount]
		// 애니메이션 => 타겟
		const cannonAnimationGroup = new AnimationGroup('cannonAnimGroup');
		cannonAnimationGroup.addTargetedAnimation(animations[0], this.cannon.getChildMeshes()[1]);
		cannonAnimationGroup.addTargetedAnimation(animations[1], this.cannon.getChildMeshes()[0]);

		this.cannonAnimationGroup = cannonAnimationGroup;
	}

	// 연기. 폭발 연출 파티클 시스템
	private async setSmokeBlastAsync() {
		// particle 내뿜는 박스
		const particleEmitter = MeshBuilder.CreateBox('particleEmitter', { size: 0.05 }, this.scene);
		particleEmitter.position = new Vector3(0, 0.76, 1.05);
		particleEmitter.rotation.x = Tools.ToRadians(78.5);
		// 안보이게 하고
		particleEmitter.isVisible = false;

		// 캐논에서 발사되는 연기, 폭발을 위한 연출이니까.
		// 이 파티클 emitter의 부모를 캐논으로 한다.
		particleEmitter.setParent(this.cannon.getChildMeshes()[1]);

		// https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/particleHelper
		// https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/particle_snippets
		// 파티클 객체 만들어서 서버에 저장하면 아래 스니펫을 줌.
		const smokeBlast = await ParticleHelper.ParseFromSnippetAsync('LCBQ5Y#6', this.scene);
		smokeBlast.emitter = particleEmitter;
		// 파티클 시스템이 작동하는 시간
		smokeBlast.targetStopDuration = 0.2;

		this.smokeBlast = smokeBlast;
	}

	// 캐논 발사 소리 불러오기
	private setCannonBlastSound() {
		this.cannonBlastSound = new Sound('cannonBlast', './sounds/cannonBlast.mp3', this.scene);
	}

	private createTenConnons() {
		// 캐논 좌표, 각도 지정
		[
			[
				[0.97, 5.52, 1.79],
				[0, 0, 180],
			],
			[
				[1.98, 2.32, 3.05],
				[0, 0, 180],
			],
			[
				[1.46, 2.35, -0.73],
				[0, 90, 180],
			],

			[
				[1.45, 5.52, -1.66],
				[0, 90, 180],
			],
			[
				[1.49, 8.69, -0.35],
				[0, 90, 180],
			],
			[
				[-1.37, 8.69, -0.39],
				[0, -90, 180],
			],

			[
				[0.58, 4, -2.18],
				[0, 180, 180],
			],
			[
				[1.22, 8.69, -2.5],
				[0, 180, 180],
			],
			[
				[-1.31, 2.33, -2.45],
				[0, 180, 180],
			],

			[
				[-3.54, 5.26, -2.12],
				[0, -90, 180],
			],
		].forEach((v, i) => {
			const [position, rotation] = v; // 좌표, 각도
			// 기존 캐논 메시를 복제
			const cannonClone = this.cannon.clone('cannonClone' + i);

			// 복제된 캐논 메시 위치 설정
			cannonClone.position = new Vector3(...position);

			// 복제된 캐논 메시 각도 설정
			cannonClone.rotation = new Vector3(...rotation.map((r) => Tools.ToRadians(r)));

			// 복제된 캐논 메시의 적용할 애니메이션 그룹 설정
			const cannonAnimGroupClone = new AnimationGroup('cannonAnimationGroupClone' + i);

			// setCannonAnimAsync 메서드에서 처럼
			//  타겟에 애니메이션을 적용
			cannonAnimGroupClone.addTargetedAnimation(
				this.cannonAnimationGroup.targetedAnimations[0].animation, // 원본 애니메이션
				cannonClone.getChildMeshes()[1] // 복제된 캐논의 메시
			);

			cannonAnimGroupClone.addTargetedAnimation(
				this.cannonAnimationGroup.targetedAnimations[1].animation,
				cannonClone.getChildMeshes()[0]
			);

			// 캐논 - 애니메이션  관리하는 객체
			this.cannonAnimationPairings[cannonClone.name] = cannonAnimGroupClone.name;

			// 캐논 준비 여부 관리하는 객체
			this.cannonReadyToPlay[cannonClone.name] = 1;
		});

		// 복사본 만들어서 위치도 정해주고, 이제 원본은 필요 없으니까  scene에서 release
		this.cannon.dispose();
		this.cannonAnimationGroup.dispose();
		this.smokeBlast.dispose();
		this.scene.particleSystems.forEach((p) => p.stop());
	}
}
