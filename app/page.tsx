"use client";

import { useEffect, useRef, useState } from "react";

type Row = {
  symbol: string;
  price: number;
  change: number;
  history: number[];
  flash: "up" | "down" | null;
};

const MAX_HISTORY = 40;

function Sparkline({ history }: { history: number[] }) {
  if (history.length < 2) return <svg width="90" height="28" />;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const span = max - min || 1;
  const step = 90 / (MAX_HISTORY - 1);
  const points = history
    .map((v, i) => {
      const x = i * step;
      const y = 26 - ((v - min) / span) * 24;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const rising = history[history.length - 1] >= history[0];
  return (
    <svg width="90" height="28" viewBox="0 0 90 28">
      <polyline
        fill="none"
        stroke={rising ? "var(--up)" : "var(--down)"}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
}

export default function Page() {
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [status, setStatus] = useState<"connecting" | "live" | "error">(
    "connecting"
  );
  const [tape, setTape] = useState<string[]>([]);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let retryTimer: ReturnType<typeof setTimeout>;

    function connect() {
      const es = new EventSource("/api/stream");
      esRef.current = es;

      es.addEventListener("snapshot", (e) => {
        const { prices } = JSON.parse((e as MessageEvent).data);
        setRows((prev) => {
          const next = { ...prev };
          for (const symbol of Object.keys(prices)) {
            next[symbol] = {
              symbol,
              price: prices[symbol],
              change: 0,
              history: [prices[symbol]],
              flash: null,
            };
          }
          return next;
        });
        setStatus("live");
      });

      es.addEventListener("tick", (e) => {
        const { updates } = JSON.parse((e as MessageEvent).data);
        setRows((prev) => {
          const next = { ...prev };
          for (const u of updates as {
            symbol: string;
            price: number;
            change: number;
          }[]) {
            const existing = next[u.symbol];
            const history = [...(existing?.history ?? []), u.price].slice(
              -MAX_HISTORY
            );
            next[u.symbol] = {
              symbol: u.symbol,
              price: u.price,
              change: u.change,
              history,
              flash: u.change > 0 ? "up" : u.change < 0 ? "down" : null,
            };
          }
          return next;
        });

        const biggest = [...updates].sort(
          (a: any, b: any) => Math.abs(b.change) - Math.abs(a.change)
        )[0];
        if (biggest) {
          const sign = biggest.change >= 0 ? "+" : "";
          setTape((prev) =>
            [
              `${biggest.symbol} ${biggest.price} (${sign}${biggest.change}%)`,
              ...prev,
            ].slice(0, 30)
          );
        }
      });

      es.onerror = () => {
        setStatus("error");
        es.close();
        retryTimer = setTimeout(connect, 2000);
      };
    }

    connect();
    return () => {
      esRef.current?.close();
      clearTimeout(retryTimer);
    };
  }, []);

  const list = Object.values(rows).sort((a, b) =>
    a.symbol.localeCompare(b.symbol)
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 24px 64px",
        maxWidth: 880,
        margin: "0 auto",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h1
          className="display"
          style={{ fontSize: 26, margin: 0, letterSpacing: -0.5 }}
        >
          Live Feed
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "var(--dim)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background:
                status === "live"
                  ? "var(--up)"
                  : status === "error"
                  ? "var(--down)"
                  : "var(--amber)",
              display: "inline-block",
              boxShadow:
                status === "live" ? "0 0 8px var(--up)" : "none",
            }}
          />
          {status === "live"
            ? "connected — updating every 1s"
            : status === "error"
            ? "reconnecting…"
            : "connecting…"}
        </div>
      </header>

      {/* Scrolling tape — the signature element: a running log of the
          largest mover each tick, like a real ticker tape. */}
      <div
        style={{
          border: "1px solid var(--line)",
          background: "var(--panel)",
          borderRadius: 6,
          padding: "8px 12px",
          fontSize: 12,
          color: "var(--dim)",
          marginBottom: 24,
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        {tape.length === 0 ? (
          <span>waiting for first tick…</span>
        ) : (
          <span>{tape.join("   ·   ")}</span>
        )}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", color: "var(--dim)", fontSize: 12 }}>
            <th style={{ fontWeight: 500, paddingBottom: 8 }}>Symbol</th>
            <th style={{ fontWeight: 500, paddingBottom: 8 }}>Price</th>
            <th style={{ fontWeight: 500, paddingBottom: 8 }}>Change</th>
            <th style={{ fontWeight: 500, paddingBottom: 8 }}>Trend</th>
          </tr>
        </thead>
        <tbody>
          {list.map((row) => (
            <tr
              key={row.symbol}
              style={{ borderTop: "1px solid var(--line)" }}
            >
              <td style={{ padding: "12px 0", fontWeight: 500 }}>
                {row.symbol}
              </td>
              <td style={{ padding: "12px 0" }}>{row.price.toLocaleString()}</td>
              <td
                style={{
                  padding: "12px 0",
                  color:
                    row.change > 0
                      ? "var(--up)"
                      : row.change < 0
                      ? "var(--down)"
                      : "var(--dim)",
                }}
              >
                {row.change > 0 ? "+" : ""}
                {row.change}%
              </td>
              <td style={{ padding: "12px 0" }}>
                <Sparkline history={row.history} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: 32, fontSize: 12, color: "var(--dim)" }}>
        Data is simulated in <code>app/api/stream/route.ts</code>. Swap the{" "}
        <code>nextTick()</code> function for your real source (database
        change feed, message queue, sensor, exchange API, etc).
      </p>
    </main>
  );
}
