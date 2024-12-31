require('dotenv').config();
const sql = require('mssql');
const password = require('passport')

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        trustServerCertificate: true,
        trustedConnection: false,
        enableArithAbort: true,
        instancename: process.env.DB_INSTANCENAME
    },
    port: 1433
}

const connectToDb = async () => {
    try {
        const pool = await sql.connect(config);
        return pool
    } catch (error) {
        throw err
    }
}

module.exports = { connectToDb, sql }