const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3 },
    content: { type: String, required: true, trim: true, minlength: 10 },
    imageUrl: { type: String, default: "" },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // اختياري
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("News", newsSchema);
