import { Action } from './action';
import { Room } from '../service/room';
import z from 'zod';
export class FetchRoomAction extends Action {
  constructor() {
    super('FETCH_ROOM', z.object({}));
  }

  async execute() {
    const result = Room.getInstance().fetch();
    return result;
  }
}
