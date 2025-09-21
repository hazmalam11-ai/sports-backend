const express = require("express");
const router = express.Router();
const FantasyPoints = require("../models/FantasyPoints");

// ✅ إضافة نقاط لاعب
router.post("/", async (req, res) => {
  try {
    const points = await FantasyPoints.create(req.body);
    res.status(201).json({ message: "Points added", points });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ جلب النقاط الخاصة بلاعب
router.get("/player/:id", async (req, res) => {
  try {
    const points = await FantasyPoints.find({ player: req.params.id }).populate("match gameweek");
    res.json(points);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;