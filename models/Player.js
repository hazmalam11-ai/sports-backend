
const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number },
    position: { type: String, required: true }, // مركز اللاعب
    // ربط اللاعب بالفريق
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true }
  },
  { timestamps: true }
);

// ✅ Hook لتحديث قائمة اللاعبين في الفريق عند إضافة لاعب
PlayerSchema.post("save", async function (doc, next) {
  try {
    const Team = mongoose.model("Team");
    await Team.findByIdAndUpdate(doc.team, { $addToSet: { players: doc._id } });
    next();
  } catch (err) {
    next(err);
  }
});

// ✅ Hook لتحديث الفريق عند حذف اللاعب
PlayerSchema.post("findOneAndDelete", async function (doc, next) {
  try {
    if (doc) {
      const Team = mongoose.model("Team");
      await Team.findByIdAndUpdate(doc.team, { $pull: { players: doc._id } });
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Player", PlayerSchema);
