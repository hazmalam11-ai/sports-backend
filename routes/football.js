// routes/football.js
const express = require("express");
const router = express.Router();
const footballAPI = require("../services/footballAPI");
const { filterMatches } = require("../middleware/leagueFilter");

// 📦 المودلز
const Match = require("../models/match");
const Tournament = require("../models/tournament");
const Team = require("../models/Team");
const Player = require("../models/Player");
const News = require("../models/news");

/* ========================
   Matches
======================== */

// ✅ مباريات مباشرة - Real-time from RapidAPI
router.get("/matches/live", async (req, res) => {
  try {
    console.log("🔴 Fetching live matches from RapidAPI...");
    const apiData = await footballAPI.getLiveMatches();

    console.log(`📡 RapidAPI Live Matches Response: ${apiData?.length || 0}`);

    if (!apiData || apiData.length === 0) {
      console.log("⚠️ No live matches found from RapidAPI");
      return res.json([]);
    }

    // تحويل البيانات لتنسيق الواجهة الأمامية
    const liveMatches = apiData.map(match => ({
      _id: match.fixture.id.toString(),
      apiId: match.fixture.id,
      homeTeam: match.teams.home,
      awayTeam: match.teams.away,
      scoreA: match.goals.home ?? 0,
      scoreB: match.goals.away ?? 0,
      date: match.fixture.date,
      status: match.fixture.status.short.toLowerCase(),
      minute: match.fixture.status.elapsed || 0,
      tournament: match.league,
      isLive: ["1H", "2H", "ET", "P", "LIVE"].includes(match.fixture.status.short),
      updatedAt: new Date(),
    }));

    const filtered = filterMatches(liveMatches);
    console.log(`🔍 Filtered: ${liveMatches.length} → ${filtered.length}`);

    res.json(filtered);
  } catch (err) {
    console.error("❌ Error fetching live matches:", err.message);
    res.status(500).json({ error: "Error fetching live matches", details: err.message });
  }
});

// ✅ مباريات اليوم
router.get("/matches/today", async (req, res) => {
  try {
    console.log("📅 Fetching today's matches...");
    const matches = await footballAPI.getTodayMatches();
    const filtered = filterMatches(matches.map(match => ({
      _id: match.fixture.id.toString(),
      apiId: match.fixture.id,
      homeTeam: match.teams.home,
      awayTeam: match.teams.away,
      scoreA: match.goals.home ?? 0,
      scoreB: match.goals.away ?? 0,
      date: match.fixture.date,
      status: match.fixture.status.short.toLowerCase(),
      tournament: match.league,
      updatedAt: new Date(),
    })));

    console.log(`✅ Returning ${filtered.length} matches for today`);
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: "Error fetching today's matches", error: err.message });
  }
});

// ✅ مباراة معينة بالـ ID
router.get("/matches/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`⚽ Fetching match by ID: ${id}`);

    let match = await Match.findOne({ apiId: id });

    if (!match) {
      const apiData = await footballAPI.getMatchById(id);
      if (apiData) {
        match = await Match.findOneAndUpdate(
          { apiId: apiData.fixture.id },
          apiData,
          { upsert: true, new: true }
        );
      }
    }

    if (!match) return res.status(404).json({ error: "Match not found" });

    res.json(match);
  } catch (err) {
    res.status(500).json({ error: "Error fetching match by ID", details: err.message });
  }
});

/* ========================
   Tournaments & Standings
======================== */

// ✅ البطولات
router.get("/tournaments", async (req, res) => {
  try {
    console.log("🏆 Fetching tournaments (leagues)...");
    const leagues = await footballAPI.getLeagues();

    let tournaments = await Tournament.find();

    if (!tournaments.length) {
      tournaments = await Tournament.insertMany(leagues, { ordered: false }).catch(() =>
        Tournament.find()
      );
    }

    res.json(tournaments);
  } catch (err) {
    console.error("❌ Error fetching tournaments:", err.message);
    res.status(500).json({ error: "Error fetching tournaments", details: err.message });
  }
});

