// services/matchSync.js
const axios = require("axios");
const Match = require("../models/match");
const Team = require("../models/Team");
const Tournament = require("../models/tournament");
const { syncPlayers } = require("./playerSync");

// ✅ إعداد Axios مع RapidAPI
const api = axios.create({
  baseURL: process.env.API_BASE || "https://free-api-live-football-data.p.rapidapi.com",
  headers: {
    "x-rapidapi-key": process.env.FOOTBALL_API_KEY,
    "x-rapidapi-host": "free-api-live-football-data.p.rapidapi.com",
  },
  timeout: 20000,
});

/**
 * ✅ مزامنة المباريات في فترة زمنية (افتراضي: أسبوع فات + أسبوع جاي)
 */
const syncMatchesInRange = async (daysBack = 7, daysForward = 7) => {
  try {
    console.log(`⏳ Syncing matches from last ${daysBack} days to next ${daysForward} days...`);

    const today = new Date();
    const past = new Date(today);
    past.setDate(today.getDate() - daysBack);
    const future = new Date(today);
    future.setDate(today.getDate() + daysForward);

    const fromDate = past.toISOString().split("T")[0];
    const toDate = future.toISOString().split("T")[0];

    console.log(`📅 Fetching matches from ${fromDate} → ${toDate}`);

    const response = await api.get(`/football-get-match-by-range`, {
      params: { from: fromDate, to: toDate },
    });

    const apiMatches = response.data?.response || [];
    console.log(`📥 API Matches Response: ${apiMatches.length}`);

    if (!apiMatches.length) return console.log("⚠️ No matches found in this range.");

    for (const m of apiMatches) {
      const homeTeam = await Team.findOneAndUpdate(
        { apiId: m.home_team_id },
        {
          apiId: m.home_team_id,
          name: m.home_team_name,
          logo: m.home_team_logo,
          country: m.country || "N/A",
        },
        { upsert: true, new: true }
      );

      const awayTeam = await Team.findOneAndUpdate(
        { apiId: m.away_team_id },
        {
          apiId: m.away_team_id,
          name: m.away_team_name,
          logo: m.away_team_logo,
          country: m.country || "N/A",
        },
        { upsert: true, new: true }
      );

      const tournament = await Tournament.findOneAndUpdate(
        { apiId: m.league_id },
        {
          apiId: m.league_id,
          name: m.league_name,
          country: m.country || "",
          season: new Date().getFullYear(),
        },
        { upsert: true, new: true }
      );

      await Match.findOneAndUpdate(
        { apiId: m.fixture_id },
        {
          apiId: m.fixture_id,
          homeTeam: homeTeam._id,
          awayTeam: awayTeam._id,
          tournament: tournament._id,
          scoreA: m.home_team_score ?? 0,
          scoreB: m.away_team_score ?? 0,
          date: new Date(m.match_time),
          venue: m.venue_name || "Unknown",
          status: m.status || "NS",
          minute: m.minute || 0,
        },
        { upsert: true, new: true }
      );

      const season = new Date().getFullYear();
      await syncPlayers(m.home_team_id, season);
      await syncPlayers(m.away_team_id, season);
    }

    console.log("✅ Matches + Players synced successfully!");
  } catch (err) {
    console.error("❌ Error syncing matches:", err.message);
  }
};

/**
 * ✅ مزامنة المباريات المباشرة (Live)
 * + بث Socket.io مباشر للأهداف والحالة وبداية/نهاية المباراة
 */
const syncLiveMatches = async () => {
  try {
    console.log("📡 Syncing live matches from RapidAPI...");
    const response = await api.get("/football-current-live");
    const apiMatches = response.data?.response || [];
    console.log(`📥 Live Matches: ${apiMatches.length}`);

    if (!apiMatches.length) return console.log("⚠️ No live matches found.");

    for (const m of apiMatches) {
      const previousMatch = await Match.findOne({ apiId: m.fixture_id });

      const updatedMatch = await Match.findOneAndUpdate(
        { apiId: m.fixture_id },
        {
          scoreA: m.home_team_score ?? 0,
          scoreB: m.away_team_score ?? 0,
          status: m.status || "LIVE",
          minute: m.minute || 0,
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      // ✅ بث النتيجة عبر Socket.io
      if (global.sendLiveScoreUpdate)
        global.sendLiveScoreUpdate(m.fixture_id, {
          homeScore: m.home_team_score ?? 0,
          awayScore: m.away_team_score ?? 0,
        });

      // 🧠 تحديد تغيّر النتيجة (هدف جديد)
      const prevA = previousMatch?.scoreA ?? 0;
      const prevB = previousMatch?.scoreB ?? 0;
      const newA = m.home_team_score ?? 0;
      const newB = m.away_team_score ?? 0;

      if (global.sendMatchEvent) {
        if (newA > prevA)
          global.sendMatchEvent(m.fixture_id, {
            type: "goal",
            minute: m.minute,
            team: m.home_team_name,
            description: `⚽ هدف لـ ${m.home_team_name}`,
          });
        if (newB > prevB)
          global.sendMatchEvent(m.fixture_id, {
            type: "goal",
            minute: m.minute,
            team: m.away_team_name,
            description: `⚽ هدف لـ ${m.away_team_name}`,
          });
      }

      // ✅ بث حالة المباراة (بداية / نهاية)
      if (global.sendMatchStatusUpdate) {
        const status = m.status?.toLowerCase() || "live";
        if (status.includes("finished") || status === "ft") {
          global.sendMatchStatusUpdate(m.fixture_id, "🏁 نهاية المباراة");
        } else if (status.includes("live") || status === "1h" || status === "2h") {
          global.sendMatchStatusUpdate(m.fixture_id, "🚨 انطلقت المباراة");
        } else {
          global.sendMatchStatusUpdate(m.fixture_id, m.status || "LIVE");
        }
      }

      console.log(`🔴 Updated: ${m.home_team_name} ${m.home_team_score}-${m.away_team_score} ${m.away_team_name}`);
    }

    console.log("✅ Live matches synced + broadcasted!");
  } catch (err) {
    console.error("❌ Error syncing live matches:", err.message);
  }
};

module.exports = { syncMatchesInRange, syncLiveMatches };
