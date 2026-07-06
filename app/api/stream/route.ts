import { NextRequest } from "next/server";

// Edge runtime = long-lived streaming responses that work the same way
// locally (`next dev`) and on Vercel (no extra config needed).
export const runtime = "edge";

const SYMBOLS = ["BTC", "ETH", "SOL", "NIFTY", "SENSEX"];

// Replace this function with a call to your real data source
// (a DB change feed, a message queue, another API, sensor input, etc).
function nextTick(prices: Record<string, number>) {
  const updates: { symbol: string; price: number; change: number }[] = [];
  for (const symbol of SYMBOLS) {
    const prev = prices[symbol];
    const drift = (Math.random() - 0.5) * prev * 0.004; // +/-0.4% wiggle
    const price = Math.max(0.01, prev + drift);
    prices[symbol] = price;
    updates.push({
      symbol,
      price: Number(price.toFixed(2)),
      change: Number((((price - prev) / prev) * 100).toFixed(3)),
    });
  }
  return updates;
}

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const prices: Record<string, number> = {
    BTC: 65000,
    ETH: 3400,
    SOL: 165,
    NIFTY: 24500,
    SENSEX: 80500,
  };

  let closed = false;
  let interval: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Initial snapshot so the client can render immediately.
      send("snapshot", { ts: Date.now(), prices: { ...prices } });

      interval = setInterval(() => {
        try {
          const updates = nextTick(prices);
          send("tick", { ts: Date.now(), updates });
        } catch (err) {
          send("error", { message: "stream error" });
        }
      }, 1000);

      // Keep the connection alive through proxies/load balancers.
      const heartbeat = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 15000);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      closed = true;
      clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable proxy buffering (nginx etc.)
    },
  });
}
