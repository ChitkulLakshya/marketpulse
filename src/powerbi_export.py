import os
from datetime import datetime

import pandas as pd
import streamlit as st

EXPORT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "exports")

DIM_ASSET_COLS = [
    "id", "symbol", "name", "current_price", "market_cap", "market_cap_rank",
    "total_volume", "high_24h", "low_24h", "ath", "ath_date",
    "circulating_supply", "total_supply",
]

FACT_MARKET_COLS = [
    "id", "symbol", "current_price", "market_cap", "total_volume",
    "price_change_percentage_1h_in_currency", "price_change_percentage_24h",
    "price_change_percentage_24h_in_currency", "price_change_percentage_7d_in_currency",
    "price_change_percentage_30d_in_currency", "fetched_at",
]


def _ensure_dir():
    os.makedirs(EXPORT_DIR, exist_ok=True)


def write_dim_asset(markets: pd.DataFrame, vs: str = "usd"):
    _ensure_dir()
    cols = [c for c in DIM_ASSET_COLS if c in markets.columns]
    df = markets[cols].copy()
    if "ath_date" in df.columns:
        df["ath_date"] = pd.to_datetime(df["ath_date"], errors="coerce").dt.strftime("%Y-%m-%d %H:%M:%S")
    path = os.path.join(EXPORT_DIR, f"dim_asset_{vs}.csv")
    df.to_csv(path, index=False)
    return path


def write_fact_market(markets: pd.DataFrame, vs: str = "usd"):
    _ensure_dir()
    cols = [c for c in FACT_MARKET_COLS if c in markets.columns]
    df = markets[cols].copy()
    df["fetched_at"] = pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")
    path = os.path.join(EXPORT_DIR, f"fact_market_snapshot_{vs}.csv")
    df.to_csv(path, index=False)
    return path


def write_fact_prices(histories: dict[str, pd.DataFrame], vs: str = "usd"):
    _ensure_dir()
    frames = []
    for name, df in (histories or {}).items():
        if df is None or df.empty:
            continue
        h = df.copy()
        if "daily_return_pct" not in h.columns:
            h["daily_return_pct"] = h["price"].pct_change() * 100
        h["asset"] = name
        frames.append(h[["date", "asset", "price", "volume", "daily_return_pct"]])
    if not frames:
        return None
    out = pd.concat(frames, ignore_index=True).rename(
        columns={"date": "date_key", "asset": "asset_id"}
    )
    out["date_key"] = out["date_key"].astype(str)
    path = os.path.join(EXPORT_DIR, f"fact_price_history_{vs}.csv")
    out.to_csv(path, index=False)
    return path


def write_fact_global(global_df: pd.DataFrame, vs: str = "usd"):
    if global_df is None or global_df.empty:
        return None
    _ensure_dir()
    df = global_df.copy()
    df["timestamp"] = df["timestamp"].dt.strftime("%Y-%m-%d %H:%M:%S")
    path = os.path.join(EXPORT_DIR, f"fact_global_metrics_{vs}.csv")
    df.to_csv(path, index=False)
    return path


def staging_export(run_name: str, markets: pd.DataFrame, histories: dict, global_df: pd.DataFrame, vs: str = "usd") -> dict:
    _ensure_dir()
    paths = {}
    paths["dim"] = write_dim_asset(markets, vs)
    paths["fact_market"] = write_fact_market(markets, vs)
    paths["fact_prices"] = write_fact_prices(histories, vs)
    paths["fact_global"] = write_fact_global(global_df, vs)
    paths["manifest"] = os.path.join(EXPORT_DIR, f"manifest_{stamp}.txt")
    with open(paths["manifest"], "w", encoding="utf-8") as f:
        f.write(f"MarketPulse export\nrun: {run_name}\nvs_currency: {vs}\ngenerated: {stamp}\n")
    return paths


POWER_QUERY_SNIPPET = """let
    Source = Csv.Document(File.Contents("YOUR_PATH\\fact_price_history_usd.csv"), [Delimiter=",", Encoding=65001]),
    PromotedHeaders = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    Typed = Table.TransformColumnTypes(PromotedHeaders, {
        {"date_key", type date}, {"asset_id", type text},
        {"price", type number}, {"volume", type number},
        {"daily_return_pct", type number}
    })
in
    Typed"""
