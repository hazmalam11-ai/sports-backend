// routes/fantasyScoring.js
const express = require("express");
const FantasyTeam = require("../models/FantasyTeam");
const router = express.Router();

// ✅ حساب النقاط (مثال مبسط)
router.post("/calculate/:teamId", async (req, res) => {
  try {
    const team = await FantasyTeam.findById(req.params.teamId).populate("players.player");

    if (!team) return res.status(404).json({ error: "الفريق غير موجود" });

    let points = 0;

    team.players.forEach((p) => {
      if (p.player && p.player.position === "Forward") points += 4;
      if (p.isCaptain) points *= 2;
    });

    team.totalPoints += points;
    await team.save();

    res.json({ message: "✅ تم تحديث النقاط", totalPoints: team.totalPoints });
  } catch (err) {
    res.status(500).json({ error: "❌ خطأ أثناء حساب النقاط" });
  }
});

module.exports = router;