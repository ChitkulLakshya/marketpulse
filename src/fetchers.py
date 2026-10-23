import os
import time
from typing import Optional

import pandas as pd
import requests
import streamlit as st

CG_PUBLIC = "https://api.coingecko.com/api/v3"
CG_PRO = "https://pro-api.coingecko.com/api/v3"
FNG_BASE = "https://api.alternative.me/fng"
USER_AGENT = {"User-Agent": "MarketPulse/1.0 (Streamlit Analytics Dashboard)"}


def demo_api_key() -> Optional[str]:
    try:
        if "coingecko_api_key" in st.secrets:
            return st.secrets["coingecko_api_key"]
    except Exception:
        pass
    return os.environ.get("COINGECKO_API_KEY")


def _get(url: str, params: Optional[dict] = None, retries: int = 3) -> Optional[dict]:
    params = dict(params or {})
    params = {k: v for k, v in params.items() if v is not None}
    key = demo_api_key()
    if key:
        if url.startswith(CG_PUBLIC):
            url = CG_PRO + url[len(CG_PUBLIC):]
        params["x_cg_demo_api_key"] = key
    delay = 1.5
    for attempt in range(retries):
        try:
            r = requests.get(url, params=params, headers=USER_AGENT, timeout=15)
            if r.status_code == 200:
                return r.json()
            if r.status_code == 429 or r.status_code in (500, 502, 503, 504):
                time.sleep(delay)
                delay *= 2
                continue
            break
        except requests.RequestException:
            time.sleep(delay)
            delay *= 2
    return None


@st.cache_data(ttl=60, show_spinner=False)
def fetch_global() -> Optional[dict]:
    return _get(f"{CG_PUBLIC}/global")


@st.cache_data(ttl=60, show_spinner=False)
def fetch_global_df() -> Optional[pd.DataFrame]:
    data = fetch_global()
    if not data:
        return None
    d = data.get("data", {})
    row = {
        "timestamp": pd.Timestamp.now(),
        "total_market_cap_usd": d.get("total_market_cap", {}).get("usd"),
        "total_volume_usd": d.get("total_volume", {}).get("usd"),
        "mcap_change_pct_24h": d.get("market_cap_change_percentage_24h_usd"),
        "btc_dominance": d.get("market_cap_percentage", {}).get("btc"),
        "eth_dominance": d.get("market_cap_percentage", {}).get("eth"),
        "active_cryptocurrencies": d.get("active_cryptocurrencies"),
        "markets": d.get("markets"),
    }
    return pd.DataFrame([row])


@st.cache_data(ttl=60, show_spinner=False)
def fetch_top_markets(
    vs_currency: str = "usd",
    per_page: int = 100,
    page: int = 1,
    sparkline: bool = True,
) -> Optional[pd.DataFrame]:
    params = {
        "vs_currency": vs_currency,
        "order": "market_cap_desc",
        "per_page": min(per_page, 250),
        "page": page,
        "sparkline": str(sparkline).lower(),
        "price_change_percentage": "1h,24h,7d,30d",
    }
    data = _get(f"{CG_PUBLIC}/coins/markets", params)
    if not data:
        return None
    df = pd.DataFrame(data)
    if df.empty:
        return None
    if "sparkline_in_7d" in df.columns:
        df["spark_7d"] = df["sparkline_in_7d"].apply(
            lambda s: s.get("price") if isinstance(s, dict) else []
        )
        df = df.drop(columns=["sparkline_in_7d"])
    df["fetched_at"] = pd.Timestamp.now()
    return df


@st.cache_data(ttl=120, show_spinner=False)
def fetch_coin_history(
    coin_id: str, vs_currency: str = "usd", days: str = "30"
) -> Optional[pd.DataFrame]:
    params = {"vs_currency": vs_currency, "days": days, "interval": "daily" if str(days).isdigit() and int(days) > 90 else None}
    params = {k: v for k, v in params.items() if v is not None}
    data = _get(f"{CG_PUBLIC}/coins/{coin_id}/market_chart", params)
    if not data:
        return None
    prices = data.get("prices", [])
    volumes = data.get("total_volumes", [])
    if not prices:
        return None
    prices_df = pd.DataFrame(prices, columns=["ts", "price"])
    volumes_df = pd.DataFrame(volumes, columns=["ts", "volume"])
    df = prices_df.merge(volumes_df, on="ts", how="left")
    df["dt"] = pd.to_datetime(df["ts"], unit="ms")
    df["date"] = df["dt"].dt.date
    df = df.drop(columns=["ts"]).drop_duplicates("date", keep="last")
    return df.reset_index(drop=True)


@st.cache_data(ttl=120, show_spinner=False)
def fetch_ohlc(
    coin_id: str, vs_currency: str = "usd", days: str = "30"
) -> Optional[pd.DataFrame]:
    data = _get(
        f"{CG_PUBLIC}/coins/{coin_id}/ohlc",
        {"vs_currency": vs_currency, "days": days},
    )
    if not data:
        return None
    df = pd.DataFrame(data, columns=["ts", "open", "high", "low", "close"])
    df["dt"] = pd.to_datetime(df["ts"], unit="ms")
    df["date"] = df["dt"].dt.date
    df = df.drop(columns=["ts"]).drop_duplicates("date", keep="last")
    return df.reset_index(drop=True)


@st.cache_data(ttl=300, show_spinner=False)
def fetch_fear_greed(limit: int = 30) -> Optional[pd.DataFrame]:
    data = _get(FNG_BASE, {"limit": limit})
    if not data:
        return None
    entries = data.get("data", [])
    if not entries:
        return None
    df = pd.DataFrame(entries)
    keep = [c for c in ["value", "value_classification", "timestamp"] if c in df.columns]
    df = df[keep]
    df["value"] = pd.to_numeric(df["value"], errors="coerce")
    df["dt"] = pd.to_datetime(pd.to_numeric(df["timestamp"], errors="coerce"), unit="s")
    return df.sort_values("dt").reset_index(drop=True)


@st.cache_data(ttl=3600, show_spinner=False)
def fetch_coin_list() -> Optional[pd.DataFrame]:
    data = _get(f"{CG_PUBLIC}/coins/list")
    if not data:
        return None
    df = pd.DataFrame(data)
    return df[df["symbol"].notna()].reset_index(drop=True)


def clear_cache():
    st.cache_data.clear()


def cache_stats() -> dict:
    try:
        return {
            "entries": int(getattr(st.cache_data, "_stats", lambda: {}).get("data_cache", 0) or 0),
            "cache_mgmt": st.cache_data.resource_metadata if hasattr(st.cache_data, "resource_metadata") else None,
        }
    except Exception:
        return {"entries": None, "cache_mgmt": None}


def api_health() -> dict:
    t0 = time.perf_counter()
    ok = _get(f"{CG_PUBLIC}/ping") is not None
    latency_ms = int((time.perf_counter() - t0) * 1000)
    fng_ok = _get(FNG_BASE, {"limit": 1}) is not None
    return {
        "coingecko": ok,
        "alternative_me": fng_ok,
        "latency_ms": latency_ms,
        "checked_at": pd.Timestamp.now(),
    }
