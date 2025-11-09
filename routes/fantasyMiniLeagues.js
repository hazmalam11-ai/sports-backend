const express = require("express");
const router = express.Router();
const { createLeague, joinLeague, getLeaderboard } = require("../services/miniLeagueService");

// ✅ إنشاء دوري جديد
router.post("/", async (req, res) => {
  try {
    const { name, isPublic, adminId } = req.body;
    const league = await createLeague(name, isPublic, adminId);
    res.json(league);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ الانضمام إلى دوري
router.post("/join", async (req, res) => {
  try {
    const { code, userId, teamId } = req.body;
    const league = await joinLeague(code, userId, teamId);
    res.json(league);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ عرض الترتيب
router.get("/:id/leaderboard", async (req, res) => {
  try {
    const leaderboard = await getLeaderboard(req.params.id);
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;