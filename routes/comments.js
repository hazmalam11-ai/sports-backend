const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment");
const Like = require("../models/Like"); // ✅ جديد
const { requireAuth, authorize, allowOwnerOr } = require("../middlewares/auth");

// 🟢 إضافة تعليق (أي user أو editor أو admin)
router.post(
  "/",
  requireAuth,
  authorize("user", "editor", "admin"),
  async (req, res, next) => {
    try {
      const { match, body } = req.body;

      if (!match || !body) {
        res.status(400);
        throw new Error("match and body are required");
      }

      const comment = await Comment.create({
        match,
        body,
        author: req.user.id,
      });

      res
        .status(201)
        .json({ message: "Comment added successfully", comment });
    } catch (err) {
      next(err);
    }
  }
);

// 📌 عرض كل التعليقات (مع عدد اللايكات + حالة المستخدم)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const comments = await Comment.find()
      .populate("author", "username email role")
      .populate("match", "homeTeam awayTeam date");

    const commentsWithLikes = await Promise.all(
      comments.map(async (comment) => {
        const likesCount = await Like.countDocuments({
          targetType: "Comment",
          targetId: comment._id,
        });

        const userLiked = await Like.exists({
          user: req.user.id,
          targetType: "Comment",
          targetId: comment._id,
        });

        return {
          ...comment.toObject(),
          likes: likesCount,
          likedByUser: !!userLiked,
        };
      })
    );

    res.json(commentsWithLikes);
  } catch (err) {
    next(err);
  }
});

// 📌 عرض تعليق واحد (مع عدد اللايكات + حالة المستخدم)
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate("author", "username email role")
      .populate("match", "homeTeam awayTeam date");

    if (!comment) {
      res.status(404);
      throw new Error("Comment not found");
    }

    const likesCount = await Like.countDocuments({
      targetType: "Comment",
      targetId: comment._id,
    });

    const userLiked = await Like.exists({
      user: req.user.id,
      targetType: "Comment",
      targetId: comment._id,
    });

    res.json({
      ...comment.toObject(),
      likes: likesCount,
      likedByUser: !!userLiked,
    });
  } catch (err) {
    next(err);
  }
});

// ✏️ تعديل تعليق (المالك أو admin فقط)
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
      );

      if (!updated) {
        res.status(404);
        throw new Error("Comment not found");
      }

      res.json({
        message: "Comment updated successfully",
        comment: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

// 🗑️ حذف تعليق (المالك أو admin فقط)
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
        res.status(404);
        throw new Error("Comment not found");
      }

      res.json({ message: "Comment deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
