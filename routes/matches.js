// routes/matches.js
const express = require("express");
const router = express.Router();
const axios = require("axios");

// ✅ RapidAPI Base
const RAPID_API_BASE = "https://free-api-live-football-data.p.rapidapi.com";

// ✅ Helper to fetch from RapidAPI
async function fetchFromRapidAPI(endpoint) {
  try {
    const response = await axios.get(`${RAPID_API_BASE}${endpoint}`, {
      headers: {
        "x-rapidapi-key": process.env.FOOTBALL_API_KEY,
        "x-rapidapi-host": "free-api-live-football-data.p.rapidapi.com",
      },
      timeout: 15000,
    });
    return response.data;
  } catch (error) {
    console.error("❌ RapidAPI Fetch Error:", error.response?.data || error.message);
    throw new Error(error.message || "Error fetching data from RapidAPI");
  }
}

// ✅ Format all matches in unified structure
function formatMatches(matches) {
  return matches.map((match) => ({
    fixture: {
      id: match.fixture_id || match.id,
      date: match.match_time || match.date || new Date().toISOString(),
      status: {
        short: match.status || "NS",
        long: match.status || "Not Started",
        elapsed: match.minute || 0,
      },
    },
    league: {
      id: match.league_id || 0,
      name: match.league_name || "Unknown League",
      country: match.country || "Unknown",
      logo: match.league_logo || "",
    },
    teams: {
      home: {
        id: match.home_team_id || 0,
        name: match.home_team_name || "Home",
        logo: match.home_team_logo || "",
      },
      away: {
        id: match.away_team_id || 0,
        name: match.away_team_name || "Away",
        logo: match.away_team_logo || "",
      },
    },
    goals: {
      home: match.home_team_score ?? 0,
      away: match.away_team_score ?? 0,
    },
  }));
}

/* =========================
   🏟️ RAPIDAPI MATCH ROUTES
   ========================= */

// 🟢 مباريات اليوم
router.get("/today", async (req, res) => {
  try {
    console.log("📅 Fetching TODAY matches...");
    const data = await fetchFromRapidAPI("/football-today");
    const matches = data?.response || [];
    res.json(formatMatches(matches));
  } catch (err) {
    console.error("❌ Error fetching today's matches:", err.message);
    res.status(500).json({ error: "Error fetching today's matches" });
  }
});

// 🔵 مباريات أمس
router.get("/yesterday", async (req, res) => {
  try {
    console.log("🕓 Fetching YESTERDAY matches...");
    const data = await fetchFromRapidAPI("/football-yesterday");
    const matches = data?.response || [];
    res.json(formatMatches(matches));
  } catch (err) {
    console.error("❌ Error fetching yesterday's matches:", err.message);
    res.status(500).json({ error: "Error fetching yesterday's matches" });
  }
});

// 🟣 مباريات غدًا
router.get("/tomorrow", async (req, res) => {
  try {
    console.log("🌅 Fetching TOMORROW matches...");
    const data = await fetchFromRapidAPI("/football-tomorrow");
    const matches = data?.response || [];
    res.json(formatMatches(matches));
  } catch (err) {
    console.error("❌ Error fetching tomorrow's matches:", err.message);
    res.status(500).json({ error: "Error fetching tomorrow's matches" });
  }
});

// 🟠 مباريات باقي الأسبوع
router.get("/week", async (req, res) => {
  try {
    console.log("📆 Fetching NEXT 7 DAYS matches...");
    const data = await fetchFromRapidAPI("/football-week");
    const matches = data?.response || [];
    res.json(formatMatches(matches));
  } catch (err) {
    console.error("❌ Error fetching week matches:", err.message);
    res.status(500).json({ error: "Error fetching week matches" });
  }
});

// 🔴 المباريات المباشرة
router.get("/live", async (req, res) => {
  try {
    console.log("🔴 Fetching LIVE matches...");
    const data = await fetchFromRapidAPI("/football-current-live");
    const matches = data?.response || [];
    res.json(formatMatches(matches));
  } catch (err) {
    console.error("❌ Error fetching live matches:", err.message);
    res.status(500).json({ error: "Error fetching live matches" });
  }
});

// 🏆 كل الدوريات
router.get("/leagues", async (req, res) => {
  try {
    console.log("🏆 Fetching LEAGUES list...");
    const data = await fetchFromRapidAPI("/football-leagues");
    const leagues = data?.response || [];
    const formatted = leagues.map((l) => ({
      id: l.league_id || 0,
      name: l.league_name || "Unknown League",
      country: l.country || "Unknown",
      logo: l.league_logo || "",
    }));
    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching leagues:", err.message);
    res.status(500).json({ error: "Error fetching leagues" });
  }
});

module.exports = router;
