import { Action } from './action';
import { SocketEssence, WebsocketManager } from '../websocket';
import { Room } from '../service/room';
import z from 'zod';
export class LeaveRoomAction extends Action {
  constructor() {
    super('LEAVE_ROOM', z.object({}));
  }

  async execute(socket: SocketEssence) {
    const result = Room.getInstance().leave(socket);
    if (result.success) {
      WebsocketManager.getInstance().broadcast({
        action: 'MINUS_ROOM_MEMBER',
        ...result,
      });
    }
    return result;
  }
}
