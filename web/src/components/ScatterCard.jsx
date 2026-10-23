import { PALETTE } from "./AllocationCard";

const W = 320;
const H = 235;
const PAD = { l: 2, r: 2, t: 12, b: 18 };

export default function ScatterCard({ portfolio }) {
  const ids = portfolio.ids || [];
  const markets = (portfolio.markets || []).filter((m) => ids.includes(m.id));
  if (!markets.length) return null;

  const symOf = (m) => m.symbol?.toUpperCase() || m.id.slice(0, 3).toUpperCase();
  const pts = markets.map((m, i) => ({
    m,
    x: m.price_change_percentage_7d_in_currency || 0,
    y: m.price_change_percentage_30d_in_currency || (m.price_change_percentage_24h || 0) * 4,
    r: 0,
    color: (m.price_change_percentage_30d_in_currency || 0) >= 0 ? "#3dd68c" : "#f0524d",
    accent: PALETTE[i % PALETTE.length],
  }));
  const maxCap = Math.max(...pts.map((p) => p.m.market_cap || 1), 1);
  pts.forEach((p) => {
    p.r = 4.5 + 9 * Math.sqrt((p.m.market_cap || 1) / maxCap);
  });

  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const xAmp = Math.max(...xs.map(Math.abs), 5) * 1.25;
  const yAmp = Math.max(...ys.map(Math.abs), 20) * 1.15;
  const x = (v) => PAD.l + ((v + xAmp) / (2 * xAmp)) * (W - PAD.l - PAD.r) + 26;
  const y = (v) => PAD.t + ((yAmp - v) / (2 * yAmp)) * (H - PAD.t - PAD.b);

  return (
    <div className="card">
      <div className="card-head">
        <h3>Risk-Return Map</h3>
        <span className="icon-btn">🎯</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", display: "block", background: "#1a1b1e", borderRadius: 18 }}
      >
        <line x1={PAD.l + 26} y1={y(0)} x2={W - PAD.r} y2={y(0)} stroke="#3a3a40" strokeWidth="1" />
        <line
          x1={x(0)}
          y1={PAD.t}
          x2={x(0)}
          y2={H - PAD.b}
          stroke="#3a3a40"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        <text x={W - PAD.r - 4} y={y(0) - 4} textAnchor="end" fontSize="8" fill="#6e737d">
          no 30D trend →
        </text>
        {pts.map((p) => (
          <g key={p.m.id}>
            <circle
              cx={x(p.x)}
              cy={y(p.y)}
              r={p.r}
              fill={p.color}
              opacity="0.85"
              stroke={p.accent}
              strokeWidth="1.6"
              style={{ cursor: "pointer", transition: "r 0.2s" }}
            >
              <title>{`${symOf(p.m)} · 7D ${p.x.toFixed(1)}% · 30D ${p.y.toFixed(1)}% · Mcap $${(p.m.market_cap / 1e9).toFixed(1)}B`}</title>
            </circle>
            <text
              x={x(p.x)}
              y={y(p.y) + p.r + 11}
              textAnchor="middle"
              fontSize="9"
              fontWeight="700"
              fill="#c9ceda"
            >
              {symOf(p.m)}
            </text>
          </g>
        ))}
        <text x="6" y={12} fontSize="8" fill="#6e737d">↑30D change</text>
        <text x={W - PAD.r - 2} y={H - 5} textAnchor="end" fontSize="8" fill="#6e737d">
          ← weakness | 7D momentum | strength →
        </text>
      </svg>
      <p className="sub" style={{ marginTop: 6, fontSize: "0.74rem" }}>
        dot size = market cap · top-right{" "}
        <b style={{ color: "#5fe3a3" }}>strong &amp; accelerating</b>, bottom-right{" "}
        <b>strong but fading</b>, top-left <b style={{ color: "#ff8585" }}>weak but rebounding</b>
      </p>
    </div>
  );
}
