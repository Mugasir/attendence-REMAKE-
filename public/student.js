const message = document.getElementById('studentMessage');

document.getElementById('requestOtpBtn').addEventListener('click', async () => {
  const studentNumber = document.getElementById('studentNumber').value;
  const res = await fetch('/api/students/check-in/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentNumber })
  });
  const data = await res.json();
  message.textContent = data.message || 'OTP request failed';
});

document.getElementById('verifyOtpBtn').addEventListener('click', async () => {
  const studentNumber = document.getElementById('studentNumber').value;
  const otp = document.getElementById('otp').value;
  const sessionTag = document.getElementById('sessionTag').value;
  const res = await fetch('/api/students/check-in/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentNumber, otp, sessionTag })
  });
  const data = await res.json();
  message.textContent = data.message || 'Verification failed';
});
