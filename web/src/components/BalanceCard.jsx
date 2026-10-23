import { money } from "../format";

export default function BalanceCard({ portfolio, metrics }) {
  const p = portfolio;
  const rows = p.rows;
  const mEnd = new Map();
  rows.forEach((r) => {
    const key = r.day.slice(0, 7);
    if (!mEnd.has(key)) mEnd.set(key, [r.value, r.value]);
    else mEnd.get(key)[1] = r.value;
  });
  const keys = [...mEnd.keys()];
  const lastKey = keys[keys.length - 1];
  const prevKey = keys[keys.length - 2] || lastKey;
  const mom = mEnd.get(lastKey)[1] - mEnd.get(prevKey)[0];
  const posMonths = keys.filter((k, i) => i > 0 && mEnd.get(k)[1] > mEnd.get(keys[i - 1])[1]).length;
  const negMonths = keys.filter((k, i) => i > 0 && mEnd.get(k)[1] < mEnd.get(keys[i - 1])[1]).length;
  const ret30 = metrics.ret30 || 0;

  return (
    <div className="card">
      <div className="card-head">
        <h3>Balance</h3>
        <span className="icon-btn">🔗</span>
      </div>
      <div className="xl">
        {money(metrics.balance)}
        <span className={`chip ${ret30 >= 0 ? "green" : "red"}`}>
          {ret30 >= 0 ? "" : ""}
          {(ret30 * 100).toFixed(2)}%
        </span>
      </div>
      <p className="sub" style={{ marginTop: 4 }}>
        {mom >= 0 ? "+" : "-"}
        {money(Math.abs(mom))} last month · equal-weight live basket
      </p>
      <div style={{ marginTop: 10 }}>
        <span className="pay-chip">↙ Income · {posMonths} mo</span>
        <span className="pay-chip">↗ Expense · {negMonths} mo</span>
      </div>
      <div className="visa">
        <span className="num">•••• 4856</span>
        <span className="brand">VISA</span>
      </div>
    </div>
  );
}
