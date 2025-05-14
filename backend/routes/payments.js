const express = require('express');
const router = express.Router();

const { capturePayment, verifyPayment, enrollStudent } = require('../controllers/payments');
const { auth, isStudent } = require('../middleware/auth');

router.post('/capturePayment', auth, isStudent, capturePayment);
router.post('/verifyPayment', auth, isStudent, verifyPayment);
router.post('/enrollStudent', auth, isStudent, enrollStudent);

module.exports = router
