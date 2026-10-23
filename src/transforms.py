import pandas as pd
import numpy as np

HI_TREND_WINDOWS = (7, 30)


def add_indicators(df: pd.DataFrame, sma_windows=(7, 30)) -> pd.DataFrame:
    out = df.copy()
    for w in sma_windows:
        out[f"sma_{w}"] = out["price"].rolling(w, min_periods=1).mean()
    if len(out) >= 14:
        delta = out["price"].diff()
        gain = delta.clip(lower=0).rolling(14, min_periods=1).mean()
        loss = -delta.clip(upper=0).rolling(14, min_periods=1).mean()
        rs = gain / loss.replace(0, np.nan)
        out["rsi_14"] = (100 - 100 / (1 + rs)).fillna(50)
    else:
        out["rsi_14"] = np.nan
    out["vol_30d_pct"] = out["price"].pct_change().rolling(30, min_periods=2).std() * 100
    out["daily_return_pct"] = out["price"].pct_change() * 100
    roll_max = out["price"].cummax()
    out["drawdown_pct"] = (out["price"] / roll_max - 1) * 100
    return out


def normalize_to_100(group: pd.DataFrame) -> pd.Series:
    base = group.iloc[0]
    if base == 0 or pd.isna(base):
        return group * np.nan
    return group / base * 100


def build_normalized_history(histories: dict[str, pd.DataFrame]) -> pd.DataFrame:
    series = {}
    for name, df in histories.items():
        if df is not None and not df.empty:
            s = df.set_index("date")["price"]
            s = normalize_to_100(s.astype(float))
            series[name] = s
    if not series:
        return pd.DataFrame()
    out = pd.DataFrame(series)
    out.index.name = "date"
    return out.reset_index()


def correlation_matrix(histories: dict[str, pd.DataFrame]) -> pd.DataFrame:
    prices = {
        name: df.set_index("date")["price"].astype(float).pct_change()
        for name, df in histories.items()
        if df is not None and not df.empty
    }
    if not prices:
        return pd.DataFrame()
    return pd.DataFrame(prices).corr().round(3)


def risk_return_table(histories: dict[str, pd.DataFrame]) -> pd.DataFrame:
    rows = []
    for name, df in histories.items():
        if df is None or df.empty or len(df) < 3:
            continue
        s = df["price"].astype(float)
        rets = s.pct_change().dropna()
        total_ret = (s.iloc[-1] / s.iloc[0] - 1) * 100
        ann_vol = rets.std() * np.sqrt(365) * 100 if len(rets) > 1 else np.nan
        sharpe = total_ret / ann_vol if ann_vol and ann_vol > 0 else np.nan
        rows.append(
            {
                "asset": name,
                "latest_price": s.iloc[-1],
                "total_return_pct": round(total_ret, 2),
                "annualized_vol_pct": round(ann_vol, 2) if pd.notna(ann_vol) else None,
                "sharpe_raw": round(sharpe, 3) if pd.notna(sharpe) else None,
                "max_drawdown_pct": round((s / s.cummax() - 1).min() * 100, 2),
            }
        )
    return pd.DataFrame(rows)


def movers_table(markets: pd.DataFrame) -> dict[str, pd.DataFrame]:
    cols = ["name", "symbol", "current_price", "price_change_percentage_24h_in_currency"]
    gainer_col = "price_change_percentage_24h"
    if gainer_col not in markets.columns:
        gainer_col = cols[-1]
    base = markets[["name", "symbol", "current_price", gainer_col]].copy()
    base = base.rename(columns={gainer_col: "change_24h_pct"}).dropna()
    gainers = base.sort_values("change_24h_pct", ascending=False).head(10)
    losers = base.sort_values("change_24h_pct").head(10)
    return {"gainers": gainers.reset_index(drop=True), "losers": losers.reset_index(drop=True)}


def market_breadth(markets: pd.DataFrame) -> dict:
    col = "price_change_percentage_24h"
    if col not in markets.columns:
        col = "price_change_percentage_24h_in_currency"
    vals = markets[col].dropna()
    if vals.empty:
        return {"up": 0, "down": 0, "flat": 0, "breadth_pct": None}
    up = int((vals > 0).sum())
    down = int((vals < 0).sum())
    flat = int((vals == 0).sum())
    return {"up": up, "down": down, "flat": flat, "breadth_pct": round(up / len(vals) * 100, 1)}


def dominance_rows(markets: pd.DataFrame) -> pd.DataFrame:
    mc = markets[["name", "symbol", "market_cap"]].dropna().copy()
    total = mc["market_cap"].sum()
    if total <= 0:
        return pd.DataFrame()
    mc["share_pct"] = (mc["market_cap"] / total * 100).round(2)
    return mc.sort_values("market_cap", ascending=False).head(15).reset_index(drop=True)


def signal_table(histories: dict[str, pd.DataFrame]) -> pd.DataFrame:
    rows = []
    for name, df in histories.items():
        if df is None or df.empty:
            continue
        ind = add_indicators(df)
        last = ind.iloc[-1]
        price = last["price"]
        sma7 = last.get("sma_7", np.nan)
        sma30 = last.get("sma_30", np.nan)
        rsi = last.get("rsi_14", np.nan)
        if pd.notna(sma7) and pd.notna(sma30):
            trend = "BULLISH" if sma7 > sma30 else "BEARISH"
        else:
            trend = "N/A"
        if pd.notna(rsi):
            if rsi >= 70:
                rsi_label = "OVERBOUGHT"
            elif rsi <= 30:
                rsi_label = "OVERSOLD"
            else:
                rsi_label = "NEUTRAL"
        else:
            rsi_label = "N/A"
        rows.append(
            {
                "asset": name,
                "price": round(float(price), 4) if pd.notna(price) else None,
                "sma_7": round(float(sma7), 4) if pd.notna(sma7) else None,
                "sma_30": round(float(sma30), 4) if pd.notna(sma30) else None,
                "trend": trend,
                "rsi_14": round(float(rsi), 1) if pd.notna(rsi) else None,
                "rsi_state": rsi_label,
                "drawdown_pct": round(float(last.get("drawdown_pct", np.nan)), 2) if pd.notna(last.get("drawdown_pct", np.nan)) else None,
            }
        )
    return pd.DataFrame(rows)


def fmt_usd(x) -> str:
    if pd.isna(x):
        return "-"
    if abs(x) >= 1e12:
        return f"${x / 1e12:.2f}T"
    if abs(x) >= 1e9:
        return f"${x / 1e9:.2f}B"
    if abs(x) >= 1e6:
        return f"${x / 1e6:.2f}M"
    if abs(x) >= 1:
        return f"${x:,.2f}"
    return f"${x:,.6f}"


def fmt_pct(x) -> str:
    if x is None or pd.isna(x):
        return "-"
    sign = "+" if x > 0 else ""
    return f"{sign}{x:.2f}%"
