// ═══════════════════════════════════════════════════════
// MAIN APP MODULE — Orchestration & UI
// ═══════════════════════════════════════════════════════

// ── Screen Management ──────────────────────────────────
function showScreen(screen) {
  document.getElementById('loading-screen').classList.add('hidden');
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('profile-setup-modal').classList.add('hidden');
  document.getElementById('app').classList.add('hidden');

  switch (screen) {
    case 'loading':
      document.getElementById('loading-screen').classList.remove('hidden');
      break;
    case 'auth':
      document.getElementById('auth-screen').classList.remove('hidden');
      // Reset sign-in button
      const btn = document.getElementById('google-signin-btn');
      btn.disabled = false;
      btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg> Continue with Google`;
      break;
    case 'profile-setup':
      document.getElementById('auth-screen').classList.remove('hidden');
      document.getElementById('profile-setup-modal').classList.remove('hidden');
      break;
    case 'app':
      document.getElementById('app').classList.remove('hidden');
      break;
  }
}

function hideLoading() {
  document.getElementById('loading-screen').classList.add('hidden');
}

// ── Initialize App after login ─────────────────────────
function initApp(userData) {
  // Update navbar
  const avatar = document.getElementById('nav-avatar');
  if (avatar) {
    avatar.src = userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=1a56db&color=fff`;
    avatar.onerror = () => {
      avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=1a56db&color=fff`;
    };
  }
  const nameEl = document.getElementById('nav-username');
  if (nameEl) nameEl.textContent = userData.name;

  const roleBadge = document.getElementById('nav-role-badge');
  if (roleBadge) {
    roleBadge.textContent = userData.role === 'teacher' ? 'Admin' : 'Student';
    roleBadge.className   = `role-badge ${userData.role === 'teacher' ? 'teacher' : 'student'}`;
  }

  // Show appropriate dashboard
  if (userData.role === 'teacher') {
    document.getElementById('student-dashboard').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    initAdminTabs();
    loadAdminDashboard(userData);
  } else {
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('student-dashboard').classList.remove('hidden');
    loadStudentDashboard(userData);
  }

  // Start clock
  startClock();
}

// ── Live Clock ─────────────────────────────────────────
function startClock() {
  function tick() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: true
    });
    const clockEl = document.getElementById('nav-clock');
    if (clockEl) clockEl.textContent = timeStr;
    updateAttendanceWindow();
  }
  tick();
  setInterval(tick, 1000);
}

// ── Toast Notifications ────────────────────────────────
let toastTimeout;
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.className   = `toast ${type}`;
  toast.classList.remove('hidden');
  toastTimeout = setTimeout(() => toast.classList.add('hidden'), 3500);
}

// ── Dark Mode ──────────────────────────────────────────
const darkModeBtn  = document.getElementById('dark-mode-toggle');
const darkIcon     = document.getElementById('dark-icon');
const savedTheme   = localStorage.getItem('aashirtech-theme') || 'light';

if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
  if (darkIcon) darkIcon.textContent = '☀️';
}

darkModeBtn?.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('aashirtech-theme', isDark ? 'dark' : 'light');
  if (darkIcon) darkIcon.textContent = isDark ? '☀️' : '🌙';
  // Redraw charts
  if (currentUserData?.role === 'teacher') {
    setTimeout(() => { renderMonthlyChart(); renderTodayPieChart(
      parseInt(document.getElementById('admin-present-today').textContent) || 0,
      parseInt(document.getElementById('admin-absent-today').textContent) || 0
    )}, 100);
  }
});

// ── Close modal on overlay click ──────────────────────
document.getElementById('student-detail-modal')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('student-detail-modal')) {
    document.getElementById('student-detail-modal').classList.add('hidden');
  }
});
