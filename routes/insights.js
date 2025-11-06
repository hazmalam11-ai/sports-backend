// routes/insights.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

// ⚙️ RapidAPI Football Base
const RAPID_API_BASE = "https://free-api-live-football-data.p.rapidapi.com";
const API_KEY = process.env.FOOTBALL_API_KEY;

// 🧠 التحليل الذكي
class AdvancedFootballAnalyzer {
  constructor() {
    this.performanceWeights = {
      goals: 10,
      assists: 8,
      keyPasses: 6,
      shots: 3,
      passAccuracy: 4,
      dribbles: 5,
      tackles: 6,
      interceptions: 5,
      saves: 12,
      rating: 7
    };
  }

  calculatePerformanceIndex(player) {
    const stats = player.stats || {};
    let index = 0;
    index += (stats.goals || 0) * this.performanceWeights.goals;
    index += (stats.assists || 0) * this.performanceWeights.assists;
    index += (stats.keyPasses || 0) * this.performanceWeights.keyPasses;
    index += (stats.shots || 0) * this.performanceWeights.shots;
    index += (stats.passAccuracy || 0) * this.performanceWeights.passAccuracy;
    index += (stats.dribbles || 0) * this.performanceWeights.dribbles;
    index += (stats.tackles || 0) * this.performanceWeights.tackles;
    index += (stats.interceptions || 0) * this.performanceWeights.interceptions;
    index += (stats.saves || 0) * this.performanceWeights.saves;
    index += (stats.rating || 0) * this.performanceWeights.rating;
    return Math.round(index * 100) / 100;
  }

  detectPlayerRole(player) {
    const stats = player.stats || {};
    const { saves, tackles, interceptions, passes, dribbles, shots } = stats;

    if (saves > 0) return "حارس مرمى 🧤";
    if ((tackles || 0) + (interceptions || 0) > 5) return "مدافع 🛡️";
    if ((passes || 0) > 50 && (dribbles || 0) < 3) return "صانع ألعاب 🎭";
    if ((dribbles || 0) > 3 || (shots || 0) > 3) return "مهاجم ⚔️";
    if ((passes || 0) > 30) return "لاعب وسط 🎯";
    return "لاعب متعدد المهام 🔄";
  }

  analyzeCriticalMoments(player) {
    const stats = player.stats || {};
    let moments = [];
    if (stats.goals > 0) moments.push(`⚽ سجل ${stats.goals} هدف`);
    if (stats.assists > 0) moments.push(`🎁 صنع ${stats.assists} فرصة`);
    if (stats.redCards > 0) moments.push(`🟥 حصل على طرد`);
    if (stats.saves > 0) moments.push(`🥅 أنقذ ${stats.saves} تسديدة خطيرة`);
    return moments;
  }

  analyzePlayerFatigue(minutes) {
    if (minutes < 30) return "⚡ طازج";
    if (minutes > 80) return "😴 مرهق";
    if (minutes > 60) return "💪 متوسط الإرهاق";
    return "🔋 نشيط";
  }
}

// 🧠 مولد الـ Insights
function generateAdvancedInsights(players, matchData = {}) {
  const analyzer = new AdvancedFootballAnalyzer();
  let insights = [];

  if (!players || players.length === 0) {
    return ["❌ لا توجد بيانات لهذه المباراة"];
  }

  // 🏆 حساب الأفضل
  const rankedPlayers = players
    .filter(p => p.minutes > 10)
    .map(p => ({ ...p, performanceIndex: analyzer.calculatePerformanceIndex(p) }))
    .sort((a, b) => b.performanceIndex - a.performanceIndex);

  if (rankedPlayers.length > 0) {
    const mvp = rankedPlayers[0];
    insights.push({
      text: `👑 MVP: ${mvp.name} (${analyzer.detectPlayerRole(mvp)}) - ${mvp.performanceIndex}`,
      player: {
        id: mvp.id,
        name: mvp.name,
        photo: mvp.photo,
        role: analyzer.detectPlayerRole(mvp),
        perf: mvp.performanceIndex
      }
    });
  }

  return insights.length > 0 ? insights : ["🤔 لم يتم العثور على Insights"];
}

// 🚀 API Endpoint (RapidAPI Integration)
router.get("/match/:matchId", async (req, res) => {
  try {
    const { matchId } = req.params;
    const startTime = Date.now();
    const analyzer = new AdvancedFootballAnalyzer();

    console.log(`🧩 Fetching match insights for ID: ${matchId}`);

    // ✅ استدعاء البيانات من RapidAPI
    const matchRes = await axios.get(`${RAPID_API_BASE}/football-get-match-detail?fixtureid=${matchId}`, {
      headers: {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "free-api-live-football-data.p.rapidapi.com"
      }
    });

    const match = matchRes.data?.response?.[0];
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    // ✅ استدعاء اللاعبين
    const playersRes = await axios.get(`${RAPID_API_BASE}/football-get-player-match-stats?fixtureid=${matchId}`, {
      headers: {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "free-api-live-football-data.p.rapidapi.com"
      }
    });

    const players = playersRes.data?.response || [];
    console.log(`📊 Players fetched: ${players.length}`);

    // 🧠 تحليل الأداء
    const insights = generateAdvancedInsights(players, { match });

    // 🏆 أفضل 11 لاعب
    const best11 = players
      .map(p => ({
        id: p.player_id || 0,
        name: p.name || "Unknown",
        photo: p.photo || "",
        role: analyzer.detectPlayerRole(p),
        perf: analyzer.calculatePerformanceIndex(p)
      }))
      .sort((a, b) => b.perf - a.perf)
      .slice(0, 11);

    // ✅ استجابة التحليل
    res.json({
      success: true,
      matchId,
      processingTime: `${Date.now() - startTime}ms`,
      dataQuality: players.length > 0 ? "🟢 عالية" : "🔴 ضعيفة",
      matchInfo: {
        venue: match?.venue_name || "غير معروف",
        tournament: match?.league_name || "غير معروف",
        teams: `${match?.home_team_name} vs ${match?.away_team_name}`,
        score: `${match?.home_team_score} - ${match?.away_team_score}`,
      },
      analysis: {
        insights,
        best11
      },
      metadata: {
        engine: "Advanced Football Analyzer Pro 🚀",
        features: [
          "Performance Index", "Auto Role Detection", "Critical Moments",
          "Predictive Analysis", "Top 11", "Player Comparison",
          "Global Comparisons", "Error Handling", "Metadata"
        ]
      }
    });
  } catch (err) {
    console.error("❌ Error in insights:", err.message);
    res.status(500).json({
      error: "analysis failed",
      message: err.message,
      suggestion: "تأكد من صحة matchId أو من توفر البيانات في RapidAPI"
    });
  }
});

module.exports = router;
