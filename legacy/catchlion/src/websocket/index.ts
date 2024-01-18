import type { WebSocket } from 'ws';
import { CLRouter } from '../router';
import { Room } from '../service/room';
export type Send = (msg: any) => void;

type CLMessage = {
  action: string;
  data: any;
};

export type SocketEssence = {
  id: string;
  send: Send;
  nickname?: string;
  setNickname: (nickname: string) => boolean;
};

export class WebsocketManager {
  private static instance: WebsocketManager;
  private sockets: Set<Send>;
  private constructor() {
    this.sockets = new Set();
  }

  public static getInstance() {
    WebsocketManager.instance ??= new WebsocketManager();
    return WebsocketManager.instance;
  }

  public broadcast(msg: any) {
    this.sockets.forEach((send) => {
      send(msg);
    });
  }

  public addSpeaker(send: Send) {
    console.log('add client');
    this.sockets.add(send);
  }

  public destroySpeaker(send: Send) {
    console.log('delete socket');
    this.sockets.delete(send);
  }
}

export class CLWebSocket {
  public send: Send;
  public id: string;
  private nickname: string;

  constructor(private socket: WebSocket, private req: any) {
    this.send = (msg: any) => {
      socket.send(JSON.stringify(msg));
    };

    this.id = req.headers['sec-websocket-key'];
    socket.on('open', () => {
      console.log('socket open!!');
      WebsocketManager.getInstance().addSpeaker(this.send);
    });

    socket.on('close', () => {
      console.log('socket close!!');
      WebsocketManager.getInstance().destroySpeaker(this.send);
      Room.getInstance().leave(this.getSocketEssence());
      CLRouter.getInstance().run('LEAVE_ROOM', {}, this.getSocketEssence());
    });

    socket.on('error', () => {
      console.error('socket error');
      socket.terminate();
    });

    socket.on('message', async (message) => {
      let action: string;
      let data: any;
      try {
        console.log(
          JSON.stringify({ type: 'request', request: message.toString() })
        );
        const request = JSON.parse(message.toString()) as CLMessage;
        action = request.action;
        data = request.data;

        if (!action) {
          this.send({ action, success: false, err: `invalid request` });
          return;
        }

        if (!CLRouter.getInstance().checkAction(action)) {
          this.send({ action, success: false, err: `invalid action` });
          return;
        }

        if (!CLRouter.getInstance().checkData(action, data)) {
          this.send({ action, success: false, err: `invalid input data` });
          return;
        }

        const result = await CLRouter.getInstance().run(
          action,
          data,
          this.getSocketEssence()
        );

        this.send({ action, ...result });
      } catch (err) {
        console.error(err);
      }
    });
  }

  private setNickname(nickname: string) {
    this.nickname = nickname;
    return true;
  }

  private getSocketEssence(): SocketEssence {
    return {
      nickname: this.nickname,
      id: this.id,
      send: this.send,
      setNickname: this.setNickname,
    };
  }
}
