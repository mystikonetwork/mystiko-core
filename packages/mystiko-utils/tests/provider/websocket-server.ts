import WebSocket from 'ws';

export function buildServer(port: number): Promise<WebSocket.Server> {
  const serverPromise = new Promise<WebSocket.Server>((resolve) => {
    const server: WebSocket.Server = new WebSocket.Server({ port }, () => resolve(server));
  });
  serverPromise.then((server) => {
    server.on('connection', (ws: WebSocket) => {
      ws.on('message', (message: Buffer) => {
        const parsedMessage = JSON.parse(message.toString());
        if (parsedMessage.method === 'eth_chainId') {
          ws.send(JSON.stringify({ id: parsedMessage.id, jsonrpc: '2.0', result: '0x3' }), () => {});
        } else if (parsedMessage.method === 'eth_getTransactionByHash') {
          ws.send(JSON.stringify({ id: parsedMessage.id, jsonrpc: '2.0', result: null }), () => {});
        } else {
          ws.send(
            JSON.stringify({
              id: parsedMessage.id,
              jsonrpc: '2.0',
              error: { code: -32600, message: 'unsupported method' },
            }),
            () => {},
          );
        }
      });
    });
  });
  return serverPromise;
}

export function closeServer(server: WebSocket.Server): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    server.clients.forEach((ws) => ws.terminate());
    server.close((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
