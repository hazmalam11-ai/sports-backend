const express = require("express");
const router = express.Router();
const FantasyLeague = require("../models/FantasyLeague");
const { requireAuth } = require("../middlewares/auth");
const { nanoid } = require("nanoid");

// ✅ إنشاء دوري
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, type } = req.body;

    const league = await FantasyLeague.create({
      name,
      type,
      inviteCode: type === "private" ? nanoid(8) : null,
      createdBy: req.user.id,
    });

    res.status(201).json({ message: "League created", league });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ الانضمام لدوري
router.post("/join", requireAuth, async (req, res) => {
  try {
    const { inviteCode, teamId } = req.body;
    const league = await FantasyLeague.findOne({ inviteCode });

    if (!league) return res.status(404).json({ message: "League not found" });

    if (league.teams.includes(teamId)) {
      return res.status(400).json({ message: "Team already in league" });
    }

    league.teams.push(teamId);
    await league.save();

    res.json({ message: "Joined league", league });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ جلب الترتيب
router.get("/:id/standings", async (req, res) => {
  try {
    const league = await FantasyLeague.findById(req.params.id).populate("standings.team");
    if (!league) return res.status(404).json({ message: "League not found" });

    res.json(league.standings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;