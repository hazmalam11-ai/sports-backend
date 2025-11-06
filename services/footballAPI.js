// services/footballAPI.js
const axios = require("axios");

class FootballAPI {
  constructor() {
    this.api = axios.create({
      baseURL: "https://free-api-live-football-data.p.rapidapi.com",
      headers: {
        "x-rapidapi-host": "free-api-live-football-data.p.rapidapi.com",
        "x-rapidapi-key": process.env.FOOTBALL_API_KEY,
      },
      timeout: 15000,
    });

    console.log("⚽ Using Free API Live Football Data ✅");
  }

  /* =========================
      📡 LIVE SCORES
  ========================= */
  async getLiveMatches() {
    try {
      const res = await this.api.get("/football-current-live");
      const live = res.data?.response?.live || res.data?.response || [];
      console.log(`📡 Live matches fetched from API: ${live.length}`);

      if (!live.length) {
        console.log("✅ API شغالة بس مفيش ماتشات لايف دلوقتي");
        return [];
      }

      return live.map(m => ({
        fixture: {
          id: m.match_id,
          date: m.match_time,
          status: { short: m.status || "FT", elapsed: m.minute || 0 },
        },
        teams: {
          home: { name: m.home_name, logo: m.home_logo },
          away: { name: m.away_name, logo: m.away_logo },
        },
        goals: {
          home: m.score_home ?? 0,
          away: m.score_away ?? 0,
        },
        league: {
          id: m.league_id,
          name: m.league_name,
          country: m.country_name,
          logo: m.league_logo,
        },
      }));
    } catch (err) {
      console.error("❌ Error fetching live matches:", err.response?.data || err.message);
      return [];
    }
  }
}

/* =========================
   ✅ EXPORT
========================= */
module.exports = new FootballAPI();
