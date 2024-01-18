import { SocketEssence } from '../websocket';
import type z from 'zod';
export abstract class Action {
  constructor(
    public name: string,
    private zod: z.ZodObject<any, 'strip', z.ZodTypeAny, any, any>
  ) {}

  abstract execute(socket: SocketEssence, data?: any): Promise<any>;

  validateInput(data: any) {
    try {
      this.zod.parse(data);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}
