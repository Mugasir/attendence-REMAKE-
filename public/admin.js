const loginCard = document.getElementById('loginCard');
const dashboardCard = document.getElementById('dashboardCard');
const loginMessage = document.getElementById('loginMessage');
const adminMeta = document.getElementById('adminMeta');

let token = localStorage.getItem('suAttendToken');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`
});

async function loadDashboard() {
  const [summaryRes, studentsRes, meRes] = await Promise.all([
    fetch('/api/admin/dashboard/summary', { headers: authHeaders() }),
    fetch('/api/students', { headers: authHeaders() }),
    fetch('/api/admin/me', { headers: authHeaders() })
  ]);

  if (!summaryRes.ok || !studentsRes.ok || !meRes.ok) {
    loginMessage.textContent = 'Session expired. Login again.';
    return;
  }

  const summary = await summaryRes.json();
  const students = await studentsRes.json();
  const me = await meRes.json();

  adminMeta.textContent = `${me.fullName} (${me.role})`;
  document.getElementById('summary').innerHTML = `
    <p>Total students: ${summary.totalStudents}</p>
    <p>Total admins: ${summary.totalAdmins}</p>
    <p>Today's check-ins: ${summary.todayCheckins}</p>
  `;

  const logRows = summary.latestLogs.map((log) => `
    <tr>
      <td>${log.student.fullName}</td>
      <td>${log.student.studentNumber}</td>
      <td>${log.student.program}</td>
      <td>${new Date(log.checkInAt).toLocaleString()}</td>
      <td>${log.sessionTag}</td>
    </tr>
  `).join('');
  document.querySelector('#logsTable tbody').innerHTML = logRows;

  const studentRows = students.map((student) => `
    <tr>
      <td>${student.fullName}</td>
      <td>${student.studentNumber}</td>
      <td>${student.program}</td>
      <td><a href="/id-card.html?studentId=${student.id}" target="_blank">View Card</a></td>
    </tr>
  `).join('');
  document.querySelector('#studentsTable tbody').innerHTML = studentRows;
}

if (token) {
  loginCard.classList.add('hidden');
  dashboardCard.classList.remove('hidden');
  loadDashboard();
}

document.getElementById('loginBtn').addEventListener('click', async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const res = await fetch('/api/auth/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (!res.ok) {
    loginMessage.textContent = data.message || 'Login failed';
    return;
  }

  token = data.token;
  localStorage.setItem('suAttendToken', token);
  loginCard.classList.add('hidden');
  dashboardCard.classList.remove('hidden');
  loadDashboard();
});

document.getElementById('createStudentBtn').addEventListener('click', async () => {
  const payload = {
    studentNumber: document.getElementById('newStudentNumber').value,
    studentId: document.getElementById('newStudentId').value,
    fullName: document.getElementById('newStudentName').value,
    program: document.getElementById('newProgram').value,
    intakeYear: Number(document.getElementById('newIntake').value),
    phoneNumber: document.getElementById('newPhone').value,
    academicEmail: document.getElementById('newEmail').value
  };

  const res = await fetch('/api/students', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    loadDashboard();
  }
});

document.getElementById('refreshBtn').addEventListener('click', loadDashboard);
document.getElementById('csvBtn').addEventListener('click', () => window.open('/api/admin/attendance/export.csv'));
document.getElementById('xlsxBtn').addEventListener('click', () => window.open('/api/admin/attendance/export.xlsx'));
