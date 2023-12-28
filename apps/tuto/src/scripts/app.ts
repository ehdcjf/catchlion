import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';

import {
	Engine,
	Scene,
	Vector3,
	Mesh,
	Color3,
	Color4,
	ShadowGenerator,
	GlowLayer,
	PointLight,
	FreeCamera,
	CubeTexture,
	Sound,
	PostProcess,
	Effect,
	SceneLoader,
	Matrix,
	MeshBuilder,
	Quaternion,
	AssetsManager,
	EngineFactory,
} from '@babylonjs/core';
import { AdvancedDynamicTexture, StackPanel, Button, TextBlock, Rectangle, Control, Image } from '@babylonjs/gui';

import { PlayerInput } from './inputController';
import { Player } from './characterController';
import { Hud } from './ui';
import { Environment } from './environment';

enum State {
	START = 0,
	GAME = 1,
	LOSE = 2,
	CUTSCENE = 3,
}

class App {}
