const express = require("express");
const jwt = require("jsonwebtoken");
const { v4: uuid } = require("uuid");
const { readStore, writeStore } = require("../utils/store");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

function makeToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/register", (req, res) => {
  const { name, email, password, role = "buyer" } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  if (!["buyer", "seller"].includes(role)) {
    return res.status(400).json({ error: "role must be buyer or seller." });
  }

  const store = readStore();
  const normalizedEmail = email.trim().toLowerCase();

  if (store.users.some(u => u.email === normalizedEmail)) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  // Development-only storage. Use bcrypt/argon2 in production.
  const user = {
    id: uuid(),
    name: name.trim(),
    email: normalizedEmail,
    password,
    role,
    createdAt: new Date().toISOString()
  };

  store.users.push(user);
  writeStore(store);

  const { password: _, ...safeUser } = user;
  res.status(201).json({ user: safeUser, token: makeToken(user) });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  const store = readStore();
  const user = store.users.find(u => u.email === String(email || "").trim().toLowerCase());

  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser, token: makeToken(user) });
});

module.exports = router;
