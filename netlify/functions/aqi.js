exports.handler = async function () {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const apiKey = process.env.AIRNOW_API_KEY;
    const url = `https://www.airnowapi.org/aq/observation/zipCode/current/?format=application/json&zipCode=77573&distance=25&API_KEY=${apiKey}`;

    const resp = await fetch(url);
    if (!resp.ok) throw new Error("AirNow error: " + resp.status);

    const data = await resp.json();
    if (!data || data.length === 0) throw new Error("No AQI data returned");

    const primary = data.reduce((a, b) => (a.AQI >= b.AQI ? a : b));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        aqi: primary.AQI,
        category: primary.Category?.Name || "Unknown",
        pollutant: primary.ParameterName || "Unknown",
        date: primary.DateObserved?.trim() || new Date().toISOString().split("T")[0],
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
