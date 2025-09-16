const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

// 🟢 Register
router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password, role = "user" } = req.body;

    // 1) تحقق من الحقول
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "username, email, and password are required",
      });
    }

    // 2) تحقق من وجود الإيميل
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "Email already in use",
      });
    }

    // 3) تحقق من وجود الـ username
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(409).json({
        success: false,
        message: "Username already in use",
      });
    }

    // 4) تشفير الباسورد
    const hashed = await bcrypt.hash(password, 10);

    // 5) إنشاء مستخدم جديد
    const user = await User.create({
      username,
      email,
      password: hashed,
      role,
    });

    // 6) رجّع المستخدم بدون الباسورد
    const { password: _, ...safeUser } = user.toObject();
    res.status(201).json({
      success: true,
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
      return res.status(400).json({
        success: false,
        message: "email and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "fallbackSecret",
      { expiresIn: "7d" }
    );

    const { password: _, ...safeUser } = user.toObject();
    res.json({
      success: true,
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
  res.json({ success: true, user: req.user });
});

module.exports = router;