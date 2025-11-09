const mongoose = require("mongoose");

const MiniLeagueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true }, // كود الدعوة
    isPublic: { type: Boolean, default: false },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        team: { type: mongoose.Schema.Types.ObjectId, ref: "FantasyTeam", required: true },
        points: { type: Number, default: 0 },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.models.MiniLeague || mongoose.model("MiniLeague", MiniLeagueSchema);