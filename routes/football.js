const express = require("express");
const router = express.Router();
const footballAPI = require("../services/footballAPI");

// 📦 المودلز
const Match = require("../models/Match");
const Tournament = require("../models/Tournament");
const Team = require("../models/Team");
const Player = require("../models/Player");
const News = require("../models/News");

/* ========================
   Matches
======================== */

// ✅ مباريات مباشرة
router.get("/matches/live", async (req, res) => {
  try {
    let matches = await Match.find({ isLive: true }).sort({ updatedAt: -1 });

    if (!matches.length) {
      const apiData = await footballAPI.getLiveMatches();
      matches = await Match.insertMany(
        apiData.map((m) => ({ ...m, apiId: m.apiId })),
        { ordered: false }
      ).catch(() => Match.find({ isLive: true })); // fallback
    }

    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: "Error fetching live matches", details: err.message });
  }
});

// ✅ مباريات اليوم
router.get("/matches/today", async (req, res) => {
  try {
    let today = new Date().toISOString().split("T")[0];
    let matches = await Match.find({ date: today }).sort({ updatedAt: -1 });

    if (!matches.length) {
      const apiData = await footballAPI.getTodayMatches();
      for (const m of apiData) {
        await Match.findOneAndUpdate(
          { apiId: m.apiId },
          { ...m, date: today },
          { upsert: true, new: true }
        );
      }
      matches = await Match.find({ date: today });
    }

    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: "Error fetching today matches", details: err.message });
  }
});

// ✅ مباراة معينة بالـ ID
router.get("/matches/:id", async (req, res) => {
  try {
    let match = await Match.findOne({ apiId: req.params.id });

    if (!match) {
      const apiData = await footballAPI.getMatchById(req.params.id);
      if (apiData) {
        match = await Match.findOneAndUpdate(
          { apiId: apiData.apiId },
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
    const { country, season } = req.query;
    let tournaments = await Tournament.find({ country, season });

    if (!tournaments.length) {
      const apiData = await footballAPI.getLeagues(country, season); // API-Sports بتسميها leagues
      tournaments = await Tournament.insertMany(apiData, { ordered: false }).catch(() =>
        Tournament.find({ country, season })
      );
    }

    res.json(tournaments);
  } catch (err) {
    res.status(500).json({ error: "Error fetching tournaments", details: err.message });
  }
});

// ✅ ترتيب البطولة
router.get("/standings/:tournament/:season", async (req, res) => {
  try {
    const key = `${req.params.tournament}_${req.params.season}`;
    let tournament = await Tournament.findOne({ standingsKey: key });

    if (!tournament) {
      const apiData = await footballAPI.getStandings(req.params.tournament, req.params.season);
      tournament = await Tournament.create({ standingsKey: key, standings: apiData });
    }

    res.json(tournament.standings);
  } catch (err) {
    res.status(500).json({ error: "Error fetching standings", details: err.message });
  }
});

/* ========================
   Teams & Players
======================== */

// ✅ معلومات فريق
router.get("/teams/:id", async (req, res) => {
  try {
    let team = await Team.findOne({ apiId: req.params.id });

    if (!team) {
      const apiData = await footballAPI.getTeamInfo(req.params.id);
      team = await Team.create({ ...apiData, apiId: apiData.id });
    }

    res.json(team);
  } catch (err) {
    res.status(500).json({ error: "Error fetching team info", details: err.message });
  }
});

// ✅ لاعبي فريق
router.get("/teams/:id/players/:season", async (req, res) => {
  try {
    let players = await Player.find({ teamId: req.params.id, season: req.params.season });

    if (!players.length) {
      const apiData = await footballAPI.getTeamPlayers(req.params.id, req.params.season);
      players = await Player.insertMany(apiData, { ordered: false }).catch(() =>
        Player.find({ teamId: req.params.id, season: req.params.season })
      );
    }

    res.json(players);
  } catch (err) {
    res.status(500).json({ error: "Error fetching team players", details: err.message });
  }
});

/* ========================
   News
======================== */

router.get("/news", async (req, res) => {
  try {
    let news = await News.find().sort({ publishedAt: -1 });

    if (!news.length) {
      const apiData = await footballAPI.getLatestNews();
      news = await News.insertMany(apiData, { ordered: false }).catch(() =>
        News.find().sort({ publishedAt: -1 })
      );
    }

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
    const data = footballAPI.getUsageStats ? footballAPI.getUsageStats() : {};
    res.json({
      message: "Football API usage stats",
      stats: data,
      timestamp: new Date(),
    });
  } catch (err) {
    res.status(500).json({ error: "Error fetching API stats", details: err.message });
  }
});

module.exports = router;