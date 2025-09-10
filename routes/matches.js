// routes/matches.js
const express = require("express");
const router = express.Router();
const Match = require("../models/Match");
const Like = require("../models/Like");
const { requireAuth, authorize } = require("../middlewares/auth");

// helper: يحاول يقرأ userId لو فيه توكن (لأجل likedByUser)، وإلا يرجع null
function tryGetUserId(req) {
  // لو عندك middleware بيحط req.user لما يكون فيه توكن صالح
  // هتلاقيه موجود في المسارات المحمية. في العامة غالبًا مش موجود.
  return req.user?.id || null;
}

/* =========================
      PUBLIC READ ENDPOINTS
   ========================= */

// GET /matches — عامة
router.get("/", async (req, res) => {
  try {
    const matches = await Match.find()
      .populate("homeTeam", "name country logo")
      .populate("awayTeam", "name country logo")
      .populate("tournament", "name year country")
      .sort({ date: -1 });

    const userId = tryGetUserId(req);

    const matchesWithLikes = await Promise.all(
      matches.map(async (match) => {
        const likesCount = await Like.countDocuments({
          targetType: "Match",
          targetId: match._id,
        });

        let userLiked = false;
        if (userId) {
          userLiked = !!(await Like.exists({
            user: userId,
            targetType: "Match",
            targetId: match._id,
          }));
        }

        return {
          ...match.toObject(),
          likes: likesCount,
          likedByUser: userLiked,
        };
      })
    );

    res.json(matchesWithLikes);
  } catch (err) {
    res.status(500).json({ message: "Error fetching matches", error: err.message });
  }
});

// GET /matches/live — عامة
router.get("/live", async (req, res) => {
  try {
    const liveMatches = await Match.find({
      status: { $in: ["live", "half-time"] },
    })
      .populate("homeTeam", "name country logo")
      .populate("awayTeam", "name country logo")
      .populate("tournament", "name year country")
      .sort({ minute: -1 });

    const userId = tryGetUserId(req);

    const matchesWithLikes = await Promise.all(
      liveMatches.map(async (match) => {
        const likesCount = await Like.countDocuments({
          targetType: "Match",
          targetId: match._id,
        });

        let userLiked = false;
        if (userId) {
          userLiked = !!(await Like.exists({
            user: userId,
            targetType: "Match",
            targetId: match._id,
          }));
        }

        return {
          ...match.toObject(),
          likes: likesCount,
          likedByUser: userLiked,
        };
      })
    );

    res.json(matchesWithLikes);
  } catch (err) {
    res.status(500).json({ message: "Error fetching live matches", error: err.message });
  }
});

// GET /matches/:id — عامة
router.get("/:id", async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate("homeTeam", "name country logo")
      .populate("awayTeam", "name country logo")
      .populate("tournament", "name year country");

    if (!match) return res.status(404).json({ message: "Match not found" });

    const likesCount = await Like.countDocuments({
      targetType: "Match",
      targetId: match._id,
    });

    const userId = tryGetUserId(req);

    let userLiked = false;
    if (userId) {
      userLiked = !!(await Like.exists({
        user: userId,
        targetType: "Match",
        targetId: match._id,
      }));
    }

    res.json({
      ...match.toObject(),
      likes: likesCount,
      likedByUser: userLiked,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching match", error: err.message });
  }
});

/* =========================
     PROTECTED WRITE OPS
   ========================= */

// ➕ إضافة ماتش جديد (admin/editor)
router.post("/", requireAuth, authorize("match:create"), async (req, res) => {
  try {
    const { homeTeam, awayTeam, tournament, date, venue, scoreA, scoreB, status } = req.body;

    if (!homeTeam || !awayTeam || !tournament || !venue) {
      return res
        .status(400)
        .json({ message: "homeTeam, awayTeam, tournament, venue are required" });
    }

    const match = new Match({
      homeTeam,
      awayTeam,
      tournament,
      date,
      venue,
      scoreA: scoreA ?? 0,
      scoreB: scoreB ?? 0,
      status: status || "scheduled",
      events: [],
      minute: 0,
    });
    await match.save();

    const populated = await Match.findById(match._id)
      .populate("homeTeam", "name country logo")
      .populate("awayTeam", "name country logo")
      .populate("tournament", "name year country");

    res.status(201).json({ message: "Match created successfully", match: populated });
  } catch (err) {
    res.status(400).json({ message: "Error creating match", error: err.message });
  }
});

