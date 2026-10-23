import { useEffect, useState } from "react";
import { loadPortfolio, portfolioMetrics, dailyReturns } from "./portfolio";
import { fetchFng, fetchGlobal, fetchMarkets } from "./api";
import DeviationCard from "./components/DeviationCard";
import AssetCard from "./components/AssetCard";
import BalanceCard from "./components/BalanceCard";
import HealthCard from "./components/HealthCard";
import IncomeCard from "./components/IncomeCard";
import DailyCard from "./components/DailyCard";
import MoversCard from "./components/MoversCard";
import FngCard from "./components/FngCard";
import RaceCard from "./components/RaceCard";
import AllocationCard from "./components/AllocationCard";
import ScatterCard from "./components/ScatterCard";
import Skeleton from "./components/Skeleton";

const REFRESH_MS = 60_000;

export default function App() {
  const [data, setData] = useState(null);
  const [extra, setExtra] = useState(null);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  async function load() {
    try {
      setError(null);
      const p = await loadPortfolio();
      const [global, fng] = await Promise.all([fetchGlobal(), fetchFng()]);
      setData(p);
      setExtra({ global, fng });
      setUpdatedAt(new Date());
    } catch (e) {
      setError(e.message || "live feed unreachable");
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(async () => {
      try {
        const markets = await fetchMarkets();
        setData((d) => (d ? { ...d, markets } : d));
        setUpdatedAt(new Date());
      } catch {
        /* keep last data */
      }
    }, REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  if (error)
    return (
      <div className="card error-card" style={{ marginTop: 40 }}>
        <h3 style={{ color: "#ff8585" }}>🛑 Live feed unreachable</h3>
        <p className="sub">
          {error} — CoinGecko or your network is rate-limiting. Retrying in 60s…
        </p>
        <button className="select" onClick={load}>
          Retry now
        </button>
      </div>
    );

  if (!data)
    return (
      <div className="grid3" style={{ marginTop: 10 }}>
        <div><Skeleton /><br /><Skeleton /></div>
        <div><Skeleton /><br /><Skeleton /></div>
        <div><Skeleton /><br /><Skeleton /></div>
      </div>
    );

  const metrics = portfolioMetrics(data);
  const daily = dailyReturns(data, 40);

  return (
    <>
      <div className="hq-header">
        <h1>🏦 Portfolio HQ</h1>
        <span className="meta">
          simulated $25,915.75 basket · live prices ·{" "}
          <span className={updatedAt ? "live" : "live off"}>● LIVE</span>{" "}
          {updatedAt?.toLocaleTimeString?.()}
        </span>
      </div>
      <div className="grid3">
        <div>
          <DeviationCard portfolio={data} />
          <AssetCard portfolio={data} />
          <RaceCard portfolio={data} />
        </div>
        <div>
          <HealthCard metrics={metrics} />
          <IncomeCard metrics={metrics} />
          <BalanceCard portfolio={data} metrics={metrics} />
          <AllocationCard portfolio={data} metrics={metrics} />
        </div>
        <div>
          <DailyCard daily={daily} />
          <MoversCard portfolio={data} />
          <FngCard fng={extra?.fng} globalData={extra?.global?.data} />
          <ScatterCard portfolio={data} />
        </div>
      </div>
      <p className="sub" style={{ fontSize: "0.68rem", marginTop: 16 }}>
        🔴 auto-refresh 60s · hover &amp; click to inspect · Data: CoinGecko &amp; Alternative.me ·
        simulated basket, not financial advice
      </p>
    </>
  );
}
