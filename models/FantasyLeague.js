const mongoose = require("mongoose");

const FantasyLeagueSchema = new mongoose.Schema(
  {
    // اسم الدوري
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // نوع الدوري (عام / خاص)
    type: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    // الكود لو الدوري خاص (زي فانتازي البريميرليج)
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
    },

    // صاحب الدوري (اللي أنشأه)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // الفرق المشتركة
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FantasyTeam",
      },
    ],

    // ترتيب الفرق (يتحدث بعد كل جولة)
    standings: [
      {
        team: { type: mongoose.Schema.Types.ObjectId, ref: "FantasyTeam" },
        points: { type: Number, default: 0 },
        rank: { type: Number, default: null },
      },
    ],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.FantasyLeague ||
  mongoose.model("FantasyLeague", FantasyLeagueSchema);