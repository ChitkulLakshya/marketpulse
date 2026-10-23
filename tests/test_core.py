import numpy as np
import pandas as pd

from src.transforms import (
    add_indicators, build_normalized_history, correlation_matrix,
    risk_return_table, movers_table, market_breadth, dominance_rows,
    signal_table, fmt_usd, fmt_pct,
)
from src.powerbi_export import write_dim_asset, write_fact_prices, write_fact_market


def make_hist(n=40, start=100, drift=0.01, seed=1):
    rng = np.random.default_rng(seed)
    rets = rng.normal(drift, 0.03, n)
    prices = start * np.cumprod(1 + rets)
    dates = pd.date_range("2025-01-01", periods=n, freq="D").date
    return pd.DataFrame({"date": dates, "price": prices, "volume": np.abs(rng.normal(1e6, 1e4, n))})


def test_add_indicators_keys():
    df = make_hist()
    out = add_indicators(df)
    for col in ["sma_7", "sma_30", "rsi_14", "vol_30d_pct", "daily_return_pct", "drawdown_pct"]:
        assert col in out.columns
    assert (out["drawdown_pct"] <= 0).all()


def test_corr_matrix_bounds():
    h = {"a": make_hist(6, seed=1), "b": make_hist(6, seed=2)}
    corr = correlation_matrix(h)
    assert corr.shape == (2, 2)
    assert (corr.abs() <= 1).all().all()
    assert not corr.isna().any().any()


def test_risk_return():
    h = {"a": make_hist()}
    rr = risk_return_table(h)
    assert rr.iloc[0]["asset"] == "a"
    assert "annualized_vol_pct" in rr.columns


def test_breadth_and_dominance():
    mk = pd.DataFrame({
        "name": ["A", "B", "C", "D"], "symbol": ["a", "b", "c", "d"],
        "current_price": [1, 1, 1, 1], "market_cap": [10, 5, 3, 2],
        "price_change_percentage_24h": [1, -1, 0, 2],
    })
    b = market_breadth(mk)
    assert b["up"] == 2 and b["down"] == 1 and b["flat"] == 1
    dom = dominance_rows(mk)
    assert dom.iloc[0]["symbol"] == "a"
    assert dom.iloc[0]["share_pct"] == 50.0


def test_movers():
    mk = pd.DataFrame({
        "name": ["A", "B", "C", "D"], "symbol": ["a", "b", "c", "d"],
        "current_price": [1, 1, 1, 1],
        "price_change_percentage_24h": [-5, 3, 2, -1],
    })
    m = movers_table(mk)
    assert m["gainers"].iloc[0]["symbol"] == "b"
    assert m["losers"].iloc[0]["symbol"] == "a"


def test_signals():
    h = {"a": make_hist(200, drift=0.005), "b": make_hist(200, drift=-0.005, seed=7)}
    sig = signal_table(h)
    assert set(sig["trend"]).issubset({"BULLISH", "BEARISH", "N/A"})


def test_fmt():
    assert fmt_usd(1.2e9).endswith("B")
    assert fmt_pct(2).startswith("+")
    assert fmt_pct(-2).startswith("-")


def test_powerbi_export(tmp_path, monkeypatch):
    import src.powerbi_export as pbe
    monkeypatch.setattr(pbe, "EXPORT_DIR", tmp_path)
    mk = pd.DataFrame({
        "id": ["x"], "symbol": ["X"], "name": ["X"], "current_price": [1],
        "market_cap": [10], "market_cap_rank": [1], "total_volume": [5],
        "high_24h": [1.2], "low_24h": [0.8], "ath": [2], "ath_date": ["2025-01-01T00:00:00"],
        "circulating_supply": [1], "total_supply": [2],
        "price_change_percentage_1h_in_currency": [0.1],
        "price_change_percentage_24h": [0.2],
        "price_change_percentage_24h_in_currency": [0.2],
        "price_change_percentage_7d_in_currency": [0.3],
        "price_change_percentage_30d_in_currency": [0.4],
        "fetched_at": [pd.Timestamp.now()],
    })
    p1 = write_dim_asset(mk)
    p2 = write_fact_market(mk)
    p3 = write_fact_prices({"x": make_hist()})
    for p in (p1, p2, p3):
        assert pd.read_csv(p).shape[0] >= 1
