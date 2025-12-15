// Helper to fetch race stats with filters and pagination
async function loadRaceStats(filters = {}, page = 1){
  const params = new URLSearchParams();
  params.append('page', page);
  
  // Add all filter parameters
  Object.keys(filters).forEach(key => {
    if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
      params.append(key, filters[key]);
    }
  });
  
  const res = await fetch('/api/stats/races-by-year?' + params.toString());
  if(!res.ok) throw new Error('Failed to load stats');
  const json = await res.json();
  return json;
}

// Example usage:
// loadRaceStats().then(data => console.table(data)).catch(console.error);

function renderStatsTable(rows){
  const container = document.getElementById('raceStatsBody');
  if(!container) return;
  if(!rows || rows.length === 0){
    container.innerHTML = '<p class="empty-state">No statistics available for the selected filters.</p>';
    return;
  }

  const cols = [
    {k: 'year', label: 'Year', cls: 'col-year'},
    {k: 'race_count', label: 'Total Races', cls: 'col-highlight col-number'},
    {k: 'avg_laps', label: 'Average Laps', cls: 'col-number', format: 'decimal'},
    {k: 'sprint_races', label: 'Sprint', cls: 'col-badge', badge: 'sprint'},
    {k: 'knockout_races', label: 'Knockout', cls: 'col-badge', badge: 'knockout'},
    {k: 'one_session_races', label: 'One Session', cls: 'col-badge', badge: 'default'},
    {k: 'two_session_races', label: 'Two Session', cls: 'col-badge', badge: 'default'},
    {k: 'four_laps_races', label: 'Four Laps', cls: 'col-badge', badge: 'default'},
    {k: 'aggregate_races', label: 'Aggregate', cls: 'col-badge', badge: 'default'}
  ];

  let html = '<table class="stats-table">';
  html += '<thead><tr>';
  html += cols.map(c => `<th>${c.label}</th>`).join('');
  html += '</tr></thead><tbody>';

  for(const r of rows){
    html += '<tr>';
    html += cols.map(c => {
      let value = r[c.k];
      let displayValue;
      
      if(value === null || value === undefined) {
        displayValue = '-';
      } else if(c.format === 'decimal' && typeof value === 'number') {
        displayValue = value.toFixed(3);
      } else {
        displayValue = value;
      }
      
      // Apply badge styling for qualifying format columns
      if(c.badge && value !== null && value !== undefined){
        const badgeType = parseInt(value) === 0 ? 'zero' : c.badge;
        displayValue = `<span class="badge badge-${badgeType}">${value}</span>`;
      }
      
      return `<td class="${c.cls || ''}">${displayValue}</td>`;
    }).join('');
    html += '</tr>';
  }

  html += '</tbody></table>';
  container.innerHTML = html;
}

let currentStatsPage = 1;
let currentStatsFilters = {};

async function initRaceStats(filters = {}, page = 1){
  currentStatsPage = page;
  currentStatsFilters = filters;
  
  try{
    const response = await loadRaceStats(filters, page);
    renderStatsTable(response.data || []);
    renderStatsPagination(response.pagination || {});
  }catch(err){
    const container = document.getElementById('raceStatsBody');
    if(container) container.innerHTML = `<p class="error-state">${err.message}</p>`;
    console.error('Failed to load race stats', err);
  }
}

function getFormFilters(){
  const form = document.getElementById('statsFilters');
  if (!form) return {};
  
  const formData = new FormData(form);
  const filters = {};
  
  // Get all form values
  for (const [key, value] of formData.entries()) {
    if (value && value.trim() !== '') {
      filters[key] = value.trim();
    }
  }
  
  return filters;
}

function renderStatsPagination(paginationData) {
  const container = document.getElementById('statsPagination');
  if (!container) return;
  
  const { current_page = 1, total_pages = 1 } = paginationData;
  
  if (total_pages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  const maxVisibleButtons = 5;
  
  let startPage = Math.max(1, current_page - Math.floor(maxVisibleButtons / 2));
  let endPage = Math.min(total_pages, startPage + maxVisibleButtons - 1);
  
  if (endPage - startPage + 1 < maxVisibleButtons) {
    startPage = Math.max(1, endPage - maxVisibleButtons + 1);
  }

  const prevDisabled = current_page === 1 ? 'disabled' : '';
  
  html += `
    <button class="page-btn nav-btn" onclick="goToStatsPage(1)" ${prevDisabled}>
      &laquo;
    </button>
    <button class="page-btn nav-btn" onclick="goToStatsPage(${current_page - 1})" ${prevDisabled}>
      &lsaquo;
    </button>
  `;

  for (let i = startPage; i <= endPage; i++) {
    html += `
      <button class="page-btn ${i === current_page ? 'active' : ''}" 
        onclick="goToStatsPage(${i})">
        ${i}
      </button>
    `;
  }

  const nextDisabled = current_page === total_pages ? 'disabled' : '';

  html += `
    <button class="page-btn nav-btn" onclick="goToStatsPage(${current_page + 1})" ${nextDisabled}>
      &rsaquo;
    </button>
    <button class="page-btn nav-btn" onclick="goToStatsPage(${total_pages})" ${nextDisabled}>
      &raquo;
    </button>
  `;
  
  container.innerHTML = html;
}

function goToStatsPage(page) {
  initRaceStats(currentStatsFilters, page);
}

function setupStatsFilters(){
  const form = document.getElementById('statsFilters');
  const resetBtn = document.getElementById('resetStatsFilters');

  if(form){
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const filters = getFormFilters();
      initRaceStats(filters, 1); // Reset to page 1 when filtering
    });
  }

  if(resetBtn){
    resetBtn.addEventListener('click', () => {
      if(form) form.reset();
      initRaceStats({}, 1); // Reset filters and go to page 1
    });
  }
}

// Auto-run after DOM ready
window.addEventListener('DOMContentLoaded', () => {
  setupStatsFilters();
  initRaceStats();
});
