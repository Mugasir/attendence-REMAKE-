const express = require('express');
const { getStudentPortal, requestOtp, verifyOtpAndRecord } = require('../controllers/student.controller');

const router = express.Router();

router.get('/', getStudentPortal);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtpAndRecord);

module.exports = router;
