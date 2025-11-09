// services/coachSync.js
const footballAPI = require("./footballAPI");
const Coach = require("../models/Coach");
const Team = require("../models/Team");

const syncCoach = async (teamId) => {
  try {
    console.log(`⏳ Syncing coach for team ${teamId}...`);

    const data = await footballAPI.getCoachByTeam(teamId);
    if (!data || !data.length) return;

    const team = await Team.findOne({ apiId: teamId });
    if (!team) return;

    const c = data[0];

    await Coach.findOneAndUpdate(
      { apiId: c.id },
      {
        apiId: c.id,
        name: c.name,
        age: c.age,
        nationality: c.nationality,
        photo: c.photo,
        birth: c.birth?.date ? new Date(c.birth.date) : null,
        team: team._id,
      },
      { upsert: true, new: true }
    );

    console.log("✅ Coach synced successfully!");
  } catch (err) {
    console.error("❌ Error syncing coach:", err.message);
  }
};

module.exports = { syncCoach };