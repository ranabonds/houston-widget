exports.handler = async function () {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const indexResp = await fetch("https://www.houstonhealth.org/services/pollen-mold", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const indexHtml = await indexResp.text();

    const linkMatch = indexHtml.match(/href="(\/services\/pollen-mold\/houston-pollen-mold-count-[^"]+)"/i);
    if (!linkMatch) throw new Error("Could not find latest pollen report link");

    const reportUrl = "https://www.houstonhealth.org" + linkMatch[1];
    const reportResp = await fetch(reportUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await reportResp.text();

    function extractCount(label) {
      const regex = new RegExp(label + "\\s*POLLEN[\\s\\S]*?<strong>([\\d,]+)<\\/strong>", "i");
      const match = html.match(regex);
      return match ? parseInt(match[1].replace(/,/g, ""), 10) : null;
    }

    function extractMold() {
      const regex = /MOLD\s*SPORES[\s\S]*?<strong>([\d,]+)<\/strong>/i;
      const match = html.match(regex);
      return match ? parseInt(match[1].replace(/,/g, ""), 10) : null;
    }

    const dateMatch = indexHtml.match(/houston-pollen-mold-count-([a-z]+-[a-z]+-\d+-\d+)/i);
    const date = dateMatch ? dateMatch[1].replace(/-(\d+)$/, "-$1") : new Date().toISOString().split("T")[0];

    const result = {
      tree:  extractCount("TREE"),
      grass: extractCount("GRASS"),
      weed:  extractCount("WEED"),
      mold:  extractMold(),
      source_url: reportUrl,
      date: date,
    };

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
