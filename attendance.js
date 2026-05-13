// ═══════════════════════════════════════════════════════
// ATTENDANCE MODULE
// ═══════════════════════════════════════════════════════

let attendanceDonutChart = null;

// ── Date Utilities ─────────────────────────────────────
function getTodayDateString() {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

function isAttendanceWindowOpen() {
  const now  = new Date();
  const hour = now.getHours();
  return hour >= ATTENDANCE_OPEN_HOUR && hour < ATTENDANCE_CLOSE_HOUR;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
}

function formatTimestamp(ts) {
  if (!ts) return '--';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
}

// ── Check today's attendance ───────────────────────────
async function getTodayAttendance(uid) {
  const today = getTodayDateString();
  const docRef = db.collection('attendance').doc(`${uid}_${today}`);
  const doc = await docRef.get();
  return doc.exists ? doc.data() : null;
}

// ── Mark Attendance ────────────────────────────────────
async function markAttendance(uid) {
  if (!isAttendanceWindowOpen()) {
    showToast('Attendance window is closed. Opens at 4:00 AM.', 'warning');
    return false;
  }

  const today = getTodayDateString();
  const docId = `${uid}_${today}`;

  // Check if already marked
  const existing = await getTodayAttendance(uid);
  if (existing) {
    showToast('Attendance already marked for today!', 'info');
    return false;
  }

  const now = new Date();
  const data = {
    uid,
    date: today,
    status: 'present',
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    markedAt: now.toISOString()
  };

  await db.collection('attendance').doc(docId).set(data);
  return true;
}

// ── Fetch all attendance for a user ───────────────────
async function getUserAttendance(uid) {
  const snap = await db.collection('attendance')
    .where('uid', '==', uid)
    .orderBy('date', 'desc')
    .get();
  return snap.docs.map(d => d.data());
}

// ── Calculate streak ───────────────────────────────────
function calculateStreak(records) {
  if (!records.length) return 0;
  const presentDates = records
    .filter(r => r.status === 'present')
    .map(r => r.date)
    .sort()
    .reverse();

  if (!presentDates.length) return 0;

  let streak = 0;
  let checkDate = new Date();
  checkDate.setHours(0,0,0,0);

  // If today not marked, start from yesterday
  const today = getTodayDateString();
  if (!presentDates.includes(today)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (presentDates.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// ── Load Student Dashboard ─────────────────────────────
async function loadStudentDashboard(userData) {
  updateStudentGreeting(userData);
  updateAttendanceWindow();
  renderStudentDonut(0, 0);

  try {
    const records = await getUserAttendance(userData.uid);
    const today = getTodayDateString();
    const todayRecord = records.find(r => r.date === today);

    const presentCount = records.filter(r => r.status === 'present').length;
    const totalDays    = records.length;
    const absentCount  = totalDays - presentCount;
    const pct          = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
    const streak       = calculateStreak(records);

    // Stats
    document.getElementById('stat-total-days').textContent = totalDays;
    document.getElementById('stat-present').textContent    = presentCount;
    document.getElementById('stat-absent').textContent     = absentCount;
    document.getElementById('stat-streak').textContent     = streak;

    // Donut
    renderStudentDonut(presentCount, absentCount);

    // Today status
    renderTodayStatus(todayRecord);

    // Rank badge
    renderRankBadge(pct);

    // History
    renderAttendanceHistory(records);

    // Month filter
    populateMonthFilter(records);

  } catch (err) {
    console.error('Dashboard load error:', err);
    showToast('Error loading dashboard', 'error');
  }
}

// ── Update greeting ────────────────────────────────────
function updateStudentGreeting(userData) {
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const el = document.getElementById('student-greeting');
  if (el) el.textContent = `${greet}, ${userData.name}! 👋  Roll: ${userData.rollNumber}`;
  const dateChip = document.getElementById('today-date-chip');
  if (dateChip) dateChip.textContent = new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  const attDate = document.getElementById('attendance-date-display');
  if (attDate) attDate.textContent = formatDate(getTodayDateString());
}

// ── Update attendance window display ───────────────────
function updateAttendanceWindow() {
  const open   = isAttendanceWindowOpen();
  const badge  = document.getElementById('attendance-window-badge');
  const status = document.getElementById('attendance-window-status');
  const text   = open ? '🟢 Attendance Open' : '🔴 Attendance Closed';
  const cls    = open ? 'open' : 'closed';
  if (badge) { badge.textContent = text; badge.className = `attendance-window-badge ${cls}`; }
  if (status) { status.textContent = open ? 'Window Open' : 'Window Closed'; status.className = `window-status ${cls}`; }
}

// ── Render today's status ──────────────────────────────
function renderTodayStatus(record) {
  const wrap = document.getElementById('today-status-wrap');
  const btn  = document.getElementById('mark-attendance-btn');

  if (record && record.status === 'present') {
    wrap.innerHTML = `<div class="today-status present">
      <span class="status-dot status-green"></span>
      <span>Present Today ✓</span>
    </div>`;
    btn.disabled  = true;
    btn.innerHTML = '<span>Already Marked ✓</span>';
  } else if (!isAttendanceWindowOpen()) {
    wrap.innerHTML = `<div class="today-status absent">
      <span class="status-dot status-red"></span>
      <span>Window Closed</span>
    </div>`;
    btn.disabled  = true;
    btn.innerHTML = '<span>🔒 Attendance Locked</span>';
  } else {
    wrap.innerHTML = `<div class="today-status unmarked">
      <span class="status-dot status-yellow"></span>
      <span>Not Marked Yet</span>
    </div>`;
    btn.disabled  = false;
    btn.innerHTML = '<span>✅ Mark Present</span>';
  }

  // Countdown timer
  const timerEl = document.getElementById('attendance-timer');
  if (timerEl) {
    if (isAttendanceWindowOpen()) {
      updateCountdown(timerEl, 'closes');
    } else {
      const hour = new Date().getHours();
      if (hour < ATTENDANCE_OPEN_HOUR) {
        updateCountdown(timerEl, 'opens');
      } else {
        timerEl.textContent = 'Opens tomorrow at 4:00 AM';
      }
    }
  }
}

function updateCountdown(el, type) {
  function tick() {
    const now  = new Date();
    let target = new Date();
    if (type === 'closes') {
      target.setHours(ATTENDANCE_CLOSE_HOUR, 0, 0, 0);
    } else {
      if (now.getHours() >= ATTENDANCE_CLOSE_HOUR) {
        target.setDate(target.getDate() + 1);
      }
      target.setHours(ATTENDANCE_OPEN_HOUR, 0, 0, 0);
    }
    const diff = target - now;
    if (diff <= 0) { el.textContent = ''; return; }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.textContent = type === 'closes'
      ? `Closes in ${h}h ${m}m ${s}s`
      : `Opens in ${h}h ${m}m ${s}s`;
    setTimeout(tick, 1000);
  }
  tick();
}

// ── Donut Chart ────────────────────────────────────────
function renderStudentDonut(present, absent) {
  const canvas = document.getElementById('attendance-donut');
  if (!canvas) return;
  const pct = (present + absent) > 0 ? Math.round((present / (present + absent)) * 100) : 0;
  document.getElementById('donut-pct').textContent = pct + '%';

  if (attendanceDonutChart) attendanceDonutChart.destroy();
  attendanceDonutChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: present + absent === 0 ? [1] : [present, absent],
        backgroundColor: present + absent === 0 ? ['#e2e8f0'] : ['#16a34a', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      cutout: '72%',
      plugins: { legend: { display: false }, tooltip: { enabled: present + absent > 0 } },
      animation: { duration: 800, easing: 'easeInOutQuart' }
    }
  });
}

// ── Rank Badge ─────────────────────────────────────────
function renderRankBadge(pct) {
  const el = document.getElementById('attendance-rank-badge');
  if (!el) return;
  let cls, text;
  if (pct >= 90)       { cls = 'excellent'; text = '🏆 Excellent Attendance' }
  else if (pct >= 75)  { cls = 'good';      text = '👍 Good Attendance' }
  else if (pct >= 60)  { cls = 'average';   text = '⚠️ Average Attendance' }
  else                 { cls = 'low';       text = '❌ Low Attendance' }
  el.textContent = text;
  el.className = `rank-badge ${cls}`;
  el.classList.remove('hidden');
}

// ── Attendance History ─────────────────────────────────
function renderAttendanceHistory(records, filterMonth = '') {
  const list = document.getElementById('attendance-history-list');
  if (!list) return;

  let filtered = records;
  if (filterMonth) {
    filtered = records.filter(r => r.date.startsWith(filterMonth));
  }

  if (!filtered.length) {
    list.innerHTML = '<div class="history-empty">📅 No attendance records found.</div>';
    return;
  }

  list.innerHTML = filtered.map(r => {
    const badgeCls = r.status === 'present' ? 'badge-present' : 'badge-absent';
    const label    = r.status === 'present' ? 'Present' : 'Absent';
    const timeStr  = r.timestamp ? formatTimestamp(r.timestamp) : '--';
    const day      = new Date(r.date + 'T00:00:00').toLocaleDateString('en-US',{weekday:'long'});
    return `<div class="history-item">
      <span class="history-date">${r.date}</span>
      <span class="history-day">${day}</span>
      <span class="${badgeCls}">${label}</span>
      <span class="history-time">${timeStr}</span>
    </div>`;
  }).join('');
}

// ── Month filter population ────────────────────────────
function populateMonthFilter(records) {
  const sel = document.getElementById('history-month-filter');
  if (!sel) return;
  const months = [...new Set(records.map(r => r.date.substring(0, 7)))].sort().reverse();
  sel.innerHTML = '<option value="">All Months</option>' +
    months.map(m => {
      const d = new Date(m + '-01');
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return `<option value="${m}">${label}</option>`;
    }).join('');

  sel.addEventListener('change', async () => {
    const records = await getUserAttendance(currentUserData.uid);
    renderAttendanceHistory(records, sel.value);
  });
}

// ── Mark Attendance Button ─────────────────────────────
document.getElementById('mark-attendance-btn').addEventListener('click', async () => {
  const btn = document.getElementById('mark-attendance-btn');
  btn.disabled  = true;
  btn.innerHTML = '<span>Marking…</span>';

  try {
    const success = await markAttendance(currentUser.uid);
    if (success) {
      showToast('✅ Attendance marked successfully!', 'success');
      await loadStudentDashboard(currentUserData);
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
    btn.disabled  = false;
    btn.innerHTML = '<span>✅ Mark Present</span>';
  }
});
