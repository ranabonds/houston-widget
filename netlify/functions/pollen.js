exports.handler = async function () {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const resp = await fetch("https://www.houstontx.gov/health/Pollen/", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await resp.text();

    const patterns = {
      tree:  /tree[^<]*<[^>]+>([0-9,]+)/i,
      grass: /grass[^<]*<[^>]+>([0-9,]+)/i,
      weed:  /weed[^<]*<[^>]+>([0-9,]+)/i,
      mold:  /mold[^<]*<[^>]+>([0-9,]+)/i,
    };

    const result = { date: new Date().toISOString().split("T")[0] };
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = html.match(pattern);
      result[key] = match ? parseInt(match[1].replace(/,/g, ""), 10) : null;
    }

    const allNull = ["tree","grass","weed","mold"].every(k => result[k] === null);
    if (allNull && process.env.ANTHROPIC_API_KEY) {
      const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "web-search-2025-03-05",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{
            role: "user",
            content: `Search houstontx.gov/health/Pollen/ for today's pollen counts. Return ONLY raw JSON, no markdown: {"tree":<number|null>,"grass":<number|null>,"weed":<number|null>,"mold":<number|null>,"date":"<date>"}`,
          }],
        }),
      });
      const aiData = await aiResp.json();
      const raw = aiData.content.filter(b => b.type === "text").map(b => b.text).join("");
      const match = raw.match(/\{[\s\S]*?\}/);
      if (match) return { statusCode: 200, headers, body: match[0] };
    }

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
