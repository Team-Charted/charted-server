const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = (req, res, next) => {
    //get adminSecret from header
    const adminSecret = req.header('x-admin-secret');

    //check if no adminSecret
    if (!adminSecret) {
        return res.status(403).json({ errors: [{ msg: "No adminSecret, forbidden" }] });
    }

    if (process.env.adminSecret == adminSecret) {
        next();
    }

    else {
        return res.status(403).json({ errors: [{ msg: "Invalid adminSecret, forbidden" }] });
    }

}