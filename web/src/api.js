const CG_PUBLIC = "https://api.coingecko.com/api/v3";
const CG_PRO = "https://pro-api.coingecko.com/api/v3";
const FNG = "https://api.alternative.me";
const KEY = import.meta.env.VITE_COINGECKO_API_KEY || "";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildUrl(base, path, params) {
  const q = new URLSearchParams(params);
  if (base === CG_PUBLIC && KEY) q.set("x_cg_demo_api_key", KEY);
  const s = q.toString();
  return base.replace(/\/$/, "") + path + (s ? `?${s}` : "");
}

async function tryFetch(url) {
  const r = await fetch(url);
  if (!r.ok) {
    const e = new Error(`HTTP ${r.status}`);
    e.status = r.status;
    throw e;
  }
  return r.json();
}

async function attemptWithRetry(url, retries) {
  let delay = 1200;
  const errs = [];
  for (let i = 0; i < retries; i++) {
    try {
      return await tryFetch(url);
    } catch (e) {
      errs.push(e.message || "fetch failed");
      if (e.status && e.status >= 400 && e.status < 500 && e.status !== 429) break;
      await sleep(delay);
      delay *= 2;
    }
  }
  throw Object.assign(new Error(errs.join(" | ")), { errList: errs });
}

function humanError(errList) {
  if (errList.some((m) => m.includes("HTTP 429")))
    return "CoinGecko is rate-limiting this request (HTTP 429). The app will auto-retry — free tier allows a few calls per minute.";
  if (errList.some((m) => !m.startsWith("HTTP")))
    return "Requests to api.coingecko.com are being blocked (often an ad-blocker, VPN or DNS filter). A server-side proxy was also tried.";
  return `Upstream error: ${errList[errList.length - 1]}`;
}

export async function getJSON(path, params = {}, opts = {}) {
  const { direct = CG_PUBLIC, proxy = "/api/gecko", retries = 3 } = opts;
  const qs = (() => {
    const s = new URLSearchParams(params).toString();
    return s ? `?${s}` : "";
  })();
  const attempts = [];
  if (direct) attempts.push(buildUrl(direct, path, params));
  if (proxy) attempts.push(proxy + path + qs);

  const errList = [];
  for (const url of attempts) {
    try {
      return await attemptWithRetry(url, retries);
    } catch (e) {
      errList.push(...(e.errList || [e.message]));
    }
  }
  throw new Error(humanError(errList));
}

export const fetchMarkets = () =>
  getJSON("/coins/markets", {
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: 100,
    page: 1,
    sparkline: false,
    price_change_percentage: "1h,24h,7d,30d",
  });

export const fetchGlobal = () => getJSON("/global", {}).catch(() => null);

export const fetchFng = () =>
  getJSON("/fng/", { limit: 1 }, { direct: FNG, proxy: "/api/fng" }).catch(() => null);

export const fetchHistory = (id, days = 365) =>
  getJSON(`/coins/${id}/market_chart`, { vs_currency: "usd", days });

export const fetchOhlc = (id, days = 90) =>
  getJSON(`/coins/${id}/ohlc`, { vs_currency: "usd", days });
