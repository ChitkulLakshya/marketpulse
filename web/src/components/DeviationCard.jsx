import { useMemo, useState } from "react";
import AreaChart from "./AreaChart";
import { money } from "../format";

const PERIODS = { "1W": 7, "1M": 30, "3M": 90, "1Y": 365 };

export default function DeviationCard({ portfolio }) {
  const [period, setPeriod] = useState("1Y");
  const n = PERIODS[period];

  const sliced = useMemo(() => {
    const rows = portfolio.rows.slice(-n);
    const btc = portfolio.btcNorm?.slice(-n) || null;
    const first = rows[0].value;
    const last = rows[rows.length - 1].value;
    const portRet = ((last - first) / first) * 100;
    const btcRet = btc ? btc[btc.length - 1] - btc[0] : 0;
    return { rows, btc, dev: portRet - btcRet };
  }, [portfolio, n]);

  const dev = sliced.dev;
  const word = dev >= 0 ? "outperformed" : "underperformed";

  return (
    <div className="card">
      <div className="card-head">
        <h3>Performance Deviation</h3>
        <div className="tabs">
          {Object.keys(PERIODS).map((p) => (
            <button key={p} className={`tab ${period === p ? "on" : ""}`} onClick={() => setPeriod(p)}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="big" style={{ color: dev >= 0 ? "#3dd68c" : "#f2f2f2" }}>
        {dev >= 0 ? "+" : ""}
        {dev.toFixed(2)}%
        <span style={{ fontSize: "0.72rem", color: "#9aa0ae", fontWeight: 600, marginLeft: 8 }}>
          vs benchmark
        </span>
      </div>
      <p className="sub" style={{ marginTop: 6 }}>
        Portfolio <b>{word}</b> by <b>{Math.abs(dev).toFixed(2)}%</b> over the selected period
        (equal-weight 5-coin basket vs BTC).
      </p>
      <div className="legend" style={{ marginTop: 10 }}>
        <span>
          <span className="dot" style={{ background: "#fcc419" }} />
          Benchmark BTC
        </span>
        <span>
          <span className="dot" style={{ background: "#fff" }} />
          Portfolio
        </span>
      </div>
      <AreaChart portfolio={{ ...portfolio, rows: sliced.rows, btcNorm: sliced.btc }} period={period} />
    </div>
  );
}
