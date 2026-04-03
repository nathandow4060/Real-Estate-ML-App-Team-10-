//AUTHOR: Nathan Dow, Ethan McDonell
const { Pool } = require("pg");
require('dotenv').config()

let pool;

if (process.env.DATABASE_URL) {
  // Render / Production environment
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
  console.log("Connected to Render Postgres via DATABASE_URL");
} else {
  // Local environment
  pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
  });
  console.log("Connected to local Postgres");
}

module.exports = pool;

