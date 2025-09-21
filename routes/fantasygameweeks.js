const express = require("express");
const Gameweek = require("../models/Gameweek");
const FantasyTeam = require("../models/FantasyTeam");
const Match = require("../models/Match");
const router = express.Router();

// ➕ إنشاء جولة جديدة
router.post("/", async (req, res) => {
  try {
    const { number, startDate, endDate, matches } = req.body;
    const gw = await Gameweek.create({ number, startDate, endDate, matches });
    res.status(201).json({ message: "Gameweek created", gameweek: gw });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 جلب الجولة الحالية
router.get("/current", async (req, res) => {
  try {
    const gw = await Gameweek.findOne({ isActive: true }).populate("matches");
    res.json(gw || { message: "No active gameweek" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ تفعيل جولة
router.post("/:id/activate", async (req, res) => {
  try {
    await Gameweek.updateMany({}, { isActive: false }); // قفل الباقي
    const gw = await Gameweek.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    res.json({ message: "Gameweek activated", gameweek: gw });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ قفل الجولة وحساب النقاط
router.post("/:id/finish", async (req, res) => {
  try {
    const gw = await Gameweek.findById(req.params.id).populate("matches");
    if (!gw) return res.status(404).json({ error: "Gameweek not found" });

    gw.isFinished = true;
    gw.isActive = false;
    await gw.save();

    // 🏆 حساب النقاط (تجريبي – هتربطه لاحقًا بإحصائيات اللاعبين)
    const teams = await FantasyTeam.find();
    for (const team of teams) {
      const points = Math.floor(Math.random() * 80); // 🔥 مؤقت، لحد ما نربطه بالإحصائيات الحقيقية
      team.totalPoints += points;
      team.pointsHistory.push({ gameweek: gw._id, points });
      await team.save();
    }

    res.json({ message: "Gameweek finished & points calculated ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;