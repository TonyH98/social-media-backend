const pgp = require("pg-promise")();
require("dotenv").config();

const { DATABASE_URL, PG_HOST, PG_PORT, PG_DATABASE, PG_USER } = process.env;

const cn = DATABASE_URL
  ? {
      connectionString: DATABASE_URL,
      max: 30,
    }
  : {
      host: PG_HOST || "postgres_container", 
      port: PG_PORT || 5432,
      database: PG_DATABASE,
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
    };

const db = pgp(cn);

module.exports = db;
