// temp smoke test: stubs the api import, exercises portfolio math with synthetic data
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/portfolio.js", import.meta.url), "utf8");
const patched = src
  .replace(/^export const WATCHLIST = .*$/m, `export const WATCHLIST = ["aaa","bbb"];`)
  .replace(/^export const BASE_BALANCE = .*$/m, `export const BASE_BALANCE = 1000;`)
  .replace(/^import .*from "\.\/api";$/m, "");

const mod = await import(
  "data:text/javascript;base64," + Buffer.from(patched).toString("base64")
);

const mkHist = (prices) => prices.map((p, i) => [Date.now() + i * 86400000, p]);
const ramp = (start, step, n) => Array.from({ length: n }, (_, i) => start + step * i);
const btc = mkHist(ramp(100, 0, 12));
const aaa = mkHist(ramp(50, 1, 12));
const bbb = mkHist(ramp(10, 0.25, 12));

const raw = { bitcoin: btc, aaa, bbb };
const built = mod.buildPortfolio(
  Object.fromEntries(Object.entries(raw).map(([id, h]) => [id, mod.historyToSeries({ prices: h })]))
);
console.log("rows     =", built.rows.length, "| btcNorm =", built.btcNorm?.length);
const val = built.value.map((v) => v.toFixed(2)).join(" → ");
console.log("value    =", val, "(expect 1000 → 1130.00)");
console.log("deviation=", built.deviation.toFixed(2), "(expect ~6.00: port +6% minus btc 0%)");

const metrics = mod.portfolioMetrics(built);
console.log("balance  =", metrics.balance.toFixed(2), "(expect 1130.00)");
console.log("months   =", metrics.monthData.length);
console.log("upDaysPnl=", metrics.upDaysPnl.toFixed(2));
console.log("score    =", metrics.score.toFixed(1), "consistent =", metrics.consistency.toFixed(2));
console.log("ret30    =", (metrics.ret30 * 100).toFixed(2));

const d = mod.dailyReturns(built, 40);
console.log("daily    =", d.length, "rows | rets:", d.map((x) => (x.ret * 100).toFixed(2)).join(","));
console.log("OK");
