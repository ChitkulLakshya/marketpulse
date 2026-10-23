import { money, monthLabel, smoothPath } from "../format";

const W = 320;
const H = 180;

export default function IncomeChart({ monthData }) {
  const labels = monthData.map((m) => monthLabel(m.month));
  const net = monthData.map((m) => Math.max(0, m.pnl));
  const gross = monthData.map((m) => Math.abs(m.pnl));
  const downs = monthData.map((m) => Math.min(0, m.pnl));

  const groups = labels.length;
  const gw = (W - 8) / groups;
  const max = Math.max(...gross, ...net, ...downs.map(Math.abs), 1);
  const h = (v) => (v / max) * (H - 40);
  const bar = (i, off) => 6 + i * gw + off;
  const bw = Math.min(8, gw * 0.28);
  const base = H - 24;

  const netLine = smoothPath(
    net.map((v, i) => [bar(i, bw + gw * 0.09) , base - h(v)])
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
      <defs>
        <pattern
          id="hqHatch"
          width="5"
          height="5"
          patternTransform="rotate(45)"
          patternUnits="userSpaceOnUse"
        >
          <rect width="5" height="5" fill="#202024" />
          <line x1="0" y1="0" x2="0" y2="5" stroke="#8a8f99" strokeWidth="2.4" />
        </pattern>
        <clipPath id="hqRound">
          <rect width={W} height={H - 24} y="0" rx="0" />
        </clipPath>
      </defs>
      {labels.map((l, i) => (
        <g key={i}>
          <rect
            className="bar"
            x={bar(i, gw * 0.05)}
            y={base - h(gross[i])}
            width={bw}
            height={h(gross[i])}
            rx={bw / 2}
            fill="url(#hqHatch)"
          >
            <title>{`Gross: ${money(gross[i], 0)}`}</title>
          </rect>
          {net[i] > 0 ? (
            <rect
              className="bar"
              x={bar(i, gw * 0.09 + bw)}
              y={base - h(net[i])}
              width={bw}
              height={h(net[i])}
              rx={bw / 2}
              fill="#fcc419"
            >
              <title>{`Net: ${money(net[i], 0)}`}</title>
            </rect>
          ) : (
            <rect
              className="bar"
              x={bar(i, gw * 0.09 + bw)}
              y={base - h(Math.abs(downs[i]))}
              width={bw}
              height={h(Math.abs(downs[i]))}
              rx={bw / 2}
              fill="rgba(240,68,56,0.85)"
            >
              <title>{`Drawdown: ${money(Math.abs(downs[i]), 0)}`}</title>
            </rect>
          )}
          <text x={bar(i, gw * 0.06)} y={H - 6} textAnchor="middle" fontSize="9" fill="#8b93a7">
            {l}
          </text>
        </g>
      ))}
      <path d={netLine} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
    </svg>
  );
}
