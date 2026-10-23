import { useState } from "react";

export default function DailyCard({ daily }) {
  const [selDay, setSelDay] = useState(null);
  if (!daily?.length) return null;

  const last = daily[daily.length - 1];
  const monthDays = daily.filter((d) => d.day.slice(0, 7) === last.day.slice(0, 7));
  const ym = last.day.slice(0, 7);
  const best = monthDays.reduce((b, d) => (d.ret > b.ret ? d : b), monthDays[0]);
  const worst = monthDays.reduce((w, d) => (d.ret < w.ret ? d : w), monthDays[0]);
  const posDays = monthDays.filter((d) => d.ret > 0).length;
  const focus = selDay ? monthDays.find((d) => d.day === selDay) : last;
  if (!focus) return null;

  const r = focus.ret;
  const cls = r >= 0 ? "green" : "red";
  const start = new Date(`${ym}-01`);
  const lead = (start.getDay() + 6) % 7;
  const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  const map = Object.fromEntries(monthDays.map((d) => [Number(d.day.slice(8)), d]));
  const rets = monthDays.map((d) => d.ret);

  const cells = [];
  for (let i = 0; i < lead; i++)
    cells.push(
      <div className="cell hatch" key={`l${i}`}>
        ·
      </div>
    );
  for (let day = 1; day <= daysInMonth; day++) {
    const d = map[day];
    const isBest = d && d === best && best.ret > 0;
    let style = isBest ? { background: "#f2f2f2", color: "#141414" } : {};
    if (!d || Math.abs(d.ret) < 0.0005) {
      cells.push(
        <div className={`cell ${isBest ? "" : "hatch"}`} key={day} style={style}>
          {day}
        </div>
      );
      continue;
    } else if (d.ret > 0) {
      const shade = 0.25 + 0.65 * Math.min(1, d.ret / (Math.max(...rets) * 0.8 || 1e-9));
      style = { background: `rgba(252,196,25,${shade.toFixed(2)})`, color: "#141414" };
    } else {
      const shade = 0.2 + 0.45 * Math.min(1, Math.abs(d.ret) / (Math.abs(Math.min(...rets)) * 0.8 || 1e-9));
      style = { background: `rgba(240,68,56,${shade.toFixed(2)})`, color: "#fff" };
    }
    cells.push(
      <div
        className={`cell ${isBest ? "today" : ""} ${selDay === d.day ? "sel" : ""}`}
        key={day}
        style={style}
        onClick={() => setSelDay(selDay === d.day ? null : d.day)}
        title={`$${Math.round(d.pnl)} · ${(d.ret * 100).toFixed(2)}% — click to inspect`}
      >
        {day}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-head">
        <h3>Daily Performance</h3>
        <select className="select" disabled defaultValue="Heatmap">
          <option>Heatmap</option>
        </select>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <div className="xl" style={{ animation: "pop 0.3s ease both" }}>
          ${Math.abs(focus.pnl).toLocaleString("en-US", { maximumFractionDigits: 0 })}
        </div>
        <span className={`chip ${cls}`}>
          {r >= 0 ? "↗" : "↘"} {(r * 100).toFixed(2)}%
        </span>
        <span className="sub" style={{ fontSize: "0.7rem" }}>{focus.day}</span>
      </div>
      <p className="sub" style={{ marginTop: 4, fontSize: "0.78rem" }}>
        {selDay ? "clicked day — click again to reset" : "latest session · click a day to inspect"} ·{" "}
        <b>
          {posDays}/{monthDays.length} green days
        </b>{" "}
        in {new Date(`${ym}-01`).toLocaleString("en", { month: "long" })}
      </p>
      <div className="cal">{cells}</div>
      <div className="sub" style={{ fontSize: "0.64rem", marginTop: 6 }}>
        best <b style={{ color: "#5fe3a3" }}>+{(best.ret * 100).toFixed(2)}%</b> · worst{" "}
        <b style={{ color: "#ff8585" }}>{(worst.ret * 100).toFixed(2)}%</b> · {ym} heatmap
      </div>
    </div>
  );
}
