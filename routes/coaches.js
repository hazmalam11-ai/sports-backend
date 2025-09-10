
const express = require("express");
const Coach = require("../models/Coach");
const router = express.Router();

// ➕ إضافة مدرب
router.post("/", async (req, res, next) => {
  try {
    const { name, age, team } = req.body;
    if (!name || !team) {
      res.status(400);
      throw new Error("name and team are required");
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
    const coaches = await Coach.find().populate("team", "name country");
    res.json(coaches);
  } catch (err) {
    next(err);
  }
});

// 📌 مدرب واحد
router.get("/:id", async (req, res, next) => {
  try {
    const coach = await Coach.findById(req.params.id).populate("team", "name country");
    if (!coach) {
      res.status(404);
      throw new Error("Coach not found");
    }
    res.json(coach);
  } catch (err) {
    next(err);
  }
});

// ✏️ تحديث مدرب
router.put("/:id", async (req, res, next) => {
  try {
    const coach = await Coach.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("team", "name country");

    if (!coach) {
      res.status(404);
      throw new Error("Coach not found");
    }
    res.json({ message: "Coach updated successfully", coach });
  } catch (err) {
    next(err);
  }
});

// 🗑️ حذف مدرب
router.delete("/:id", async (req, res, next) => {
  try {
    const coach = await Coach.findByIdAndDelete(req.params.id);
    if (!coach) {
      res.status(404);
      throw new Error("Coach not found");
    }
    res.json({ message: "Coach deleted successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
