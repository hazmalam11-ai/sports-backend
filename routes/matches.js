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
  if (!Array.isArray(matches)) {
    console.log("⚠️ Matches is not an array:", typeof matches);
    return [];
  }
  
  return matches.map((match) => ({
    fixture: {
      id: match.fixture_id || match.id || match.match_id,
      date: match.match_time || match.date || new Date().toISOString(),
      status: {
        short: match.status || match.match_status || "NS",
        long: match.status_full || match.status || "Not Started",
        elapsed: match.minute || match.elapsed || 0,
      },
    },
    league: {
      id: match.league_id || match.competition_id || 0,
      name: match.league_name || match.competition_name || "Unknown League",
      country: match.country || match.country_name || "Unknown",
      logo: match.league_logo || match.competition_logo || "",
    },
    teams: {
      home: {
        id: match.home_team_id || match.home_id || 0,
        name: match.home_team_name || match.home_name || "Home",
        logo: match.home_team_logo || match.home_logo || "",
      },
      away: {
        id: match.away_team_id || match.away_id || 0,
        name: match.away_team_name || match.away_name || "Away",
        logo: match.away_team_logo || match.away_logo || "",
      },
    },
    goals: {
      home: match.home_team_score ?? match.home_score ?? 0,
      away: match.away_team_score ?? match.away_score ?? 0,
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
    console.log("📦 Today Response:", JSON.stringify(data, null, 2));
    
    const matches = data?.response || data?.data || [];
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
    console.log("📦 Yesterday Response:", JSON.stringify(data, null, 2));
    
    const matches = data?.response || data?.data || [];
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
    console.log("📦 Tomorrow Response:", JSON.stringify(data, null, 2));
    
    const matches = data?.response || data?.data || [];
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
    console.log("📦 Week Response:", JSON.stringify(data, null, 2));
    
    const matches = data?.response || data?.data || [];
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
    console.log("📦 Live Full Response:", JSON.stringify(data, null, 2));
    
    // 🎯 المشكلة كانت هنا!
    let matches = data?.response?.live || 
                  data?.response || 
                  data?.data?.live || 
                  data?.data || 
                  data?.live || 
                  [];
    
    // لو كان object مش array
    if (!Array.isArray(matches) && typeof matches === 'object') {
      if (matches.live && Array.isArray(matches.live)) {
        matches = matches.live;
      } else {
        matches = [];
      }
    }
    
    console.log(`📡 Live Matches Found: ${Array.isArray(matches) ? matches.length : 'Not an array'}`);
    console.log("🎯 Matches Type:", typeof matches);
    
    res.json(formatMatches(matches));
  } catch (err) {
    console.error("❌ Error fetching live matches:", err.message);
    if (err.response) {
      console.error("📛 API Error Response:", err.response.data);
      console.error("📛 Status Code:", err.response.status);
    }
    res.status(500).json({ 
      error: "Error fetching live matches",
      details: err.message 
    });
  }
});

// 🏆 كل الدوريات
router.get("/leagues", async (req, res) => {
  try {
    console.log("🏆 Fetching LEAGUES list...");
    const data = await fetchFromRapidAPI("/football-leagues");
    console.log("📦 Leagues Response:", JSON.stringify(data, null, 2));
    
    const leagues = data?.response || data?.data || [];
    const formatted = leagues.map((l) => ({
      id: l.league_id || l.id || 0,
      name: l.league_name || l.name || "Unknown League",
      country: l.country || l.country_name || "Unknown",
      logo: l.league_logo || l.logo || "",
    }));
    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching leagues:", err.message);
    res.status(500).json({ error: "Error fetching leagues" });
  }
});

module.exports = router;
