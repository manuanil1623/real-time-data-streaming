<<<<<<< HEAD
# Realtime Stream

A minimal realtime data streaming app built with Next.js Server-Sent
Events (SSE). Runs locally with zero config and deploys to Vercel as-is
(no extra setup, no separate server, no WebSocket infra needed).

## Why SSE instead of WebSockets

Vercel's serverless/edge functions don't keep a persistent bidirectional
socket open well, but they *do* support long-lived one-way streaming
responses. SSE is a plain HTTP response that stays open and pushes
events — the browser's built-in `EventSource` reconnects automatically.
That makes it the simplest realtime option that "just works" on Vercel.

If you need bidirectional (client → server) realtime instead (chat,
multiplayer cursors, etc), see the "Going further" section below.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll see live-updating prices ticking
every second, streamed from `app/api/stream/route.ts`.

## Deploy to Vercel

Option A — CLI:
```bash
npm i -g vercel
vercel
```

Option B — GitHub:
1. Push this folder to a GitHub repo.
2. Go to https://vercel.com/new and import the repo.
3. Click Deploy — no environment variables or config needed.

The stream endpoint runs on Vercel's Edge Runtime
(`export const runtime = "edge"` in `route.ts`), so it works the same
way in production as it does locally.

## Project structure

```
app/
  api/stream/route.ts   # SSE endpoint — emits `snapshot` then `tick` events
  page.tsx               # client UI, subscribes via EventSource
  layout.tsx
  globals.css
```

## Plugging in real data

Replace the body of `nextTick()` in `app/api/stream/route.ts` with your
actual data source, for example:

- **Database change stream**: poll or subscribe (Postgres LISTEN/NOTIFY,
  MongoDB change streams, Supabase Realtime, etc.) inside the
  `setInterval`/event handler and call `send("tick", ...)` when new data
  arrives.
- **Message queue / pub-sub**: subscribe to Kafka, Redis pub/sub, NATS,
  or similar, and forward each message via `send(...)`.
- **External API polling**: fetch an upstream API on an interval and
  forward the delta.
- **IoT / sensor data**: if the source itself pushes over MQTT or a
  socket, bridge it into `controller.enqueue(...)` the same way.

The client (`app/page.tsx`) already handles reconnection, a live status
indicator, and rendering — you only need to change what data flows
through `send()`.

## Going further: WebSockets

If you need true two-way realtime (not just server → client push),
Vercel's serverless functions aren't suitable for holding a persistent
WebSocket. Common approaches:
- A managed realtime service (Pusher, Ably, Supabase Realtime,
  PartyKit, Liveblocks) called from your Vercel-hosted frontend.
- Your own long-running WebSocket server hosted elsewhere (Fly.io,
  Render, a small VPS) that the Vercel app connects to as a client.

Happy to wire up either of those if you tell me which fits your use
case.
=======
# real-time-data-streaming
A real-time data streaming dashboard built with Next.js, featuring live event monitoring, file uploads, and interactive command controls.
>>>>>>> 18cbab9c3c22d58c9148698d3bc66a5c8f17e3ef