// ✅ ترتيب البطولة
router.get("/standings/:tournament/:season", async (req, res) => {
  try {
    const { tournament, season } = req.params;
    console.log(`📊 Fetching standings for ${tournament} (${season})`);

    const standings = await footballAPI.getStandings(tournament, season);
    res.json(standings);
  } catch (err) {
    console.error("❌ Error fetching standings:", err.message);
    res.status(500).json({ error: "Error fetching standings", details: err.message });
  }
});

/* ========================
   Teams & Players
======================== */

// ✅ معلومات فريق
router.get("/teams/:id", async (req, res) => {
  try {
    const teamId = req.params.id;
    console.log(`🏟️ Fetching team info: ${teamId}`);

    let team = await Team.findOne({ apiId: teamId });
    if (!team) {
      const apiData = await footballAPI.getTeamInfo(teamId);
      team = await Team.create({ ...apiData, apiId: apiData.id });
    }

    res.json(team);
  } catch (err) {
    res.status(500).json({ error: "Error fetching team info", details: err.message });
  }
});

// ✅ لاعبي فريق
router.get("/teams/:id/players", async (req, res) => {
  try {
    const teamId = req.params.id;
    console.log(`👕 Fetching players for team: ${teamId}`);

    const players = await footballAPI.getTeamPlayers(teamId);
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: "Error fetching team players", details: err.message });
  }
});

// ✅ فرق الدوري
router.get("/teams/league/:leagueId", async (req, res) => {
  try {
    const leagueId = req.params.leagueId;
    console.log(`⚽ Fetching teams for league: ${leagueId}`);

    const teams = await footballAPI.getTeamsByLeague(leagueId);
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: "Error fetching teams by league", details: err.message });
  }
});

/* ========================
   Match Details
======================== */

// ✅ إحصائيات المباراة
router.get("/statistics/:matchId", async (req, res) => {
  try {
    const matchId = req.params.matchId;
    console.log(`📊 Fetching statistics for match: ${matchId}`);

    const stats = await footballAPI.getMatchStatistics(matchId);
    res.json(stats);
  } catch (err) {
    console.error("❌ Error fetching match statistics:", err.message);
    res.status(500).json({ error: "Error fetching match statistics", details: err.message });
  }
});

// ✅ أحداث المباراة
router.get("/events/:matchId", async (req, res) => {
  try {
    const matchId = req.params.matchId;
    console.log(`⚽ Fetching events for match: ${matchId}`);

    const events = await footballAPI.getMatchEvents(matchId);
    res.json(events);
  } catch (err) {
    console.error("❌ Error fetching match events:", err.message);
    res.status(500).json({ error: "Error fetching match events", details: err.message });
  }
});

// ✅ تشكيل المباراة
router.get("/lineups/:matchId", async (req, res) => {
  try {
    const matchId = req.params.matchId;
    console.log(`🧩 Fetching lineups for match: ${matchId}`);

    const lineups = await footballAPI.getMatchLineups(matchId);
    res.json(lineups);
  } catch (err) {
    console.error("❌ Error fetching match lineups:", err.message);
    res.status(500).json({ error: "Error fetching match lineups", details: err.message });
  }
});

/* ========================
   Top Scorers
======================== */

router.get("/topscorers/:league/:season", async (req, res) => {
  try {
    const { league, season } = req.params;
    console.log(`🥇 Fetching top scorers for league ${league}, season ${season}`);

    const scorers = await footballAPI.getTopScorers(league, season);
    res.json(scorers);
  } catch (err) {
    console.error("❌ Error fetching top scorers:", err.message);
    res.status(500).json({ error: "Error fetching top scorers", details: err.message });
  }
});

/* ========================
   News (Placeholder)
======================== */

router.get("/news", async (req, res) => {
  try {
    const news = await News.find().sort({ publishedAt: -1 });
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: "Error fetching news", details: err.message });
  }
});

/* ========================
   System Stats
======================== */

router.get("/stats", (req, res) => {
  try {
    res.json({
      message: "RapidAPI Football service is active ✅",
      timestamp: new Date(),
    });
  } catch (err) {
    res.status(500).json({ error: "Error fetching API stats", details: err.message });
  }
});

module.exports = router;
