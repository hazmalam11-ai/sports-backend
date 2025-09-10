const mongoose = require("mongoose");

const CoachSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  age: { type: Number },
  nationality: { type: String, trim: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" } // ربط المدرب بفريق
}, { timestamps: true });

module.exports = mongoose.model("Coach", CoachSchema);
