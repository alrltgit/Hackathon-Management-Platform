// login.js

// Function to handle login
async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('http://127.0.0.1:5000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const err = await response.json();
      alert(err.message || 'Login failed');
      return;
    }

    const data = await response.json();
    const token = data.token;

    // Zapisanie tokena w localStorage
    localStorage.setItem('token', token);

    // Ukryj przycisk logowania i pokaż logout
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'inline-block';

    // Pokaż panel akcji w zależności od ról
    const payload = JSON.parse(atob(token.split('.')[1])); // dekodowanie payload JWT
    const roles = payload.roles || [];

    document.getElementById('actions').style.display = 'block';
    document.getElementById('participantBtn').style.display = roles.includes(
      'participant'
    )
      ? 'inline-block'
      : 'none';
    document.getElementById('judgeBtn').style.display = roles.includes('judge')
      ? 'inline-block'
      : 'none';
    document.getElementById('adminBtn').style.display = roles.includes('admin')
      ? 'inline-block'
      : 'none';

    alert('Login successful!');
  } catch (err) {
    console.error(err);
    alert('Error logging in');
  }
}

// Funkcja wylogowania
function logout() {
  localStorage.removeItem('token');
  document.getElementById('loginBtn').style.display = 'inline-block';
  document.getElementById('logoutBtn').style.display = 'none';
  document.getElementById('actions').style.display = 'none';
  alert('Logged out');
}
