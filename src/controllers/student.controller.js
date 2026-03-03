const prisma = require('../config/prisma');
const { createOtpChallenge, verifyOtp } = require('../services/student-attendance.service');

function getStudentPortal(req, res) {
  res.render('student/checkin', { title: 'SU Attend - Student Check In', message: null, error: null });
}

async function requestOtp(req, res) {
  try {
    const { studentNumber, action } = req.body;
    const result = await createOtpChallenge(studentNumber);

    if (!result.student) {
      return res.render('student/checkin', {
        title: 'SU Attend - Student Check In',
        error: 'Student not found. Please contact administration.',
        message: null,
      });
    }

    return res.render('student/checkin', {
      title: 'SU Attend - Student Check In',
      message: `OTP sent to ${result.student.phoneNumber}.`,
      error: null,
      requestedStudentNumber: studentNumber,
      requestedAction: action,
    });
  } catch (error) {
    return res.render('student/checkin', {
      title: 'SU Attend - Student Check In',
      message: null,
      error: error.message,
    });
  }
}

async function verifyOtpAndRecord(req, res) {
  try {
    const { studentNumber, otpCode, action } = req.body;
    await verifyOtp(studentNumber, otpCode, action);

    return res.render('student/checkin', {
      title: 'SU Attend - Student Check In',
      message: action === 'checkout' ? 'Check-out successful.' : 'Check-in successful.',
      error: null,
    });
  } catch (error) {
    return res.render('student/checkin', {
      title: 'SU Attend - Student Check In',
      message: null,
      error: error.message,
      requestedStudentNumber: req.body.studentNumber,
      requestedAction: req.body.action,
    });
  }
}

async function getStudentCard(req, res) {
  const student = await prisma.student.findUnique({ where: { id: req.params.id } });
  if (!student) {
    return res.status(404).send('Student not found');
  }
  return res.render('admin/student-card', { title: `${student.fullName} - ID Card`, student });
}

module.exports = {
  getStudentPortal,
  requestOtp,
  verifyOtpAndRecord,
  getStudentCard,
};
