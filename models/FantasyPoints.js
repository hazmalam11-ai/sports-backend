const mongoose = require("mongoose");

const FantasyPointsSchema = new mongoose.Schema(
  {
    player: { type: mongoose.Schema.Types.ObjectId, ref: "Player", required: true },
    match: { type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true },
    gameweek: { type: mongoose.Schema.Types.ObjectId, ref: "FantasyGameweek", required: true },

    // توزيع النقاط
    minutesPlayed: { type: Number, default: 0 },
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    cleanSheet: { type: Boolean, default: false },
    goalsConceded: { type: Number, default: 0 },
    yellowCards: { type: Number, default: 0 },
    redCards: { type: Number, default: 0 },
    penaltiesSaved: { type: Number, default: 0 },
    penaltiesMissed: { type: Number, default: 0 },

    totalPoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.FantasyPoints ||
  mongoose.model("FantasyPoints", FantasyPointsSchema);