const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const { connectToDb, sql } = require('../config/db')

const generateToken = (payload) => {
    const jwt_secrete = process.env.JWT_SECRET
    return jwt.sign(payload, jwt_secrete, { expiresIn: '24h' })
}

const hashedPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        throw new Error('Error hashing password');
    }
};

const checkIfUserExist = async (email) => {
    const pool = await connectToDb();
    const query = `SELECT * FROM users WHERE email =@email`;
    const result = await pool.request().input('email', email).query(query)
    return result.recordset
}

const createUser = async (fullName, email, password) => {
    const pool = await connectToDb();
    const query = `
    INSERT INTO users (fullName, email, password)
    OUTPUT INSERTED.id
    VALUES (@fullname, @email, @password)
    `
    const result = await pool
        .request()
        .input('fullname', fullName)
        .input('email', email)
        .input('password', password)
        .query(query)

    return result.recordset[0]?.id

}

const verifyPassword = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword)
}

module.exports = { generateToken, hashedPassword, checkIfUserExist, createUser, verifyPassword }