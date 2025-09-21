const express = require("express");
const router = express.Router();
const FantasyTeam = require("../models/FantasyTeam");
const { requireAuth } = require("../middlewares/auth");

// ✅ إنشاء فريق جديد
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, players } = req.body;

    if (!name || !players || players.length !== 15) {
      return res.status(400).json({ message: "Team name and 15 players required" });
    }

    const team = await FantasyTeam.create({
      user: req.user.id,
      name,
      players,
    });

    res.status(201).json({ message: "Fantasy team created", team });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ جلب كل الفرق الخاصة باليوزر
router.get("/my", requireAuth, async (req, res) => {
  try {
    const teams = await FantasyTeam.find({ user: req.user.id }).populate("players.player");
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ تحديث فريق (تحويلات أو تعديل لاعبين)
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const updated = await FantasyTeam.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate("players.player");

    if (!updated) return res.status(404).json({ message: "Team not found" });

    res.json({ message: "Team updated", team: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;