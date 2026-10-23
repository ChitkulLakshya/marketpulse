import { money } from "../format";

const ZONES = [
  { upTo: 25, color: "#f04438", label: "Extreme Fear" },
  { upTo: 45, color: "#f6803c", label: "Fear" },
  { upTo: 55, color: "#8a8f99", label: "Neutral" },
  { upTo: 75, color: "#a9d85c", label: "Greed" },
  { upTo: 100, color: "#3dd68c", label: "Extreme Greed" },
];

export default function FngCard({ fng, globalData }) {
  const v = Number(fng?.data?.[0]?.value ?? 50);
  const zone = ZONES.find((z) => v <= z.upTo) || ZONES[4];
  const angle = (v / 100) * 180 - 90;
  const tcap = globalData?.data?.total_market_cap?.usd ?? 0;
  const vol = globalData?.data?.total_volume?.usd ?? 0;
  const ethDom = globalData?.data?.market_cap_percentage?.eth ?? 0;
  const btcDom = globalData?.data?.market_cap_percentage?.btc ?? 0;
  const mcapChg = globalData?.data?.market_cap_change_percentage_24h_usd ?? 0;

  let segStart = -90;
  const segs = ZONES.map((z) => {
    const segEnd = (z.upTo / 100) * 180 - 90;
    const d = arcPath(segStart, segEnd, z.color);
    segStart = segEnd;
    return d;
  });

  return (
    <div className="card">
      <div className="card-head">
        <h3>Fear &amp; Greed</h3>
        <span className="icon-btn">🌡️</span>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg viewBox="0 0 200 108" width="215" style={{ animation: "pop 0.4s ease both" }}>
          {segs}
          <g transform={`rotate(${angle} 100 92)`}>
            <line x1="100" y1="92" x2="100" y2="30" stroke="#f2f2f2" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="100" cy="92" r="5" fill="#f2f2f2" />
          </g>
          <text x="16" y="104" fontSize="9" fill="#6e737d">0 fear</text>
          <text x="168" y="104" fontSize="9" fill="#6e737d">100 greed</text>
        </svg>
      </div>
      <div style={{ textAlign: "center" }}>
        <div className="big" style={{ color: zone.color }}>{v}</div>
        <span className={`badge ${zone.label.includes("Greed") ? "ok" : zone.label === "Neutral" ? "" : "bad"}`}>
          {zone.label}
        </span>
      </div>
      <div style={{ marginTop: 12 }}>
        {[
          ["Total Market Cap", `$${(tcap / 1e12).toFixed(2)}T`],
          ["MCap 24h", `${mcapChg >= 0 ? "+" : ""}${mcapChg.toFixed(2)}%`],
          ["24h Volume", `$${(vol / 1e9).toFixed(2)}B`],
          ["BTC Dominance", `${btcDom.toFixed(1)}%`],
          ["ETH Dominance", `${ethDom.toFixed(1)}%`],
        ].map(([k, val]) => (
          <div className="gauge-row" key={k}>
            <span>{k}</span>
            <span className="line" />
            <span style={{ fontWeight: 700 }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function arcPath(a0, a1, color) {
  const polar = (a) => {
    const rad = (a * Math.PI) / 180;
    return [100 + 74 * Math.cos(rad + Math.PI), 92 - 74 * Math.sin(rad)];
  };
  const [x0, y0] = polar(a0);
  const [x1, y1] = polar(a1);
  return (
    <path
      d={`M${x0},${y0} A74 74 0 0 1 ${x1},${y1}`}
      fill="none"
      stroke={color}
      strokeWidth="13"
    />
  );
}
