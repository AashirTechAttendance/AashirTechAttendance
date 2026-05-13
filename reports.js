// ═══════════════════════════════════════════════════════
// REPORTS MODULE — PDF & Excel Export
// ═══════════════════════════════════════════════════════

let reportData = [];

// ── Generate Report ────────────────────────────────────
async function generateReport() {
  const monthInput = document.getElementById('report-month');
  const month = monthInput?.value;
  if (!month) { showToast('Please select a month', 'warning'); return; }

  const btn = document.getElementById('generate-report-btn');
  btn.textContent = 'Generating…';
  btn.disabled = true;

  try {
    await Promise.all([loadAllStudents(), loadAllAttendance()]);

    // Filter attendance for the selected month
    const monthRecords = allAttendance.filter(r => r.date.startsWith(month));

    // Get unique school days in this month
    const schoolDays = [...new Set(monthRecords.map(r => r.date))].sort();
    const totalDays  = schoolDays.length;

    // Build report per student
    reportData = allStudents.map(s => {
      const sRecords  = monthRecords.filter(r => r.uid === s.uid);
      const present   = sRecords.filter(r => r.status === 'present').length;
      const absent    = totalDays - present;
      const pct       = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;
      const grade     = pct >= 90 ? 'A' : pct >= 75 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';
      return { ...s, present, absent, totalDays, pct, grade };
    }).sort((a, b) => b.pct - a.pct);

    // Render table
    const d = new Date(month + '-01');
    const monthLabel = d.toLocaleDateString('en-US', { month:'long', year:'numeric' });
    document.getElementById('report-title').textContent = `Monthly Report — ${monthLabel}`;

    const tbody = document.getElementById('report-tbody');
    tbody.innerHTML = reportData.map((s, i) => {
      const pctCls = s.pct >= 75 ? 'badge-present' : s.pct >= 60 ? 'badge-unmarked' : 'badge-absent';
      return `<tr>
        <td>${i + 1}</td>
        <td><strong>${s.name}</strong></td>
        <td style="font-family:'JetBrains Mono',monospace;font-size:12px">${s.rollNumber}</td>
        <td>${s.classSection || '-'}</td>
        <td style="color:#16a34a;font-weight:700">${s.present}</td>
        <td style="color:#dc2626;font-weight:700">${s.absent}</td>
        <td>${s.totalDays}</td>
        <td><span class="${pctCls}">${s.pct}%</span></td>
        <td><strong>${s.grade}</strong></td>
      </tr>`;
    }).join('');

    document.getElementById('report-preview').classList.remove('hidden');
    showToast('Report generated successfully!', 'success');
  } catch (err) {
    showToast('Error generating report: ' + err.message, 'error');
  } finally {
    btn.textContent = '📊 Generate Report';
    btn.disabled = false;
  }
}

// ── Export Excel ───────────────────────────────────────
function exportExcel() {
  if (!reportData.length) { showToast('Generate a report first', 'warning'); return; }

  const monthInput = document.getElementById('report-month');
  const month = monthInput?.value || 'Report';
  const d = new Date(month + '-01');
  const monthLabel = d.toLocaleDateString('en-US', { month:'long', year:'numeric' });

  const wsData = [
    ['AashirTech Attendance System'],
    [`Monthly Report — ${monthLabel}`],
    [`Generated: ${new Date().toLocaleString()}`],
    [],
    ['#', 'Name', 'Roll No.', 'Class', 'Present Days', 'Absent Days', 'Total Days', 'Attendance %', 'Grade'],
    ...reportData.map((s, i) => [
      i + 1, s.name, s.rollNumber, s.classSection || '-',
      s.present, s.absent, s.totalDays, s.pct + '%', s.grade
    ])
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws['!cols'] = [
    {wch:5},{wch:25},{wch:12},{wch:10},
    {wch:14},{wch:14},{wch:12},{wch:14},{wch:8}
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');
  XLSX.writeFile(wb, `AashirTech_Attendance_${month}.xlsx`);
  showToast('Excel file downloaded!', 'success');
}

// ── Export PDF ─────────────────────────────────────────
function exportPDF() {
  if (!reportData.length) { showToast('Generate a report first', 'warning'); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const monthInput = document.getElementById('report-month');
  const month = monthInput?.value || '';
  const d = new Date(month + '-01');
  const monthLabel = d.toLocaleDateString('en-US', { month:'long', year:'numeric' });

  // Header background
  doc.setFillColor(26, 86, 219);
  doc.rect(0, 0, 297, 30, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('AashirTech Attendance System', 14, 12);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Monthly Report — ${monthLabel}`, 14, 21);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 200, 21);

  // Summary stats
  const total   = reportData.length;
  const present = reportData.filter(s => s.pct >= 75).length;
  const avg     = total > 0 ? Math.round(reportData.reduce((a, s) => a + s.pct, 0) / total) : 0;

  doc.setFillColor(240, 244, 255);
  doc.rect(0, 30, 297, 18, 'F');
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Students: ${total}`, 14, 41);
  doc.text(`Students ≥75%: ${present}`, 80, 41);
  doc.text(`Class Average: ${avg}%`, 150, 41);
  doc.text(`Total School Days: ${reportData[0]?.totalDays || 0}`, 220, 41);

  // Table
  doc.autoTable({
    startY: 52,
    head: [['#','Name','Roll No.','Class','Present','Absent','Total','Attendance %','Grade']],
    body: reportData.map((s, i) => [
      i + 1, s.name, s.rollNumber, s.classSection || '-',
      s.present, s.absent, s.totalDays, s.pct + '%', s.grade
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: [26, 86, 219],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [240, 244, 255] },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 50 },
      2: { cellWidth: 22 },
      3: { cellWidth: 18 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 28, halign: 'center' },
      8: { cellWidth: 16, halign: 'center' }
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 8) {
        const grade = data.cell.text[0];
        if (grade === 'A')      doc.setTextColor(22, 163, 74);
        else if (grade === 'B') doc.setTextColor(37, 99, 235);
        else if (grade === 'F') doc.setTextColor(220, 38, 38);
        else                    doc.setTextColor(217, 119, 6);
      }
    }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text('AashirTech Attendance System — Confidential', 14, 200);
    doc.text(`Page ${i} of ${pageCount}`, 280, 200, { align: 'right' });
  }

  doc.save(`AashirTech_Attendance_${month}.pdf`);
  showToast('PDF report downloaded!', 'success');
}

// ── Event Listeners ────────────────────────────────────
document.getElementById('generate-report-btn')?.addEventListener('click', generateReport);
document.getElementById('export-excel-btn')?.addEventListener('click', exportExcel);
document.getElementById('export-pdf-btn')?.addEventListener('click', exportPDF);
