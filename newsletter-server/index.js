import 'dotenv/config';

console.log("🔍 DB_HOST:", process.env.DB_HOST);
console.log("🔍 DB_USER:", process.env.DB_USER);
console.log("🔍 DB_PASSWORD:", process.env.DB_PASSWORD ? "***" : "leer");
console.log("🔍 DB_NAME:", process.env.DB_NAME);

import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import crypto from "crypto";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 MySQL-Pool
const db = await mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

try {
  const [rows] = await db.query("SELECT NOW() AS jetzt");
  console.log("✅ DB Verbindung OK:", rows);
} catch (err) {
  console.error("❌ DB-Verbindungsfehler beim Start:", err.message);
  process.exit(1);
}

// 🔹 Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "localhost",
  port: process.env.MAIL_PORT || 1025,
  secure: process.env.MAIL_SECURE === "true" || false,
  auth: process.env.MAIL_USER ? {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  } : undefined
});

// 📌 API-Routen
app.post("/subscribe", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Ungültige E-Mail" });

  const [rows] = await db.query("SELECT id FROM subscribers WHERE email = ?", [email]);
  if (rows.length > 0) return res.status(400).json({ error: "Adresse schon eingetragen" });

  const hash = crypto.randomBytes(32).toString("hex");
  await db.query("INSERT INTO subscribers (email, hash, created_at) VALUES (?, ?, NOW())", [email, hash]);

  res.json({ message: "Bitte bestätige Deine Anmeldung per E-Mail." });
});

app.get("/check-confirmation/:email", async (req, res) => {
  const { email } = req.params;
  const [rows] = await db.query("SELECT confirmed_at FROM subscribers WHERE email = ?", [email]);
  if (!rows.length) return res.json({ confirmed: false });
  return res.json({ confirmed: !!rows[0].confirmed_at });
});

app.get("/confirm/:hash", async (req, res) => {
  const { hash } = req.params;
  const [rows] = await db.query("SELECT id, confirmed_at FROM subscribers WHERE hash = ?", [hash]);
  if (!rows.length) return res.status(400).send("Ungültiger Bestätigungslink.");
  if (rows[0].confirmed_at) return res.send("Bereits bestätigt.");

  await db.query("UPDATE subscribers SET confirmed_at = NOW() WHERE hash = ?", [hash]);
  res.send("Danke! Deine Anmeldung wurde bestätigt.");
});

// 🔹 Frontend ausliefern
app.use(express.static(path.join(__dirname, "public")));

// Alle nicht-API-Routen an index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🔹 Server starten
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend läuft auf http://localhost:${PORT}`));