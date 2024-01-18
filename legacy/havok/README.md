
# HACK

## import havok  

##### Download
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