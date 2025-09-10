const express = require("express");
const Player = require("../models/Player");
const { requireAuth, authorize } = require("../middlewares/auth");

const router = express.Router();

// ➕ إنشاء لاعب (admin/editor)
router.post("/", requireAuth, authorize("team:create"), async (req, res, next) => {
  try {
    const { name, position, team } = req.body;
    if (!name || !position || !team) {
      res.status(400);
      throw new Error("name, position, team are required");
    }
    const player = await Player.create(req.body);
    const populated = await Player.findById(player._id).populate("team", "name country");
    res.status(201).json({ message: "Player created", player: populated });
  } catch (err) {
    next(err);
  }
});

// 📌 كل اللاعبين (مفتوحة)
router.get("/", async (req, res, next) => {
  try {
    const players = await Player.find().populate("team", "name country");
    res.json(players);
  } catch (err) {
    next(err);
  }
});

// 📌 لاعب واحد
router.get("/:id", async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id).populate("team", "name country");
    if (!player) {
      res.status(404);
      throw new Error("Player not found");
    }
    res.json(player);
  } catch (err) {
    next(err);
  }
});

// ✏️ تحديث لاعب
router.put("/:id", requireAuth, authorize("team:update"), async (req, res, next) => {
  try {
    const updated = await Player.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("team", "name country");
    if (!updated) {
      res.status(404);
      throw new Error("Player not found");
    }
    res.json({ message: "Player updated", player: updated });
  } catch (err) {
    next(err);
  }
});

// 🗑️ حذف لاعب
router.delete("/:id", requireAuth, authorize("team:delete"), async (req, res, next) => {
  try {
    const deleted = await Player.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404);
      throw new Error("Player not found");
    }
    res.json({ message: "Player deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;





