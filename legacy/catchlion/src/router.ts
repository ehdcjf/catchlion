import { Action } from './actions/action';
import { SocketEssence } from './websocket';

export class CLRouter {
  private routes: Map<string, Action>;
  private static instance: CLRouter;
  private constructor() {
    this.routes = new Map();
  }

  public static getInstance() {
    CLRouter.instance ??= new CLRouter();
    return CLRouter.instance;
  }

  addRoute(router: Action) {
    this.routes.set(router.name, router);
    return this;
  }

  async run(action: string, data: any, socket: SocketEssence) {
    const runner = this.routes.get(action);
    const result = await runner.execute.bind(runner)(socket, data);
    return result;
  }

  async checkAction(action: string) {
    return this.routes.has(action);
  }
  async checkData(action: string, data: any) {
    const runner = this.routes.get(action);
    return runner.validateInput.bind(runner)(data);
  }
}
