const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email createdAt");
    if (!user) return res.status(404).json({ message: "Account not found." });
    res.json({ user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt } });
  } catch (err) {
    res.status(500).json({ message: "Failed to load profile." });
  }
});

router.patch("/profile", verifyToken, async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

    if (!name || name.length > 80) {
      return res.status(400).json({ message: "Name must be between 1 and 80 characters." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    const existing = await User.findOne({ email, _id: { $ne: req.user.id } }).select("_id");
    if (existing) return res.status(409).json({ message: "That email is already in use." });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { name, email } },
      { new: true, runValidators: true, select: "name email createdAt" }
    );
    if (!user) return res.status(404).json({ message: "Account not found." });
    res.json({ user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "That email is already in use." });
    }
    res.status(500).json({ message: "Failed to update profile." });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({ message: "Account created. Please log in." });
  } catch (err) {
    res.status(500).json({ message: "Registration failed.", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed.", error: err.message });
  }
});

module.exports = router;
