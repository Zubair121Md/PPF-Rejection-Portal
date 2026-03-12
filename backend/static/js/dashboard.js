// Simple vanilla JS dashboard wiring for PPF Rejection Management
// Focuses on tab switching and basic KPIs for now.

const API_BASE = 'http://127.0.0.1:8000';

function selectAll(selector) {
  return Array.prototype.slice.call(document.querySelectorAll(selector));
}

function $(selector) {
  return document.querySelector(selector);
}

function setupTabs() {
  const links = selectAll('.nav-link');
  links.forEach((link) => {
    link.addEventListener('click', () => {
      const tab = link.getAttribute('data-tab');
      if (!tab) return;

      // Activate sidebar item
      links.forEach((l) => l.classList.remove('active'));
      link.classList.add('active');

      // Show corresponding section
      const sections = selectAll('[id^="tab-"]');
      sections.forEach((section) => {
        section.classList.add('hidden');
      });
      const activeSection = document.getElementById(`tab-${tab}`);
      if (activeSection) activeSection.classList.remove('hidden');
    });
  });
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

async function loadKpis() {
  try {
    // For now, reuse /tickets and /approvals/pending to compute simple KPIs.
    const [ticketsResp, pendingResp] = await Promise.all([
      fetchJson(`${API_BASE}/tickets?limit=200`),
      fetchJson(`${API_BASE}/approvals/pending`),
    ]);

    const tickets = ticketsResp.items || [];
    const pending = pendingResp || [];

    const totalTickets = tickets.length;
    const totalB2B = tickets
      .filter((t) => t.channel === 'B2B')
      .reduce((sum, t) => sum + Number(t.cost || 0), 0);
    const totalB2C = tickets
      .filter((t) => t.channel === 'B2C')
      .reduce((sum, t) => sum + Number(t.cost || 0), 0);

    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });

    const totalEl = $('#kpi-total-tickets');
    const totalFootnote = $('#kpi-total-footnote');
    const b2bEl = $('#kpi-b2b-value');
    const b2cEl = $('#kpi-b2c-value');
    const pendingEl = $('#kpi-pending-count');

    if (totalEl) totalEl.textContent = String(totalTickets);
    if (totalFootnote) totalFootnote.textContent = `${totalTickets} tickets in the system`;
    if (b2bEl) b2bEl.textContent = totalB2B ? formatter.format(totalB2B) : '–';
    if (b2cEl) b2cEl.textContent = totalB2C ? formatter.format(totalB2C) : '–';
    if (pendingEl) pendingEl.textContent = String(pending.length || '0');

    renderCharts(totalB2B, totalB2C, tickets);
  } catch (err) {
    // On error, leave placeholders; optionally log to console for dev
    // eslint-disable-next-line no-console
    console.warn('Failed to load KPIs', err);
  }
}

function renderCharts(totalB2B, totalB2C, tickets) {
  const ctxBar = document.getElementById('chart-cost-vs-qty');
  const ctxPie = document.getElementById('chart-channel-split');
  if (!ctxBar || !ctxPie || !window.Chart) return;

  const totalQtyB2B = tickets
    .filter((t) => t.channel === 'B2B')
    .reduce((sum, t) => sum + Number(t.quantity || 0), 0);
  const totalQtyB2C = tickets
    .filter((t) => t.channel === 'B2C')
    .reduce((sum, t) => sum + Number(t.quantity || 0), 0);

  // Bar chart: value vs qty for B2B / B2C
  // eslint-disable-next-line no-new
  new window.Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: ['B2B', 'B2C'],
      datasets: [
        {
          label: 'Rejection value',
          data: [totalB2B, totalB2C],
          backgroundColor: ['#38bdf8', '#fb923c'],
          borderRadius: 6,
          yAxisID: 'y',
        },
        {
          label: 'Quantity',
          data: [totalQtyB2B, totalQtyB2C],
          backgroundColor: ['#0f766e', '#a855f7'],
          borderRadius: 6,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          position: 'left',
          ticks: { font: { size: 10 } },
          grid: { display: false },
        },
        y1: {
          position: 'right',
          ticks: { font: { size: 10 } },
          grid: { display: false },
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 10, font: { size: 10 } },
        },
      },
    },
  });

  const totalValue = totalB2B + totalB2C;
  if (!totalValue) return;

  // Doughnut chart: channel split
  // eslint-disable-next-line no-new
  new window.Chart(ctxPie, {
    type: 'doughnut',
    data: {
      labels: ['B2B', 'B2C'],
      datasets: [
        {
          data: [totalB2B, totalB2C],
          backgroundColor: ['#22c55e', '#f97316'],
          borderWidth: 0,
        },
      ],
    },
    options: {
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 10, font: { size: 10 } },
        },
      },
    },
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  loadKpis();
});

