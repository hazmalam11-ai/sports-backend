const Gameweek = require("../models/Gameweek");
const FantasyTeam = require("../models/FantasyTeam");
const FantasyPoints = require("../models/FantasyPoints");
const Player = require("../models/Player");

/**
 * ✅ تحديث إحصائيات الجولة
 */
const updateGameweekStats = async (gameweekId) => {
  try {
    console.log(`⏳ Updating stats for Gameweek ${gameweekId}...`);

    const gameweek = await Gameweek.findById(gameweekId);
    if (!gameweek) throw new Error("Gameweek not found");

    // هات كل الفرق
    const teams = await FantasyTeam.find();
    let totalPlayers = 0;
    let totalPoints = 0;
    let highestPoints = 0;

    // لحساب مين اللاعب الأكثر اختيارًا أو كابتنة
    const pickedMap = {};
    const captainedMap = {};
    const transferInMap = {};
    const transferOutMap = {};

    for (const team of teams) {
      totalPlayers++;

      totalPoints += team.totalPoints;
      if (team.totalPoints > highestPoints) highestPoints = team.totalPoints;

      for (const p of team.players) {
        const playerId = p.player.toString();

        // عدد مرات اختيار اللاعب
        pickedMap[playerId] = (pickedMap[playerId] || 0) + 1;

        if (p.isCaptain) {
          captainedMap[playerId] = (captainedMap[playerId] || 0) + 1;
        }
      }

      // حساب التحويلات
      for (const t of team.transfers) {
        if (t.date >= gameweek.startDate && t.date <= gameweek.endDate) {
          if (t.in) transferInMap[t.in.toString()] = (transferInMap[t.in.toString()] || 0) + 1;
          if (t.out) transferOutMap[t.out.toString()] = (transferOutMap[t.out.toString()] || 0) + 1;
        }
      }
    }

    // استخراج إحصائيات "الأكثر"
    const mostPickedPlayerId = Object.keys(pickedMap).reduce(
      (a, b) => (pickedMap[a] > pickedMap[b] ? a : b),
      null
    );
    const mostCaptainedPlayerId = Object.keys(captainedMap).reduce(
      (a, b) => (captainedMap[a] > captainedMap[b] ? a : b),
      null
    );
    const mostTransferredInId = Object.keys(transferInMap).reduce(
      (a, b) => (transferInMap[a] > transferInMap[b] ? a : b),
      null
    );
    const mostTransferredOutId = Object.keys(transferOutMap).reduce(
      (a, b) => (transferOutMap[a] > transferOutMap[b] ? a : b),
      null
    );

    // حفظ النتائج
    gameweek.totalPlayers = totalPlayers;
    gameweek.averagePoints = totalPlayers > 0 ? totalPoints / totalPlayers : 0;
    gameweek.highestPoints = highestPoints;
    gameweek.mostPickedPlayer = mostPickedPlayerId;
    gameweek.mostCaptainedPlayer = mostCaptainedPlayerId;
    gameweek.mostTransferredIn = mostTransferredInId;
    gameweek.mostTransferredOut = mostTransferredOutId;

    await gameweek.save();

    console.log("✅ Gameweek stats updated successfully!");
    return gameweek;
  } catch (err) {
    console.error("❌ Error updating gameweek stats:", err.message);
  }
};

module.exports = { updateGameweekStats };