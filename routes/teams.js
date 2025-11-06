// routes/teams.js
const express = require("express");
const router = express.Router();
const Team = require("../models/Team");
const { requireAuth, authorize } = require("../middlewares/auth");
const footballAPI = require("../services/footballAPI");

/* ========================
   ⚙️ TEST
======================== */
router.get("/test", (req, res) => {
  res.json({ message: "Teams route works ✅" });
});

/* ========================
   ⚽ RapidAPI Endpoints
======================== */

// 📌 جلب قائمة كل الفرق في دوري معين
router.get("/api/league/:leagueid", async (req, res) => {
  try {
    const { leagueid } = req.params;
    console.log(`⚽ Fetching teams for league ${leagueid}`);
    const teams = await footballAPI.getTeamsByLeague(leagueid);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json(teams);
  } catch (err) {
    console.error("❌ Error fetching teams by league:", err.message);
    res.status(500).json({ message: "Error fetching teams", error: err.message });
  }
});

// 📌 جلب بيانات فريق واحد من الـ API
router.get("/api/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📄 Fetching team info for team ${id}`);
    const team = await footballAPI.getTeamDetail(id);
    if (!team) return res.status(404).json({ message: "Team not found in API" });
    res.json(team);
  } catch (err) {
    console.error("❌ Error fetching team detail:", err.message);
    res.status(500).json({ message: "Error fetching team from API", error: err.message });
  }
});

// 📌 جلب لاعبي الفريق من الـ API
router.get("/api/:id/players", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`👥 Fetching players for team ${id}`);
    const players = await footballAPI.getPlayersByTeam(id);
    res.json(players);
  } catch (err) {
    console.error("❌ Error fetching players from API:", err.message);
    res.status(500).json({ message: "Error fetching players", error: err.message });
  }
});

/* ========================
   💾 MongoDB Endpoints
======================== */

// ➕ إضافة فريق جديد (admin/editor)
router.post("/", requireAuth, authorize("admin", "editor"), async (req, res) => {
  try {
    const team = new Team(req.body);
    await team.save();
    res.status(201).json({ message: "Team created successfully", team });
  } catch (err) {
    console.error("❌ Error creating team:", err.message);
    res.status(400).json({ message: "Error creating team", error: err.message });
  }
});

// 📌 عرض جميع الفرق من قاعدة البيانات
router.get("/", async (req, res) => {
  try {
    const teams = await Team.find().populate("players", "name position");
    res.json(teams);
  } catch (err) {
    console.error("❌ Error fetching teams:", err.message);
    res.status(500).json({ message: "Error fetching teams", error: err.message });
  }
});

// 📌 عرض فريق واحد بالـ ID من قاعدة البيانات
router.get("/:id", async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate("players", "name position");
    if (!team) return res.status(404).json({ message: "Team not found" });
    res.json(team);
  } catch (err) {
    console.error("❌ Error fetching team:", err.message);
    res.status(500).json({ message: "Error fetching team", error: err.message });
  }
});

// ✏️ تعديل فريق (admin/editor)
router.put("/:id", requireAuth, authorize("admin", "editor"), async (req, res) => {
  try {
    const updated = await Team.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Team not found" });
    res.json({ message: "Team updated successfully", team: updated });
  } catch (err) {
    console.error("❌ Error updating team:", err.message);
    res.status(500).json({ message: "Error updating team", error: err.message });
  }
});

// 🗑️ حذف فريق (admin فقط)
router.delete("/:id", requireAuth, authorize("admin"), async (req, res) => {
  try {
    const deleted = await Team.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Team not found" });
    res.json({ message: "Team deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting team:", err.message);
    res.status(500).json({ message: "Error deleting team", error: err.message });
  }
});

module.exports = router;
