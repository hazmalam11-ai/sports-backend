
const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    country: { type: String, required: true },
  },
  { timestamps: true }
);

// Virtual: يربط كل اللاعبين بالفريق من غير ما يتخزنوا جوا الـ team مباشرة
TeamSchema.virtual("players", {
  ref: "Player",
  localField: "_id",
  foreignField: "team",
});

// عشان يتشمل الـ virtuals في JSON و Object
TeamSchema.set("toObject", { virtuals: true });
TeamSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Team", TeamSchema);
