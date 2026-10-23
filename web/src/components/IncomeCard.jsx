import IncomeChart from "./IncomeChart";
import { money } from "../format";

export default function IncomeCard({ metrics }) {
  const monthData = metrics.monthData;
  const total = monthData.filter((m) => m.pnl > 0).reduce((a, m) => a + m.pnl, 0);
  const n = monthData.length;
  const last = monthData[n - 1];
  const pct = (last.pnl / metrics.balance) * 100;
  const gains = monthData.filter((m) => m.pnl > 0).reduce((a, m) => a + m.pnl, 0);
  const upDaysPnl = metrics.upDaysPnl ?? 0;
  const yieldEst = metrics.balance * 0.035;

  return (
    <div className="card">
      <div className="card-head">
        <h3>Portfolio Income</h3>
        <select className="select" disabled defaultValue="Monthly">
          <option>Monthly</option>
        </select>
      </div>
      <div className="xl">
        {money(total)}
        <span className={`chip ${pct >= 0 ? "green" : "red"}`}>
          {pct >= 0 ? "↗" : "↘"} {pct.toFixed(2)}%
        </span>
      </div>
      <p className="sub" style={{ marginTop: 4 }}>
        net monthly P&amp;L of the live basket · trailing year
      </p>
      <IncomeChart monthData={monthData} />
      <div className="summary">
        <div>
          <div className="k">Gross Gains</div>
          <div className="v">{money(upDaysPnl)}</div>
        </div>
        <div>
          <div className="k">Capital Gains</div>
          <div className="v">{money(gains)}</div>
        </div>
        <div>
          <div className="k">Forecast Yield*</div>
          <div className="v">{money(yieldEst)}</div>
        </div>
      </div>
      <div className="sub" style={{ fontSize: "0.66rem", marginTop: 4 }}>
        *simulated 3.5% APY on balance
      </div>
    </div>
  );
}
