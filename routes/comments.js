const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment");
const Like = require("../models/Like");
const { requireAuth, authorize, allowOwnerOr } = require("../middlewares/auth");

/* ==========================
   CREATE
   ========================== */

// 🟢 إضافة تعليق (أي user أو editor أو admin)
router.post(
  "/",
  requireAuth,
  authorize("user", "editor", "admin"),
  async (req, res, next) => {
    try {
      const { match, body } = req.body;

      if (!match || !body) {
        return res.status(400).json({ message: "match and body are required" });
      }

      const comment = await Comment.create({
        match,
        body,
        author: req.user.id,
      });

      const populated = await Comment.findById(comment._id)
        .populate("author", "username email role")
        .populate("match", "homeTeam awayTeam date");

      res.status(201).json({ message: "Comment added successfully", comment: populated });
    } catch (err) {
      next(err);
    }
  }
);

/* ==========================
   READ
   ========================== */

// 📌 كل التعليقات (مفتوح للجميع)
router.get("/", async (req, res, next) => {
  try {
    const comments = await Comment.find()
      .populate("author", "username email role")
      .populate("match", "homeTeam awayTeam date")
      .sort({ createdAt: -1 });

    const userId = req.user?.id || null;

    const commentsWithLikes = await Promise.all(
      comments.map(async (comment) => {
        const likesCount = await Like.countDocuments({
          targetType: "Comment",
          targetId: comment._id,
        });

        let userLiked = false;
        if (userId) {
          userLiked = !!(await Like.exists({
            user: userId,
            targetType: "Comment",
            targetId: comment._id,
          }));
        }

        return {
          ...comment.toObject(),
          likes: likesCount,
          likedByUser: userLiked,
        };
      })
    );

    res.json(commentsWithLikes);
  } catch (err) {
    next(err);
  }
});

// 📌 تعليق واحد
router.get("/:id", async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate("author", "username email role")
      .populate("match", "homeTeam awayTeam date");

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const likesCount = await Like.countDocuments({
      targetType: "Comment",
      targetId: comment._id,
    });

    const userLiked = req.user
      ? !!(await Like.exists({
          user: req.user.id,
          targetType: "Comment",
          targetId: comment._id,
        }))
      : false;

    res.json({
      ...comment.toObject(),
      likes: likesCount,
      likedByUser: userLiked,
    });
  } catch (err) {
    next(err);
  }
});

/* ==========================
   UPDATE
   ========================== */

// ✏️ تعديل تعليق (المالك أو admin)
router.put(
  "/:id",
  requireAuth,
  allowOwnerOr(async (req) => {
    const comment = await Comment.findById(req.params.id);
    return comment?.author;
  }),
  async (req, res, next) => {
    try {
      const updated = await Comment.findByIdAndUpdate(
        req.params.id,
        { body: req.body.body },
        { new: true, runValidators: true }
      )
        .populate("author", "username email role")
        .populate("match", "homeTeam awayTeam date");

      if (!updated) {
        return res.status(404).json({ message: "Comment not found" });
      }

      res.json({ message: "Comment updated successfully", comment: updated });
    } catch (err) {
      next(err);
    }
  }
);

/* ==========================
   DELETE
   ========================== */

// 🗑️ حذف تعليق (المالك أو admin)
router.delete(
  "/:id",
  requireAuth,
  allowOwnerOr(async (req) => {
    const comment = await Comment.findById(req.params.id);
    return comment?.author;
  }),
  async (req, res, next) => {
    try {
      const deleted = await Comment.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Comment not found" });
      }

      res.json({ message: "Comment deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;