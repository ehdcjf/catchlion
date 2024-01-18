import { Action } from './action';
import { SocketEssence } from '../websocket';
import z from 'zod';
export class SetNickAction extends Action {
  constructor() {
    super('SET_NICK', z.object({ nickname: z.string() }));
  }

  async execute(socket: SocketEssence, data: any) {
    const isSuccess = socket.setNickname(data.nickname);
    return { success: isSuccess };
  }
}
