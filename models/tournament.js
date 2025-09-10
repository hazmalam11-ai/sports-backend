const mongoose = require("mongoose");

const TournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  teams: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team"   // ربط البطولة بالفرق
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Tournament", TournamentSchema);
