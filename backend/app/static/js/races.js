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
  const lapsMin = document.getElementById('filterLapsMin')?.value || '';
  const lapsMax = document.getElementById('filterLapsMax')?.value || '';
  const isRealChecked = document.getElementById('filterIsReal')?.checked || false;
  
  // create URL parameters
  const params = new URLSearchParams();
  params.append('page', page);
  if (year) params.append('year', year);
  if (round) params.append('round', round);
  if (dateFrom) params.append('date_from', dateFrom);
  if (dateTo) params.append('date_to', dateTo);
  if (officialName) params.append('official_name', officialName);
  if (qualifyingFormat) params.append('qualifying_format', qualifyingFormat);
  if (lapsMin) params.append('laps_min', lapsMin);
  if (lapsMax) params.append('laps_max', lapsMax);
  if (isRealChecked) params.append('is_real', 'true');

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
      return `
      <div class="card" onclick="openRaceModal(${race.id})">
        <div class="logo-wrapper">
          <img class="logo" src="/static/img/placeholder_track.png" alt="${race.circuit_name} layout"/>
        </div>
        <div class="team-info">
          <div class="name">${race.official_name || race.circuit_name}</div>
          <div class="nation">${race.country} • ${race.circuit_name}</div>
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
        <button class="btn">View Race</button>
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
        <button class="page-btn nav-btn" onclick="fetchConstructors(${current_page + 1})" ${nextDisabled}>
            &rsaquo; </button>
        <button class="page-btn nav-btn" onclick="fetchConstructors(${total_pages})" ${nextDisabled}>
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


async function openRaceModal(raceId) {
  const race = currentRaces.find((r) => r.id == raceId);
  if (!race) return;

  const modal = document.getElementById('raceModal');
  const titleEl = document.getElementById('modalTitle');
  const subtitleEl = document.getElementById('modalSubtitle');
  const bodyEl = document.getElementById('modalBody');

  if (!modal) return;

  titleEl.textContent = race.circuit_name; // veya race.official_name
  subtitleEl.textContent = `${race.official_name} • ${race.year}`;

  // Modal İçeriği
  bodyEl.innerHTML = `
    <div class="modal-top">
      <p class="modal-description single-line">
         <a href="${race.circuit_url}" target="_blank" style="color:#e10600">More info on Wikipedia</a>
      </p>
    </div>

    <div class="modal-stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-content">
          <div class="stat-label">Year</div>
          <div class="stat-value">${race.year}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📍</div>
        <div class="stat-content">
          <div class="stat-label">Location</div>
          <div class="stat-value">${race.location}, ${race.country}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏁</div>
        <div class="stat-content">
          <div class="stat-label">Format</div>
          <div class="stat-value">${race.qualifying_format || 'Standard'}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📏</div>
        <div class="stat-content">
          <div class="stat-label">Length</div>
          <div class="stat-value">${race.course_length ? race.course_length + ' km' : '-'}</div>
        </div>
      </div>
    </div>
    
    <div id="modalResults">
        <p class="loading">Loading results (Not implemented in backend yet)...</p>
    </div>
  `;

  modal.classList.add('active');
}

function closeRaceModal() {
  const modal = document.getElementById('raceModal');
  if (modal) modal.classList.remove('active');
}

// Event Listeners
document.getElementById('raceModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'raceModal') closeRaceModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeRaceModal();
});

// Başlat
window.addEventListener('DOMContentLoaded', () => {
  setupFilters();

  if (window.flatpickr) {
    flatpickr('#filterDateFrom', { dateFormat: 'Y-m-d', allowInput: false });
    flatpickr('#filterDateTo', { dateFormat: 'Y-m-d', allowInput: false });
  }

  fetchRaces(); // İlk yükleme
});