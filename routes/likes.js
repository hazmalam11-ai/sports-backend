const express = require("express");
const router = express.Router();
const Like = require("../models/Like");
const { requireAuth } = require("../middlewares/auth");

/**
 * ✅ الموديل Like لازم يكون فيه:
 * { user, targetType, targetId }
 * و Unique index على (user, targetType, targetId)
 * عشان ميعملش دبل لايك
 */

// 🟢 إضافة لايك
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { targetType, targetId } = req.body;

    if (!["Comment", "Match", "News"].includes(targetType)) {
      return res
        .status(400)
        .json({ message: "targetType must be Comment, Match or News" });
    }

    const like = await Like.create({
      user: req.user.id,
      targetType,
      targetId,
    });

    res.status(201).json({ message: "Liked successfully", like });
  } catch (err) {
    if (err.code === 11000) {
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

// 👀 عدد اللايكات + حالة المستخدم (تصلح لأي كيان)
router.get("/:targetType/:targetId", async (req, res, next) => {
  try {
    const { targetType, targetId } = req.params;

    if (!["Comment", "Match", "News"].includes(targetType)) {
      return res
        .status(400)
        .json({ message: "targetType must be Comment, Match or News" });
    }

    const count = await Like.countDocuments({ targetType, targetId });

    let userLiked = false;
    if (req.user) {
      userLiked = !!(await Like.exists({
        user: req.user.id,
        targetType,
        targetId,
      }));
    }

    res.json({
      targetType,
      targetId,
      likes: count,
      likedByUser: userLiked,
    });
  } catch (err) {
    next(err);
  }
});

// 📌 إرجاع كل اللايكات الخاصة بمستخدم (ملف شخصي)
router.get("/user/me", requireAuth, async (req, res, next) => {
  try {
    const likes = await Like.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(likes);
  } catch (err) {
    next(err);
  }
});

module.exports = router;