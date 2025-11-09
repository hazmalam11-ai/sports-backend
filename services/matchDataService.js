const axios = require('axios');
require('dotenv').config();

const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY;
const FOOTBALL_API_BASE = 'https://free-api-live-football-data.p.rapidapi.com';

// ✅ RapidAPI - Free Football Data
class MatchDataService {
  constructor() {
    this.apiKey = FOOTBALL_API_KEY;
    this.baseURL = FOOTBALL_API_BASE;

    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'x-rapidapi-key': this.apiKey,
        'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com'
      },
      timeout: 15000,
    });

    console.log("⚙️ MatchDataService API KEY:", this.apiKey ? "Loaded ✅" : "❌ Missing");
  }

  // ✅ Get live matches
  async getLiveMatches() {
    try {
      console.log("🔴 Fetching live matches from RapidAPI...");
      const response = await this.api.get("/football-current-live");
      console.log(`📡 API Response: ${response.data?.response?.live?.length || 0} live matches found`);
      return response.data?.response?.live || [];
    } catch (error) {
      console.error("❌ Error in getLiveMatches:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ Get matches by date
  async getMatchesByDate(date) {
    try {
      console.log(`📅 Fetching matches for date: ${date}`);
      const response = await this.api.get("/football-get-matches-by-date", {
        params: { date },
      });
      console.log(`📡 API Response: Matches retrieved for ${date}`);
      return response.data?.response || [];
    } catch (error) {
      console.error("❌ Error in getMatchesByDate:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ Get match details
  async getMatchDetails(matchId) {
    try {
      console.log(`📊 Fetching match details for: ${matchId}`);
      const response = await this.api.get("/football-get-match-by-id", {
        params: { match_id: matchId },
      });
      console.log(`📡 API Response: Match details retrieved`);
      return response.data?.response?.[0] || null;
    } catch (error) {
      console.error("❌ Error in getMatchDetails:", error.response?.data || error.message);
      return null;
    }
  }

  // ✅ Get player statistics for a specific match
  async getMatchPlayerStats(matchId) {
    try {
      console.log(`⚽ Fetching player stats for match: ${matchId}`);
      const response = await this.api.get("/football-get-players-by-match", {
        params: { match_id: matchId },
      });
      console.log(`📡 API Response: Player stats retrieved`);
      return response.data?.response || [];
    } catch (error) {
      console.error("❌ Error in getMatchPlayerStats:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ Get leagues
  async getLeagues() {
    try {
      console.log(`🏆 Fetching leagues`);
      const response = await this.api.get("/football-get-all-leagues");
      console.log(`📡 API Response: Leagues retrieved`);
      return response.data?.response || [];
    } catch (error) {
      console.error("❌ Error in getLeagues:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ Get teams by league
  async getTeamsByLeague(leagueId) {
    try {
      console.log(`🏟️ Fetching teams for league: ${leagueId}`);
      const response = await this.api.get("/football-get-all-teams-by-league-id", {
        params: { league_id: leagueId },
      });
      console.log(`📡 API Response: Teams retrieved`);
      return response.data?.response || [];
    } catch (error) {
      console.error("❌ Error in getTeamsByLeague:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ Process match data for fantasy scoring
  processMatchDataForFantasy(matchData) {
    const processedData = {
      matchId: matchData.fixture.id,
      homeTeam: {
        id: matchData.teams.home.id,
        name: matchData.teams.home.name,
        players: []
      },
      awayTeam: {
        id: matchData.teams.away.id,
        name: matchData.teams.away.name,
        players: []
      },
      status: matchData.fixture.status.short,
      date: matchData.fixture.date
    };

    // Process home team players
    if (matchData.players && matchData.players[0]) {
      processedData.homeTeam.players = matchData.players[0].map(player => ({
        playerId: player.player.id,
        name: player.player.name,
        position: this.mapPosition(player.statistics[0]?.games.position),
        minutesPlayed: player.statistics[0]?.games.minutes || 0,
        goals: player.statistics[0]?.goals.total || 0,
        assists: player.statistics[0]?.goals.assists || 0,
        yellowCards: player.statistics[0]?.cards.yellow || 0,
        redCards: player.statistics[0]?.cards.red || 0,
        penaltiesSaved: player.statistics[0]?.goals.saves || 0,
        penaltiesMissed: player.statistics[0]?.penalty.missed || 0,
        cleanSheet: this.calculateCleanSheet(player.statistics[0], true),
        goalsConceded: this.calculateGoalsConceded(player.statistics[0], true)
      }));
    }

    // Process away team players
    if (matchData.players && matchData.players[1]) {
      processedData.awayTeam.players = matchData.players[1].map(player => ({
        playerId: player.player.id,
        name: player.player.name,
        position: this.mapPosition(player.statistics[0]?.games.position),
        minutesPlayed: player.statistics[0]?.games.minutes || 0,
        goals: player.statistics[0]?.goals.total || 0,
        assists: player.statistics[0]?.goals.assists || 0,
        yellowCards: player.statistics[0]?.cards.yellow || 0,
        redCards: player.statistics[0]?.cards.red || 0,
        penaltiesSaved: player.statistics[0]?.goals.saves || 0,
        penaltiesMissed: player.statistics[0]?.penalty.missed || 0,
        cleanSheet: this.calculateCleanSheet(player.statistics[0], false),
        goalsConceded: this.calculateGoalsConceded(player.statistics[0], false)
      }));
    }

    return processedData;
  }

  // ✅ Convert API match data to ExternalMatch schema format
  convertToExternalMatchFormat(apiMatchData) {
    if (!apiMatchData) return null;

    return {
      apiId: apiMatchData.fixture.id,
      fixture: {
        id: apiMatchData.fixture.id,
        referee: apiMatchData.fixture.referee,
        timezone: apiMatchData.fixture.timezone || "UTC",
        date: new Date(apiMatchData.fixture.date),
        timestamp: apiMatchData.fixture.timestamp,
        periods: apiMatchData.fixture.periods || {},
        venue: {
          id: apiMatchData.fixture.venue?.id || null,
          name: apiMatchData.fixture.venue?.name || "Unknown Venue",
          city: apiMatchData.fixture.venue?.city || "Unknown City"
        },
        status: {
          long: apiMatchData.fixture.status?.long || "Not Started",
          short: apiMatchData.fixture.status?.short || "NS",
          elapsed: apiMatchData.fixture.status?.elapsed || null,
          extra: apiMatchData.fixture.status?.extra || null
        }
      },
      league: {
        id: apiMatchData.league.id,
        name: apiMatchData.league.name,
        country: apiMatchData.league.country,
        logo: apiMatchData.league.logo,
        flag: apiMatchData.league.flag,
        season: apiMatchData.league.season || new Date().getFullYear(),
        round: apiMatchData.league.round,
        standings: apiMatchData.league.standings || false
      },
      teams: {
        home: {
          id: apiMatchData.teams.home.id,
          name: apiMatchData.teams.home.name,
          logo: apiMatchData.teams.home.logo,
          winner: apiMatchData.teams.home.winner
        },
        away: {
          id: apiMatchData.teams.away.id,
          name: apiMatchData.teams.away.name,
          logo: apiMatchData.teams.away.logo,
          winner: apiMatchData.teams.away.winner
        }
      },
      goals: {
        home: apiMatchData.goals?.home || null,
        away: apiMatchData.goals?.away || null
      },
      score: {
        halftime: apiMatchData.score?.halftime || {},
        fulltime: apiMatchData.score?.fulltime || {},
        extratime: apiMatchData.score?.extratime || {},
        penalty: apiMatchData.score?.penalty || {}
      },
      matchType: "Regular Match",
      season: apiMatchData.league.season,
      leagueId: apiMatchData.league.id
    };
  }

  // ✅ Map API position to our position system
  mapPosition(apiPosition) {
    const positionMap = {
      'G': 'Goalkeeper',
      'D': 'Defender',
      'M': 'Midfielder',
      'F': 'Forward',
      'A': 'Attacker'
    };
    return positionMap[apiPosition] || 'Midfielder';
  }

  // ✅ Calculate clean sheet
  calculateCleanSheet(playerStats, isHome) {
    if (!playerStats) return false;
    return false;
  }

  // ✅ Calculate goals conceded
  calculateGoalsConceded(playerStats, isHome) {
    if (!playerStats) return 0;
    return 0;
  }

  // ✅ Sync match data to fantasy teams
  async syncMatchToFantasyTeams(matchId) {
    try {
      console.log(`🔄 Attempting to sync match ${matchId}...`);
      const matchStats = await this.getMatchPlayerStats(matchId);

      if (!matchStats.response || matchStats.response.length === 0) {
        console.log(`⚠️ No player statistics available for match ${matchId}, using fallback data`);
        const matchDetails = await this.getMatchDetails(matchId);
        if (!matchDetails) throw new Error('Match not found');

        const fantasyScoringService = require('./fantasyScoringService');
        await fantasyScoringService.syncMatchDataToFantasyTeams(matchId);
        console.log(`✅ Synced match ${matchId} with fallback data`);
        return { status: 'synced_with_fallback', matchId };
      }

      const processedData = this.processMatchDataForFantasy(matchStats.response[0]);
      const FantasyTeam = require('../models/FantasyTeam');
      const teams = await FantasyTeam.find().populate('players.player');

      for (const team of teams) {
        for (const playerData of team.players) {
          if (!playerData.player) continue;
          const homePlayer = processedData.homeTeam.players.find(p => p.playerId === playerData.player.apiId);
          const awayPlayer = processedData.awayTeam.players.find(p => p.playerId === playerData.player.apiId);
          const matchPlayer = homePlayer || awayPlayer;
          if (matchPlayer) {
            playerData.minutesPlayed = matchPlayer.minutesPlayed;
            playerData.goals = matchPlayer.goals;
            playerData.assists = matchPlayer.assists;
            playerData.cleanSheet = matchPlayer.cleanSheet;
            playerData.goalsConceded = matchPlayer.goalsConceded;
            playerData.yellowCards = matchPlayer.yellowCards;
            playerData.redCards = matchPlayer.redCards;
            playerData.penaltiesSaved = matchPlayer.penaltiesSaved;
            playerData.penaltiesMissed = matchPlayer.penaltiesMissed;
          }
        }
        await team.save();
      }

      console.log(`✅ Synced real match data for ${teams.length} fantasy teams`);
      return processedData;
    } catch (error) {
      console.error('❌ Error syncing match data:', error);
      try {
        console.log(`🔄 Trying fallback sync for match ${matchId}...`);
        const fantasyScoringService = require('./fantasyScoringService');
        await fantasyScoringService.syncMatchDataToFantasyTeams(matchId);
        console.log(`✅ Fallback sync successful for match ${matchId}`);
        return { status: 'synced_with_fallback', matchId };
      } catch (fallbackError) {
        console.error('❌ Fallback sync also failed:', fallbackError);
        throw error;
      }
    }
  }
}

// Export individual functions
module.exports = {
  getLiveMatches: () => new MatchDataService().getLiveMatches(),
  getMatchesByDate: (date) => new MatchDataService().getMatchesByDate(date),
  getMatchDetails: (matchId) => new MatchDataService().getMatchDetails(matchId),
  getMatchPlayerStats: (matchId) => new MatchDataService().getMatchPlayerStats(matchId),
  getLeagues: () => new MatchDataService().getLeagues(),
  getTeamsByLeague: (leagueId) => new MatchDataService().getTeamsByLeague(leagueId),
  processMatchDataForFantasy: (matchData) => new MatchDataService().processMatchDataForFantasy(matchData),
  convertToExternalMatchFormat: (apiMatchData) => new MatchDataService().convertToExternalMatchFormat(apiMatchData),
  syncMatchToFantasyTeams: (matchId) => new MatchDataService().syncMatchToFantasyTeams(matchId)
};