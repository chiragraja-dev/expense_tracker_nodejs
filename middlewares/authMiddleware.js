const jwt = require('jsonwebtoken');
require('dotenv').config();

const isUserAuthorized = (req, res, next) => {
    const authHearder = req.headers.authorization

    if (!authHearder) {
        res.status(401).json({ error: "Invalid token" })
    }
    const token = authHearder.split(' ')[1];
    if (!token) res.status(401).json({ error: 'Unauthorized' })
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()
    } catch (error) {
        res.status(401).json({ error: 'Unauthorized', message: error?.message })
    }
}

module.exports = { isUserAuthorized }
