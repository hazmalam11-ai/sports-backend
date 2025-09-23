const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const News = require("../models/News");
const { requireAuth, authorize } = require("../middlewares/auth");

const router = express.Router();

// 🔹 مكان تخزين الصور (uploads/news)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/news");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true }); // يعمل فولدر لو مش موجود
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// ➕ إنشاء خبر (يدعم رفع صورة)
router.post(
  "/",
  requireAuth,
  authorize("admin", "editor"),
  upload.single("image"), // هنا بنرفع صورة باسم field "image"
  async (req, res, next) => {
    try {
      const { title, content, category } = req.body;
      if (!title || !content) {
        res.status(400);
        throw new Error("title and content are required");
      }

      // لو فيه صورة
      const imageUrl = req.file ? `/uploads/news/${req.file.filename}` : null;

      const news = await News.create({
        title,
        content,
        category,
        imageUrl,
        author: req.user?.id,
      });

      res.status(201).json({ message: "News created", news });
    } catch (err) {
      next(err);
    }
  }
);

// 📌 كل الأخبار
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

// ✏️ تحديث خبر
router.put(
  "/:id",
  requireAuth,
  authorize("admin", "editor"),
  upload.single("image"),
  async (req, res, next) => {
    try {
      const { title, content, category } = req.body;
      const updateData = { title, content, category };

      if (req.file) {
        updateData.imageUrl = `/uploads/news/${req.file.filename}`;
      }

      const updated = await News.findByIdAndUpdate(req.params.id, updateData, {
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
  }
);

// 🗑️ حذف خبر
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