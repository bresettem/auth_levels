//jshint esversion:6
import env from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import Sequelize from "sequelize";
import flash from "connect-flash";
import GoogleStrategy from "passport-google-oauth20";

const app = express();
const port = 3000;
const saltRounds = 10;
env.config();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // cookie: {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   maxAge: 1000 * 60 * 60 * 24, // Optional: cookie expiry
    // },
  })
);

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

//  Configure Passport Local Strategy
passport.use(
  "local",
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              return cb(null, user);
            } else {
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found");
      }
    } catch (err) {
      console.log(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

//  Setup Google Strategy
passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.emails[0].value,
        ]);
        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2)",
            [profile.emails[0].value, "google"]
          );
          return cb(null, newUser.rows[0]);
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);

//   Render Home Page -
app.get("/", (req, res) => {
  res.render("home");
});

//   Render Google Auth -
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/register" }),
  function (req, res) {
    // Successful authentication, redirect Secrets.
    res.redirect("/secrets");
  }
);

// Render Register Page
app.get("/register", (req, res) => {
  res.render("register");
});

// Post Register Information
app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      req.redirect("/login");
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          const result = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [email, hash]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            console.log("success");
            res.redirect("/secrets");
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

//   Render Login Page
app.get("/login", (req, res) => {
  const messages = req.flash("error"); // Assign flash messages to const to pass it as object in render
  res.render("login", { messages: messages });
});

//   Post Login Information
app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true, // Enable flash messages for failures
  }),
  (req, res) => {
    res.redirect("/secrets");
  }
);

//   Secrets Route
app.get("/secrets", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const userId = req.session.passport.user;
      //TODO: Update this to pull in the user secret to render in secrets.ejs
      const userSecrets = await db.query(
        "SELECT secret FROM users WHERE id = $1",
        [userId]
      );
      const result = userSecrets.rows[0];
      res.render("secrets", { secret: result.secret });
    } catch (error) {
      console.error(error);
    }
  } else {
    // res.cookie("connect.sid", "", { expires: new Date(0) });
    res.redirect("/login");
  }
});

app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    // res.cookie("connect.sid", "", { expires: new Date(0) });
    res.redirect("/login");
  }
});

//TODO: Create the post route for submit.
//Handle the submitted data and add it to the database

app.post("/submit", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const secret = req.body.secret;
      const userId = req.session.passport.user;
      await db.query("UPDATE users INT SET secret = $1 WHERE id = $2", [
        secret,
        userId,
      ]);
      res.render("secrets", { secret: secret });
    } catch (error) {
      console.error("Error! ", error);
    }
  } else {
    // res.cookie("connect.sid", "", { expires: new Date(0) });
    res.redirect("/login");
  }
});
//   Logout Route
app.get("/logout", (req, res) => {
  req.logout(function (error) {
    // Passport's method to log out the user
    if (error) {
      console.log(error.message);
      return next(error);
    }
    // res.cookie("connect.sid", "", { expires: new Date(0) });
    res.redirect("/"); // Redirect to the homepage or login page after logout
  });
});

app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}`);
});
