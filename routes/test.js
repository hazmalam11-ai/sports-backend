const express = require("express");
const router = express.Router();

// 📌 استدعاء المودلز (بالطريقة الصح)
const User = require("../models/user");
const Team = require("../models/Team");
const Player = require("../models/Player");
const Coach = require("../models/Coach");
const Match = require("../models/match");
const Tournament = require("../models/tournament");
const Comment = require("../models/Comment");
const Like = require("../models/Like");
const News = require("../models/news");

// ✅ Route للتجربة البسيطة
router.get("/", (req, res) => {
  res.json({ message: "✅ Test route is working!" });
});

// ✅ Route لاختبار المودلز كلها
router.get("/models", (req, res) => {
  try {
    res.json({
      message: "📊 Models loaded successfully",
      models: {
        User: !!User,
        Team: !!Team,
        Player: !!Player,
        Coach: !!Coach,
        Match: !!Match,
        Tournament: !!Tournament,
        Comment: !!Comment,
        Like: !!Like,
        News: !!News,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "خطأ في تحميل المودلز", details: error.message });
  }
});

module.exports = router;