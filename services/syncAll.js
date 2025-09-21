// services/syncAll.js
require("dotenv").config(); // ✅ عشان يقرأ .env
const mongoose = require("mongoose");

const { syncTodayMatches } = require("./matchSync");
const { syncTeams } = require("./teamSync");
const { syncPlayers } = require("./playerSync");
const { syncCoach } = require("./coachSync");
const { syncTournaments } = require("./tournamentSync");
const fs = require("fs");
const path = require("path");

// ✅ اقرأ config
const configPath = path.join(__dirname, "../config/syncConfig.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const runFullSync = async () => {
  try {
    console.log("🚀 Starting full sync...");

    // 1) البطولات
    for (const league of config.leagues) {
      console.log(`🏆 Syncing tournament: ${league.name} (${league.season})`);
      await syncTournaments(league.name, league.season);
    }

    // 2) الفرق
    for (const league of config.leagues) {
      console.log(`👕 Syncing teams for league ${league.id}, season ${league.season}`);
      await syncTeams(league.id, league.season);
    }

    // 3) اللاعبين
    for (const team of config.teams) {
      console.log(`👤 Syncing players for team ${team.id}, season ${team.season}`);
      await syncPlayers(team.id, team.season);
    }

    // 4) المدربين
    for (const team of config.teams) {
      console.log(`🎩 Syncing coach for team ${team.id}`);
      await syncCoach(team.id);
    }

    // 5) المباريات
    console.log("⚽ Syncing today matches...");
    await syncTodayMatches();

    console.log("✅ Full sync completed!");
  } catch (err) {
    console.error("❌ Full sync failed:", err.message, err.stack);
  } finally {
    // ✅ قفل الاتصال بعد ما يخلص
    mongoose.connection.close();
  }
};

// ✅ شغل MongoDB وبعدين Run Sync
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("✅ MongoDB connected for syncAll.js");
    await runFullSync();
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });