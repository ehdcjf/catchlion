import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { CLWebSocket } from './websocket';
import { CLRouter } from './router';
import { CreateRoomAction } from './actions/createRoom';
import { JoinRoomAction } from './actions/joinRoom';
import { LeaveRoomAction } from './actions/leaveRoom';
import { FetchRoomAction } from './actions/fetchRoom';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// Instantiate Fastify with some config

(async () => {
  CLRouter.getInstance()
    .addRoute(new CreateRoomAction())
    .addRoute(new JoinRoomAction())
    .addRoute(new LeaveRoomAction())
    .addRoute(new FetchRoomAction());

  const server = Fastify({
    logger: true,
  });

  await server.register(websocket);
  server.get('/', { websocket: true }, (connection, req: any) => {
    new CLWebSocket(connection.socket, req);
  });

  // Start listening.
  server.listen({ port, host }, (err) => {
    if (err) {
      server.log.error(err);
      process.exit(1);
    } else {
      console.log(`[ ready ] http://${host}:${port}`);
    }
  });
})();

// Register your application as a normal plugin.
