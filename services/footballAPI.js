// services/footballAPI.js
const axios = require("axios");

class FootballAPI {
  constructor() {
    this.api = axios.create({
      baseURL: "https://api-football-v1.p.rapidapi.com/v3",
      headers: {
        "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
        "x-rapidapi-key": process.env.FOOTBALL_API_KEY,
      },
      timeout: 15000,
    });

    console.log("⚽ Using RapidAPI Football API v3 ✅");
  }

  /* =========================
      📡 LIVE SCORES
  ========================= */
  async getLiveMatches() {
    try {
      const res = await this.api.get("/fixtures", {
        params: { live: "all" },
      });

      const matches = res.data?.response || [];
      console.log(`📡 API Live Matches Response: ${matches.length}`);

      return matches.map(match => ({
        id: match.fixture?.id,
        status: match.fixture?.status?.short,
        elapsed: match.fixture?.status?.elapsed,
        homeTeam: {
          id: match.teams?.home?.id,
          name: match.teams?.home?.name,
          logo: match.teams?.home?.logo,
        },
        awayTeam: {
          id: match.teams?.away?.id,
          name: match.teams?.away?.name,
          logo: match.teams?.away?.logo,
        },
        score: {
          home: match.goals?.home,
          away: match.goals?.away,
        },
        league: {
          id: match.league?.id,
          name: match.league?.name,
          country: match.league?.country,
          logo: match.league?.logo,
        },
        date: match.fixture?.date,
      }));
    } catch (err) {
      console.error("❌ Error fetching live matches:", err.message);
      return [];
    }
  }

  /* =========================
      📅 FIXTURES
  ========================= */
  async getMatchesByDate(date) {
    try {
      const res = await this.api.get("/fixtures", {
        params: { date }, // Format: YYYY-MM-DD
      });

      const matches = res.data?.response || [];
      return matches.map(match => ({
        id: match.fixture?.id,
        date: match.fixture?.date,
        status: match.fixture?.status?.short,
        homeTeam: {
          id: match.teams?.home?.id,
          name: match.teams?.home?.name,
          logo: match.teams?.home?.logo,
        },
        awayTeam: {
          id: match.teams?.away?.id,
          name: match.teams?.away?.name,
          logo: match.teams?.away?.logo,
        },
        score: {
          home: match.goals?.home,
          away: match.goals?.away,
        },
        league: {
          id: match.league?.id,
          name: match.league?.name,
          logo: match.league?.logo,
        },
      }));
    } catch (err) {
      console.error("❌ Error fetching matches by date:", err.message);
      return [];
    }
  }

  async getLeagueMatches(leagueId, season = new Date().getFullYear()) {
    try {
      const res = await this.api.get("/fixtures", {
        params: { 
          league: leagueId,
          season: season
        },
      });

      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching matches by league:", err.message);
      return [];
    }
  }

  async getFixtureById(fixtureId) {
    try {
      const res = await this.api.get("/fixtures", {
        params: { id: fixtureId },
      });

      return res.data?.response?.[0] || null;
    } catch (err) {
      console.error("❌ Error fetching fixture:", err.message);
      return null;
    }
  }

  async getFixtureHeadToHead(team1, team2) {
    try {
      const res = await this.api.get("/fixtures/headtohead", {
        params: { 
          h2h: `${team1}-${team2}`,
        },
      });

      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching H2H:", err.message);
      return [];
    }
  }

  /* =========================
      🏆 LEAGUES & SEASONS
  ========================= */
  async getAllLeagues() {
    try {
      const res = await this.api.get("/leagues");
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching leagues:", err.message);
      return [];
    }
  }

