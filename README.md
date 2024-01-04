# Catchlion



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









