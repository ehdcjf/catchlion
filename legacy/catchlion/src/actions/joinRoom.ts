import { Action } from './action';
import { SocketEssence, WebsocketManager } from '../websocket';
import { Room } from '../service/room';
import z from 'zod';
export class JoinRoomAction extends Action {
  constructor() {
    super(
      'JOIN_ROOM',
      z.object({
        roomId: z.string(),
      })
    );
  }

  async execute(socket: SocketEssence, data: any) {
    const result = Room.getInstance().join(data, socket);
    if (result.success) {
      WebsocketManager.getInstance().broadcast({
        action: 'PLUS_ROOM_MEMBER',
        ...result,
      });
    }
    return result;
  }
}
