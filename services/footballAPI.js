// services/footballAPI.js
const axios = require("axios");

class FootballAPI {
  constructor() {
    this.api = axios.create({
      baseURL: "https://free-api-live-football-data.p.rapidapi.com",
      headers: {
        "x-rapidapi-host": "free-api-live-football-data.p.rapidapi.com",
        "x-rapidapi-key": process.env.FOOTBALL_API_KEY,
      },
      timeout: 15000,
    });

    console.log("⚽ Using Free API Live Football Data ✅");
  }

  /* =========================
      📡 LIVE SCORES
  ========================= */
  async getLiveMatches() {
    try {
      const res = await this.api.get("/football-current-live");
      const live = res.data?.response?.live || [];
      console.log(`📡 Live matches fetched from API: ${live.length}`);

      if (!live.length) {
        console.log("✅ API شغالة بس مفيش ماتشات لايف دلوقتي");
        return [];
      }

      // إعادة تشكيل الداتا لتناسب الواجهة الأمامية
      return live.map(m => ({
        fixture: {
          id: m.match_id,
          date: m.match_time,
          status: { short: m.status || "FT", elapsed: m.minute || 0 },
        },
        teams: {
          home: { name: m.home_name, logo: m.home_logo },
          away: { name: m.away_name, logo: m.away_logo },
        },
        goals: {
          home: m.score_home ?? 0,
          away: m.score_away ?? 0,
        },
        league: {
          id: m.league_id,
          name: m.league_name,
          country: m.country_name,
          logo: m.league_logo,
        },
      }));
    } catch (err) {
      console.error("❌ Error fetching live matches:", err.response?.data || err.message);
      return [];
    }
  }

  /* =========================
      📅 FIXTURES
  ========================= */
  async getMatchesByDate(date) {
    try {
      const res = await this.api.get("/football-get-matches-by-date", {
        params: { date },
      });
      const matches = res.data?.response || [];
      console.log(`📅 Matches fetched for ${date}: ${matches.length}`);

      return matches.map(m => ({
        fixture: {
          id: m.match_id,
          date: m.match_time,
          status: { short: m.status || "NS", elapsed: m.minute || 0 },
        },
        teams: {
          home: { name: m.home_name, logo: m.home_logo },
          away: { name: m.away_name, logo: m.away_logo },
        },
        goals: {
          home: m.score_home ?? 0,
          away: m.score_away ?? 0,
        },
        league: {
          id: m.league_id,
          name: m.league_name,
          country: m.country_name,
          logo: m.league_logo,
        },
      }));
    } catch (err) {
      console.error("❌ Error fetching matches by date:", err.response?.data || err.message);
      return [];
    }
  }

