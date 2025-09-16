// routes/matches.js
const express = require("express");
const router = express.Router();
const Match = require("../models/Match");
const Like = require("../models/Like");
const { requireAuth, authorize } = require("../middlewares/auth");

// 🆕 استدعاء API المدفوع
const {
  getTodayMatches,
  getMatchByIdAPI,
  getTeamLastMatches,
  getStandings,
  getLeagues,
  getTeamInfo,
  getTeamPlayers
} = require("../services/footballAPI");

// helper: يحاول يقرأ userId لو فيه توكن
function tryGetUserId(req) {
  return req.user?.id || null;
}

/* =========================
   PUBLIC: API FOOTBALL ENDPOINTS
   ========================= */

// 🆕 مباريات اليوم (من API خارجي)
router.get("/today/api", async (req, res) => {
  try {
    const { league } = req.query;
    const matches = await getTodayMatches(league);
    res.json({ source: "API-Football", count: matches.length, matches });
  } catch (err) {
    res.status(500).json({ message: "Error fetching API matches", error: err.message });
  }
});

// 🆕 مباراة من API بالـ ID
router.get("/api/:id", async (req, res) => {
  try {
    const match = await getMatchByIdAPI(req.params.id);
    if (!match) return res.status(404).json({ message: "Match not found in API" });
    res.json(match);
  } catch (err) {
    res.status(500).json({ message: "Error fetching API match", error: err.message });
  }
});

// 🆕 جدول الترتيب
router.get("/standings/:leagueId", async (req, res) => {
  try {
    const season = req.query.season || new Date().getFullYear();
    const standings = await getStandings(req.params.leagueId, season);
    res.json({ league: req.params.leagueId, season, standings });
  } catch (err) {
    res.status(500).json({ message: "Error fetching standings", error: err.message });
  }
});

// 🆕 آخر مباريات فريق
router.get("/team/:teamId/last", async (req, res) => {
  try {
    const count = req.query.count || 5;
    const matches = await getTeamLastMatches(req.params.teamId, count);
    res.json({ teamId: req.params.teamId, matches });
  } catch (err) {
    res.status(500).json({ message: "Error fetching team matches", error: err.message });
  }
});

// 🆕 لاعبي الفريق
router.get("/team/:teamId/players", async (req, res) => {
  try {
    const season = req.query.season || new Date().getFullYear();
    const players = await getTeamPlayers(req.params.teamId, season);
    res.json({ teamId: req.params.teamId, season, players });
  } catch (err) {
    res.status(500).json({ message: "Error fetching players", error: err.message });
  }
});

// 🆕 الدوريات
router.get("/leagues", async (req, res) => {
  try {
    const { country, season } = req.query;
    const leagues = await getLeagues(country, season);
    res.json({ count: leagues.length, leagues });
  } catch (err) {
    res.status(500).json({ message: "Error fetching leagues", error: err.message });
  }
});

/* =========================
   PUBLIC: DATABASE ENDPOINTS
   ========================= */

// GET /matches (كل المباريات من الداتابيز)
router.get("/", async (req, res) => {
  try {
    const matches = await Match.find()
      .populate("homeTeam", "name country logo")
      .populate("awayTeam", "name country logo")
      .populate("tournament", "name year country")
      .sort({ date: -1 });

    const userId = tryGetUserId(req);

    const matchesWithLikes = await Promise.all(
      matches.map(async (match) => {
        const likesCount = await Like.countDocuments({ targetType: "Match", targetId: match._id });
        let userLiked = false;
        if (userId) {
          userLiked = !!(await Like.exists({ user: userId, targetType: "Match", targetId: match._id }));
        }
        return { ...match.toObject(), likes: likesCount, likedByUser: userLiked };
      })
    );

    res.json(matchesWithLikes);
  } catch (err) {
    res.status(500).json({ message: "Error fetching matches", error: err.message });
  }
});

// GET /matches/live (مباريات لايف من الداتابيز)
router.get("/live", async (req, res) => {
  try {
    const liveMatches = await Match.find({ status: { $in: ["live", "half-time"] } })
      .populate("homeTeam", "name country logo")
      .populate("awayTeam", "name country logo")
      .populate("tournament", "name year country")
      .sort({ minute: -1 });

    res.json(liveMatches);
  } catch (err) {
    res.status(500).json({ message: "Error fetching live matches", error: err.message });
  }
});

// GET /matches/:id (مباراة من الداتابيز)
router.get("/:id", async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate("homeTeam", "name country logo")
      .populate("awayTeam", "name country logo")
      .populate("tournament", "name year country");

    if (!match) return res.status(404).json({ message: "Match not found" });

    res.json(match);
  } catch (err) {
    res.status(500).json({ message: "Error fetching match", error: err.message });
  }
});

/* =========================
   PROTECTED: ADMIN OPS
   ========================= */

// ➕ إضافة مباراة
router.post("/", requireAuth, authorize("match:create"), async (req, res) => {
  try {
    const match = new Match(req.body);
    await match.save();
    res.status(201).json({ message: "Match created", match });
  } catch (err) {
    res.status(400).json({ message: "Error creating match", error: err.message });
  }
});

// ✏️ تحديث النتيجة
router.put("/:id/score", requireAuth, authorize("match:edit"), async (req, res) => {
  try {
    const { scoreA, scoreB, minute } = req.body;
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { scoreA, scoreB, minute, status: "live" },
      { new: true }
    );
    if (!match) return res.status(404).json({ message: "Match not found" });

    if (global.sendLiveScoreUpdate) {
      global.sendLiveScoreUpdate(match._id, {
        homeScore: match.scoreA,
        awayScore: match.scoreB,
        minute: match.minute,
      });
    }

    res.json({ message: "Score updated", match });
  } catch (err) {
    res.status(500).json({ message: "Error updating score", error: err.message });
  }
});

// 🗑️ حذف مباراة
router.delete("/:id", requireAuth, authorize("match:delete"), async (req, res) => {
  try {
    const deleted = await Match.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Match not found" });
    res.json({ message: "Match deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting match", error: err.message });
  }
});

module.exports = router;