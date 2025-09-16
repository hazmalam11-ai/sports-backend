const mongoose = require("mongoose");

const TournamentSchema = new mongoose.Schema(
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
    season: {
      type: Number,
      required: true,
    },
    logo: {
      type: String, // شعار البطولة (اختياري)
      default: "",
    },
    type: {
      type: String,
      enum: ["League", "Cup", "Friendly"], // نوع البطولة
      default: "League",
    },
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team", // ربط البطولة بالفرق
      },
    ],
  },
  { timestamps: true }
);

// ✅ Indexes للبحث السريع
TournamentSchema.index({ name: 1, season: -1 });
TournamentSchema.index({ country: 1 });

// ✅ Virtual: عدد الفرق
TournamentSchema.virtual("teamCount").get(function () {
  return this.teams ? this.teams.length : 0;
});

// ✅ Method: يجيب تفاصيل البطولة مع الفرق
TournamentSchema.methods.getWithTeams = function () {
  return this.populate("teams", "name country logo");
};

// ✅ Static: يجيب بطولة معينة بالـ API ID
TournamentSchema.statics.findByApiId = function (apiId) {
  return this.findOne({ apiId }).populate("teams", "name country logo");
};

module.exports =
  mongoose.models.Tournament || mongoose.model("Tournament", TournamentSchema);