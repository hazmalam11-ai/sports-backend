// routes/coaches.js
const express = require("express");
const axios = require("axios");
const Coach = require("../models/Coach");
const { requireAuth, authorize } = require("../middlewares/auth");

const router = express.Router();

// ✅ RapidAPI Base
const RAPID_API_BASE = "https://free-api-live-football-data.p.rapidapi.com";

// ✅ Helper function to fetch from RapidAPI
async function fetchFromRapidAPI(endpoint) {
  try {
    const response = await axios.get(`${RAPID_API_BASE}${endpoint}`, {
      headers: {
        "x-rapidapi-key": process.env.FOOTBALL_API_KEY,
        "x-rapidapi-host": "free-api-live-football-data.p.rapidapi.com",
      },
      timeout: 15000,
    });
    return response.data;
  } catch (error) {
    console.error("❌ RapidAPI Fetch Error:", error.response?.data || error.message);
    throw new Error(error.message || "Error fetching data from RapidAPI");
  }
}

/* ==========================
   ⚽ RapidAPI Integration
   ========================== */

// 📌 جلب بيانات مدرب معين من API
router.get("/api/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🧠 Fetching coach info for ID: ${id}...`);

    const data = await fetchFromRapidAPI(`/football-coach-detail?coachid=${id}`);

    if (!data || !data.response || data.response.length === 0) {
      console.log("⚠️ No coach found in API");
      return res.status(404).json({ message: "Coach not found in API" });
    }

    const coach = data.response[0];
    const formatted = {
      id: coach.coach_id || id,
      name: coach.name || "Unknown Coach",
      age: coach.age || null,
      nationality: coach.nationality || "Unknown",
      team: {
        id: coach.team_id || null,
        name: coach.team_name || "Unknown Team",
        logo: coach.team_logo || "",
      },
      photo: coach.photo || "",
    };

    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching coach from API:", err.message);
    res.status(500).json({ error: "Error fetching coach from API", details: err.message });
  }
});

// 📌 جلب كل المدربين من API
router.get("/api", async (req, res) => {
  try {
    console.log("📋 Fetching all coaches from RapidAPI...");
    const data = await fetchFromRapidAPI("/football-all-coaches");

    if (!data || !data.response || data.response.length === 0) {
      console.log("⚠️ No coaches found");
      return res.json([]);
    }

    const formatted = data.response.map((coach) => ({
      id: coach.coach_id || 0,
      name: coach.name || "Unknown Coach",
      team: coach.team_name || "Unknown Team",
      nationality: coach.nationality || "Unknown",
      age: coach.age || null,
      photo: coach.photo || "",
    }));

    console.log(`✅ Returning ${formatted.length} coaches`);
    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching coaches:", err.message);
    res.status(500).json({ error: "Error fetching coaches from API", details: err.message });
  }
});

// 📌 جلب مدرب فريق معين من API (الجديد)
router.get("/api/team/:teamId/coach", async (req, res) => {
  try {
    const { teamId } = req.params;
    console.log(`🏟️ Fetching coach for team ID: ${teamId} from RapidAPI...`);

    const data = await fetchFromRapidAPI(`/football-team-coach?teamid=${teamId}`);

    if (!data || !data.response || data.response.length === 0) {
      console.log("⚠️ No coach found for this team");
      return res.status(404).json({ message: "No coach found for this team" });
    }

    const coach = data.response[0];
    const formatted = {
      id: coach.coach_id || 0,
      name: coach.name || "Unknown Coach",
      nationality: coach.nationality || "Unknown",
      age: coach.age || null,
      team: {
        id: teamId,
        name: coach.team_name || "Unknown Team",
        logo: coach.team_logo || "",
      },
      photo: coach.photo || "",
    };

    console.log("✅ Coach retrieved for team successfully");
    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching team coach:", err.message);
    res.status(500).json({ error: "Error fetching team coach", details: err.message });
  }
});

/* ==========================
   💾 MongoDB CRUD Endpoints
   ========================== */

// ➕ إضافة مدرب (admin/editor)
router.post("/", requireAuth, authorize("coach:create"), async (req, res, next) => {
  try {
    const { name, age, team } = req.body;
    if (!name || !team) {
      return res.status(400).json({ message: "name and team are required" });
    }

    const coach = await Coach.create({ name, age, team });
    res.status(201).json({ message: "Coach created successfully", coach });
  } catch (err) {
    next(err);
  }
});

// 📌 كل المدربين (من DB)
router.get("/", async (req, res, next) => {
  try {
    const coaches = await Coach.find().populate("team", "name country logo");
    res.json(coaches);
  } catch (err) {
    next(err);
  }
});

// 📌 مدرب واحد (من DB)
router.get("/:id", async (req, res, next) => {
  try {
    const coach = await Coach.findById(req.params.id).populate("team", "name country logo");
    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }
    res.json(coach);
  } catch (err) {
    next(err);
  }
});

// ✏️ تحديث مدرب
router.put("/:id", requireAuth, authorize("coach:update"), async (req, res, next) => {
  try {
    const coach = await Coach.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("team", "name country logo");

    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }
    res.json({ message: "Coach updated successfully", coach });
  } catch (err) {
    next(err);
  }
});

// 🗑️ حذف مدرب
router.delete("/:id", requireAuth, authorize("coach:delete"), async (req, res, next) => {
  try {
    const coach = await Coach.findByIdAndDelete(req.params.id);
    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }
    res.json({ message: "Coach deleted successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