  async getLeaguesByCountry(country) {
    try {
      const res = await this.api.get("/leagues", {
        params: { country },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching leagues by country:", err.message);
      return [];
    }
  }

  async getLeagueSeasons() {
    try {
      const res = await this.api.get("/leagues/seasons");
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching seasons:", err.message);
      return [];
    }
  }

  /* =========================
      🏟️ TEAMS
  ========================= */
  async getTeamsByLeague(leagueId, season = new Date().getFullYear()) {
    try {
      const res = await this.api.get("/teams", {
        params: { 
          league: leagueId,
          season: season
        },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching teams by league:", err.message);
      return [];
    }
  }

  async getTeamDetail(teamId) {
    try {
      const res = await this.api.get("/teams", {
        params: { id: teamId },
      });
      return res.data?.response?.[0] || {};
    } catch (err) {
      console.error("❌ Error fetching team detail:", err.message);
      return {};
    }
  }

  async getTeamStatistics(teamId, leagueId, season = new Date().getFullYear()) {
    try {
      const res = await this.api.get("/teams/statistics", {
        params: { 
          team: teamId,
          league: leagueId,
          season: season
        },
      });
      return res.data?.response || {};
    } catch (err) {
      console.error("❌ Error fetching team statistics:", err.message);
      return {};
    }
  }

  async searchTeams(query) {
    try {
      const res = await this.api.get("/teams", {
        params: { search: query },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error searching teams:", err.message);
      return [];
    }
  }

  /* =========================
      👥 PLAYERS
  ========================= */
  async getPlayersByTeam(teamId, season = new Date().getFullYear()) {
    try {
      const res = await this.api.get("/players", {
        params: { 
          team: teamId,
          season: season
        },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching players by team:", err.message);
      return [];
    }
  }

  async getPlayerDetail(playerId, season = new Date().getFullYear()) {
    try {
      const res = await this.api.get("/players", {
        params: { 
          id: playerId,
          season: season
        },
      });
      return res.data?.response?.[0] || {};
    } catch (err) {
      console.error("❌ Error fetching player detail:", err.message);
      return {};
    }
  }

  async searchPlayers(query, season = new Date().getFullYear()) {
    try {
      const res = await this.api.get("/players", {
        params: { 
          search: query,
          season: season
        },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error searching players:", err.message);
      return [];
    }
  }

  async getPlayerSeasons(playerId) {
    try {
      const res = await this.api.get("/players/seasons", {
        params: { player: playerId },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching player seasons:", err.message);
      return [];
    }
  }

  /* =========================
      ⚽ TOP SCORERS & ASSISTS
  ========================= */
  async getTopScorers(leagueId, season = new Date().getFullYear()) {
    try {
      const res = await this.api.get("/players/topscorers", {
        params: { 
          league: leagueId,
          season: season
        },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching top scorers:", err.message);
      return [];
    }
  }

  async getTopAssists(leagueId, season = new Date().getFullYear()) {
    try {
      const res = await this.api.get("/players/topassists", {
        params: { 
          league: leagueId,
          season: season
        },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching top assists:", err.message);
      return [];
    }
  }

  async getTopYellowCards(leagueId, season = new Date().getFullYear()) {
    try {
      const res = await this.api.get("/players/topyellowcards", {
        params: { 
          league: leagueId,
          season: season
        },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching top yellow cards:", err.message);
      return [];
    }
  }

  async getTopRedCards(leagueId, season = new Date().getFullYear()) {
    try {
      const res = await this.api.get("/players/topredcards", {
        params: { 
          league: leagueId,
          season: season
        },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching top red cards:", err.message);
      return [];
    }
  }

  /* =========================
      📊 STANDINGS
  ========================= */
  async getLeagueStandings(leagueId, season = new Date().getFullYear()) {
    try {
      const res = await this.api.get("/standings", {
        params: { 
          league: leagueId,
          season: season
        },
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
  async getMatchStatistics(fixtureId) {
    try {
      const res = await this.api.get("/fixtures/statistics", {
        params: { fixture: fixtureId },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching match statistics:", err.message);
      return [];
    }
  }

  async getMatchEvents(fixtureId) {
    try {
      const res = await this.api.get("/fixtures/events", {
        params: { fixture: fixtureId },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching match events:", err.message);
      return [];
    }
  }

  async getMatchLineups(fixtureId) {
    try {
      const res = await this.api.get("/fixtures/lineups", {
        params: { fixture: fixtureId },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching match lineups:", err.message);
      return [];
    }
  }

  async getMatchPlayerStatistics(fixtureId) {
    try {
      const res = await this.api.get("/fixtures/players", {
        params: { fixture: fixtureId },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching player statistics:", err.message);
      return [];
    }
  }

  /* =========================
      🔮 PREDICTIONS & ODDS
  ========================= */
  async getMatchPredictions(fixtureId) {
    try {
      const res = await this.api.get("/predictions", {
        params: { fixture: fixtureId },
      });
      return res.data?.response?.[0] || {};
    } catch (err) {
      console.error("❌ Error fetching predictions:", err.message);
      return {};
    }
  }

  async getMatchOdds(fixtureId) {
    try {
      const res = await this.api.get("/odds", {
        params: { fixture: fixtureId },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching odds:", err.message);
      return [];
    }
  }

  async getOddsByDateAndLeague(date, leagueId) {
    try {
      const res = await this.api.get("/odds", {
        params: { 
          date: date,
          league: leagueId
        },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching odds:", err.message);
      return [];
    }
  }

  /* =========================
      🔁 TRANSFERS
  ========================= */
  async getPlayerTransfers(playerId) {
    try {
      const res = await this.api.get("/transfers", {
        params: { player: playerId },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching player transfers:", err.message);
      return [];
    }
  }

  async getTeamTransfers(teamId) {
    try {
      const res = await this.api.get("/transfers", {
        params: { team: teamId },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching team transfers:", err.message);
      return [];
    }
  }

  /* =========================
      🏃 SIDELINED PLAYERS
  ========================= */
  async getSidelinedPlayers(playerId) {
    try {
      const res = await this.api.get("/sidelined", {
        params: { player: playerId },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching sidelined info:", err.message);
      return [];
    }
  }

  /* =========================
      🏆 TROPHIES
  ========================= */
  async getPlayerTrophies(playerId) {
    try {
      const res = await this.api.get("/trophies", {
        params: { player: playerId },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching player trophies:", err.message);
      return [];
    }
  }

  async getCoachTrophies(coachId) {
    try {
      const res = await this.api.get("/trophies", {
        params: { coach: coachId },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching coach trophies:", err.message);
      return [];
    }
  }

  /* =========================
      👨‍🏫 COACHES
  ========================= */
  async getCoachDetail(coachId) {
    try {
      const res = await this.api.get("/coachs", {
        params: { id: coachId },
      });
      return res.data?.response?.[0] || {};
    } catch (err) {
      console.error("❌ Error fetching coach detail:", err.message);
      return {};
    }
  }

  async searchCoaches(query) {
    try {
      const res = await this.api.get("/coachs", {
        params: { search: query },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error searching coaches:", err.message);
      return [];
    }
  }

  /* =========================
      🏟️ VENUES
  ========================= */
  async getVenuesByCity(city) {
    try {
      const res = await this.api.get("/venues", {
        params: { city },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching venues:", err.message);
      return [];
    }
  }

  async searchVenues(query) {
    try {
      const res = await this.api.get("/venues", {
        params: { search: query },
      });
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error searching venues:", err.message);
      return [];
    }
  }

  /* =========================
      🌍 COUNTRIES & TIMEZONES
  ========================= */
  async getCountries() {
    try {
      const res = await this.api.get("/countries");
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching countries:", err.message);
      return [];
    }
  }

  async getTimezones() {
    try {
      const res = await this.api.get("/timezone");
      return res.data?.response || [];
    } catch (err) {
      console.error("❌ Error fetching timezones:", err.message);
      return [];
    }
  }

  /* =========================
      ℹ️ API STATUS
  ========================= */
  async getAPIStatus() {
    try {
      const res = await this.api.get("/status");
      return res.data || {};
    } catch (err) {
      console.error("❌ Error fetching API status:", err.message);
      return {};
    }
  }
}

/* =========================
   ✅ EXPORTS
========================= */
module.exports = new FootballAPI();
