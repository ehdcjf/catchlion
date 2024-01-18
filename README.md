# Catchlion  Babylonjs 연습


# 설치
```sh
git clone https://github.com/ehdcjf/catchlion.git
cd catchlion
npm install
```

# 시작
```sh

npx nx dev [appName]
# appNmae은  apps/ 폴더 하위에 있는 폴더명
```

# 앱 만들기
```sh
 npm run gen [appName]

```



# 주석이 작성된 코드

### cannon  : ammojs로 탄환에 관련딘 물리 엔진을 적용하고  대포 발사 관련 애니메이션은 연습

### amin2 : 애니메이션 연습












# Box 만들기
```ts
	const box1 = MeshBuilder.CreateBox('box1', { width: 2, height: 1.5, depth: 3 });
	box1.position.y = 0.75;

	const box2 = MeshBuilder.CreateBox('box2', {});
	box2.scaling.x = 2;
	box2.scaling.y = 1.5;
	box2.scaling.z = 3;
	box2.position = new Vector3(-3, 0.75, 0);

	const box3 = MeshBuilder.CreateBox('box3', {});
	box3.scaling = new Vector3(2, 1.5, 3);
	box3.position.x = 3;
	box3.position.y = 0.75;
	box3.position.z = 0;
```

# Box 회전하기
```ts
	const box4 = MeshBuilder.CreateBox('box4', { width: 2, height: 2, depth: 2 });
	box4.position = new Vector3(-6, 1, 0);
	box4.rotation.y = Math.PI / 4;
```

# 실린더
```ts
	const roof = MeshBuilder.CreateCylinder('roof', { diameter: 1.3, height: 1.2, tessellation: 3 });
	roof.scaling.x = 0.75;
	roof.rotation.z = Math.PI / 2;
	roof.position.y = 1.22;

```
diameter 는 실린더 한 변의 길이
height 는 실린더 높이
tessllation: 실린더의 옆면을 채울 타일의 수. 3이면 삼각기둥, 4면 사각기둥 ... 원기둥


# Mesh 색칠하기
```ts
	const groundMat = new StandardMaterial('groundMat');
	groundMat.diffuseColor = new Color3(0.565, 0.933, 0.565);
	const ground = MeshBuilder.CreateGround('ground', { width: 20, height: 20 });
	ground.material = groundMat;

```


# Mesh Texture 입히기
```ts
	const roofMat = new StandardMaterial('roofMat');
		roofMat.diffuseTexture = new Texture('./textures/roof.jpg');

	const boxMat = new StandardMaterial('boxMat');
		boxMat.diffuseTexture = new Texture('./textures/floor.png');

	const box = MeshBuilder.CreateBox('box', {});
	box.position.y = 0.5;
	box.material = boxMat;	

	const roof = MeshBuilder.CreateCylinder('roof', { diameter: 1.3, height: 1.2, tessellation: 3 });
	roof.scaling.x = 0.75;
	roof.rotation.z = Math.PI / 2;
	roof.position.y = 1.22;
	roof.material = roofMat;

```


# Vector4
Vector4( 왼쪽아래 X, 왼쪽아래 Y, 오른쪽 위 X, 오른쪽 위 Y )
참고: [Vector4,faceUV](https://doc.babylonjs.com/features/introductionToFeatures/chap2/face_material)


# Merge
```ts
const box = this.buildBox();
	const roof = this.buildRoof();

	const house = Mesh.MergeMeshes([box, roof], true, false, null, false, true);
```


# Export

```ts
GLTF2Export.GLBAsync(this.scene, 'village.glb').then(glb => {
			glb.downloadFiles();
		});
```





# import Havok  

## Download
[havok wasm](https://github.com/BabylonJS/havok/blob/main/packages/havok/lib/esm/HavokPhysics.wasm)


```ts
private async initHavok() {
		/**
		 *  node_modules에서 havok을 불러오는 과정에 문제가 있는 거 같음.
		 *
		 *  아마도   vite 가 최적화하는 과정에서 wasm 파일에 문제가 생기는 거 같음.
		 *
		 * vite.config에  optimizeDeps.exclude 설정을 했는데  잘 안됨.
		 *
		 * 그래서 그냥 public 모듈에 넣어놓고 불러오기로함.
		 *
		 * 모노레포 버리고 나중에 진짜로 만들 때,  설정하면 될 수도 있음.
		 */
		const wasmBinary = await fetch('./havok/HavokPhysics.wasm');
		const wasmBinaryArrayBuffer = await wasmBinary.arrayBuffer();
		const havokInterface = await HavokPhysics({ wasmBinary: wasmBinaryArrayBuffer });
		// const havokInterface = await HavokPhysics();

		const hk = new HavokPlugin(true, havokInterface);
		this.scene.enablePhysics(new Vector3(0, -9.8, 0), hk);

		const sphereAggregate = new PhysicsAggregate(
			this.sphere,
			PhysicsShapeType.SPHERE,
			{
				mass: 100,
				restitution: 0.75,
			},
			this.scene
		);

		const groundAggragate = new PhysicsAggregate(this.gound, PhysicsShapeType.BOX, { mass: 0 }, this.scene);
	}
```


# Havok
Havok에서 사용하는 시뮬레이션은 강체 시뮬레이션, 모양이 변하지 않는 객체를 의미. 
서로 충돌하고 튕겨나가도 찌그러지거나 늘어나지 않음.













