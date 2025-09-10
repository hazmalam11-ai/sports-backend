const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      enum: ["Comment", "Match"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetType", // ديناميك يربط مع Comment أو Match
    },
  },
  { timestamps: true }
);

// 🔑 منع التكرار: نفس المستخدم ما يعملش لايك مرتين على نفس الهدف
likeSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model("Like", likeSchema);

