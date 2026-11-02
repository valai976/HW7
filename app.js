const express = require("express");
const path = require("path");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const { register, login } = require("./helpers/auth");

function createApp(db) {
const app = express();
// Use EJS files for our pages.
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Read form submissions and serve CSS files.
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// Remember the user between page requests.
app.use(session({
    secret: "login-lab-local-development-secret",
    resave: false,
    saveUninitialized: false
}));

// Send visitors to the login page.
app.get("/", (req, res) => {
    res.redirect("/login");
});

// Display the login page.
app.get("/login", (req, res) => {
    res.render("login", { error: "" });
});
// Display the account creation page.
app.get("/register", (req, res) => {
    res.render("register", { error: "" });
});
// Process the account creation form.
app.post("/register", (req, res) => {
    register(db, req.body, (error, username) => {
        if (error) return res.render("register", { error });
        req.session.username = username;
        res.redirect("/landing");
    });
});
// Display the landing page only for a signed-in user.
app.get("/landing", (req, res) => {
    if (!req.session.username) {
        return res.redirect("/login");
    }

    res.render("landing", {
        username: req.session.username
    });
});
// Process the login form.
app.post("/login", (req, res) => {
    login(db, req.body, (error, username) => {
        if (error) return res.render("login", { error });
        req.session.username = username;
        res.redirect("/landing");
    });
});
return app;
}
function initializeDatabase(db, callback) {
    db.run("CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT NOT NULL)", callback);
}
if (require.main === module) {
    const db = new sqlite3.Database(path.join(__dirname, "users.db"));
    initializeDatabase(db, (error) => {
        if (error) {
            console.error("Database setup failed:", error.message);
            db.close();
            process.exitCode = 1;
            return;
        }
        createApp(db).listen(3000, () => console.log("Open http://localhost:3000"));
    });
}
module.exports = { createApp, initializeDatabase };
