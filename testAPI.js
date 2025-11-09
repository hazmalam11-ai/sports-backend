const axios = require("axios");

const options = {
  method: 'GET',
  url: 'https://free-api-live-football-data.p.rapidapi.com/football-get-matches-by-date',
  params: { date: '20251028' }, // التاريخ بصيغة YYYYMMDD (غيره لو عايز)
  headers: {
    'x-rapidapi-key': 'a9ca627fe1msh29c8992995679c5p12a17djsn50416cc6b7d9',
    'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com'
  }
};

(async () => {
  try {
    console.log("⚽ Fetching matches for today...");
    const response = await axios.request(options);
    console.log("✅ Response received:");
    console.dir(response.data, { depth: null });
  } catch (error) {
    console.error("❌ Error fetching matches:", error.response?.data || error.message);
  }
})();