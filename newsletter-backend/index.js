import 'dotenv/config'; 
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import crypto from "crypto";
import nodemailer from "nodemailer";

const app = express();
app.use(cors());
app.use(express.json()); // wichtig, sonst req.body = undefined

// 🔹 MySQL-Pool erstellen
const db = await mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Testen der Verbindung
try {
  const [rows] = await db.query("SELECT NOW() AS jetzt");
  console.log("✅ DB Verbindung OK:", rows);
} catch (err) {
  console.error("❌ DB-Verbindungsfehler beim Start:", err.message);
  process.exit(1);
}

// 🔹 Nodemailer Transport (Mailhog)
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "localhost",
  port: process.env.MAIL_PORT || 1025,
  secure: process.env.MAIL_SECURE === "true" || false,
  auth: process.env.MAIL_USER ? {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  } : undefined
});

// 📌 POST /subscribe – neue Adresse eintragen
app.post("/subscribe", async (req, res) => {
  try {
    const { email } = req.body;

    console.log("🔹 Neue Anmeldung erhalten:", email);  // <-- hier loggen wir die E-Mail

    // Validierung
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log("❌ Ungültige E-Mail:", email);
      return res.status(400).json({ error: "Ungültige E-Mail-Adresse" });
    }

    // Prüfen, ob schon vorhanden
    const [rows] = await db.query("SELECT id FROM subscribers WHERE email = ?", [email]);
    console.log("🔹 Prüfe, ob schon vorhanden:", rows);

    if (rows.length > 0) {
      console.log("⚠️ Adresse schon eingetragen:", email);
      return res.status(400).json({ error: "Adresse schon eingetragen" });
    }

    // Hash generieren & speichern
    const hash = crypto.randomBytes(32).toString("hex");
    console.log("🔹 Generierter Hash:", hash);

    const result = await db.query(
      "INSERT INTO subscribers (email, hash) VALUES (?, ?)",
      [email, hash]
    );
    console.log("✅ Insert Result:", result);

    return res.json({ message: "Bitte bestätige deine Anmeldung per E-Mail." });
  } catch (err) {
    console.error("❌ Fehler beim /subscribe:", err);
    return res.status(500).json({ error: "Serverfehler" });
  }
});

// GET /check-confirmation/:email
app.get("/check-confirmation/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const [rows] = await db.query(
      "SELECT confirmed_at FROM subscribers WHERE email = ?",
      [email]
    );

    if (rows.length === 0) return res.json({ confirmed: false });

    return res.json({ confirmed: !!rows[0].confirmed_at });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Serverfehler" });
  }
});

// 📌 GET /confirm/:hash – Double-Opt-In Link
app.get("/confirm/:hash", async (req, res) => {
  try {
    const { hash } = req.params;

    const [rows] = await db.query(
      "SELECT id, confirmed_at FROM subscribers WHERE hash = ?",
      [hash]
    );

    if (rows.length === 0) {
      return res.status(400).send("Ungültiger Bestätigungslink.");
    }

    if (rows[0].confirmed_at) {
      return res.send("Die E-Mail wurde bereits bestätigt.");
    }

    // DB aktualisieren
    await db.query(
      "UPDATE subscribers SET confirmed_at = NOW() WHERE hash = ?",
      [hash]
    );

    res.send("Danke! Deine Newsletter-Anmeldung wurde bestätigt.");

  } catch (err) {
    console.error("❌ Fehler im /confirm/:hash:", err);
    res.status(500).send("Serverfehler");
  }
});

// 🔹 Server starten
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend läuft auf http://localhost:${PORT}`);
});