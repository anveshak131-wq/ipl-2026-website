// Cloudflare Pages Function: /api/websocket (WebSocket Gateway)
export async function onRequest(context) {
  const { request } = context;

  if (request.headers.get('Upgrade') !== 'websocket') {
    return new Response('Expected WebSocket Upgrade', { status: 426 });
  }

  // Native Cloudflare Workers WebSocketPair
  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);

  server.accept();

  server.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // Heartbeat ping-pong
      if (data.type === 'ping') {
        server.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        return;
      }

      // Live Score Subscription Room Echo
      if (data.type === 'subscribe') {
        server.send(JSON.stringify({
          type: 'subscribed',
          channel: data.channel,
          message: `Connected to channel: ${data.channel}`,
          timestamp: Date.now()
        }));
        return;
      }

      // Broadcast relay echo back to client
      server.send(JSON.stringify({
        type: 'ack',
        received: data,
        timestamp: Date.now()
      }));
    } catch (e) {
      server.send(JSON.stringify({ type: 'error', message: 'Invalid JSON payload' }));
    }
  });

  server.addEventListener('close', () => {
    server.close(1000, 'Deregistered from live ops cluster');
  });

  return new Response(null, {
    status: 101,
    webSocket: client
  });
}
