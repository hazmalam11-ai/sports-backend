

const express = require("express");
const router = express.Router();
const Team = require("../models/Team");
const { requireAuth, authorize } = require("../middlewares/auth"); // ✅ تأكد إن المسار صح (middlewares)

// ➕ إضافة فريق (admin/editor)
router.post("/", requireAuth, authorize("team:create"), async (req, res) => {
  try {
    const team = new Team(req.body);
    await team.save();
    res.status(201).json({ message: "Team created successfully", team });
  } catch (err) {
    res.status(400).json({ message: "Error creating team", error: err.message });
  }
});

// 📌 عرض كل الفرق (مفتوح للجميع)
router.get("/", async (req, res) => {
  try {
    const teams = await Team.find().populate("players", "name position");
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: "Error fetching teams", error: err.message });
  }
});

// 📌 عرض فريق واحد بالـ ID
router.get("/:id", async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate("players", "name position");
    if (!team) return res.status(404).json({ message: "Team not found" });

    res.json(team);
  } catch (err) {
    res.status(500).json({ message: "Error fetching team", error: err.message });
  }
});

// ✏️ تعديل فريق (admin/editor)
router.put("/:id", requireAuth, authorize("team:edit"), async (req, res) => {
  try {
    const updated = await Team.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Team not found" });

    res.json({ message: "Team updated", team: updated });
  } catch (err) {
    res.status(500).json({ message: "Error updating team", error: err.message });
  }
});

// 🗑️ حذف فريق (admin فقط)
router.delete("/:id", requireAuth, authorize("team:delete"), async (req, res) => {
  try {
    const deleted = await Team.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Team not found" });

    res.json({ message: "Team deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting team", error: err.message });
  }
});

module.exports = router;


