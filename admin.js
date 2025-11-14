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
  window.location.href = 'index.html'; // lub inna strona
}

// ---------------- LOAD USERS ----------------
async function loadUsers() {
  const res = await apiFetch('/admin/users');
  const data = await res.json();

  const container = document.getElementById('usersList');
  container.innerHTML = '';

  data.forEach((user) => {
    const div = document.createElement('div');
    div.textContent = `ID: ${user.id}, Email: ${
      user.email
    }, Roles: ${user.roles.join(', ')}`;
    container.appendChild(div);
  });
}

// ---------------- ASSIGN ROLE ----------------
async function assignRole() {
  const userId = document.getElementById('userId').value;
  const role = document.getElementById('roleName').value;

  const res = await apiFetch('/admin/assign-role', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, role: role }),
  });

  const data = await res.json();
  alert(data.message);
  loadUsers();
}

// ---------------- REMOVE ROLE ----------------
async function removeRole() {
  const userId = document.getElementById('userId').value;
  const role = document.getElementById('roleName').value;

  const res = await apiFetch('/admin/remove-role', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, role: role }),
  });

  const data = await res.json();
  alert(data.message);
  loadUsers();
}

// ---------------- INITIAL LOAD ----------------
window.onload = function () {
  loadUsers();
};
