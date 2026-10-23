import { smoothPath } from "../format";

const W = 320;
const H = 190;
const PAD = { l: 4, r: 4, t: 14, b: 18 };

export default function AreaChart({ portfolio }) {
  const { rows } = portfolio;
  const btc = portfolio.btcNorm || null;
  const base = rows[0].value;
  const idx = rows.map((r) => (r.value / base) * 100);

  const n = idx.length;
  if (n < 2) return <div className="skeleton" style={{ height: 190, borderRadius: 18 }} />;
  const x = (i) => PAD.l + (i / (n - 1)) * (W - PAD.l - PAD.r);
  const all = btc ? [...idx, ...btc] : idx;
  const lo = Math.min(...all) - 6;
  const hi = Math.max(...all) + 8;
  const y = (v) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);

  const pts = idx.map((v, i) => [x(i), y(v)]);
  const bpts = btc ? btc.map((v, i) => [x(i), y(v)]) : null;

  let peakI = 0;
  if (bpts) {
    peakI = pts.reduce(
      (best, p, i) =>
        Math.abs(p[1] - bpts[Math.min(i, bpts.length - 1)][1]) >
        Math.abs(pts[best][1] - bpts[Math.min(best, bpts.length - 1)][1])
          ? i
          : best,
      0
    );
  }

  const area = `${smoothPath(pts)} L${x(n - 1)},${H - PAD.b} L${x(0)},${H - PAD.b} Z`;
  const bAtPeak = bpts ? bpts[Math.min(peakI, bpts.length - 1)][1] : null;

  const step = Math.max(1, Math.floor(n / 6));
  const ticks = [];
  for (let i = n - 1; i >= 0; i -= Math.max(step, Math.round(n / 10))) ticks.push(i);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", display: "block", background: "#1a1b1e", borderRadius: 18 }}
    >
      <defs>
        <linearGradient id="hqDev" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(240,68,56,0.55)" />
          <stop offset="100%" stopColor="rgba(240,68,56,0.28)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#hqDev)" />
      {bpts && (
        <path
          d={smoothPath(bpts)}
          fill="none"
          stroke="#fcc419"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
      <path d={smoothPath(pts)} fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
      {bAtPeak !== null && (
        <g>
          <line
            x1={pts[peakI][0]}
            y1={pts[peakI][1]}
            x2={pts[peakI][0]}
            y2={bAtPeak}
            stroke="#5c6169"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <rect
            x={Math.min(Math.max(pts[peakI][0] - 34, 2), W - 70)}
            y={(pts[peakI][1] + bAtPeak) / 2 - 10}
            width="68"
            height="20"
            rx="6"
            fill="#0b0b0e"
            stroke="#2c2c31"
          />
          <text
            x={Math.min(Math.max(pts[peakI][0], 36), W - 36)}
            y={(pts[peakI][1] + bAtPeak) / 2 + 4}
            textAnchor="middle"
            fontSize="10"
            fill="#f2f2f2"
          >
            {(idx[peakI] - 100 - (btc[Math.min(peakI, btc.length - 1)] - 100)).toFixed(1)}%
          </text>
        </g>
      )}
      {ticks.toSorted((a, b) => a - b).map((i) => (
        <text
          key={i}
          x={Math.min(Math.max(x(i), 16), W - 22)}
          y={H - 4}
          textAnchor="middle"
          fontSize="9"
          fill="#6e737d"
        >
          {new Date(rows[i].day).toLocaleString("en", { month: "short" })}
          {n > 40 ? ` ${rows[i].day.slice(8)}` : ""}
        </text>
      ))}
    </svg>
  );
}
