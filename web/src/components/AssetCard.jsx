import { useMemo, useState } from "react";
import CandleChart from "./CandleChart";
import { money } from "../format";

export default function AssetCard({ portfolio }) {
  const markets = portfolio.markets || [];
  const top = useMemo(() => markets.slice(0, 60), [markets]);
  const [coinId, setCoinId] = useState("bitcoin");
  const coin = top.find((c) => c.id === coinId) || top[0];

  if (!coin) return <div className="card"><h3>Asset Performance</h3><div className="skeleton" style={{ height: 220 }} /></div>;

  const chg = coin.price_change_percentage_24h || 0;
  const d30 = coin.price_change_percentage_30d_in_currency || 0;
  const d7 = coin.price_change_percentage_7d_in_currency || 0;
  const turnover = coin.market_cap ? coin.total_volume / coin.market_cap : 0;
  const badge1 = turnover > 0.08 ? "High Activity" : "Moderate Flow";
  const badge2 = Math.abs(d7) < 6 ? "Stable Performer" : "Volatile Mover";
  const verb = d30 < 0 ? "softening" : "firming";
  const wave = Math.abs(d30) < 5 ? "consolidation" : d30 > 0 ? "a broad risk-on bid" : "distribution";

  return (
    <div className="card">
      <div className="card-head">
        <h3>Asset Performance</h3>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <select className="select" value={coinId} onChange={(e) => setCoinId(e.target.value)} style={{ flex: 1 }}>
          {top.map((c) => (
            <option key={c.id} value={c.id}>
              {c.symbol.toUpperCase()} · {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="coin-row">
        <img src={coin.image} alt={coin.symbol} />
        <div>
          <div className="coin-sym">{coin.symbol.toUpperCase()}</div>
          <div className="coin-price">
            {money(coin.current_price, coin.current_price < 10 ? 4 : 2)}
            <span className={chg >= 0 ? "up" : "down"}>
              {chg >= 0 ? "" : ""}
              {chg.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <span className="badge">⚡ {badge1}</span>
        <span className={`badge ${badge2 === "Stable Performer" ? "ok" : "bad"}`}>{badge2}</span>
      </div>
      <p className="sub" style={{ marginTop: 0 }}>
        {coin.symbol.toUpperCase()} price is <b>{verb} over the last 30 days ({d30 > 0 ? "+" : ""}{d30.toFixed(1)}%)</b>{" "}
        amid {wave}, with volume turnover <b>{turnover > 0.08 ? "elevated" : "orderly"}</b>.
      </p>
      <CandleChart coinId={coinId} />
    </div>
  );
}
