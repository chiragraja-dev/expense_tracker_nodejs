const express = require('express');
const router = express.Router();
const { isUserAuthorized } = require('../middlewares/authMiddleware')
const { getTransaction, insertTranscation, deleteTranscation } = require('../controllers/transcation')

router.post('/add-transcation', isUserAuthorized, insertTranscation)
router.get('/get-transcation', isUserAuthorized, getTransaction)
router.delete('/delete-transaction', isUserAuthorized, deleteTranscation)

module.exports = router;
