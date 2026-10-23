# MarketPulse — Live Crypto Portfolio Intelligence

> A production-quality, **live-data** crypto portfolio dashboard. Zero chart libraries — every visualization is hand-rolled SVG. Built for the resume.

**Dashboard:** React 18 + Vite · **Data layer:** Python (Power BI bridge) · **Deploy:** Vercel-ready

> For education & portfolio demonstration only — not financial advice.

---

## ✨ What it does

An 11-card dark fintech dashboard ("Portfolio HQ") driven entirely by live APIs — nothing is mocked:

| Card | Visualization | Interaction |
|---|---|---|
| Performance Deviation | portfolio vs BTC benchmark area chart + deviation callout | 1W / 1M / 3M / 1Y tabs |
| Asset Performance | candlestick chart with high/low price bubbles | coin picker, 30D→1Y ranges, hover crosshair |
| 30D Basket Race | 5 coins normalized, multi-line race | click chips to hide/show coins |
| Portfolio Health | dual-arc gauge (score + consistency) | — |
| Portfolio Income | hatched gross bars + yellow net bars, red drawdowns | hover tooltips |
| Balance | headline USD value + VISA strip | — |
| Allocation | interactive donut with drifting weights | hover slices/legend rows |
| Daily Performance | calendar heatmap of session P&L | click a day to inspect |
| Top Movers | hottest coins list | 1H / 24H / 7D / 30D tabs |
| Fear & Greed | needle gauge with market-cap stats | — |
| Risk-Return Map | momentum × trend bubble scatter | hover for exact figures |

**Live data:** CoinGecko (prices, OHLC, market cap, global stats) + Alternative.me Fear & Greed. 3-attempt retry with exponential backoff on 429/5xx. Auto-refresh every 60s. Optional CoinGecko demo key via `VITE_COINGECKO_API_KEY` (auto-switches to pro-api).

**Portfolio:** simulated $25,915.75 equal-weight basket (BTC, ETH, SOL, ADA, XRP) valued with live prices.

---

## 🚀 Quick start

```bash
cd web
npm install     # once
npm run dev     # http://localhost:5173
```

Or run the production build locally: `npm run build && npm run preview`.

## ▲ Deploy to Vercel

1. `vercel` (or Import the repo in the Vercel dashboard).
2. Set **Root Directory** = `web` — framework auto-detects as **Vite**.
3. Build Command `npm run build`, Output `dist` (Vercel fills these in automatically).

## 🐍 Python data layer + Power BI bridge

`src/` is a standalone data pipeline (same data sources, with retry/backoff):

```
python -m src.powerbi_export        # writes star-schema CSVs to data/exports/
```
- `src/fetchers.py` — CoinGecko client, timezone-safe joins
- `src/transforms.py` — indicators, risk/return, correlation, signals
- `src/powerbi_export.py` — fact/dimension tables + Power Query snippet for direct import into Power BI
- `tests/test_core.py` — pytest suite

```bash
pip install -r requirements.txt
pytest tests/
```

## 🗂 Structure

```
web/                  React 18 + Vite dashboard (this is what Vercel deploys)
  src/api.js          API client w/ retry + optional demo key
  src/portfolio.js    basket math, metrics, daily returns
  src/components/     11 SVG-native cards
src/                 Python data layer + Power BI export
tests/               pytest suite
data/exports/        CSV output (gitignored)
```
