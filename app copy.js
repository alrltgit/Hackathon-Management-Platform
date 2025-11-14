// ---------------- LOGIN ----------------
async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem('token', data.token);
    console.log('Logged in. Token saved:', data.token);

    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'inline';
    showActionsByRole(data.token);
  } else {
    console.log('Login error:', data.message);
  }
}

// ---------------- LOGOUT ----------------
function logout() {
  localStorage.removeItem('token');
  document.getElementById('loginBtn').style.display = 'inline';
  document.getElementById('logoutBtn').style.display = 'none';
  document.getElementById('actions').style.display = 'none';

  document.getElementById('participantBtn').style.display = 'none';
  document.getElementById('judgeBtn').style.display = 'none';
  document.getElementById('adminBtn').style.display = 'none';

  console.log('Logged out — token removed.');
}

// ---------------- HELPER FOR FETCH ----------------
async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    ...(options.headers || {}),
    Authorization: token,
  };

  return fetch(url, { ...options, headers });
}

// ---------------- PARTICIPANT PANEL ----------------
async function getParticipantPanel() {
  const res = await apiFetch('/participant/panel');
  const data = await res.json();
  console.log('Participant Panel:', data);
}

// ---------------- JUDGE PANEL ----------------
async function getJudgePanel() {
  const res = await apiFetch('/judge/review');
  const data = await res.json();
  console.log('Judge Panel:', data);
}

// ---------------- ADMIN PANEL ----------------
async function getAdminPanel() {
  const res = await apiFetch('/admin/panel');
  const data = await res.json();
  console.log('Admin Panel:', data);
}

// ---------------- DYNAMIC BUTTON DISPLAY ----------------
function showActionsByRole(token) {
  // Decode JWT payload
  const payloadBase64 = token.split('.')[1];
  const payload = JSON.parse(atob(payloadBase64));

  document.getElementById('actions').style.display = 'block';

  if (payload.roles.includes('participant')) {
    document.getElementById('participantBtn').style.display = 'inline';
  }
  if (payload.roles.includes('judge')) {
    document.getElementById('judgeBtn').style.display = 'inline';
  }
  if (payload.roles.includes('admin')) {
    document.getElementById('adminBtn').style.display = 'inline';
  }
}
