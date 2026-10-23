export default function Gauge({ score, consistency }) {
  const arc = (color, r, frac, w) => {
    const vis = Math.max(0.5, Math.min(74.5, frac * 75));
    return (
      <circle
        key={`${color}${r}`}
        cx="70"
        cy="70"
        r={r}
        pathLength="100"
        fill="none"
        stroke={color}
        strokeWidth={w}
        strokeLinecap="round"
        strokeDasharray={`${vis} 100`}
        transform="rotate(135 70 70)"
      />
    );
  };
  return (
    <svg viewBox="0 0 140 140" width="130" height="130">
      <circle
        cx="70"
        cy="70"
        r="60"
        pathLength="100"
        stroke="#232327"
        strokeWidth="14"
        fill="none"
        strokeDasharray="75 25"
        transform="rotate(135 70 70)"
      />
      {arc("#FFFFFF", 60, score / 100, 14)}
      {arc("#FCC419", 45, consistency * 100, 10)}
      <circle cx="70" cy="70" r="9" fill="#fff" />
    </svg>
  );
}
