// ---------------- HELPER FETCH FUNCTION ----------------
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

// ---------------- LOAD PARTICIPANTS AND SUBMISSIONS ----------------
async function loadParticipants() {
  const res = await apiFetch('/judge/review');
  const data = await res.json();

  const container = document.getElementById('participantsList');
  container.innerHTML = '';

  data.forEach((participant) => {
    const div = document.createElement('div');
    let submissionsText = participant.submissions
      .map((s) => `ID: ${s.submission_id}, Title: ${s.title}`)
      .join(' | ');

    div.textContent = `Participant ID: ${participant.user_id}, Email: ${participant.email}, Submissions: ${submissionsText}`;
    container.appendChild(div);
  });
}

// ---------------- SUBMIT GRADE ----------------
async function submitGrade() {
  const userId = document.getElementById('userId').value;
  const submissionId = document.getElementById('submissionId').value;
  const grade = document.getElementById('grade').value;
  const comment = document.getElementById('comment').value;

  const res = await apiFetch('/judge/grade', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      submission_id: submissionId,
      grade: grade,
      comment: comment,
    }),
  });

  const data = await res.json();
  alert(data.message);
  loadParticipants(); // refresh participants list if needed
}

// ---------------- INITIAL LOAD ----------------
window.onload = function () {
  loadParticipants();
};
