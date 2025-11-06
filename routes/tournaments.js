// routes/tournaments.js
const express = require("express");
const Tournament = require("../models/tournament");
const Team = require("../models/Team");
const Match = require("../models/match");
const { requireAuth, authorize } = require("../middlewares/auth");
const footballAPI = require("../services/footballAPI");

const router = express.Router();

/* ==========================
   🏆 RapidAPI Endpoints
   ========================== */

// 📌 جلب كل البطولات من الـ API
router.get("/api", async (req, res, next) => {
  try {
    console.log("🏆 Fetching all tournaments from RapidAPI...");
    const tournaments = await footballAPI.getAllLeagues();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json(tournaments);
  } catch (err) {
    console.error("❌ Error fetching tournaments from API:", err.message);
    res.status(500).json({ message: "Error fetching tournaments", error: err.message });
  }
});

// 📌 جلب بطولة معينة من الـ API
router.get("/api/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`📄 Fetching tournament info for ID: ${id}`);
    const tournament = await footballAPI.getLeagueDetail(id);
    if (!tournament) return res.status(404).json({ message: "Tournament not found in API" });
    res.json(tournament);
  } catch (err) {
    console.error("❌ Error fetching tournament info:", err.message);
    res.status(500).json({ message: "Error fetching tournament info", error: err.message });
  }
});

// 📌 جلب جدول الترتيب من الـ API
router.get("/api/:id/standings", async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`📊 Fetching standings for tournament ${id}`);
    const standings = await footballAPI.getStandings(id);
    res.json(standings);
  } catch (err) {
    console.error("❌ Error fetching standings:", err.message);
    res.status(500).json({ message: "Error fetching standings", error: err.message });
  }
});

// 📌 جلب الفرق المشاركة في بطولة من الـ API
router.get("/api/:id/teams", async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`👥 Fetching teams for tournament ${id}`);
    const teams = await footballAPI.getTeamsByLeague(id);
    res.json(teams);
  } catch (err) {
    console.error("❌ Error fetching tournament teams:", err.message);
    res.status(500).json({ message: "Error fetching tournament teams", error: err.message });
  }
});

/* ==========================
   💾 MongoDB CRUD Endpoints
   ========================== */

// ➕ إنشاء بطولة جديدة
router.post("/", requireAuth, authorize("tournament:create"), async (req, res, next) => {
  try {
    const { name, season, country, year } = req.body;
    if (!name || !season || !country || !year) {
      res.status(400);
      throw new Error("name, season, country, year are required");
    }
    const tournament = await Tournament.create(req.body);
    res.status(201).json({ message: "Tournament created successfully", tournament });
  } catch (err) {
    next(err);
  }
});

// 📌 عرض جميع البطولات
router.get("/", async (req, res, next) => {
  try {
    const tournaments = await Tournament.find().populate("teams", "name country logo");
    res.json(tournaments);
  } catch (err) {
    next(err);
  }
});

// 📌 عرض بطولة واحدة
router.get("/:id", async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id).populate("teams", "name country logo");
    if (!tournament) {
      res.status(404);
      throw new Error("Tournament not found");
    }
    res.json(tournament);
  } catch (err) {
    next(err);
  }
});

// ✏️ تحديث بطولة
router.put("/:id", requireAuth, authorize("tournament:update"), async (req, res, next) => {
  try {
    const updated = await Tournament.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      res.status(404);
      throw new Error("Tournament not found");
    }
    res.json({ message: "Tournament updated successfully", tournament: updated });
  } catch (err) {
    next(err);
  }
});

// 🗑️ حذف بطولة
router.delete("/:id", requireAuth, authorize("tournament:delete"), async (req, res, next) => {
  try {
    const deleted = await Tournament.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404);
      throw new Error("Tournament not found");
    }
    res.json({ message: "Tournament deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// 📌 الفرق المشاركة في بطولة (من قاعدة البيانات)
router.get("/:id/teams", async (req, res, next) => {
  try {
    const teams = await Team.find({ tournament: req.params.id });
    res.json(teams);
  } catch (err) {
    next(err);
  }
});

// 📌 المباريات في بطولة معينة (من قاعدة البيانات)
router.get("/:id/matches", async (req, res, next) => {
  try {
    const matches = await Match.find({ tournament: req.params.id })
      .populate("homeTeam", "name country logo")
      .populate("awayTeam", "name country logo");
    res.json(matches);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
