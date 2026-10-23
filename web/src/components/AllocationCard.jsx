import { useState } from "react";
import { money } from "../format";

export const PALETTE = ["#fcc419", "#3dd68c", "#5b8def", "#e57373", "#b78cf2", "#63d9d9"];

export default function AllocationCard({ portfolio, metrics }) {
  const [hover, setHover] = useState(null);
  const ids = portfolio.ids || [];
  const symOf = (id) =>
    portfolio.markets?.find((m) => m.id === id)?.symbol?.toUpperCase() || id.slice(0, 3).toUpperCase();

  const items = ids
    .map((id, i) => ({ id, sym: symOf(id), share: portfolio.weights?.[id] ?? 1 / ids.length, color: PALETTE[i % PALETTE.length] }))
    .sort((a, b) => b.share - a.share);
  const active = hover || items[0];

  let start = 0;
  const arcs = items.map((it) => {
    const seg = it.share * 100;
    const svg = { ...it, dashOffset: -start };
    start += seg;
    return svg;
  });

  return (
    <div className="card">
      <div className="card-head">
        <h3>Allocation</h3>
        <span className="icon-btn">🍩</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <svg viewBox="0 0 120 120" width="128" height="128" style={{ flexShrink: 0 }}>
          {arcs.map((it) => (
            <circle
              key={it.id}
              cx="60"
              cy="60"
              r="48"
              pathLength="100"
              fill="none"
              stroke={it.color}
              strokeWidth={hover === it.id ? 17 : 13}
              strokeDasharray={`${Math.max(0, it.share * 100 - 1.2)} ${100 - it.share * 100 + 1.2}`}
              strokeDashoffset={it.dashOffset}
              transform="rotate(-90 60 60)"
              opacity={hover && hover !== it.id ? 0.35 : 1}
              onMouseEnter={() => setHover(it.id)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer", transition: "stroke-width 0.15s, opacity 0.15s" }}
            >
              <title>{`${it.sym} · ${(it.share * 100).toFixed(1)}%`}</title>
            </circle>
          ))}
          <text x="60" y="55" textAnchor="middle" fontSize="13" fontWeight="800" fill="#f2f2f2">
            {active.sym}
          </text>
          <text x="60" y="70" textAnchor="middle" fontSize="11" fontWeight="700" fill={active.color}>
            {(active.share * 100).toFixed(1)}%
          </text>
        </svg>
        <div style={{ flex: 1 }}>
          {items.map((it) => (
            <div
              key={it.id}
              className="gauge-row"
              style={{ cursor: "pointer", opacity: hover && hover !== it.id ? 0.45 : 1, transition: "opacity 0.15s" }}
              onMouseEnter={() => setHover(it.id)}
              onMouseLeave={() => setHover(null)}
            >
              <span>
                <span className="dot" style={{ background: it.color, marginRight: 7 }} />
                {it.sym}
              </span>
              <span className="line" />
              <span style={{ fontWeight: 700 }}>{(it.share * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
      <p className="sub" style={{ marginTop: 8, fontSize: "0.74rem" }}>
        basket of <b>{ids.length} coins</b> · ${metrics.balance.toLocaleString("en-US", { maximumFractionDigits: 0 })} allocated ·
        weights drift with price ("live" equal-start)
      </p>
    </div>
  );
}
