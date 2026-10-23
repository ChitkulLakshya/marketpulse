export default function Skeleton() {
  return (
    <div className="card">
      <div className="card-head">
        <div className="skeleton" style={{ width: 130, height: 14 }} />
        <div className="skeleton" style={{ width: 30, height: 30, borderRadius: 10 }} />
      </div>
      <div className="skeleton" style={{ width: "55%", height: 34, marginBottom: 10 }} />
      <div className="skeleton" style={{ height: 170, borderRadius: 18 }} />
    </div>
  );
}
