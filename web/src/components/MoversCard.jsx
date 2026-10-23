import { useMemo, useState } from "react";
import { money } from "../format";

const WINDOWS = [
  ["1h", "price_change_percentage_1h_in_currency", "1H"],
  ["24h", "price_change_percentage_24h", "24H"],
  ["7d", "price_change_percentage_7d_in_currency", "7D"],
  ["30d", "price_change_percentage_30d_in_currency", "30D"],
];

export default function MoversCard({ portfolio }) {
  const markets = portfolio.markets || [];
  const [win, setWin] = useState("24h");
  const key = (WINDOWS.find(([w]) => w === win) || WINDOWS[1])[1];

  const rows = useMemo(() => {
    return [...markets]
      .slice(0, 40)
      .sort((a, b) => (b[key] || 0) - (a[key] || 0))
      .slice(0, 9);
  }, [markets, key]);

  return (
    <div className="card">
      <div className="card-head">
        <h3>🚀 Top Movers</h3>
        <div className="tabs">
          {WINDOWS.map(([w, , label]) => (
            <button key={w} className={`tab ${win === w ? "on" : ""}`} onClick={() => setWin(w)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {rows.map((c) => (
        <div className="mover" key={c.id} title={`Mcap $${money(c.market_cap, 0)}`}>
          <img src={c.image} alt={c.symbol} />
          <span className="sym">{c.symbol.toUpperCase()}</span>
          <span className="nm">{c.name}</span>
          <span
            className={(c[key] || 0) >= 0 ? "up" : "down"}
            style={{ fontSize: "0.72rem", width: 58, textAlign: "right" }}
          >
            {(c[key] || 0).toFixed(2)}%
          </span>
        </div>
      ))}
      {rows.length === 0 && <div className="skeleton" style={{ height: 180 }} />}
    </div>
  );
}
