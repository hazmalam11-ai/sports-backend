// routes/players.js
const express = require("express");
const Player = require("../models/Player");
const { requireAuth, authorize } = require("../middlewares/auth");
const footballAPI = require("../services/footballAPI");

const router = express.Router();

/* ========================
    ⚽ API Endpoints (RapidAPI)
   ======================== */

// 📌 جلب هدافي اللاعبين بالأهداف
router.get("/api/topscorers", async (req, res, next) => {
  try {
    const { league } = req.query;
    if (!league) return res.status(400).json({ message: "League ID is required" });

    console.log(`🏆 Fetching top scorers for league ${league}`);
    const topScorers = await footballAPI.getTopPlayersByGoals(league);

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json(topScorers);
  } catch (err) {
    console.error("❌ Error fetching top scorers:", err.message);
    next(err);
  }
});

// 📌 جلب أكثر اللاعبين صناعة للأهداف
router.get("/api/topassists", async (req, res, next) => {
  try {
    const { league } = req.query;
    if (!league) return res.status(400).json({ message: "League ID is required" });

    console.log(`🎯 Fetching top assists for league ${league}`);
    const topAssists = await footballAPI.getTopPlayersByAssists(league);

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json(topAssists);
  } catch (err) {
    console.error("❌ Error fetching top assists:", err.message);
    next(err);
  }
});

// 📌 جلب اللاعبين الأعلى تقييماً
router.get("/api/toprated", async (req, res, next) => {
  try {
    const { league } = req.query;
    if (!league) return res.status(400).json({ message: "League ID is required" });

    console.log(`⭐ Fetching top rated players for league ${league}`);
    const topRated = await footballAPI.getTopPlayersByRating(league);

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json(topRated);
  } catch (err) {
    console.error("❌ Error fetching top rated players:", err.message);
    next(err);
  }
});

// 📌 جلب لاعبي فريق محدد
router.get("/api/team/:teamid", async (req, res, next) => {
  try {
    const { teamid } = req.params;
    console.log(`👥 Fetching players for team ${teamid}`);
    const players = await footballAPI.getPlayersByTeam(teamid);

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json(players);
  } catch (err) {
    console.error("❌ Error fetching team players:", err.message);
    next(err);
  }
});

// 📌 جلب بيانات لاعب معين
router.get("/api/player/:id", async (req, res, next) => {
  try {
    const player = await footballAPI.getPlayerDetail(req.params.id);
    if (!player) return res.status(404).json({ message: "Player not found" });
    res.json(player);
  } catch (err) {
    console.error("❌ Error fetching player detail:", err.message);
    next(err);
  }
});

/* ========================
    💾 MongoDB Endpoints
   ======================== */

// ➕ إنشاء لاعب (admin/editor)
router.post("/", requireAuth, authorize("team:create"), async (req, res, next) => {
  try {
    const { name, position, team } = req.body;
    if (!name || !position || !team) {
      res.status(400);
      throw new Error("name, position, team are required");
    }
    const player = await Player.create(req.body);
    const populated = await Player.findById(player._id).populate("team", "name country");
    res.status(201).json({ message: "Player created", player: populated });
  } catch (err) {
    next(err);
  }
});

// 📌 جلب جميع اللاعبين من الداتابيز
router.get("/", async (req, res, next) => {
  try {
    const players = await Player.find().populate("team", "name country");
    res.json(players);
  } catch (err) {
    next(err);
  }
});

// 📌 جلب لاعب واحد من الداتابيز
router.get("/:id", async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id).populate("team", "name country");
    if (!player) {
      res.status(404);
      throw new Error("Player not found");
    }
    res.json(player);
  } catch (err) {
    next(err);
  }
});

// ✏️ تحديث بيانات لاعب
router.put("/:id", requireAuth, authorize("team:update"), async (req, res, next) => {
  try {
    const updated = await Player.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("team", "name country");
    if (!updated) {
      res.status(404);
      throw new Error("Player not found");
    }
    res.json({ message: "Player updated", player: updated });
  } catch (err) {
    next(err);
  }
});

// 🗑️ حذف لاعب
router.delete("/:id", requireAuth, authorize("team:delete"), async (req, res, next) => {
  try {
    const deleted = await Player.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404);
      throw new Error("Player not found");
    }
    res.json({ message: "Player deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
