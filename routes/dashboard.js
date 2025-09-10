const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Match = require("../models/Match");
const Comment = require("../models/Comment");
const Like = require("../models/Like");
const { requireAuth, authorize } = require("../middlewares/auth");

// 📊 Dashboard Stats (Admin Only)
router.get("/", requireAuth, authorize("admin"), async (req, res, next) => {
  try {
    const usersCount = await User.countDocuments();
    const matchesCount = await Match.countDocuments();
    const commentsCount = await Comment.countDocuments();
    const likesCount = await Like.countDocuments();

    // 🟢 أكتر تعليق واخد لايكات
    const mostLikedComment = await Like.aggregate([
      { $match: { targetType: "Comment" } },
      { $group: { _id: "$targetId", totalLikes: { $sum: 1 } } },
      { $sort: { totalLikes: -1 } },
      { $limit: 1 }
    ]);

    let topComment = null;
    if (mostLikedComment.length > 0) {
      const commentDoc = await Comment.findById(mostLikedComment[0]._id)
        .populate("author", "username");
      if (commentDoc) {
        topComment = {
          id: commentDoc._id,
          body: commentDoc.body,
          likes: mostLikedComment[0].totalLikes,
          author: commentDoc.author?.username || "Unknown"
        };
      }
    }

    // 🔵 أكتر ماتش واخد تعليقات
    const mostCommentedMatch = await Comment.aggregate([
      { $group: { _id: "$match", totalComments: { $sum: 1 } } },
      { $sort: { totalComments: -1 } },
      { $limit: 1 }
    ]);

    let topMatch = null;
    if (mostCommentedMatch.length > 0) {
      const matchDoc = await Match.findById(mostCommentedMatch[0]._id)
        .populate("homeTeam awayTeam", "name");
      if (matchDoc) {
        topMatch = {
          id: matchDoc._id,
          home: matchDoc.homeTeam?.name || "Unknown",
          away: matchDoc.awayTeam?.name || "Unknown",
          comments: mostCommentedMatch[0].totalComments
        };
      }
    }

    res.json({
      usersCount,
      matchesCount,
      commentsCount,
      likesCount,
      topComment: topComment || "No comments yet",
      topMatch: topMatch || "No matches with comments yet"
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
