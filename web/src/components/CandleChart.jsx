import { useEffect, useState } from "react";
import { fetchOhlc } from "../api";
import { money } from "../format";

const W = 320;
const H = 220;
const RANGES = { "30D": "30", "3M": "90", "6M": "183", "1Y": "365" };

export default function CandleChart({ coinId }) {
  const [range, setRange] = useState("3M");
  const [data, setData] = useState([]);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    let alive = true;
    setData([]);
    fetchOhlc(coinId, RANGES[range])
      .then((json) => {
        if (!alive) return;
        const ohlc = (json || []).map(([ts, o, h, l, c]) => ({
          day: new Date(ts).toISOString().slice(0, 10),
          open: o,
          high: h,
          low: l,
          close: c,
        }));
        setData(dedupByDay(ohlc));
      })
      .catch(() => alive && setData([]));
    return () => {
      alive = false;
    };
  }, [coinId, range]);

  if (!data.length)
    return <div className="skeleton" style={{ height: 230, borderRadius: 18 }} />;

  const n = data.length;
  const step = W / n;
  const x = (i) => (i + 0.5) * step;
  const lo = Math.min(...data.map((c) => c.low));
  const hi = Math.max(...data.map((c) => c.high));
  const y = (v) => 12 + (1 - (v - lo) / (hi - lo || 1)) * (H - 44);
  const hiI = data.findIndex((c) => c.high === hi);
  const loI = data.findIndex((c) => c.low === lo);

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.min(n - 1, Math.max(0, Math.floor(px / step)));
    setHover(i);
  };

  const tipX = Math.min(Math.max(x(hover ?? 0), 48), W - 48);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
        <select className="select" value={range} onChange={(e) => setRange(e.target.value)}>
          {Object.keys(RANGES).map((r) => (
            <option key={r} value={r}>
              Technical · {r}
            </option>
          ))}
        </select>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", display: "block", background: "#1a1b1e", borderRadius: 18 }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <line
          x1="0"
          x2={W}
          y1={y((hi + lo) / 2)}
          y2={y((hi + lo) / 2)}
          stroke="#2c2c31"
          strokeDasharray="3 4"
        />
        {data.map((c, i) => {
          const up = c.close >= c.open;
          const col = up ? "#3dd68c" : "#f0524d";
          const bw = Math.max(1.6, step * 0.55);
          const yo = y(c.open);
          const yc = y(c.close);
          return (
            <g key={i}>
              <line x1={x(i)} x2={x(i)} y1={y(c.high)} y2={y(c.low)} stroke={col} strokeWidth="1.1" />
              <rect
                x={x(i) - bw / 2}
                y={Math.min(yo, yc)}
                width={bw}
                height={Math.max(1, Math.abs(yo - yc))}
                fill={col}
                rx="1"
              />
            </g>
          );
        })}
        <Bubble cx={x(hiI)} cy={y(hi)} label={money(hi, 2)} dir="up" />
        <Bubble cx={x(loI)} cy={y(lo)} label={money(lo, 2)} dir="down" />
        {[0, 2, 4, 6, 8, 10].map((m) => {
          const i = Math.round((m / 10) * (n - 1));
          if (i >= n) return null;
          return (
            <text
              key={m}
              x={Math.min(Math.max(x(i), 14), W - 16)}
              y={H - 5}
              textAnchor="middle"
              fontSize="9"
              fill="#6e737d"
            >
              {new Date(data[i].day).toLocaleString("en", { month: "short" })}
            </text>
          );
        })}
        {hover !== null && (
          <g>
            <line x1={tipX} x2={tipX} y1={40} y2={H - 20} stroke="#4a4a52" strokeWidth="0.8" />
            <rect x={tipX - 46} y={8} width="92" height="30" rx="6" fill="#0b0b0e" stroke="#2c2c31" />
            <text x={tipX} y={20} textAnchor="middle" fontSize="8" fill="#6e737d">
              {data[hover].day}
            </text>
            <text x={tipX} y={31} textAnchor="middle" fontSize="9" fontWeight="700" fill="#f2f2f2">
              {money(data[hover].close, 2)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

function Bubble({ cx, cy, label, dir }) {
  const clamped = Math.min(Math.max(cx, 32), W - 32);
  const boxY = dir === "up" ? cy + 14 : cy - 30;
  return (
    <g>
      <circle cx={clamped} cy={cy} r="3" fill="#c9cdd6" />
      <line
        x1={clamped}
        x2={clamped}
        y1={dir === "up" ? cy + 4 : cy - 4}
        y2={dir === "up" ? cy + 14 : cy - 14}
        stroke="#4a4a52"
        strokeWidth="1"
      />
      <rect x={clamped - 30} y={boxY} width="60" height="16" rx="8" fill="#f2f2f5" />
      <text x={clamped} y={boxY + 12} textAnchor="middle" fontSize="9" fontWeight="700" fill="#141416">
        {label}
      </text>
    </g>
  );
}

function dedupByDay(rows) {
  const seen = new Map();
  for (const r of rows) seen.set(r.day, r);
  return [...seen.values()];
}
