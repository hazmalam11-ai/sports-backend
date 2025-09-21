const MiniLeague = require("../models/FantasyminiLeague");
const FantasyTeam = require("../models/FantasyTeam");

// ✅ إنشاء دوري جديد
async function createLeague(name, isPublic, adminId) {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  return await MiniLeague.create({ name, code, isPublic, admin: adminId, members: [] });
}

// ✅ الانضمام إلى دوري
async function joinLeague(code, userId, teamId) {
  const league = await MiniLeague.findOne({ code });
  if (!league) throw new Error("League not found");

  // تأكد أنه مش عضو بالفعل
  if (league.members.some((m) => m.user.toString() === userId.toString())) {
    throw new Error("Already joined this league");
  }

  league.members.push({ user: userId, team: teamId });
  await league.save();
  return league;
}

// ✅ حساب الترتيب
async function getLeaderboard(leagueId) {
  const league = await MiniLeague.findById(leagueId).populate("members.user", "username").populate("members.team");
  if (!league) throw new Error("League not found");

  league.members.sort((a, b) => b.team.totalPoints - a.team.totalPoints);

  return league.members.map((m, index) => ({
    rank: index + 1,
    username: m.user.username,
    teamName: m.team.name,
    points: m.team.totalPoints,
  }));
}

module.exports = { createLeague, joinLeague, getLeaderboard };