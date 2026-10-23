import { useState } from "react";
import { PALETTE } from "./AllocationCard";

const W = 320;
const H = 210;
const TOP = 16;
const BOT = 18;

export default function RaceCard({ portfolio }) {
  const [hidden, setHidden] = useState(() => new Set());
  const lines = (portfolio.coinLines || []).filter((l) => l.pts.length > 5);
  if (!lines.length) return null;
  const symOf = (id) =>
    portfolio.markets?.find((m) => m.id === id)?.symbol?.toUpperCase() || id.slice(0, 3).toUpperCase();

  const visible = lines.filter((l) => !hidden.has(l.id));
  const vals = visible.flatMap((l) => l.pts.map((p) => p.norm));
  if (!vals.length) return <div className="sub">All coins hidden — tap a chip.</div>;
  const lo = Math.min(...vals, 100) - 2;
  const hi = Math.max(...vals, 100) + 4;

  const n = Math.max(...lines.map((l) => l.pts.length));
  const x = (i, len) => {
    const idx = len === n ? i : Math.round((i / (len - 1)) * (n - 1));
    return 4 + (idx / (n - 1)) * (W - 8);
  };
  const y = (v) => TOP + (1 - (v - lo) / (hi - lo)) * (H - TOP - BOT);

  const toggle = (id) =>
    setHidden((s) => {
      const s2 = new Set(s);
      if (s2.has(id)) s2.delete(id);
      else s2.add(id);
      return s2;
    });

  return (
    <div className="card">
      <div className="card-head">
        <h3>30D Basket Race</h3>
        <span className="sub" style={{ fontSize: "0.62rem" }}>normalized to 0</span>
      </div>
      <div className="legend" style={{ flexWrap: "wrap" }}>
        {lines.map((l, i) => (
          <button
            key={l.id}
            className="tab"
            style={{
              padding: "3px 9px",
              fontSize: "0.66rem",
              opacity: hidden.has(l.id) ? 0.4 : 1,
              boxShadow: hidden.has(l.id) ? "none" : "inset 0 0 0 1px #33343a",
            }}
            onClick={() => toggle(l.id)}
          >
            <span className="dot" style={{ background: PALETTE[i % PALETTE.length], marginRight: 5 }} />
            {symOf(l.id)}
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block", background: "#1a1b1e", borderRadius: 18 }}>
        <line x1="0" y1={y(100)} x2={W} y2={y(100)} stroke="#3a3a40" strokeDasharray="3 3" strokeWidth="1" />
        <text x="2" y={y(100) - 3} fontSize="8" fill="#5c6169">start = 100</text>
        {lines.map((l, i) =>
          hidden.has(l.id) ? null : (
            <path
              key={l.id}
              d={l.pts.map((p, j) => `${j ? "L" : "M"}${x(j, l.pts.length)},${y(p.norm)}`).join("")}
              fill="none"
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth="2"
              strokeLinecap="round"
            >
              <title>{`${symOf(l.id)} 30D: ${((l.pts[l.pts.length - 1].norm / l.pts[0].norm - 1) * 100).toFixed(1)}%`}</title>
            </path>
          )
        )}
        {lines.map((l, i) =>
          hidden.has(l.id) ? null : (
            <text
              key={l.id}
              x={W - 3}
              y={y(l.pts[l.pts.length - 1].norm) + 3}
              textAnchor="end"
              fontSize="9"
              fontWeight="700"
              fill={PALETTE[i % PALETTE.length]}
            >
              {((l.pts[l.pts.length - 1].norm / l.pts[0].norm - 1) * 100).toFixed(1)}%
            </text>
          )
        )}
        {[0, 0.5, 1].map((f) => {
          const day = lines[0].pts[Math.round(f * (n - 1))];
          return (
            <text key={f} x={4 + f * (W - 8)} y={H - 4} fontSize="9" fill="#6e737d" textAnchor={f === 0 ? "start" : f === 1 ? "end" : "middle"}>
              {new Date(day.day).toLocaleString("en", { month: "short", day: "numeric" })}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
