// services/footballAPI.js
const axios = require("axios");

class FootballAPIService {
  constructor() {
    this.baseURL = "https://v3.football.api-sports.io";
    this.apiKey = process.env.FOOTBALL_API_KEY;

    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        "x-apisports-key": this.apiKey,
      },
      timeout: 15000,
    });

    console.log("⚙️ Using API KEY:", this.apiKey ? "Loaded ✅" : "❌ Missing");
  }

  // ✅ جلب المباريات المباشرة
  async getLiveMatches() {
    try {
      const response = await this.api.get("/fixtures", { params: { live: "all" } });
      return response.data.response;
    } catch (error) {
      console.error("❌ Error in getLiveMatches:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ جلب مباريات اليوم
  async getTodayMatches() {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await this.api.get("/fixtures", { params: { date: today } });
      return response.data.response;
    } catch (error) {
      console.error("❌ Error in getTodayMatches:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ جلب مباريات بين تاريخين
  async getMatchesInRange(fromDate, toDate) {
    try {
      const from = new Date(fromDate).toISOString().split("T")[0];
      const to = new Date(toDate).toISOString().split("T")[0];

      const response = await this.api.get("/fixtures", {
        params: { from, to },
      });

      return response.data.response;
    } catch (error) {
      console.error("❌ Error in getMatchesInRange:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ جلب مباريات أسبوع فات + أسبوع جاي
  async getMatchesOneWeekRange() {
    try {
      const today = new Date();

      const fromDate = new Date(today);
      fromDate.setDate(today.getDate() - 7);

      const toDate = new Date(today);
      toDate.setDate(today.getDate() + 7);

      const from = fromDate.toISOString().split("T")[0];
      const to = toDate.toISOString().split("T")[0];

      const response = await this.api.get("/fixtures", {
        params: { from, to },
      });

      return response.data.response;
    } catch (error) {
      console.error("❌ Error in getMatchesOneWeekRange:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ مباراة محددة
  async getMatchById(matchId) {
    try {
      const response = await this.api.get("/fixtures", { params: { id: matchId } });
      return response.data.response[0] || null;
    } catch (error) {
      console.error("❌ Error in getMatchById:", error.response?.data || error.message);
      return null;
    }
  }

  // ✅ آخر مباريات فريق
  async getTeamLastMatches(teamId, count = 5) {
    try {
      const response = await this.api.get("/fixtures", { params: { team: teamId, last: count } });
      return response.data.response;
    } catch (error) {
      console.error("❌ Error in getTeamLastMatches:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ ترتيب الدوري
  async getStandings(leagueId, season) {
    try {
      const response = await this.api.get("/standings", { params: { league: leagueId, season } });
      return response.data.response[0]?.league?.standings[0] || [];
    } catch (error) {
      console.error("❌ Error in getStandings:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ الدوريات
  async getLeagues(country, season) {
    try {
      const params = {};
      if (country) params.country = country;
      if (season) params.season = season;

      const response = await this.api.get("/leagues", { params });
      return response.data.response;
    } catch (error) {
      console.error("❌ Error in getLeagues:", error.response?.data || error.message);
      return [];
    }
  }

  // ✅ معلومات فريق
  async getTeamInfo(teamId) {
    try {
      const response = await this.api.get("/teams", { params: { id: teamId } });
      return response.data.response[0] || null;
    } catch (error) {
      console.error("❌ Error in getTeamInfo:", error.response?.data || error.message);
      return null;
    }
  }

  // ✅ لاعبي فريق
  async getTeamPlayers(teamId, season) {
    try {
      const response = await this.api.get("/players", { params: { team: teamId, season } });
      return response.data.response;
    } catch (error) {
      console.error("❌ Error in getTeamPlayers:", error.response?.data || error.message);
      return [];
    }
  }
}

module.exports = new FootballAPIService();