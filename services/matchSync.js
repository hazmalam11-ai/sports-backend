// services/matchSync.js
const footballAPI = require("./footballAPI");
const Match = require("../models/Match");
const Team = require("../models/Team");
const Tournament = require("../models/Tournament");
const { syncPlayers } = require("./playerSync"); // ✅ استدعاء مزامنة اللاعبين

/**
 * ✅ مزامنة مباريات اليوم من Football API إلى MongoDB
 */
const syncTodayMatches = async () => {
  try {
    console.log("⏳ Syncing today's matches...");

    const apiMatches = await footballAPI.getTodayMatches();
    console.log("📥 API Today Matches Response:", JSON.stringify(apiMatches, null, 2));

    if (!apiMatches || apiMatches.length === 0) {
      console.log("⚠️ No matches found for today from API");
      return;
    }

    for (const m of apiMatches) {
      // ✅ تحقق من الفريقين
      const homeTeam = await Team.findOneAndUpdate(
        { apiId: m.teams.home.id },
        {
          apiId: m.teams.home.id,
          name: m.teams.home.name,
          logo: m.teams.home.logo,
          country: m.teams.home.country,
        },
        { upsert: true, new: true }
      );

      const awayTeam = await Team.findOneAndUpdate(
        { apiId: m.teams.away.id },
        {
          apiId: m.teams.away.id,
          name: m.teams.away.name,
          logo: m.teams.away.logo,
          country: m.teams.away.country,
        },
        { upsert: true, new: true }
      );

      // ✅ تحقق من البطولة
      const tournament = await Tournament.findOneAndUpdate(
        { apiId: m.league.id },
        {
          apiId: m.league.id,
          name: m.league.name,
          country: m.league.country,
          season: m.league.season,
        },
        { upsert: true, new: true }
      );

      // ✅ حفظ أو تحديث المباراة
      await Match.findOneAndUpdate(
        { apiId: m.fixture.id },
        {
          apiId: m.fixture.id,
          homeTeam: homeTeam._id,
          awayTeam: awayTeam._id,
          tournament: tournament._id,
          scoreA: m.goals.home ?? 0,
          scoreB: m.goals.away ?? 0,
          date: new Date(m.fixture.date),
          venue: m.fixture.venue?.name || "Unknown",
          status: m.fixture.status.short === "LIVE" ? "live" : "scheduled",
          minute: m.fixture.status.elapsed || 0,
        },
        { upsert: true, new: true }
      );

      // ✅ جلب لاعيبة الفريقين أوتوماتيك
      const season = m.league.season;
      await syncPlayers(m.teams.home.id, season);
      await syncPlayers(m.teams.away.id, season);
    }

    console.log("✅ Matches + Players synced successfully!");
  } catch (err) {
    console.error("❌ Error syncing matches:", err.message);
  }
};

/**
 * ✅ مزامنة المباريات المباشرة (Live)
 */
const syncLiveMatches = async () => {
  try {
    console.log("⏳ Syncing live matches...");

    const apiMatches = await footballAPI.getLiveMatches();
    console.log("📥 API Live Matches Response:", JSON.stringify(apiMatches, null, 2));

    if (!apiMatches || apiMatches.length === 0) {
      console.log("⚠️ No live matches found from API");
      return;
    }

    for (const m of apiMatches) {
      await Match.findOneAndUpdate(
        { apiId: m.fixture.id },
        {
          scoreA: m.goals.home ?? 0,
          scoreB: m.goals.away ?? 0,
          status: "live",
          minute: m.fixture.status.elapsed || 0,
        },
        { new: true }
      );
    }

    console.log("✅ Live matches updated!");
  } catch (err) {
    console.error("❌ Error syncing live matches:", err.message);
  }
};

module.exports = { syncTodayMatches, syncLiveMatches };