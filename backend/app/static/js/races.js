// global variables
let currentRaces = [];
let currentPage = 1;


async function fetchRaces(page = 1) {
  currentPage = page;

  // get values from HTML inputs
  const year = document.getElementById('filterYear')?.value || '';
  const round = document.getElementById('filterRound')?.value || '';
  const dateFrom = document.getElementById('filterDateFrom')?.value || '';
  const dateTo = document.getElementById('filterDateTo')?.value || '';
  const officialName = document.getElementById('filterOfficialName')?.value || '';
  const qualifyingFormat = document.getElementById('filterQualifyingFormat')?.value || '';
  const raceTypeRadio = document.querySelector('input[name="raceType"]:checked');
  const raceType = raceTypeRadio ? raceTypeRadio.value : 'all';
  
  // create URL parameters
  const params = new URLSearchParams();
  params.append('page', page);
  if (year) params.append('year', year);
  if (round) params.append('round', round);
  if (dateFrom) params.append('date_from', dateFrom);
  if (dateTo) params.append('date_to', dateTo);
  if (officialName) params.append('official_name', officialName);
  if (qualifyingFormat) params.append('qualifying_format', qualifyingFormat);
  if (raceType === 'real') params.append('is_real', 'true');
  if (raceType === 'user') params.append('is_real', 'false');

  try {
    const response = await fetch(`/api/races?${params.toString()}`);
    if (!response.ok) throw new Error('Network response was not ok');

    const data = await response.json();
    currentRaces = data.races;

    renderRaces(data.races);
    renderPagination(data.pagination);

  } catch (error) {
    console.error('Error fetching races:', error);
    document.getElementById('racesGrid').innerHTML = 
      '<p class="empty-state">Error loading data. Please try again later.</p>';
  }
}

function renderRaces(list) {
  const grid = document.getElementById('racesGrid');
  if (!grid) return;

  if (!list || list.length === 0) {
    grid.innerHTML = '<p class="empty-state">No races match the selected filters.</p>';
    return;
  }

  grid.innerHTML = list
    .map((race) => {
      const circuitLocation = [race.circuit_place_name, race.circuit_country].filter(Boolean).join(' • ');
      const circuitButton = race.circuit_id
        ? `<a class="btn secondary" href="/circuits/${race.circuit_id}">View Circuit</a>`
        : '';
      return `
      <div class="card">
        <div class="team-info">
          <div class="name">${race.official_name || race.circuit_name}</div>
          <div class="nation">${circuitLocation || 'Location TBD'}</div>
          <div class="stats">
            <div class="stat-item">
              <span class="stat-label">Year</span>
              <span class="stat-value">${race.year}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Round</span>
              <span class="stat-value">${race.round}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Date</span>
              <span class="stat-value">${race.date}</span>
            </div>
          </div>
        </div>
        <div class="card-actions">
          <a class="btn" href="/races/${race.id}">View Race</a>
          ${circuitButton}
        </div>
      </div>
      `;
    })
    .join('');
}

function renderPagination(paginationData) {
    const container = document.getElementById('pagination');
    if (!container) return;
    
    const { current_page, total_pages } = paginationData;
    
    if (total_pages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';

    let maxVisibleButtons = 5;
    let startPage = Math.max(1, current_page - Math.floor(maxVisibleButtons / 2));
    let endPage = Math.min(total_pages, startPage + maxVisibleButtons - 1);

    if (endPage - startPage + 1 < maxVisibleButtons) {
        startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }

    const prevDisabled = current_page === 1 ? 'disabled' : '';
    
    html += `
        <button class="page-btn nav-btn" onclick="fetchRaces(1)" ${prevDisabled}>
            &laquo; </button>
        <button class="page-btn nav-btn" onclick="fetchRaces(${current_page - 1})" ${prevDisabled}>
            &lsaquo; </button>
    `;

    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="page-btn ${i === current_page ? 'active' : ''}" 
                onclick="fetchRaces(${i})">
                ${i}
            </button>
        `;
    }

    const nextDisabled = current_page === total_pages ? 'disabled' : '';

    html += `
        <button class="page-btn nav-btn" onclick="fetchRaces(${current_page + 1})" ${nextDisabled}>
            &rsaquo; </button>
        <button class="page-btn nav-btn" onclick="fetchRaces(${total_pages})" ${nextDisabled}>
            &raquo; </button>
    `;

    container.innerHTML = html;
}

function setupFilters() {
  const form = document.getElementById('raceFilters');
  const resetBtn = document.getElementById('resetFilters');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      fetchRaces(1);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      fetchRaces(1);
    });
  }
}


// Note: Modal functionality removed. Cards now link to a dedicated page at /races/<id>

// Remove any remaining references to modal DOM elements in case they exist
document.getElementById('raceModal')?.remove?.();

// Başlat
window.addEventListener('DOMContentLoaded', () => {
  setupFilters();

  if (window.flatpickr) {
    flatpickr('#filterDateFrom', { dateFormat: 'Y-m-d', allowInput: false });
    flatpickr('#filterDateTo', { dateFormat: 'Y-m-d', allowInput: false });
  }

  fetchRaces(); // İlk yükleme
});
