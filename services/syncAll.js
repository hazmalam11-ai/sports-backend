// services/syncAll.js
const { syncTodayMatches } = require("./matchSync");
const { syncTeams } = require("./teamSync");
const { syncPlayers } = require("./playerSync");
const { syncCoach } = require("./coachSync");
const { syncTournaments } = require("./tournamentSync");
const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "../config/syncConfig.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const runFullSync = async () => {
  try {
    console.log("🚀 Starting full sync...");

    // 1) البطولات
    for (const league of config.leagues) {
      await syncTournaments(league.name, league.season);
    }

    // 2) الفرق
    for (const league of config.leagues) {
      await syncTeams(league.id, league.season);
    }

    // 3) اللاعبين
    for (const team of config.teams) {
      await syncPlayers(team.id, team.season);
    }

    // 4) المدربين
    for (const team of config.teams) {
      await syncCoach(team.id);
    }

    // 5) المباريات
    await syncTodayMatches();

    console.log("✅ Full sync completed!");
  } catch (err) {
    console.error("❌ Full sync failed:", err.message);
  }
};

module.exports = { runFullSync };