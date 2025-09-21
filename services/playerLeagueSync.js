require("dotenv").config();
const footballAPI = require("./footballAPI");
const { syncPlayers } = require("./playerSync");

const syncLeaguePlayers = async (leagueId, season, leagueName) => {
  try {
    console.log(`\n🚀 Starting players sync for ${leagueName} (leagueId: ${leagueId})...`);

    // ✅ هات كل الفرق بتاعة الدوري من الـ API
    const teams = await footballAPI.api.get("/teams", {
      params: { league: leagueId, season },
    });

    if (!teams.data.response || teams.data.response.length === 0) {
      console.log(`⚠️ No teams found for league ${leagueName}`);
      return;
    }

    // ✅ لف على كل فريق وهات لاعيبته
    for (const t of teams.data.response) {
      const teamId = t.team.id;
      const teamName = t.team.name;
      console.log(`\n⚽ Syncing players for ${teamName} (teamId: ${teamId})`);
      await syncPlayers(teamId, season);
    }

    console.log(`🎉 Finished syncing all players for ${leagueName}`);
  } catch (err) {
    console.error(`❌ Error syncing league ${leagueName}:`, err.message);
  }
};

// ✅ شغل للدوري الإنجليزي والإسباني
(async () => {
  await syncLeaguePlayers(39, 2023, "Premier League"); // الدوري الإنجليزي
  await syncLeaguePlayers(140, 2023, "La Liga");       // الدوري الإسباني
  process.exit(0);
})();