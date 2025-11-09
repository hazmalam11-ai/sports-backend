// services/playerSync.js
const footballAPI = require("./footballAPI");
const Player = require("../models/Player");
const Team = require("../models/Team");

const syncPlayers = async (teamId, season) => {
  try {
    console.log(`\n⏳ Syncing players for team ${teamId}, season ${season}...`);

    // ✅ هات اللاعبين من الـ API
    const data = await footballAPI.getTeamPlayers(teamId, season);
    console.log(`📥 API Response Players Count: ${data?.length || 0}`);

    if (!data || data.length === 0) {
      console.log(`⚠️ No players found for team ${teamId} (season ${season})`);
      return;
    }

    // ✅ هات الفريق من الـ DB
    const team = await Team.findOne({ apiId: teamId });
    if (!team) {
      console.log(`❌ Team with apiId ${teamId} not found in DB`);
      return;
    }
    console.log(`🏟️ Found team in DB: ${team.name} (${team._id})`);

    // ✅ لف على كل لاعب من API
    for (const p of data) {
      if (!p?.player?.id) {
        console.log("⚠️ Skipping player with missing ID:", p);
        continue;
      }

      const playerData = {
        apiId: p.player.id,
        name: p.player.name || "Unknown",
        age: p.player.age || null,
        position: p.statistics?.[0]?.games?.position || "Unknown",
        nationality: p.player.nationality || "",
        photo: p.player.photo || "",
        birth: {
          date: p.player.birth?.date ? new Date(p.player.birth.date) : null,
          place: p.player.birth?.place || "",
          country: p.player.birth?.country || "",
        },
        height: p.player.height || "",
        weight: p.player.weight || "",
        team: team._id,
      };

      // ✅ حفظ أو تحديث اللاعب
      const updated = await Player.findOneAndUpdate(
        { apiId: p.player.id },
        playerData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log(
        `✅ Synced player: ${updated.name} | ID: ${updated.apiId} | Team: ${team.name}`
      );
    }

    console.log("🎉 All players synced successfully!\n");
  } catch (err) {
    console.error("❌ Error syncing players:", err.message, err.stack);
  }
};

module.exports = { syncPlayers };