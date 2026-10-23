const CG_PUBLIC = "https://api.coingecko.com/api/v3";
const CG_PRO = "https://pro-api.coingecko.com/api/v3";

module.exports = async function handler(req, res) {
  const path = String(req.url || "/").replace(/^\/api\/gecko/, "");
  if (!path.startsWith("/")) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "bad path" }));
    return;
  }
  const key = process.env.COINGECKO_API_KEY || "";
  const base = key ? CG_PRO : CG_PUBLIC;
  try {
    const r = await fetch(base + path, {
      headers: {
        accept: "application/json",
        ...(key ? { "x_cg_demo_api_key": key } : {}),
      },
    });
    const text = await r.text();
    res.statusCode = r.status;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.end(text);
  } catch {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: "upstream unavailable" }));
  }
};
