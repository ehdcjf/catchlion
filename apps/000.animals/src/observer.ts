import { Observable } from '@babylonjs/core';
import type { SceneEvent, Message } from './const';

export class Observers {
	private static instance: Observers;
	public sceneChanger = new Observable<SceneEvent>();
	public sendMsgObserver = new Observable<Message>();
	private constructor() {}
	public static getInstance() {
		Observers.instance ??= new Observers();
		return Observers.instance;
	}
}
