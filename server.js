// server.js (Enhanced with Socket.io)
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");
const errorHandler = require("./middlewares/errorHandler");

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5050;

// ✅ Socket.io Setup
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// ✅ Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(helmet());

// ✅ CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ✅ Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again later." },
});
app.use(limiter);

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Make io available to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ✅ Routes
const authRoutes = require("./routes/auth");
const teamRoutes = require("./routes/teams");
const playerRoutes = require("./routes/players");
const coachRoutes = require("./routes/coaches");
const tournamentRoutes = require("./routes/tournaments");
const matchRoutes = require("./routes/matches");
const newsRoutes = require("./routes/news");
const commentRoutes = require("./routes/comments");
const likesRoutes = require("./routes/likes");
const dashboardRoutes = require("./routes/dashboard");

// ✅ Use Routes
app.use("/auth", authRoutes);
app.use("/teams", teamRoutes);
app.use("/players", playerRoutes);
app.use("/coaches", coachRoutes);
app.use("/tournaments", tournamentRoutes);
app.use("/matches", matchRoutes);
app.use("/news", newsRoutes);
app.use("/comments", commentRoutes);
app.use("/likes", likesRoutes);
app.use("/dashboard", dashboardRoutes);

// ===============================
// ✅ Socket.io Live Updates
io.on("connection", (socket) => {
  console.log(`👤 User connected: ${socket.id}`);

  // ✅ Join specific match room
  socket.on("join-match", (matchId) => {
    socket.join(`match-${matchId}`);
    console.log(`👤 User ${socket.id} joined match ${matchId}`);
  });

  // ✅ Leave match room
  socket.on("leave-match", (matchId) => {
    socket.leave(`match-${matchId}`);
    console.log(`👤 User ${socket.id} left match ${matchId}`);
  });

  // ✅ Handle disconnect
  socket.on("disconnect", () => {
    console.log(`👋 User disconnected: ${socket.id}`);
  });
});

// ===============================
// ✅ Live Match Updates Functions (تستدعيها من الـ API أو Cron Jobs)

// دالة لإرسال تحديث Live Score
const sendLiveScoreUpdate = (matchId, scoreData) => {
  io.to(`match-${matchId}`).emit("score-update", {
    matchId,
    homeScore: scoreData.homeScore,
    awayScore: scoreData.awayScore,
    timestamp: new Date(),
  });
};

// دالة لإرسال أحداث المباراة
const sendMatchEvent = (matchId, eventData) => {
  io.to(`match-${matchId}`).emit("match-event", {
    matchId,
    type: eventData.type, // 'goal', 'card', 'substitution'
    minute: eventData.minute,
    player: eventData.player,
    team: eventData.team,
    description: eventData.description,
    timestamp: new Date(),
  });
};

// دالة لإرسال تحديث حالة المباراة
const sendMatchStatusUpdate = (matchId, status) => {
  io.to(`match-${matchId}`).emit("match-status", {
    matchId,
    status, // 'live', 'half-time', 'finished'
    timestamp: new Date(),
  });
};

// اجعل هذه الدالات متاحة عالمياً
global.sendLiveScoreUpdate = sendLiveScoreUpdate;
global.sendMatchEvent = sendMatchEvent;
global.sendMatchStatusUpdate = sendMatchStatusUpdate;

// ===============================
// ✅ Array مؤقتة لتخزين المستخدمين
let users = [];

// ✅ تسجيل مستخدم جديد
app.post("/api/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "الرجاء إدخال اسم المستخدم وكلمة المرور" });
  }

  const newUser = { username, password };
  users.push(newUser);

  res.json({ message: "تم التسجيل بنجاح ✅", user: newUser });
});

// ✅ تسجيل دخول
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res
      .status(401)
      .json({ error: "❌ اسم المستخدم أو كلمة المرور غير صحيحة" });
  }

  res.json({ message: "✅ تم تسجيل الدخول بنجاح", user });
});

// ===============================
// ✅ Test API لتجربة Live Updates
app.post("/api/test-live-update", (req, res) => {
  const { matchId, type, data } = req.body;

  if (type === "score") {
    sendLiveScoreUpdate(matchId, data);
  } else if (type === "event") {
    sendMatchEvent(matchId, data);
  } else if (type === "status") {
    sendMatchStatusUpdate(matchId, data.status);
  }

  res.json({ message: "Live update sent successfully!" });
});

// ✅ Test routes
app.get("/", (req, res) => {
  res.send("🚀 Football API with Live Updates running!");
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Hello from backend with Socket.io!" });
});

// ✅ Error Handler
app.use(errorHandler);

// ✅ Start server (استخدم server مش app)
server.listen(PORT, () =>
  console.log(`🚀 Server with Socket.io running at http://localhost:${PORT}`)
);