import { realtimeBus } from '@/server/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get('tripId');

  if (!tripId) {
    return new Response('tripId is required', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // 1. Initial connection greeting
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ tripId, time: Date.now() })}\n\n`));

      // 2. Event handler for real-time telemetry and state changes
      const channel = `trip:${tripId}`;
      const listener = (eventData: any) => {
        try {
          const payload = `event: ${eventData.type || 'message'}\ndata: ${JSON.stringify(eventData)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Client stream closed
        }
      };

      realtimeBus.on(channel, listener);

      // 3. Keepalive heartbeat ping every 15s
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(heartbeat);
          realtimeBus.off(channel, listener);
        }
      }, 15000);

      // 4. Cleanup when client disconnects
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        realtimeBus.off(channel, listener);
        try {
          controller.close();
        } catch {
          // ignore
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
