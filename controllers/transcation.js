const { models } = require('mongoose');
const { connectToDb, sql } = require('../config/db')


const getTransaction = async (req, res) => {
    const userId = req.user.id;
    try {
        const pool = await connectToDb()
        const query = `SELECT * FROM transactions WHERE user_id = @userId`
        const result = await pool.request().input('userId', sql.Int, userId)
            .query(query);
        res.status(201).json({ message: "Data fetched successfully", data: result.recordset })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Server error' });
    }
}

const insertTranscation = async (req, res) => {
    const data = req.body;
    const userId = req.user.id;

    if (!Array.isArray(data)) {
        return res.status(400).json({ error: "Invalid data format" })
    }
    try {
        const pool = await connectToDb();
        const insertUpdate = data.map(async (item) => {
            const { id, comments, amount, transactionDate, debit_credit } = item;
            if (id) {
                const checkQuery = `SELECT COUNT(*) AS count FROM transactions WHERE id = @Id AND user_id= @UserId`;
                const checkResult = await pool.request()
                    .input('Id', sql.Int, id)
                    .input('UserId', sql.Int, userId)
                    .query(checkQuery);
                const isTransactionExists = checkResult.recordset[0].count > 0
                if (isTransactionExists) {
                    const updateQuery = `
                UPDATE transactions SET comments =@Comments, amount= @Amount, transactionDate = @TransactionDate, debit_credit = @DebitCredit
                WHERE id = @Id AND user_id = @UserId
                `
                    return pool.request()
                        .input('Comments', sql.NVarChar, comments)
                        .input('Amount', sql.Decimal(18, 2), amount)
                        .input('TransactionDate', sql.Date, transactionDate)
                        .input('Id', sql.Int, id)
                        .input('userId', sql.Int, userId)
                        .input('DebitCredit', sql.NVarChar, debit_credit)
                        .query(updateQuery)
                } else {
                    const insertQuery = `
                INSERT INTO transactions (comments, amount, transactionDate, user_id, debit_credit)
                VALUES (@Comments, @Amount, @TransactionDate, @userId, @DebitCredit)
                `
                    return pool
                        .request()
                        .input('Comments', sql.NVarChar, comments)
                        .input('Amount', sql.Decimal(18, 2), amount)
                        .input('TransactionDate', sql.Date, transactionDate)
                        .input('userId', sql.Int, userId)
                        .input('DebitCredit', sql.NVarChar, debit_credit)
                        .query(insertQuery)
                }
            }

        })
        await Promise.all(insertUpdate);
        res.status(201).json({ message: "Transactions processed successfully!" })
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ error: "Server Error" })
    }
}


const deleteTranscation = async (req, res) => {
    try {
        const pool = await connectToDb();
        const request = pool.request();
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ error: "Id is not present" })
        }
        request.input('id', sql.Int, id);
        const query = ` DELETE FROM transactions WHERE id= @Id`
        const result = await request.query(query);
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.status(200).json({ message: "Transcation Deleted" })
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete transaction', details: error.message });

    }
}

const getSummary = (req, res) => {

}

module.exports = { getTransaction, insertTranscation, deleteTranscation }