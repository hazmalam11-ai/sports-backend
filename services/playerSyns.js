// services/playerSync.js
const footballAPI = require("./footballAPI");
const Player = require("../models/Player");
const Team = require("../models/Team");

const syncPlayers = async (teamId, season) => {
  try {
    console.log(`⏳ Syncing players for team ${teamId}...`);

    const data = await footballAPI.getTeamPlayers(teamId, season);

    for (const p of data) {
      const team = await Team.findOne({ apiId: teamId });
      if (!team) continue;

      await Player.findOneAndUpdate(
        { apiId: p.player.id },
        {
          apiId: p.player.id,
          name: p.player.name,
          age: p.player.age,
          position: p.statistics[0]?.games?.position || "",
          nationality: p.player.nationality,
          photo: p.player.photo,
          birth: p.player.birth?.date ? new Date(p.player.birth.date) : null,
          height: p.player.height,
          weight: p.player.weight,
          team: team._id,
        },
        { upsert: true, new: true }
      );
    }

    console.log("✅ Players synced successfully!");
  } catch (err) {
    console.error("❌ Error syncing players:", err.message);
  }
};

module.exports = { syncPlayers };