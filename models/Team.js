const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema(
  {
    apiId: {
      type: Number, // ID من API-Sports
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String,
      default: "",
    },
    stadium: {
      name: { type: String, default: "" },
      city: { type: String, default: "" },
      capacity: { type: Number, default: 0 },
    },
    founded: {
      type: Number,
    },
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coach",
    },
  },
  { timestamps: true }
);

// ✅ Virtual: يربط اللاعبين بالفريق
TeamSchema.virtual("players", {
  ref: "Player",
  localField: "_id",
  foreignField: "team",
});

// ✅ Virtual: عدد اللاعبين
TeamSchema.virtual("playerCount").get(function () {
  return this.players ? this.players.length : 0;
});

// ✅ Methods
TeamSchema.methods.getWithPlayers = function () {
  return this.populate("players", "name position age");
};

// ✅ Static: يجيب فريق بالـ API ID
TeamSchema.statics.findByApiId = function (apiId) {
  return this.findOne({ apiId })
    .populate("players", "name position age")
    .populate("coach", "name nationality");
};

// ✅ إظهار الـ virtuals في JSON و Object
TeamSchema.set("toObject", { virtuals: true });
TeamSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.models.Team || mongoose.model("Team", TeamSchema);