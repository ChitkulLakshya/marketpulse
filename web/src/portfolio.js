import { fetchHistory, fetchMarkets } from "./api";

export const WATCHLIST = ["bitcoin", "ethereum", "solana", "cardano", "xrp"];
export const BASE_BALANCE = 25915.75;

export function historyToSeries(json) {
  const prices = json?.prices || [];
  if (!prices.length) return null;
  const byDay = new Map();
  for (const [ts, price] of prices) {
    byDay.set(new Date(ts).toISOString().slice(0, 10), price);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([day, price]) => ({ day, price }));
}

export function buildPortfolio(histories) {
  const series = Object.entries(histories)
    .filter(([, s]) => s?.length > 2)
    .map(([id, s]) => {
      const base = s[0].price || 1;
      return [id, s.map((p) => ({ ...p, norm: (p.price / base) * 100 }))];
    });
  if (series.length < 2) return null;
  const dayMap = new Map();
  for (const [id, pts] of series) {
    for (const p of pts) {
      if (!dayMap.has(p.day)) dayMap.set(p.day, {});
      dayMap.get(p.day)[id] = p.norm;
    }
  }
  const ids = series.map(([id]) => id);
  const rows = [...dayMap.entries()]
    .filter(([, v]) => ids.every((id) => Number.isFinite(v[id])))
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([day, v]) => {
      const norm = ids.reduce((acc, id) => acc + v[id], 0) / ids.length;
      return { day, value: (norm / 100) * BASE_BALANCE };
    });
  if (rows.length < 10) return null;
  const value = rows.map((r) => r.value);
  const returns = value.map((v, i) =>
    i === 0 ? 0 : (v / value[i - 1] - 1)
  );
  const btc = series.find(([id]) => id === "bitcoin");
  const portRet = (value[value.length - 1] / value[0] - 1) * 100;
  const btcRet = btc ? btc[1][btc[1].length - 1].norm - 100 : 0;
  const deviation = portRet - btcRet;
  const btcNorm = btc ? btc[1].map((p) => p.norm) : null;
  const weights = Object.fromEntries(
    series.map(([id, pts]) => [id, pts[pts.length - 1].norm])
  );
  const totalW = Object.values(weights).reduce((a, v) => a + v, 0) || 1;
  for (const id of Object.keys(weights)) weights[id] /= totalW;
  const coinLines = series
    .map(([id, pts]) => ({ id, pts: pts.slice(-30) }))
    .slice(0, 6);
  return { ids, rows, value, returns, deviation, btcNorm, weights, coinLines };
}

export function portfolioMetrics(p) {
  const { value, returns } = p;
  const upDays = returns.slice(1);
  const consistency = upDays.filter((r) => r > 0).length / upDays.length;
  const diversification = 1 - 1 / p.ids.length;
  const mean = upDays.reduce((a, r) => a + r, 0) / upDays.length;
  const std = Math.sqrt(
    upDays.reduce((a, r) => a + (r - mean) ** 2, 0) / upDays.length
  );
  const volAnn = std * Math.sqrt(365);
  const riskScore = Math.max(0, Math.min(1, 1 - volAnn / 0.9));
  const score = Math.round(
    100 * (0.35 * consistency + 0.35 * diversification + 0.3 * riskScore)
  );
  const monthly = new Map();
  value.forEach((v, i) => {
    const m = p.rows[i].day.slice(0, 7);
    if (!monthly.has(m)) monthly.set(m, [v, v]);
    else monthly.get(m)[1] = v;
  });
  const monthKeys = [...monthly.keys()].slice(-12);
  const monthData = monthKeys.map((m) => ({
    month: m,
    pnl: monthly.get(m)[1] - monthly.get(m)[0],
  }));
  let upDaysPnl = 0;
  returns.forEach((r, i) => {
    if (r > 0 && i > 0) upDaysPnl += r * value[i - 1];
  });
  return {
    score,
    consistency,
    diversification,
    volAnn,
    riskScore,
    monthData,
    upDaysPnl,
    balance: value[value.length - 1],
    ret30: value[value.length - 1] / value[value.length - 31] - 1,
  };
}

export function dailyReturns(p, lastN = 31) {
  const rows = p.rows.slice(-lastN).map((r, i, arr) => ({
    day: r.day,
    ret: i === 0 ? 0 : r.value / arr[i - 1].value - 1,
    pnl: i === 0 ? 0 : r.value - arr[i - 1].value,
  }));
  return rows;
}

export async function loadPortfolio() {
  const markets = await fetchMarkets();
  const list = WATCHLIST.filter((id) => markets.some((m) => m.id === id));
  const entries = [];
  const stagger = (ms) => new Promise((r) => setTimeout(r, ms));
  for (const id of list) {
    try {
      entries.push([id, historyToSeries(await fetchHistory(id, 365))]);
    } catch {
      entries.push([id, null]);
    }
    await stagger(250);
  }
  const histories = Object.fromEntries(entries.filter(([, s]) => s));
  const portfolio = buildPortfolio(histories);
  if (!portfolio) throw new Error("CoinGecko returned too little history — try again in a minute");
  portfolio.markets = markets;
  return portfolio;
}
