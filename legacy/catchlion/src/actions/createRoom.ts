import { Action } from './action';
import { SocketEssence, WebsocketManager } from '../websocket';
import { Room } from '../service/room';
import z from 'zod';
export class CreateRoomAction extends Action {
  constructor() {
    super('create-room', z.object({}));
  }

  async execute(socket: SocketEssence) {
    const result = Room.getInstance().create(socket);
    if (result.success) {
      WebsocketManager.getInstance().broadcast({
        action: 'NEW_ROOM',
        ...result,
      });
    }
    return result;
  }
}
