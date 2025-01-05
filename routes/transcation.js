const express = require('express');
const router = express.Router();
const { isUserAuthorized } = require('../middlewares/authMiddleware')
const { getTransaction, insertTranscation, deleteTranscation, getSummary, getTransactionExcel } = require('../controllers/transcation')

router.post('/add-transcation', isUserAuthorized, insertTranscation)
router.get('/get-transcation', isUserAuthorized, getTransaction)
router.delete('/delete-transaction', isUserAuthorized, deleteTranscation)
router.get('/get-summary', isUserAuthorized, getSummary)
router.get('/get-excel', isUserAuthorized, getTransactionExcel)

module.exports = router;
