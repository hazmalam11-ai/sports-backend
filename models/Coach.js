const mongoose = require("mongoose");

const CoachSchema = new mongoose.Schema(
  {
    apiId: {
      type: Number, // ID من API-Sports
      unique: true,
      sparse: true, // يسمح بوجود null لكن يمنع التكرار لو فيه قيمة
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
    },
    nationality: {
      type: String,
      trim: true,
      default: "",
    },
    photo: {
      type: String,
      default: "",
    }, // صورة المدرب
    birth: {
      date: { type: Date },
      place: { type: String, default: "" },
      country: { type: String, default: "" },
    },

    // ✅ ربط المدرب بفريق
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },

    // ✅ إحصائيات المدرب (اختياري)
    stats: {
      matches: { type: Number, default: 0 }, // عدد المباريات اللي دربها
      wins: { type: Number, default: 0 },
      draws: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      trophies: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// ✅ Virtual: يجيب اسم الفريق اللي بيدربه
CoachSchema.virtual("teamName", {
  ref: "Team",
  localField: "team",
  foreignField: "_id",
  justOne: true,
  options: { select: "name country logo" },
});

// ✅ Method: يجهز بروفايل كامل للمدرب
CoachSchema.methods.getProfile = function () {
  return {
    id: this._id,
    apiId: this.apiId,
    name: this.name,
    age: this.age,
    nationality: this.nationality,
    photo: this.photo,
    birth: this.birth,
    stats: this.stats,
    team: this.team,
  };
};

// ✅ إظهار الـ virtuals
CoachSchema.set("toObject", { virtuals: true });
CoachSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.models.Coach || mongoose.model("Coach", CoachSchema);