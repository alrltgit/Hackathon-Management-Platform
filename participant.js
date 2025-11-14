// ---------------- HELPER FETCH ----------------
async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    ...(options.headers || {}),
    Authorization: token,
    'Content-Type': 'application/json',
  };

  return fetch(url, { ...options, headers });
}

// ---------------- LOGOUT ----------------
function logout() {
  localStorage.removeItem('token');
  alert('Logged out');
  window.location.href = 'index.html'; // redirect to login page
}

// ---------------- LOAD SUBMISSIONS ----------------
async function loadSubmissions() {
  const res = await apiFetch('/participant/panel');
  const data = await res.json();

  const container = document.getElementById('submissionsList');
  container.innerHTML = '';

  data.submissions.forEach((s) => {
    const div = document.createElement('div');
    div.textContent = `ID: ${s.submission_id}, Title: ${s.title}`;
    container.appendChild(div);
  });
}

// ---------------- CREATE NEW SUBMISSION ----------------
async function createSubmission() {
  const title = document.getElementById('title').value;
  const content = document.getElementById('content').value;

  const res = await apiFetch('/participant/submit', {
    method: 'POST',
    body: JSON.stringify({ title: title, content: content }),
  });

  const data = await res.json();
  alert(data.message);
  loadSubmissions(); // refresh submissions list
}

// ---------------- INITIAL LOAD ----------------
window.onload = function () {
  loadSubmissions();
};
