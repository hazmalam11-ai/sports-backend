const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { requireAuth } = require("../middlewares/auth"); // ✅

const router = express.Router();

// 🟢 Register
router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password, role = "user" } = req.body;

    if (!username || !email || !password) {
      res.status(400);
      throw new Error("username, email, and password are required");
    }

    const exists = await User.findOne({ email });
    if (exists) {
      res.status(409);
      throw new Error("Email already in use");
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed, role });

    const { password: _, ...safeUser } = user.toObject();
    res.status(201).json({
      message: "User registered successfully",
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
});

// 🟡 Login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400);
      throw new Error("email and password are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400);
      throw new Error("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400);
      throw new Error("Invalid email or password");
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "fallbackSecret", // ✅ fallback عشان التطوير
      { expiresIn: "7d" }
    );

    const { password: _, ...safeUser } = user.toObject();
    res.json({
      message: "Login successful",
      user: safeUser,
      token,
    });
  } catch (err) {
    next(err);
  }
});

// 🔵 Get user info from token
router.get("/me", requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

module.exports = router;
