const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

const app = express();

// Set up session
app.use(
  session({
    secret: "xyz123",
    resave: true,
    saveUninitialized: true,
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Set up Google OAuth
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: "http://localhost:3000/auth/google/callback",
//       prompt: "select_account",
//     },
//     (accessToken, refreshToken, profile, done) => {
//       return done(null, profile);
//     }
//   )
// );
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
      // hd: '',
      prompt: "select_account", // Add this line to force account selection
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

// Serialize user information
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Set up EJS as the view engine
app.set("view engine", "ejs");

// Set up routes
app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("user", {
      user: req.user,
      indianTime: getIndianTime(),
    });
  } else {
    res.render("home");
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["https://www.googleapis.com/auth/plus.login", "email"],
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/");
  }
);


// app.get("/logout", (req, res) => {
//   req.logout((err) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).send("Error during logout");
//     }
//     req.session.destroy((err) => {
//       if (err) {
//         console.error(err);
//         return res.status(500).send("Error during logout");
//       }
//       req.session = null;
//       res.redirect("/");
//     });
//   });
// });

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error during logout");
    }

    // Attempt to invalidate Google session token
    try {
      const idToken = req.user?.idToken;
      if (idToken) {
        client.revokeToken({ token: idToken });
      }
    } catch (error) {
      console.error("Error revoking Google token:", error);
    }

    req.session = null;
   
    res.redirect("/");
  });
});

// const { OAuth2Client } = require("google-auth-library");
// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// app.get("/logout", (req, res) => {
//   const idToken = req.user?.idToken;
//   if (idToken) {
//     const logoutUrl = `https://accounts.google.com/o/oauth2/revoke?token=${idToken}`;
//     res.redirect(logoutUrl);
//   } else {
//     req.logout();
//     req.session.destroy((err) => {
//       if (err) {
//         console.error(err);
//         return res.status(500).send("Error during logout");
//       }
//       res.redirect("/");
//     });
//   }
// });











// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Helper function to get Indian time
function getIndianTime() {
  const now = new Date();
  const options = { timeZone: "Asia/Kolkata" };
  return now.toLocaleString("en-US", options);
}
