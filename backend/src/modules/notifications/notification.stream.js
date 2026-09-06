import { ApiError } from '../../utils/apiError.js';

const connections = new Map();
export function openNotificationStream(request, response) {
  const id = request.user.userId;
  const streams = connections.get(id) ?? new Set();
  if (streams.size >= 5) throw new ApiError(429, 'TOO_MANY_STREAMS', 'Too many open notification connections.');
  response.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  response.flushHeaders();
  streams.add(response);
  connections.set(id, streams);
  response.write('event: ready\ndata: {}\n\n');
  const heartbeat = setInterval(() => response.write(': heartbeat\n\n'), 15000);
  // Periodic reconnects recheck token expiry and current account authorization.
  const lifetime = setTimeout(() => response.end(), 60000);
  response.on('close', () => {
    clearInterval(heartbeat); clearTimeout(lifetime);
    streams.delete(response);
    if (!streams.size) connections.delete(id);
  });
}

export function publishNotifications(notifications) {
  for (const notification of notifications) {
    for (const response of connections.get(notification.recipientId) ?? []) {
      if (response.destroyed || response.writableEnded) continue;
      try {
        if (!response.write(`event: ${notification.type}\ndata: ${JSON.stringify(notification)}\n\n`)) response.end();
      } catch {
        response.destroy();
      }
    }
  }
}
