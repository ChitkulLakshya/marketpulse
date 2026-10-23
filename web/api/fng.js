module.exports = async function handler(req, res) {
  const path = String(req.url || "/").replace(/^\/api\/fng/, "");
  if (!path.startsWith("/")) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "bad path" }));
    return;
  }
  try {
    const r = await fetch(`https://api.alternative.me${path}`, {
      headers: { accept: "application/json" },
    });
    const text = await r.text();
    res.statusCode = r.status;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1800");
    res.end(text);
  } catch {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: "upstream unavailable" }));
  }
};
