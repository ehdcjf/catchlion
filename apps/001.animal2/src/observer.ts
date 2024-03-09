import { Observable } from '@babylonjs/core';
import type { SceneEvent, GameEvent } from './const';

export class Observers {
	private static instance: Observers;
	public sceneChanger = new Observable<SceneEvent>();
	public gameEventObserver = new Observable<GameEvent>();
	private constructor() {}
	public static getInstance() {
		Observers.instance ??= new Observers();
		return Observers.instance;
	}
}
