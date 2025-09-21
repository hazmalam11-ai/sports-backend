const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema(
  {
    apiId: {
      type: Number, // ID من API-Sports
      unique: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    age: { type: Number },
    position: { type: String, required: true, trim: true },
    nationality: { type: String, default: "", trim: true },
    photo: { type: String, default: "" },
    birth: {
      date: { type: Date },
      place: { type: String, default: "" },
      country: { type: String, default: "" },
    },
    height: { type: String, default: "" },
    weight: { type: String, default: "" },

    // ✅ ربط اللاعب بالفريق
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },

    // ✅ بيانات الفانتازي
    price: { type: Number, default: 5 }, // سعر اللاعب
    totalPoints: { type: Number, default: 0 }, // مجموع النقاط
    gameweekPoints: [
      {
        gameweek: { type: Number },
        points: { type: Number, default: 0 },
      },
    ],

    // ✅ إحصائيات إضافية
    stats: {
      appearances: { type: Number, default: 0 },
      goals: { type: Number, default: 0 },
      assists: { type: Number, default: 0 },
      yellowCards: { type: Number, default: 0 },
      redCards: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Virtual: اسم الفريق
PlayerSchema.virtual("teamName", {
  ref: "Team",
  localField: "team",
  foreignField: "_id",
  justOne: true,
  options: { select: "name country" },
});

// Static Method: البحث بالـ API ID
PlayerSchema.statics.findByApiId = function (apiId) {
  return this.findOne({ apiId }).populate("team", "name country logo");
};

// Method: يجيب اللاعب + إحصائياته
PlayerSchema.methods.getProfile = function () {
  return {
    id: this._id,
    name: this.name,
    age: this.age,
    position: this.position,
    nationality: this.nationality,
    photo: this.photo,
    team: this.team,
    price: this.price,
    totalPoints: this.totalPoints,
    stats: this.stats,
  };
};

// إظهار الـ virtuals
PlayerSchema.set("toObject", { virtuals: true });
PlayerSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.models.Player || mongoose.model("Player", PlayerSchema);