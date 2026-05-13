// ═══════════════════════════════════════════════════════
// ADMIN MODULE
// ═══════════════════════════════════════════════════════

let allStudents    = [];
let allAttendance  = [];
let monthlyChart   = null;
let todayPieChart  = null;

// ── Load all students ──────────────────────────────────
async function loadAllStudents() {
  const snap = await db.collection('users').where('role', '==', 'student').get();
  allStudents = snap.docs.map(d => d.data());
  return allStudents;
}

// ── Load all attendance records ────────────────────────
async function loadAllAttendance() {
  const snap = await db.collection('attendance').orderBy('date', 'desc').get();
  allAttendance = snap.docs.map(d => d.data());
  return allAttendance;
}

// ── Student attendance stats ───────────────────────────
function getStudentStats(uid, attendanceRecords) {
  const records      = attendanceRecords.filter(r => r.uid === uid);
  const presentCount = records.filter(r => r.status === 'present').length;
  const totalDays    = records.length;
  const absentCount  = totalDays - presentCount;
  const pct          = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
  return { presentCount, absentCount, totalDays, pct, records };
}

// ── Load Admin Dashboard ───────────────────────────────
async function loadAdminDashboard(userData) {
  updateAdminGreeting(userData);

  try {
    await Promise.all([loadAllStudents(), loadAllAttendance()]);

    const today  = getTodayDateString();
    const presentToday = allAttendance.filter(r => r.date === today && r.status === 'present').length;
    const totalStu     = allStudents.length;
    const absentToday  = totalStu - presentToday;

    // Average attendance
    let totalPct = 0;
    allStudents.forEach(s => {
      const stats = getStudentStats(s.uid, allAttendance);
      totalPct += stats.pct;
    });
    const avgPct = totalStu > 0 ? Math.round(totalPct / totalStu) : 0;

    document.getElementById('admin-total-students').textContent = totalStu;
    document.getElementById('admin-present-today').textContent  = presentToday;
    document.getElementById('admin-absent-today').textContent   = absentToday;
    document.getElementById('admin-avg-attendance').textContent = avgPct + '%';

    renderMonthlyChart();
    renderTodayPieChart(presentToday, absentToday);
    renderTopPerformers();

  } catch (err) {
    console.error('Admin dashboard error:', err);
    showToast('Error loading admin data', 'error');
  }
}

function updateAdminGreeting(userData) {
  const el = document.getElementById('admin-greeting');
  if (el) el.textContent = `Welcome, ${userData.name}! You have full access.`;
  const chip = document.getElementById('admin-date-chip');
  if (chip) chip.textContent = new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
}

// ── Monthly Trend Chart ────────────────────────────────
function renderMonthlyChart() {
  const canvas = document.getElementById('admin-monthly-chart');
  if (!canvas) return;
  if (monthlyChart) monthlyChart.destroy();

  // Group by month
  const monthMap = {};
  allAttendance.forEach(r => {
    const month = r.date.substring(0, 7);
    if (!monthMap[month]) monthMap[month] = { present: 0, total: 0 };
    monthMap[month].total++;
    if (r.status === 'present') monthMap[month].present++;
  });

  const months = Object.keys(monthMap).sort().slice(-6);
  const labels = months.map(m => {
    const d = new Date(m + '-01');
    return d.toLocaleDateString('en-US', { month:'short', year:'2-digit' });
  });
  const data = months.map(m => monthMap[m].total > 0
    ? Math.round((monthMap[m].present / monthMap[m].total) * 100)
    : 0
  );

  const isDark = document.body.classList.contains('dark-mode');
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#8b949e' : '#64748b';

  monthlyChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Attendance %',
        data,
        backgroundColor: 'rgba(37,99,235,0.8)',
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => `${ctx.parsed.y}% attendance` }
        }
      },
      scales: {
        y: {
          beginAtZero: true, max: 100,
          grid: { color: gridColor },
          ticks: { color: textColor, callback: v => v + '%' }
        },
        x: { grid: { display: false }, ticks: { color: textColor } }
      }
    }
  });
}

// ── Today Pie Chart ────────────────────────────────────
function renderTodayPieChart(present, absent) {
  const canvas = document.getElementById('admin-today-chart');
  if (!canvas) return;
  if (todayPieChart) todayPieChart.destroy();

  todayPieChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Present', 'Absent'],
      datasets: [{
        data: (present + absent) === 0 ? [1] : [present, absent],
        backgroundColor: (present + absent) === 0
          ? ['#e2e8f0']
          : ['#16a34a', '#ef4444'],
        borderWidth: 0
      }]
    },
    options: {
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Sora', size: 12 }, padding: 14 } }
      }
    }
  });
}