  async getLeagueMatches(leagueid) {
    try {
      const res = await this.api.get("/football-get-matches-by-league", {
        params: { leagueid },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching matches by league:", err.message);
      return [];
    }
  }

  async getFixtureById(matchid) {
    try {
      const res = await this.api.get("/football-get-match-detail", {
        params: { matchid },
      });
      return res.data?.response || null;
    } catch (err) {
      console.error("❌ Error fetching fixture:", err.message);
      return null;
    }
  }

  /* =========================
      🏆 LEAGUES
  ========================= */
  async getAllLeagues() {
    try {
      const res = await this.api.get("/football-get-all-leagues");
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching leagues:", err.message);
      return [];
    }
  }

  async getLeaguesByCountry(country) {
    try {
      const res = await this.api.get("/football-get-all-leagues-with-country", {
        params: { country },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching leagues by country:", err.message);
      return [];
    }
  }

  async getLeagueDetail(leagueid) {
    try {
      const res = await this.api.get("/football-get-league-detail", {
        params: { leagueid },
      });
      return res.data?.response || {};
    } catch (err) {
      console.error("❌ Error fetching league detail:", err.message);
      return {};
    }
  }

  /* =========================
      🏟️ TEAMS
  ========================= */
  async getTeamsByLeague(leagueid) {
    try {
      const res = await this.api.get("/football-get-list-all-team", {
        params: { leagueid },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching teams by league:", err.message);
      return [];
    }
  }

  async getTeamDetail(teamid) {
    try {
      const res = await this.api.get("/football-get-team-detail", {
        params: { teamid },
      });
      return res.data?.response || {};
    } catch (err) {
      console.error("❌ Error fetching team detail:", err.message);
      return {};
    }
  }

  async getTeamStatistics(teamid) {
    try {
      const res = await this.api.get("/football-get-team-statistics", {
        params: { teamid },
      });
      return res.data?.response || {};
    } catch (err) {
      console.error("❌ Error fetching team statistics:", err.message);
      return {};
    }
  }

  /* =========================
      👥 PLAYERS
  ========================= */
  async getPlayersByTeam(teamid) {
    try {
      const res = await this.api.get("/football-get-players-by-team", {
        params: { teamid },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching players by team:", err.message);
      return [];
    }
  }

  async getPlayerDetail(playerid) {
    try {
      const res = await this.api.get("/football-get-player-detail", {
        params: { playerid },
      });
      return res.data?.response || {};
    } catch (err) {
      console.error("❌ Error fetching player detail:", err.message);
      return {};
    }
  }

  /* =========================
      ⚽ TOP PLAYERS
  ========================= */
  async getTopScorers(leagueid) {
    try {
      const res = await this.api.get("/football-get-top-players-by-goals", {
        params: { leagueid },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching top scorers:", err.message);
      return [];
    }
  }

  async getTopAssists(leagueid) {
    try {
      const res = await this.api.get("/football-get-top-players-by-assists", {
        params: { leagueid },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching top assists:", err.message);
      return [];
    }
  }

  async getTopRatedPlayers(leagueid) {
    try {
      const res = await this.api.get("/football-get-top-players-by-rating", {
        params: { leagueid },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching top rated players:", err.message);
      return [];
    }
  }

  /* =========================
      📊 STANDINGS
  ========================= */
  async getLeagueStandings(leagueid) {
    try {
      const res = await this.api.get("/football-get-league-standings", {
        params: { leagueid },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching league standings:", err.message);
      return [];
    }
  }

  /* =========================
      📈 MATCH STATISTICS
  ========================= */
  async getMatchStatistics(matchid) {
    try {
      const res = await this.api.get("/football-get-match-statistics", {
        params: { matchid },
      });
      return res.data?.response || {};
    } catch (err) {
      console.error("❌ Error fetching match statistics:", err.message);
      return {};
    }
  }

  async getMatchLineups(matchid) {
    try {
      const res = await this.api.get("/football-get-match-lineups", {
        params: { matchid },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching match lineups:", err.message);
      return [];
    }
  }

  async getMatchEvents(matchid) {
    try {
      const res = await this.api.get("/football-get-match-events", {
        params: { matchid },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching match events:", err.message);
      return [];
    }
  }

  /* =========================
      📰 NEWS
  ========================= */
  async getTrendingNews() {
    try {
      const res = await this.api.get("/football-get-trending-news");
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching news:", err.message);
      return [];
    }
  }

  async getNewsByLeague(leagueid) {
    try {
      const res = await this.api.get("/football-get-news-by-league", {
        params: { leagueid },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching league news:", err.message);
      return [];
    }
  }

  async getNewsByTeam(teamid) {
    try {
      const res = await this.api.get("/football-get-news-by-team", {
        params: { teamid },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching team news:", err.message);
      return [];
    }
  }

  /* =========================
      🔍 SEARCH
  ========================= */
  async searchPlayers(query) {
    try {
      const res = await this.api.get("/football-search-players", {
        params: { query },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error searching players:", err.message);
      return [];
    }
  }

  async searchTeams(query) {
    try {
      const res = await this.api.get("/football-search-teams", {
        params: { query },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error searching teams:", err.message);
      return [];
    }
  }

  async searchLeagues(query) {
    try {
      const res = await this.api.get("/football-search-leagues", {
        params: { query },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error searching leagues:", err.message);
      return [];
    }
  }

  async searchMatches(query) {
    try {
      const res = await this.api.get("/football-search-matches", {
        params: { query },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error searching matches:", err.message);
      return [];
    }
  }

  /* =========================
      🔁 TRANSFERS
  ========================= */
  async getAllTransfers() {
    try {
      const res = await this.api.get("/football-get-all-transfers");
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching transfers:", err.message);
      return [];
    }
  }

  async getTopTransfers() {
    try {
      const res = await this.api.get("/football-get-top-transfers");
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching top transfers:", err.message);
      return [];
    }
  }

  async getTransfersByLeague(leagueid) {
    try {
      const res = await this.api.get("/football-get-transfers-by-league", {
        params: { leagueid },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching transfers by league:", err.message);
      return [];
    }
  }
}

/* =========================
   ✅ EXPORTS
========================= */
module.exports = new FootballAPI();
