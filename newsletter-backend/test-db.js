import mysql from "mysql2/promise";

const test = async () => {
  try {
    const db = await mysql.createPool({
      host: "localhost",
      port: 8889,      // MAMP MySQL-Port
      user: "root",    // MAMP User
      password: "root",// MAMP Passwort
      database: "newsletter"
    });

    const [rows] = await db.query("SELECT NOW() AS jetzt");
    console.log("✅ DB Verbindung OK:", rows);
    process.exit(0);
  } catch (err) {
    console.error("❌ DB-Verbindungsfehler:", err.message);
    process.exit(1);
  }
};

test();