// ✏️ تحديث النتيجة المباشرة (admin/editor)
router.put("/:id/score", requireAuth, authorize("match:edit"), async (req, res) => {
  try {
    const { scoreA, scoreB, minute } = req.body;
    const matchId = req.params.id;

    const updated = await Match.findByIdAndUpdate(
      matchId,
      {
        scoreA: scoreA ?? 0,
        scoreB: scoreB ?? 0,
        minute: minute ?? 0,
        status: "live",
      },
      { new: true, runValidators: true }
    )
      .populate("homeTeam", "name country logo")
      .populate("awayTeam", "name country logo")
      .populate("tournament", "name year country");

    if (!updated) return res.status(404).json({ message: "Match not found" });

    if (global.sendLiveScoreUpdate) {
      global.sendLiveScoreUpdate(matchId, {
        homeScore: updated.scoreA,
        awayScore: updated.scoreB,
        minute: updated.minute,
        homeTeam: updated.homeTeam?.name,
        awayTeam: updated.awayTeam?.name,
      });
    }

    res.json({ message: "Score updated", match: updated });
  } catch (err) {
    res.status(500).json({ message: "Error updating score", error: err.message });
  }
});

// ➕ إضافة حدث (admin/editor)
router.post("/:id/events", requireAuth, authorize("match:edit"), async (req, res) => {
  try {
    const { type, minute, player, team, description } = req.body;
    const matchId = req.params.id;

    if (!type || minute == null || !player || !team) {
      return res.status(400).json({ message: "type, minute, player, team are required" });
    }

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: "Match not found" });

    const newEvent = {
      type, // goal, card, substitution
      minute,
      player,
      team,
      description: description || `${type} by ${player}`,
      timestamp: new Date(),
    };

    match.events.push(newEvent);
    match.minute = minute;
    await match.save();

    const updated = await Match.findById(matchId)
      .populate("homeTeam", "name country logo")
      .populate("awayTeam", "name country logo")
      .populate("tournament", "name year country");

    if (global.sendMatchEvent) {
      global.sendMatchEvent(matchId, {
        type,
        minute,
        player,
        team,
        description: newEvent.description,
      });
    }

    res.json({ message: "Event added", match: updated });
  } catch (err) {
    res.status(500).json({ message: "Error adding event", error: err.message });
  }
});

// ✏️ تحديث الحالة (admin/editor)
router.put("/:id/status", requireAuth, authorize("match:edit"), async (req, res) => {
  try {
    const { status } = req.body;
    const matchId = req.params.id;

    if (!["scheduled", "live", "half-time", "finished"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Use: scheduled, live, half-time, finished" });
    }

    const updated = await Match.findByIdAndUpdate(
      matchId,
      { status },
      { new: true, runValidators: true }
    )
      .populate("homeTeam", "name country logo")
      .populate("awayTeam", "name country logo")
      .populate("tournament", "name year country");

    if (!updated) return res.status(404).json({ message: "Match not found" });

    if (global.sendMatchStatusUpdate) {
      global.sendMatchStatusUpdate(matchId, status);
    }

    res.json({ message: "Status updated", match: updated });
  } catch (err) {
    res.status(500).json({ message: "Error updating status", error: err.message });
  }
});

// ✏️ تعديل عام (admin/editor)
router.put("/:id", requireAuth, authorize("match:edit"), async (req, res) => {
  try {
    const updated = await Match.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("homeTeam", "name country logo")
      .populate("awayTeam", "name country logo")
      .populate("tournament", "name year country");

    if (!updated) return res.status(404).json({ message: "Match not found" });

    res.json({ message: "Match updated", match: updated });
  } catch (err) {
    res.status(500).json({ message: "Error updating match", error: err.message });
  }
});

// 🗑️ حذف (admin)
router.delete("/:id", requireAuth, authorize("match:delete"), async (req, res) => {
  try {
    const deleted = await Match.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Match not found" });

    res.json({ message: "Match deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting match", error: err.message });
  }
});

module.exports = router;