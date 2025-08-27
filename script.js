const apiBase = 'http://localhost:3001/api';

function show(cardId) {
  document.getElementById('login-card').style.display = cardId === 'login-card' ? 'flex' : 'none';
  document.getElementById('signup-card').style.display = cardId === 'signup-card' ? 'flex' : 'none';
  document.getElementById('forgot-card').style.display = cardId === 'forgot-card' ? 'flex' : 'none';
}

document.getElementById('link-signup').addEventListener('click', (e) => {
  e.preventDefault();
  show('signup-card');
});

document.getElementById('link-forgot').addEventListener('click', (e) => {
  e.preventDefault();
  show('forgot-card');
});

document.getElementById('link-to-login-1').addEventListener('click', (e) => {
  e.preventDefault();
  show('login-card');
});

document.getElementById('link-to-login-2').addEventListener('click', (e) => {
  e.preventDefault();
  show('login-card');
});

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  try {
    const res = await fetch(`${apiBase}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Login failed');
      return;
    }
    window.location.href = 'success.html';
  } catch (err) {
    alert('Network error');
  }
});

document.getElementById('form-signup').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  try {
    const res = await fetch(`${apiBase}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Signup failed');
      return;
    }
    alert('Signup successful. Please log in.');
    show('login-card');
  } catch (err) {
    alert('Network error');
  }
});

document.getElementById('btn-get-token').addEventListener('click', async () => {
  const email = document.getElementById('forgot-email').value.trim();
  if (!email) { alert('Enter your email'); return; }
  try {
    const res = await fetch(`${apiBase}/forgot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Failed to get token');
      return;
    }
    if (data.token) {
      document.getElementById('forgot-token').value = data.token;
      alert('Token generated and filled.');
    } else {
      alert('If your email exists, a token was generated.');
    }
  } catch (err) {
    alert('Network error');
  }
});

document.getElementById('form-forgot').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value.trim();
  const token = document.getElementById('forgot-token').value.trim();
  const newPassword = document.getElementById('forgot-newpass').value;
  try {
    const res = await fetch(`${apiBase}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, newPassword })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Reset failed');
      return;
    }
    alert('Password reset successful. Please log in.');
    show('login-card');
  } catch (err) {
    alert('Network error');
  }
});


