const express = require("express");
const News = require("../models/News");
const { requireAuth, authorize } = require("../middlewares/auth");

const router = express.Router();

// ➕ إنشاء خبر (admin, editor)
router.post("/", requireAuth, authorize("admin", "editor"), async (req, res, next) => {
  try {
    const { title, content, imageUrl } = req.body;
    if (!title || !content) {
      res.status(400);
      throw new Error("title and content are required");
    }
    const news = await News.create({ title, content, imageUrl, author: req.user?.id });
    res.status(201).json({ message: "News created", news });
  } catch (err) {
    next(err);
  }
});

// 📌 كل الأخبار (مفتوحة للجميع)
router.get("/", async (req, res, next) => {
  try {
    const { q } = req.query;
    const filter = q ? { title: { $regex: q, $options: "i" } } : {};
    const news = await News.find(filter)
      .populate("author", "username email role")
      .sort({ createdAt: -1 });
    res.json(news);
  } catch (err) {
    next(err);
  }
});

// 📌 خبر واحد
router.get("/:id", async (req, res, next) => {
  try {
    const item = await News.findById(req.params.id).populate("author", "username email role");
    if (!item) {
      res.status(404);
      throw new Error("News not found");
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// ✏️ تحديث خبر (admin, editor)
router.put("/:id", requireAuth, authorize("admin", "editor"), async (req, res, next) => {
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

// 🗑️ حذف خبر (admin فقط)
router.delete("/:id", requireAuth, authorize("admin"), async (req, res, next) => {
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