// ── Top Performers ─────────────────────────────────────
function renderTopPerformers() {
  const list = document.getElementById('top-performers-list');
  if (!list) return;

  const studentStats = allStudents.map(s => ({
    ...s,
    ...getStudentStats(s.uid, allAttendance)
  })).filter(s => s.totalDays > 0).sort((a, b) => b.pct - a.pct).slice(0, 10);

  if (!studentStats.length) {
    list.innerHTML = '<p style="color:var(--text-3);font-size:13px">No data yet.</p>';
    return;
  }

  list.innerHTML = studentStats.map((s, i) => {
    const rankCls = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-other';
    const pctCls  = s.pct >= 90 ? 'excellent' : s.pct >= 75 ? 'good' : s.pct >= 60 ? 'average' : 'low';
    return `<div class="performer-item">
      <div class="performer-rank ${rankCls}">${i + 1}</div>
      <div style="flex:1">
        <div class="performer-name">${s.name}</div>
        <div class="performer-roll">${s.rollNumber} · ${s.classSection || '-'}</div>
      </div>
      <div class="performer-pct ${pctCls}">${s.pct}%</div>
    </div>`;
  }).join('');
}

// ── Students Table ─────────────────────────────────────
function renderStudentsTable(students = allStudents, attendance = allAttendance) {
  const tbody = document.getElementById('students-tbody');
  if (!tbody) return;

  // Populate section filter
  const sectionFilter = document.getElementById('section-filter');
  if (sectionFilter && sectionFilter.options.length <= 1) {
    const sections = [...new Set(allStudents.map(s => s.classSection).filter(Boolean))].sort();
    sections.forEach(sec => {
      const opt = document.createElement('option');
      opt.value = sec; opt.textContent = sec;
      sectionFilter.appendChild(opt);
    });
  }

  tbody.innerHTML = students.map((s, i) => {
    const stats = getStudentStats(s.uid, attendance);
    const pctCls = stats.pct >= 90 ? 'badge-present' : stats.pct >= 60 ? 'badge-unmarked' : 'badge-absent';
    return `<tr>
      <td>${i + 1}</td>
      <td><strong>${s.name}</strong></td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:12px">${s.rollNumber}</td>
      <td>${s.classSection || '-'}</td>
      <td style="color:#16a34a;font-weight:700">${stats.presentCount}</td>
      <td style="color:#dc2626;font-weight:700">${stats.absentCount}</td>
      <td><span class="${pctCls}">${stats.pct}%</span></td>
      <td><button class="btn-table-view" onclick="openStudentDetail('${s.uid}')">View</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--text-3);padding:24px">No students found.</td></tr>';
}

// ── Attendance Records Table ───────────────────────────
function renderAttendanceTable(records = allAttendance) {
  const tbody = document.getElementById('attendance-tbody');
  if (!tbody) return;

  // Join with student names
  const studentMap = {};
  allStudents.forEach(s => { studentMap[s.uid] = s; });

  tbody.innerHTML = records.map(r => {
    const s   = studentMap[r.uid] || {};
    const cls = r.status === 'present' ? 'badge-present' : 'badge-absent';
    const timeStr = r.timestamp ? formatTimestamp(r.timestamp) : '--';
    return `<tr>
      <td style="font-family:'JetBrains Mono',monospace;font-size:12px">${r.date}</td>
      <td><strong>${s.name || 'Unknown'}</strong></td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:12px">${s.rollNumber || '-'}</td>
      <td><span class="${cls}">${r.status}</span></td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:12px">${timeStr}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-3);padding:24px">No records found.</td></tr>';
}

// ── Student Detail Modal ───────────────────────────────
async function openStudentDetail(uid) {
  const student = allStudents.find(s => s.uid === uid);
  if (!student) return;

  const stats = getStudentStats(uid, allAttendance);
  const streak = calculateStreak(stats.records);

  document.getElementById('modal-student-name').textContent = `${student.name} — ${student.rollNumber}`;

  document.getElementById('modal-student-body').innerHTML = `
    <div class="student-detail-grid">
      <div class="detail-stat blue">
        <div class="detail-stat-val">${stats.totalDays}</div>
        <div class="detail-stat-label">Total Days</div>
      </div>
      <div class="detail-stat green">
        <div class="detail-stat-val">${stats.presentCount}</div>
        <div class="detail-stat-label">Present</div>
      </div>
      <div class="detail-stat red">
        <div class="detail-stat-val">${stats.absentCount}</div>
        <div class="detail-stat-label">Absent</div>
      </div>
      <div class="detail-stat purple">
        <div class="detail-stat-val">${stats.pct}%</div>
        <div class="detail-stat-label">Attendance</div>
      </div>
    </div>
    <div style="margin-top:16px;padding:12px;background:var(--surface-2);border-radius:10px;border:1px solid var(--border)">
      <div style="font-size:12px;color:var(--text-2)"><strong>Class:</strong> ${student.classSection || '-'} &nbsp;|&nbsp;
      <strong>Email:</strong> ${student.email} &nbsp;|&nbsp;
      <strong>Streak:</strong> 🔥 ${streak} days</div>
    </div>
    <div class="detail-history">
      <h3>Recent Attendance</h3>
      <div class="detail-history-list">
        ${stats.records.slice(0, 30).map(r => {
          const cls = r.status === 'present' ? 'badge-present' : 'badge-absent';
          const timeStr = r.timestamp ? formatTimestamp(r.timestamp) : '--';
          const day = new Date(r.date + 'T00:00:00').toLocaleDateString('en-US',{weekday:'short'});
          return `<div class="detail-hist-item">
            <span style="font-family:'JetBrains Mono',monospace">${r.date}</span>
            <span style="color:var(--text-3)">${day}</span>
            <span class="${cls}">${r.status}</span>
            <span style="font-family:'JetBrains Mono',monospace;color:var(--text-3)">${timeStr}</span>
          </div>`;
        }).join('') || '<div style="color:var(--text-3);font-size:13px;padding:12px">No records</div>'}
      </div>
    </div>
  `;

  document.getElementById('student-detail-modal').classList.remove('hidden');
}

document.getElementById('close-student-modal').addEventListener('click', () => {
  document.getElementById('student-detail-modal').classList.add('hidden');
});

// ── Search & Filter ────────────────────────────────────
function setupAdminSearch() {
  const searchEl  = document.getElementById('student-search');
  const sectionEl = document.getElementById('section-filter');

  function applyFilter() {
    const q   = (searchEl?.value || '').toLowerCase();
    const sec = sectionEl?.value || '';
    const filtered = allStudents.filter(s =>
      (!q || s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q)) &&
      (!sec || s.classSection === sec)
    );
    renderStudentsTable(filtered, allAttendance);
  }

  searchEl?.addEventListener('input', applyFilter);
  sectionEl?.addEventListener('change', applyFilter);
}

function setupAttendanceFilter() {
  const dateEl = document.getElementById('att-date-filter');
  const nameEl = document.getElementById('att-student-filter');
  const studentMap = {};
  allStudents.forEach(s => { studentMap[s.uid] = s; });

  function applyFilter() {
    const d = dateEl?.value || '';
    const n = (nameEl?.value || '').toLowerCase();
    const filtered = allAttendance.filter(r => {
      const s = studentMap[r.uid] || {};
      return (!d || r.date === d) &&
             (!n || (s.name || '').toLowerCase().includes(n) || (s.rollNumber || '').toLowerCase().includes(n));
    });
    renderAttendanceTable(filtered);
  }

  dateEl?.addEventListener('change', applyFilter);
  nameEl?.addEventListener('input', applyFilter);
}

// ── Tab Switching ──────────────────────────────────────
function initAdminTabs() {
  document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.getElementById(`tab-${tab}`)?.classList.remove('hidden');

      if (tab === 'students') {
        await Promise.all([loadAllStudents(), loadAllAttendance()]);
        renderStudentsTable();
        setupAdminSearch();
      } else if (tab === 'attendance') {
        await Promise.all([loadAllStudents(), loadAllAttendance()]);
        renderAttendanceTable();
        setupAttendanceFilter();
      }
    });
  });

  document.getElementById('refresh-students-btn')?.addEventListener('click', async () => {
    await Promise.all([loadAllStudents(), loadAllAttendance()]);
    renderStudentsTable();
    showToast('Students refreshed', 'info');
  });
}
