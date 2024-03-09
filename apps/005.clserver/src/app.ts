import type { ServerWebSocket } from 'bun';

class CatchLion {
	server!: import('bun').Server;
	test: any;
	constructor() {
		this.test = { kill: 'bill' };
	}

	private composeWSHandler(app: CatchLion) {
		return {
			open: (ws: ServerWebSocket) => {
				console.log(app.test);
			},
			message: async (ws: ServerWebSocket, message: string | Buffer) => {
				console.log(app.test);
				console.log(message);
			},
		};
	}

	listen() {
		const ws = this.composeWSHandler(this);

		this.server = Bun.serve<any>({
			fetch(req, server) {
				const success = server.upgrade(req);
				if (success) {
					// Bun automatically returns a 101 Switching Protocols
					// if the upgrade succeeds
					return undefined;
				}
				// handle HTTP request normally
				return new Response('Hello world!');
			},
			websocket: ws,
		});
		console.log(`Listening on ${this.server.hostname}:${this.server.port}`);
	}
}

const cl = new CatchLion();
cl.listen();
