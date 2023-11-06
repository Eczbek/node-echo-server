import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { join, parse } from 'node:path';
import { lookup } from 'mime-types';
import { WebSocketServer } from 'ws';

const sockets = new Map();

new WebSocketServer({
	server: createServer((request, response) => {
		createReadStream(join('./public', request.url))
			.on('open', function() {
				response.setHeader('Content-Type', lookup(parse(request.url).ext));
				this.pipe(response);
			})
			.on('error', () => response.writeHead(404).end());
	}).listen(8080)
}).on('connection', (socket) => {
	const id = randomUUID();
	sockets.set(id, socket);
	console.log(id, 'connected');

	socket
		.on('close', () => {
			sockets.delete(id);
			console.log(id, 'disconnected');
		})
		.on('message', (buffer) => {
			try {
				const message = JSON.parse(buffer.toString());
				console.log(id, 'sends', message);
				socket.send(JSON.stringify(message));
			} catch {}
		});
});
