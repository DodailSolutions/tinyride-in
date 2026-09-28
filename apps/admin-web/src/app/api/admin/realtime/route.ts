import { realtimeBus } from '@/server/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // 1. Initial connection greeting
      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({
            status: 'LIVE',
            time: Date.now(),
            zone: 'Asia/Kolkata',
          })}\n\n`
        )
      );

      // 2. Event listener on global realtimeBus
      const listener = (eventData: any) => {
        try {
          const eventType = eventData.type || 'message';
          const payload = `event: ${eventType}\ndata: ${JSON.stringify({
            ...eventData,
            serverTimestamp: Date.now(),
          })}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream might be closed
        }
      };

      realtimeBus.on('admin:events', listener);

      // Also listen to all trip broadcast channels
      const tripListener = (eventData: any) => {
        try {
          controller.enqueue(
            encoder.encode(
              `event: trip_telemetry\ndata: ${JSON.stringify({
                ...eventData,
                serverTimestamp: Date.now(),
              })}\n\n`
            )
          );
        } catch {
          // Stream might be closed
        }
      };

      realtimeBus.on('admin:telemetry', tripListener);

      // 3. Keepalive heartbeat ping every 10 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`event: ping\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`)
          );
        } catch {
          clearInterval(heartbeat);
          realtimeBus.off('admin:events', listener);
          realtimeBus.off('admin:telemetry', tripListener);
        }
      }, 10000);

      // 4. Cleanup when client disconnects
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        realtimeBus.off('admin:events', listener);
        realtimeBus.off('admin:telemetry', tripListener);
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
