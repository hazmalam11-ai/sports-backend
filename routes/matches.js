// routes/matches.js
const express = require("express");
const router = express.Router();
const axios = require("axios");

// ✅ RapidAPI Football Endpoint
const RAPID_API_BASE = "https://free-api-live-football-data.p.rapidapi.com";

// ✅ Helper function to fetch from RapidAPI
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

/* =========================
   RAPIDAPI MATCH ROUTES
   ========================= */

// 🟢 LIVE MATCHES
router.get("/live", async (req, res) => {
  try {
    console.log("🔴 Fetching LIVE matches from RapidAPI...");
    const data = await fetchFromRapidAPI("/football-current-live");

    if (!data || !data.response || data.response.length === 0) {
      console.log("⚠️ No live matches found");
      return res.json([]);
    }

    const formatted = data.response.map((match) => ({
      fixture: {
        id: match.fixture_id || match.id,
        date: match.match_time || match.date || new Date().toISOString(),
        status: {
          short: "LIVE",
          long: "Live Match",
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

    console.log(`✅ Returning ${formatted.length} live matches`);
    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching live matches:", err.message);
    res.status(500).json({ error: "Error fetching live matches", details: err.message });
  }
});

// 🟢 TODAY MATCHES
router.get("/today", async (req, res) => {
  try {
    console.log("📅 Fetching TODAY matches from RapidAPI...");
    const data = await fetchFromRapidAPI("/football-today");

    if (!data || !data.response || data.response.length === 0) {
      console.log("⚠️ No matches found for today");
      return res.json([]);
    }

    const formatted = data.response.map((match) => ({
      fixture: {
        id: match.fixture_id || match.id,
        date: match.match_time || match.date || new Date().toISOString(),
        status: {
          short: match.status || "NS",
          long: match.status || "Not Started",
          elapsed: 0,
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

    console.log(`✅ Returning ${formatted.length} today's matches`);
    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching today's matches:", err.message);
    res.status(500).json({ error: "Error fetching today's matches", details: err.message });
  }
});

// 🟢 LEAGUES LIST
router.get("/leagues", async (req, res) => {
  try {
    console.log("🏆 Fetching leagues from RapidAPI...");
    const data = await fetchFromRapidAPI("/football-leagues");

    if (!data || !data.response || data.response.length === 0) {
      console.log("⚠️ No leagues found");
      return res.json([]);
    }

    const formatted = data.response.map((league) => ({
      league: {
        id: league.league_id || 0,
        name: league.league_name || "Unknown League",
        country: league.country || "Unknown",
        logo: league.league_logo || "",
      },
    }));

    console.log(`✅ Returning ${formatted.length} leagues`);
    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching leagues:", err.message);
    res.status(500).json({ error: "Error fetching leagues", details: err.message });
  }
});

module.exports = router;
