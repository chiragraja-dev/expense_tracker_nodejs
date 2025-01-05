const ExcelJS = require('exceljs');
const { connectToDb, sql } = require('../config/db')


const getTransaction = async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query
    try {
        const pool = await connectToDb()

        let dateCondition = '';
        if (startDate && endDate) {
            dateCondition = `AND transactionDate BETWEEN @StartDate AND @EndDate`
        } else if (startDate) {
            dateCondition = `AND transactionDate >= @StartDate`
        } else if (endDate) {
            dateCondition = `AND transactionDate <= @EndDate`

        }
        const query = `SELECT * FROM transactions WHERE user_id = @userId ${dateCondition}`

        const request = await pool.request().input('userId', sql.Int, userId)
        if (startDate) request.input('StartDate', sql.DateTime, new Date(startDate))
        if (endDate) request.input('EndDate', sql.DateTime, new Date(endDate))

        const result = await request.query(query);

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
        return res.status(400).json({ error: "Invalid data format" });
    }

    try {
        const pool = await connectToDb();

        const promises = data.map(async (item) => {
            const { id, comments, amount, transactionDate, category, transaction_type } = item;

            if (id) {

                const checkQuery = `SELECT COUNT(*) AS count FROM transactions WHERE id = @Id AND user_id = @UserId`;
                const checkResult = await pool.request()
                    .input('Id', sql.Int, id)
                    .input('UserId', sql.Int, userId)
                    .query(checkQuery);

                const isTransactionExists = checkResult.recordset[0].count > 0;

                if (isTransactionExists) {

                    const updateQuery = `
                        UPDATE transactions
                        SET comments = @Comments,
                            amount = @Amount,
                            transactionDate = @TransactionDate,
                            category = @Category,
                            transaction_type = @TransactionType
                        WHERE id = @Id AND user_id = @UserId
                    `;
                    return pool.request()
                        .input('Comments', sql.NVarChar, comments || null)
                        .input('Amount', sql.Decimal(18, 2), amount)
                        .input('TransactionDate', sql.Date, transactionDate)
                        .input('Category', sql.NVarChar, category || null)
                        .input('TransactionType', sql.NVarChar, transaction_type)
                        .input('Id', sql.Int, id)
                        .input('UserId', sql.Int, userId)
                        .query(updateQuery);
                }
            }


            const insertQuery = `
                INSERT INTO transactions (comments, amount, transactionDate, user_id, category, transaction_type)
                VALUES (@Comments, @Amount, @TransactionDate, @UserId, @Category, @TransactionType)
            `;
            return pool.request()
                .input('Comments', sql.NVarChar, comments || null)
                .input('Amount', sql.Decimal(18, 2), amount)
                .input('TransactionDate', sql.Date, transactionDate)
                .input('Category', sql.NVarChar, category || null)
                .input('TransactionType', sql.NVarChar, transaction_type)
                .input('UserId', sql.Int, userId)
                .query(insertQuery);
        });

        await Promise.all(promises);
        res.status(201).json({ message: "Transactions processed successfully!" });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Server Error", details: error.message });
    }
};



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

const getSummary = async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    try {
        const pool = await connectToDb()
        let dateCondition = ''
        if (startDate && endDate) {
            dateCondition = `AND transactionDate BETWEEN @StartDate AND @EndDate`;
        } else if (startDate) {
            dateCondition = `AND transactionDate >=@StartDate`
        } else if (endDate) {
            dateCondition = `AND transactionDate <=@EndDate`
        }
        const totalSpentQuery = `SELECT SUM(amount) AS amount FROM transactions WHERE user_id = @UserId AND transaction_type='d' ${dateCondition}`;
        const categoryWiseSpent = `SELECT category, SUM(amount) AS amount FROM transactions WHERE user_id = @UserId AND transaction_type = 'd'  ${dateCondition} GROUP BY category;`;
        const totalIncome = `SELECT SUM(amount) as amount from transactions WHERE user_id = @UserId AND transaction_type='c' ${dateCondition}`;
        const avgSpentQuery = `SELECT AVG(amount) AS avg_amount FROM transactions WHERE user_id = @UserId AND transaction_type='d' ${dateCondition}`;

        const request = pool.request().input('UserId', sql.Int, userId);
        if (startDate) request.input('StartDate', sql.DateTime, new Date(startDate));
        if (endDate) request.input('EndDate', sql.DateTime, new Date(endDate));

        const totalSpentResult = await request.query(totalSpentQuery);
        const categoryWiseSpentResult = await request.query(categoryWiseSpent)
        const totalIncomeResult = await request.query(totalIncome)
        const avgSpentQueryResult = await request.query(avgSpentQuery)

        res.status(201).json({
            message: "Summary data fetched successfully",
            data: {
                totalAmountSpent: totalSpentResult.recordset[0],
                categoryWiseSpent: categoryWiseSpentResult.recordset,
                totalIncomeResult: totalIncomeResult.recordset[0],
                avgSpentQueryResult: avgSpentQueryResult.recordset[0]
            }
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Server error', error: error.message });

    }
}

const getTransactionExcel = async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    try {
        const pool = await connectToDb();

        let dateCondition = '';
        if (startDate && endDate) {
            dateCondition = `AND transactionDate BETWEEN @StartDate AND @EndDate`;
        } else if (startDate) {
            dateCondition = `AND transactionDate >= @StartDate`;
        } else if (endDate) {
            dateCondition = `AND transactionDate <= @EndDate`;
        }

        const query = `SELECT * FROM transactions WHERE user_id = @UserId ${dateCondition}`;

        const request = pool.request().input('UserId', sql.Int, userId);
        if (startDate) request.input('StartDate', sql.DateTime, new Date(startDate));
        if (endDate) request.input('EndDate', sql.DateTime, new Date(endDate));

        const result = await request.query(query);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Transactions');


        worksheet.columns = [
            { header: 'Transaction ID', key: 'id', width: 15 },
            { header: 'Comments', key: 'comments', width: 30 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'Transaction Date', key: 'transaction_date', width: 20 },
            { header: 'Category', key: 'category', width: 15 },
            { header: 'Transaction Type', key: 'transaction_type', width: 20 },
        ];

        // Add data rows to the worksheet
        result.recordset.forEach((transaction) => {
            worksheet.addRow(transaction);
        });

        // Set the response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=transactions.xlsx');

        // Write the workbook to the response
        await workbook.xlsx.write(res);

        // End the response
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};


module.exports = {
    getTransaction,
    insertTranscation,
    deleteTranscation,
    getSummary,
    getTransactionExcel
}