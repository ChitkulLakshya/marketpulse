import Gauge from "./Gauge";

export default function HealthCard({ metrics }) {
  const { score, consistency, diversification, volAnn, riskScore } = metrics;
  const rows = [
    ["Risk Level", `${(volAnn * 100).toFixed(0)}% ann.`, riskScore],
    ["Return Consistency", `${(consistency * 100).toFixed(0)}% up-days`, consistency],
    ["Diversification", `HHI ${(1 - diversification).toFixed(2)}`, diversification],
  ];
  return (
    <div className="card">
      <div className="card-head">
        <h3>Portfolio Health</h3>
        <span className="icon-btn">↗</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div>
          <div className="big">{score}</div>
          <div className="sub" style={{ fontSize: "0.78rem" }}>of 100</div>
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <Gauge score={score} consistency={consistency} />
        </div>
      </div>
      {rows.map(([label, detail, frac]) => (
        <div className="gauge-row" key={label}>
          <span>{label}</span>
          <span className="line" />
          <span className="detail">{detail}</span>
          <span
            className="radio"
            style={{ borderColor: frac > 0.6 ? "#3dd68c" : frac > 0.35 ? "#fcc419" : "#f04438" }}
          />
        </div>
      ))}
    </div>
  );
}
