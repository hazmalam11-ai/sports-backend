// services/footballAPI.js
const axios = require("axios");

class FootballAPIService {
  constructor() {
    this.baseURL = "https://free-api-live-football-data.p.rapidapi.com";
    this.apiKey = process.env.FOOTBALL_API_KEY;

    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        "x-rapidapi-key": this.apiKey,
        "x-rapidapi-host": "free-api-live-football-data.p.rapidapi.com",
      },
      timeout: 15000,
    });

    console.log("⚙️ Using RapidAPI KEY:", this.apiKey ? "Loaded ✅" : "❌ Missing");
  }

  // ✅ جلب المباريات المباشرة
  async getLiveMatches() {
    try {
      console.log("🔴 Fetching LIVE matches from RapidAPI...");
      const response = await this.api.get("/football-current-live");
      const data = response.data.response || [];

      console.log(`📡 RapidAPI: ${data.length} live matches found`);
      return data.map(this._formatMatch);
    } catch (error) {
      console.error("❌ Error in getLiveMatches:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ جلب مباريات اليوم
  async getTodayMatches() {
    try {
      console.log("📅 Fetching today's matches from RapidAPI...");
      const response = await this.api.get("/football-today");
      const data = response.data.response || [];

      console.log(`📡 RapidAPI: ${data.length} matches found for today`);
      return data.map(this._formatMatch);
    } catch (error) {
      console.error("❌ Error in getTodayMatches:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ جلب مباريات أمس
  async getYesterdayMatches() {
    try {
      console.log("📅 Fetching yesterday's matches...");
      const response = await this.api.get("/football-yesterday");
      const data = response.data.response || [];

      return data.map(this._formatMatch);
    } catch (error) {
      console.error("❌ Error in getYesterdayMatches:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ جلب مباريات غدًا
  async getTomorrowMatches() {
    try {
      console.log("📅 Fetching tomorrow's matches...");
      const response = await this.api.get("/football-tomorrow");
      const data = response.data.response || [];

      return data.map(this._formatMatch);
    } catch (error) {
      console.error("❌ Error in getTomorrowMatches:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ جلب مباريات بتاريخ محدد
  async getMatchesByDate(date) {
    try {
      const dateStr = new Date(date).toISOString().split("T")[0];
      console.log(`📅 Fetching matches by date: ${dateStr}`);

      const response = await this.api.get(`/football-date/${dateStr}`);
      const data = response.data.response || [];

      return data.map(this._formatMatch);
    } catch (error) {
      console.error("❌ Error in getMatchesByDate:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ جلب مباريات بين تاريخين
  async getMatchesInRange(fromDate, toDate) {
    try {
      const from = new Date(fromDate).toISOString().split("T")[0];
      const to = new Date(toDate).toISOString().split("T")[0];
      console.log(`📆 Fetching matches range: ${from} → ${to}`);

      const response = await this.api.get(`/football-date-range/${from}/${to}`);
      const data = response.data.response || [];

      return data.map(this._formatMatch);
    } catch (error) {
      console.error("❌ Error in getMatchesInRange:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ جلب مباريات أسبوع
  async getMatchesOneWeekRange() {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 7);
    const to = new Date(today);
    to.setDate(today.getDate() + 7);

    return this.getMatchesInRange(from, to);
  }

  // ✅ مباراة محددة
  async getMatchById(matchId) {
    try {
      const response = await this.api.get(`/football-fixture/${matchId}`);
      const data = response.data.response || [];

      return data[0] ? this._formatMatch(data[0]) : null;
    } catch (error) {
      console.error("❌ Error in getMatchById:", error.response?.data || error.message);
      return null;
    }
  }

  // ✅ ترتيب الدوري
  async getStandings(leagueId, season) {
    try {
      const response = await this.api.get(`/football-standings/${leagueId}/${season}`);
      const data = response.data.response || [];
      console.log(`📊 Standings found: ${data.length}`);

      return data.map((team) => ({
        rank: team.rank || 0,
        team: {
          id: team.team_id,
          name: team.team_name,
          logo: team.team_logo,
        },
        points: team.points,
        goalsDiff: team.goals_diff,
        played: team.played,
        win: team.win,
        draw: team.draw,
        lose: team.lose,
      }));
    } catch (error) {
      console.error("❌ Error in getStandings:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ الدوريات
  async getLeagues() {
    try {
      console.log("🏆 Fetching leagues...");
      const response = await this.api.get("/football-leagues");
      const data = response.data.response || [];

      return data.map((league) => ({
        id: league.league_id,
        name: league.league_name,
        country: league.country,
        logo: league.league_logo,
      }));
    } catch (error) {
      console.error("❌ Error in getLeagues:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ معلومات فريق
  async getTeamInfo(teamId) {
    try {
      const response = await this.api.get(`/football-team/${teamId}`);
      const team = response.data.response[0] || {};
      return {
        id: team.team_id,
        name: team.team_name,
        logo: team.team_logo,
        country: team.country,
      };
    } catch (error) {
      console.error("❌ Error in getTeamInfo:", error.response?.data || error.message);
      return null;
    }
  }

  // ✅ لاعبي فريق
  async getTeamPlayers(teamId) {
    try {
      const response = await this.api.get(`/football-team-players/${teamId}`);
      const data = response.data.response || [];

      return data.map((player) => ({
        id: player.player_id,
        name: player.player_name,
        age: player.age,
        nationality: player.nationality,
        photo: player.photo,
      }));
    } catch (error) {
      console.error("❌ Error in getTeamPlayers:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ إحصائيات المباراة
  async getMatchStatistics(matchId) {
    try {
      const response = await this.api.get(`/football-statistics/${matchId}`);
      const stats = response.data.response || [];

      return stats.reduce((acc, s) => {
        acc[s.type] = { home: s.home, away: s.away };
        return acc;
      }, {});
    } catch (error) {
      console.error("❌ Error in getMatchStatistics:", error.response?.data || error.message);
      return {};
    }
  }

  // ✅ أحداث المباراة
  async getMatchEvents(matchId) {
    try {
      const response = await this.api.get(`/football-events/${matchId}`);
      const events = response.data.response || [];

      return events.map((event) => ({
        time: event.minute || 0,
        type: event.type,
        player: event.player_name,
        team: event.team_name,
        detail: event.detail,
      }));
    } catch (error) {
      console.error("❌ Error in getMatchEvents:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ تشكيل المباراة
  async getMatchLineups(matchId) {
    try {
      const response = await this.api.get(`/football-lineups/${matchId}`);
      const lineups = response.data.response || [];

      return lineups.map((team) => ({
        team: {
          id: team.team_id,
          name: team.team_name,
          logo: team.team_logo,
        },
        formation: team.formation,
        coach: team.coach,
        startXI: team.startXI || [],
        substitutes: team.substitutes || [],
      }));
    } catch (error) {
      console.error("❌ Error in getMatchLineups:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ هدافي الدوري
  async getTopScorers(leagueId, season) {
    try {
      const response = await this.api.get(`/football-topscorers/${leagueId}/${season}`);
      const players = response.data.response || [];

      return players.map((p) => ({
        id: p.player_id,
        name: p.player_name,
        team: p.team_name,
        goals: p.goals,
        assists: p.assists,
        matches: p.matches,
      }));
    } catch (error) {
      console.error("❌ Error in getTopScorers:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ فرق الدوري
  async getTeamsByLeague(leagueId) {
    try {
      const response = await this.api.get(`/football-league-teams/${leagueId}`);
      const teams = response.data.response || [];

      return teams.map((t) => ({
        id: t.team_id,
        name: t.team_name,
        logo: t.team_logo,
        country: t.country,
      }));
    } catch (error) {
      console.error("❌ Error in getTeamsByLeague:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ دالة داخلية لتوحيد تنسيق المباراة
  _formatMatch(match) {
    return {
      fixture: {
        id: match.fixture_id || match.id,
        date: match.match_time || new Date().toISOString(),
        status: {
          short: match.status || "NS",
          elapsed: match.minute || 0,
        },
      },
      league: {
        id: match.league_id || 0,
        name: match.league_name || "Unknown League",
        country: match.country || "Unknown",
        logo: match.league_logo || "",
      },
      teams: {
        home: {
          id: match.home_team_id,
          name: match.home_team_name,
          logo: match.home_team_logo,
        },
        away: {
          id: match.away_team_id,
          name: match.away_team_name,
          logo: match.away_team_logo,
        },
      },
      goals: {
        home: match.home_team_score ?? 0,
        away: match.away_team_score ?? 0,
      },
    };
  }
}

// ✅ Export all functions
module.exports = {
  getLiveMatches: () => new FootballAPIService().getLiveMatches(),
  getTodayMatches: () => new FootballAPIService().getTodayMatches(),
  getYesterdayMatches: () => new FootballAPIService().getYesterdayMatches(),
  getTomorrowMatches: () => new FootballAPIService().getTomorrowMatches(),
  getMatchesByDate: (date) => new FootballAPIService().getMatchesByDate(date),
  getMatchesInRange: (from, to) => new FootballAPIService().getMatchesInRange(from, to),
  getMatchesOneWeekRange: () => new FootballAPIService().getMatchesOneWeekRange(),
  getMatchById: (id) => new FootballAPIService().getMatchById(id),
  getStandings: (league, season) => new FootballAPIService().getStandings(league, season),
  getLeagues: () => new FootballAPIService().getLeagues(),
  getTeamInfo: (id) => new FootballAPIService().getTeamInfo(id),
  getTeamPlayers: (id) => new FootballAPIService().getTeamPlayers(id),
  getMatchStatistics: (id) => new FootballAPIService().getMatchStatistics(id),
  getMatchEvents: (id) => new FootballAPIService().getMatchEvents(id),
  getMatchLineups: (id) => new FootballAPIService().getMatchLineups(id),
  getTopScorers: (league, season) => new FootballAPIService().getTopScorers(league, season),
  getTeamsByLeague: (league) => new FootballAPIService().getTeamsByLeague(league),
};
