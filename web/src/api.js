const CG_PUBLIC = "https://api.coingecko.com/api/v3";
const CG_PRO = "https://pro-api.coingecko.com/api/v3";
const FNG = "https://api.alternative.me/fng/";
const KEY = import.meta.env.VITE_COINGECKO_API_KEY || "";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url, params = {}, retries = 3) {
  const q = new URLSearchParams({ ...params });
  if (KEY) {
    if (url.startsWith(CG_PUBLIC)) url = CG_PRO + url.slice(CG_PUBLIC.length);
    q.set("x_cg_demo_api_key", KEY);
  }
  let delay = 1500;
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(`${url}?${q}`);
      if (r.ok) return await r.json();
      if (r.status === 429 || r.status >= 500) {
        await sleep(delay);
        delay *= 2;
        continue;
      }
      break;
    } catch {
      await sleep(delay);
      delay *= 2;
    }
  }
  throw new Error(`fetch failed: ${url}`);
}

export const fetchMarkets = () =>
  getJSON(`${CG_PUBLIC}/coins/markets`, {
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: 100,
    page: 1,
    sparkline: false,
    price_change_percentage: "1h,24h,7d,30d",
  });

export const fetchGlobal = () =>
  getJSON(`${CG_PUBLIC}/global`).catch(() => null);

export const fetchFng = () =>
  getJSON(FNG, { limit: 1 }).catch(() => null);

export const fetchHistory = (id, days = 365) =>
  getJSON(`${CG_PUBLIC}/coins/${id}/market_chart`, { vs_currency: "usd", days });

export const fetchOhlc = (id, days = 90) =>
  getJSON(`${CG_PUBLIC}/coins/${id}/ohlc`, { vs_currency: "usd", days });
