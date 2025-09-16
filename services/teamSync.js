// services/teamSync.js
const footballAPI = require("./footballAPI");
const Team = require("../models/Team");

const syncTeams = async (leagueId, season) => {
  try {
    console.log(`⏳ Syncing teams for league ${leagueId}...`);

    const data = await footballAPI.getTeamsByLeague(leagueId, season);

    for (const t of data) {
      await Team.findOneAndUpdate(
        { apiId: t.team.id },
        {
          apiId: t.team.id,
          name: t.team.name,
          logo: t.team.logo,
          country: t.team.country,
          stadium: t.venue?.name || "",
          founded: t.team.founded || null,
        },
        { upsert: true, new: true }
      );
    }

    console.log("✅ Teams synced successfully!");
  } catch (err) {
    console.error("❌ Error syncing teams:", err.message);
  }
};

module.exports = { syncTeams };