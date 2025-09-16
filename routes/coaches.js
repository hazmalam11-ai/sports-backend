const express = require("express");
const Coach = require("../models/Coach");
const { requireAuth, authorize } = require("../middlewares/auth");
const { getCoachInfo } = require("../services/footballAPI"); // لو عندك في API

const router = express.Router();

/* ==========================
   MongoDB CRUD Endpoints
   ========================== */

// ➕ إضافة مدرب (admin/editor)
router.post("/", requireAuth, authorize("coach:create"), async (req, res, next) => {
  try {
    const { name, age, team } = req.body;
    if (!name || !team) {
      return res.status(400).json({ message: "name and team are required" });
    }

    const coach = await Coach.create({ name, age, team });
    res.status(201).json({ message: "Coach created successfully", coach });
  } catch (err) {
    next(err);
  }
});

// 📌 كل المدربين
router.get("/", async (req, res, next) => {
  try {
    const coaches = await Coach.find().populate("team", "name country logo");
    res.json(coaches);
  } catch (err) {
    next(err);
  }
});

// 📌 مدرب واحد
router.get("/:id", async (req, res, next) => {
  try {
    const coach = await Coach.findById(req.params.id).populate("team", "name country logo");
    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }
    res.json(coach);
  } catch (err) {
    next(err);
  }
});

// ✏️ تحديث مدرب (admin/editor)
router.put("/:id", requireAuth, authorize("coach:update"), async (req, res, next) => {
  try {
    const coach = await Coach.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("team", "name country logo");

    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }
    res.json({ message: "Coach updated successfully", coach });
  } catch (err) {
    next(err);
  }
});

// 🗑️ حذف مدرب (admin فقط)
router.delete("/:id", requireAuth, authorize("coach:delete"), async (req, res, next) => {
  try {
    const coach = await Coach.findByIdAndDelete(req.params.id);
    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }
    res.json({ message: "Coach deleted successfully" });
  } catch (err) {
    next(err);
  }
});

/* ==========================
   API-Football Integration
   ========================== */

// 📌 جلب بيانات مدرب من API خارجي
router.get("/api/:id", async (req, res, next) => {
  try {
    const coach = await getCoachInfo(req.params.id); // محتاجة دالة في services/footballAPI.js
    if (!coach) {
      return res.status(404).json({ message: "Coach not found in API" });
    }
    res.json(coach);
  } catch (err) {
    next(err);
  }
});

module.exports = router;