// Normalize usernames but preserve password whitespace.
function validateCredentials(body = {}) {
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    return { username, password,
        error: !username || !password.trim() ? "Please enter a username and password." : null };
}
function register(db, body, callback) {
    const { username, password, error } = validateCredentials(body);
    if (error) return callback(error);
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], (err) => {
        if (err) return callback(err.code === "SQLITE_CONSTRAINT"
            ? "That username is already taken."
            : "Could not create your account. Please try again.");
        callback(null, username);
    });
}
function login(db, body, callback) {
    const { username, password, error } = validateCredentials(body);
    if (error) return callback(error);
    db.get("SELECT username, password FROM users WHERE username = ?", [username], (err, user) => {
        if (err) return callback("Could not log in. Please try again.");
        if (!user || user.password !== password) return callback("Invalid username or password.");
        callback(null, user.username);
    });
}
module.exports = { validateCredentials, register, login };
