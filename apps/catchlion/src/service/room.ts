import * as crypto from 'crypto';
import { SocketEssence } from '../websocket';

type RoomItem = {
  roomId: string;
  sockets: Set<SocketEssence>;
  master: string;
  status: 'wait' | 'play';
};

export class Room {
  private static instance: Room;
  private rooms: Map<string, RoomItem>;
  private constructor() {
    this.rooms = new Map();
  }

  public static getInstance() {
    Room.instance ??= new Room();
    return Room.instance;
  }

  create(socket: SocketEssence): { success: boolean; roomId?: string } {
    for (const room of this.rooms.values()) {
      if (room.sockets.has(socket)) return { success: false };
    }

    const roomId = crypto.randomUUID();
    const sockets: Set<SocketEssence> = new Set();
    sockets.add(socket);

    const newRoom: RoomItem = {
      roomId,
      master: socket.id,
      sockets: sockets,
      status: 'wait',
    };

    this.rooms.set(roomId, newRoom);
    return { success: true, roomId };
  }

  join(data: any, socket: SocketEssence) {
    const room = this.rooms.get(data.roomId);
    if (!room) return { success: false, err: 'no room' };
    if (room.sockets.size > 1) return { success: false, err: 'full' };
    room.sockets.add(socket);
    this.rooms.set(room.roomId, room);
    room.sockets.forEach((sock) => {
      if (sock.id == room.master) {
        sock.send({ action: 'join', data: { id: socket.id } });
      }
    });
    return { sucess: true, roomId: data.roomId };
  }

  leave(socket: SocketEssence) {
    let roomId: string;
    for (const room of this.rooms.values()) {
      if (room.sockets.has(socket)) {
        roomId = room.roomId;
        room.sockets.delete(socket);
        if (room.sockets.size == 0) {
          this.rooms.delete(room.roomId);
        } else {
          this.rooms.set(room.roomId, room);
          room.sockets.forEach((remain) => {
            remain.send({
              action: 'LEAVE_ROOM',
              data: {
                id: socket.id,
              },
            });
          });
        }
      }
    }
    return { success: true, roomId: roomId };
  }

  fetch() {
    const roomList = [];
    for (const [roomId, room] of this.rooms) {
      const roomInfo = {
        roomId: roomId,
        members: [...room.sockets].map((socket) => socket.nickname),
        status: room.status,
      };
      roomList.push(roomInfo);
    }
    return {
      success: true,
      data: {
        roomList: roomList,
      },
    };
  }
}
