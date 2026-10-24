/**
 * FSOFT HRMS - Enterprise Analytics Chart Module (Chart.js wrapper)
 */
const chartInstances = {};

function destroyExisting(chartId) {
  if (chartInstances[chartId]) {
    chartInstances[chartId].destroy();
    delete chartInstances[chartId];
  }
}

function getColors(theme) {
  const isDark = theme === 'dark';
  return {
    isDark,
    textColor: isDark ? '#F8FAFC' : '#1E293B',
    mutedColor: isDark ? '#94A3B8' : '#64748B',
    gridColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    borderColor: isDark ? '#1C2541' : '#FFFFFF',
    fptOrange: '#F37021',
    fptBlue: '#005C8A',
    fptGreen: '#10B981',
    fptPurple: '#8B5CF6',
    fptPink: '#EC4899',
    fptCyan: '#06B6D4',
    palette: ['#F37021', '#005C8A', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4', '#EAB308']
  };
}

// 1. Bar Chart: Phân bổ Nhân sự theo Đơn vị (FSU)
export function renderDeptBarChart(canvasId, deptList, theme = 'light') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  destroyExisting(canvasId);

  const colors = getColors(theme);
  const labels = deptList.map(d => d.department || d.name);
  const counts = deptList.map(d => parseInt(d.count || 0, 10));

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Số lượng Nhân viên',
        data: counts,
        backgroundColor: colors.palette.slice(0, labels.length),
        borderRadius: 6,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Nhân sự: ${ctx.raw} người`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', weight: '600' } },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: { color: colors.mutedColor, stepSize: 1 },
          grid: { color: colors.gridColor }
        }
      }
    }
  });
}

// 2. Donut Chart: Cơ Cấu Trình Độ Level FSOFT
export function renderLevelDonutChart(canvasId, levelList, theme = 'light') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  destroyExisting(canvasId);

  const colors = getColors(theme);
  const labels = levelList.map(l => l.level);
  const counts = levelList.map(l => parseInt(l.count || 0, 10));

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: counts,
        backgroundColor: ['#10B981', '#005C8A', '#F37021', '#8B5CF6', '#EC4899'],
        borderColor: colors.borderColor,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', weight: '600', size: 12 }, padding: 12 }
        }
      },
      cutout: '68%'
    }
  });
}

// 3. Line Chart: Xu Hướng Quỹ Lương 6 Tháng
export function renderPayrollTrendChart(canvasId, trendData, theme = 'light') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  destroyExisting(canvasId);

  const colors = getColors(theme);
  const labels = trendData.map(t => t.month);
  const values = trendData.map(t => t.total / 1000000); // triệu VND

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Tổng Quỹ Lương (Triệu VND)',
        data: values,
        borderColor: colors.fptOrange,
        backgroundColor: 'rgba(243, 112, 33, 0.12)',
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointBackgroundColor: colors.fptOrange,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.raw} Triệu ₫`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', weight: '600' } },
          grid: { color: colors.gridColor }
        },
        y: {
          ticks: {
            color: colors.mutedColor,
            callback: (v) => `${v}M`
          },
          grid: { color: colors.gridColor }
        }
      }
    }
  });
}

// 4. Radar Chart: Ma Trận Năng Lực Kỹ Năng Kỹ Thuật (Employee / Team)
export function renderSkillsRadarChart(canvasId, skillsList, theme = 'light') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  destroyExisting(canvasId);

  const colors = getColors(theme);
  const labels = skillsList.length ? skillsList.map(s => s.name || s.skill_name) : ['Java', '.NET Core', 'Python AI', 'React', 'AWS Cloud', 'Docker'];
  const levels = skillsList.length ? skillsList.map(s => parseInt(s.level || 3, 10)) : [4, 5, 3, 4, 3, 4];

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Level Kỹ Năng (Thang 1 - 5 Sao)',
        data: levels,
        backgroundColor: 'rgba(0, 92, 138, 0.25)',
        borderColor: colors.fptBlue,
        pointBackgroundColor: colors.fptOrange,
        pointBorderColor: '#FFFFFF',
        pointRadius: 4,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        r: {
          min: 0,
          max: 5,
          ticks: { stepSize: 1, color: colors.mutedColor, backdropColor: 'transparent' },
          grid: { color: colors.gridColor },
          angleLines: { color: colors.gridColor },
          pointLabels: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', weight: '700', size: 11 } }
        }
      }
    }
  });
}

// 5. Horizontal Bar Chart: Tiến Độ Dự Án
export function renderProjectProgressBarChart(canvasId, projectsList, theme = 'light') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  destroyExisting(canvasId);

  const colors = getColors(theme);
  const labels = projectsList.map(p => p.name);
  const progresses = projectsList.map(p => parseInt(p.progress || 0, 10));

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Tiến độ hoàn thành (%)',
        data: progresses,
        backgroundColor: progresses.map(p => p >= 80 ? colors.fptGreen : (p >= 50 ? colors.fptOrange : colors.fptBlue)),
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Tiến độ: ${ctx.raw}%`
          }
        }
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          ticks: { color: colors.mutedColor, callback: (v) => `${v}%` },
          grid: { color: colors.gridColor }
        },
        y: {
          ticks: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', weight: '600' } },
          grid: { display: false }
        }
      }
    }
  });
}

// 6. Line Chart: Lịch Sử Đánh Giá KPI Cá Nhân
export function renderKpiHistoryChart(canvasId, kpiList, theme = 'light') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  destroyExisting(canvasId);

  const colors = getColors(theme);
  const labels = kpiList.length ? kpiList.map(k => k.review_period) : ['Q1/2026', 'Q2/2026', 'Q3/2026', 'Q4/2026'];
  const scores = kpiList.length ? kpiList.map(k => parseInt(k.kpi_score || 85, 10)) : [82, 88, 91, 95];

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Điểm KPI (Thang 100)',
        data: scores,
        borderColor: colors.fptGreen,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        fill: true,
        tension: 0.3,
        borderWidth: 3,
        pointBackgroundColor: colors.fptGreen,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', weight: '600' } },
          grid: { color: colors.gridColor }
        },
        y: {
          min: 60,
          max: 100,
          ticks: { color: colors.mutedColor, stepSize: 10 },
          grid: { color: colors.gridColor }
        }
      }
    }
  });
}
