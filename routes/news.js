
const express = require("express");
const News = require("../models/News");
const { requireAuth, authorize } = require("../middlewares/auth");

const router = express.Router();

// ➕ إنشاء خبر (admin/editor)
router.post("/", requireAuth, authorize("team:create"), async (req, res, next) => {
  try {
    const { title, content, imageUrl } = req.body;
    if (!title || !content) {
      res.status(400);
      throw new Error("title and content are required");
    }
    const news = await News.create({ title, content, imageUrl });
    res.status(201).json({ message: "News created", news });
  } catch (err) {
    next(err);
  }
});

// 📌 كل الأخبار (مفتوحة)
router.get("/", async (req, res, next) => {
  try {
    const { q } = req.query;
    const filter = q ? { title: { $regex: q, $options: "i" } } : {};
    const news = await News.find(filter).sort({ createdAt: -1 });
    res.json(news);
  } catch (err) {
    next(err);
  }
});

// 📌 خبر واحد
router.get("/:id", async (req, res, next) => {
  try {
    const item = await News.findById(req.params.id);
    if (!item) {
      res.status(404);
      throw new Error("News not found");
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// ✏️ تحديث خبر
router.put("/:id", requireAuth, authorize("team:update"), async (req, res, next) => {
  try {
    const updated = await News.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      res.status(404);
      throw new Error("News not found");
    }
    res.json({ message: "News updated", news: updated });
  } catch (err) {
    next(err);
  }
});

// 🗑️ حذف خبر
router.delete("/:id", requireAuth, authorize("team:delete"), async (req, res, next) => {
  try {
    const deleted = await News.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404);
      throw new Error("News not found");
    }
    res.json({ message: "News deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;


