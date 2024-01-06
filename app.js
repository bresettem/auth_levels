//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const pg = require("pg");
const port = 3000;
console.log(process.env.SECRET_KEY);
const db = new pg.Client({
  user: "brese",
  host: "localhost",
  database: "userdb",
  password: "Hello123",
  port: 5432,
});

db.connect();

db.query("CREATE EXTENSION IF NOT EXISTS pgcrypto;", (err, res) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("pgcrypto extension enabled");
  }
});

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", async function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  try {
    const results = await db.query("SELECT * FROM users WHERE email = $1", [
      username,
    ]);
    const user = results.rows[0];

    if (user) {
      res.render("register", {
        message: "The email already exists, try again.",
      });
    } else {
      await db.query(
        `INSERT INTO users (email, password) VALUES ($1, pgp_sym_encrypt($2, '${SECRET_KEY}'))`,
        [username, password]
      );
      res.render("secrets");
    }
  } catch (error) {
    console.log(error.message);
    res.render("register", {
      message: "Server is not connected, please try again later.",
    });
  }
});

app.post("/login", async function (req, res) {
  const username = req.body.username;
  const password = req.body.password;

  try {
    const results =
      'SELECT email, pgp_sym_decrypt(password::bytea, $2) AS "decryptedPassword" FROM users WHERE email = $1';
    const values = [username, SECRET_KEY];
    const user = (await db.query(results, values)).rows[0];
    if (user) {
      console.log("user", user);
      if (password == user.decryptedPassword) {
        res.render("secrets");
      } else {
        res.render("login", {
          message: "The password is not correct, try again.",
        });
      }
    } else {
      res.render("login", {
        message: "The username is not correct, try again.",
      });
    }
  } catch (error) {
    console.error(error.detail);
    res.render("login", { message: "An error occured, please try again." });
  }
});

app.listen(port, function () {
  console.log(`Server started on port 3000.`);
});
