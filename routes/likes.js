
const express = require("express");
const router = express.Router();
const Like = require("../models/Like"); // ✅ لازم يكون موجود
const { requireAuth } = require("../middlewares/auth");

// 🟢 إضافة لايك
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { targetType, targetId } = req.body;

    if (!["Comment", "Match"].includes(targetType)) {
      return res
        .status(400)
        .json({ message: "targetType must be Comment or Match" });
    }

    const like = await Like.create({
      user: req.user.id,
      targetType,
      targetId,
    });

    res.status(201).json({ message: "Liked successfully", like });
  } catch (err) {
    if (err.code === 11000) {
      // Error من الـ unique index
      return res.status(400).json({ message: "You already liked this item" });
    }
    next(err);
  }
});

// 🟡 إلغاء لايك
router.delete("/", requireAuth, async (req, res, next) => {
  try {
    const { targetType, targetId } = req.body;

    const deleted = await Like.findOneAndDelete({
      user: req.user.id,
      targetType,
      targetId,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Like not found" });
    }

    res.json({ message: "Unliked successfully" });
  } catch (err) {
    next(err);
  }
});

// 👀 عدد اللايكات + حالة المستخدم
router.get("/:targetType/:targetId", requireAuth, async (req, res, next) => {
  try {
    const { targetType, targetId } = req.params;

    if (!["Comment", "Match"].includes(targetType)) {
      return res
        .status(400)
        .json({ message: "targetType must be Comment or Match" });
    }

    const count = await Like.countDocuments({ targetType, targetId });

    const userLiked = await Like.exists({
      user: req.user.id,
      targetType,
      targetId,
    });

    res.json({
      targetType,
      targetId,
      likes: count,
      likedByUser: !!userLiked,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
