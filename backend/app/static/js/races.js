// backend/app/static/js/races.js

// Daha zengin mock race datası
const races = [
  {
    id: 1,
    circuitId: 'bahrain',
    year: 2024,
    round: 1,
    date: '2024-03-02',
    officialName: 'FORMULA 1 GULF AIR BAHRAIN GRAND PRIX 2024',
    qualifyingFormat: 'standard',
    laps: 57,
    qualifyingDate: '2024-03-01',
    isReal: true,
    name: 'Bahrain Grand Prix',
    country: 'Bahrain',
    circuit: 'Bahrain International Circuit',
    distance: '308.238 km',
    trackLength: '5.412 km',
    firstHeld: 2004,
    lapRecord: '1:31.447',
    recordHolder: 'Pedro de la Rosa (2005)',
    description:
      'A night race in the desert with long straights and heavy braking zones, great for overtakes.',
    image: '/placeholder.svg?height=100&width=160'
  },
  {
    id: 2,
    circuitId: 'jeddah',
    year: 2024,
    round: 2,
    date: '2024-03-09',
    officialName: 'FORMULA 1 STC SAUDI ARABIAN GRAND PRIX 2024',
    qualifyingFormat: 'standard',
    laps: 50,
    qualifyingDate: '2024-03-08',
    isReal: true,
    name: 'Saudi Arabian Grand Prix',
    country: 'Saudi Arabia',
    circuit: 'Jeddah Corniche Circuit',
    distance: '308.450 km',
    trackLength: '6.174 km',
    firstHeld: 2021,
    lapRecord: '1:30.734',
    recordHolder: 'Lewis Hamilton (2021)',
    description:
      'High-speed street circuit with blind corners and walls close to the racing line.',
    image: '/placeholder.svg?height=100&width=160'
  },
  {
    id: 3,
    circuitId: 'melbourne',
    year: 2024,
    round: 3,
    date: '2024-03-24',
    officialName: 'FORMULA 1 ROLEX AUSTRALIAN GRAND PRIX 2024',
    qualifyingFormat: 'standard',
    laps: 58,
    qualifyingDate: '2024-03-23',
    isReal: true,
    name: 'Australian Grand Prix',
    country: 'Australia',
    circuit: 'Albert Park Circuit',
    distance: '307.574 km',
    trackLength: '5.278 km',
    firstHeld: 1996,
    lapRecord: '1:24.125',
    recordHolder: 'Michael Schumacher (2004)',
    description:
      'Semi-street circuit around Albert Park with a mix of fast chicanes and traction zones.',
    image: '/placeholder.svg?height=100&width=160'
  },
  {
    id: 4,
    circuitId: 'monaco',
    year: 2023,
    round: 6,
    date: '2023-05-28',
    officialName: 'FORMULA 1 GRAND PRIX DE MONACO 2023',
    qualifyingFormat: 'standard',
    laps: 78,
    qualifyingDate: '2023-05-27',
    isReal: true,
    name: 'Monaco Grand Prix',
    country: 'Monaco',
    circuit: 'Circuit de Monaco',
    distance: '260.286 km',
    trackLength: '3.337 km',
    firstHeld: 1929,
    lapRecord: '1:12.909',
    recordHolder: 'Lewis Hamilton (2021)',
    description:
      'The most iconic race on the calendar, extremely tight walls and zero margin for error.',
    image: '/placeholder.svg?height=100&width=160'
  },
  {
    id: 5,
    circuitId: 'monza',
    year: 2023,
    round: 14,
    date: '2023-09-03',
    officialName: 'FORMULA 1 PIRELLI GRAN PREMIO D\'ITALIA 2023',
    qualifyingFormat: 'standard',
    laps: 53,
    qualifyingDate: '2023-09-02',
    isReal: true,
    name: 'Italian Grand Prix',
    country: 'Italy',
    circuit: 'Autodromo Nazionale Monza',
    distance: '306.720 km',
    trackLength: '5.793 km',
    firstHeld: 1950,
    lapRecord: '1:21.046',
    recordHolder: 'Rubens Barrichello (2004)',
    description:
      'Temple of Speed with long straights, low downforce, and huge top speeds.',
    image: '/placeholder.svg?height=100&width=160'
  },
  {
    id: 6,
    circuitId: 'sprint-brazil',
    year: 2023,
    round: 21,
    date: '2023-11-05',
    officialName: 'FORMULA 1 ROLEX GRANDE PRÊMIO DE SÃO PAULO 2023',
    qualifyingFormat: 'sprint',
    laps: 71,
    qualifyingDate: '2023-11-03',
    isReal: true,
    name: 'São Paulo Grand Prix',
    country: 'Brazil',
    circuit: 'Interlagos',
    distance: '305.909 km',
    trackLength: '4.309 km',
    firstHeld: 1973,
    lapRecord: '1:10.540',
    recordHolder: 'Valtteri Bottas (2018)',
    description:
      'Classic anti-clockwise circuit with elevation change and great racing, including sprint weekends.',
    image: '/placeholder.svg?height=100&width=160'
  },
  {
    id: 7,
    circuitId: 'fictional-istanbul',
    year: 2025,
    round: 4,
    date: '2025-04-06',
    officialName: 'FORMULA 1 TÜRKİYE GRAND PRIX (SIMULATED)',
    qualifyingFormat: 'standard',
    laps: 58,
    qualifyingDate: '2025-04-05',
    isReal: false,
    name: 'Turkish Grand Prix (Sim)',
    country: 'Türkiye',
    circuit: 'Istanbul Park',
    distance: '309.396 km',
    trackLength: '5.338 km',
    firstHeld: 2005,
    lapRecord: '1:24.770',
    recordHolder: 'Juan Pablo Montoya (2005)',
    description:
      'Simulated data for testing filters, including the legendary Turn 8.',
    image: '/placeholder.svg?height=100&width=160'
  },
  {
    id: 8,
    circuitId: 'fictional-vegas',
    year: 2025,
    round: 22,
    date: '2025-11-22',
    officialName: 'FORMULA 1 LAS VEGAS NIGHT GRAND PRIX (SIMULATED)',
    qualifyingFormat: 'sprint',
    laps: 50,
    qualifyingDate: '2025-11-21',
    isReal: false,
    name: 'Las Vegas Night Grand Prix (Sim)',
    country: 'USA',
    circuit: 'Las Vegas Strip Circuit',
    distance: '305.000 km',
    trackLength: '6.201 km',
    firstHeld: 2023,
    lapRecord: '1:34.000',
    recordHolder: 'Simulated Driver',
    description:
      'Fake data for testing sprint + fictional race filters on a neon city layout.',
    image: '/placeholder.svg?height=100&width=160'
  }
];

// 🔧 Kartları bastığımız fonksiyon (artık parametre alıyor)
function renderRaces(list = races) {
  const grid = document.getElementById('racesGrid');
  if (!grid) return;

  if (!list.length) {
    grid.innerHTML = `<p class="empty-state">No races match the selected filters.</p>`;
    return;
  }

  grid.innerHTML = list
    .map((race) => {
      return `
      <div class="card" onclick="openRaceModal(${race.id})">
        <div class="logo-wrapper">
          <img class="logo" src="${race.image}" alt="${race.circuit} layout"/>
        </div>
        <div class="team-info">
          <div class="name">${race.name}</div>
          <div class="nation">${race.country} • ${race.circuit}</div>
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

// 🔍 Filtreleri uygula
function getFilteredRaces() {
  const year = document.getElementById('filterYear')?.value || '';
  const round = document.getElementById('filterRound')?.value.trim();
  const dateFrom = document.getElementById('filterDateFrom')?.value;
  const dateTo = document.getElementById('filterDateTo')?.value;
  const officialName = (document.getElementById('filterOfficialName')?.value || '').toLowerCase();
  const qualifyingFormat = document.getElementById('filterQualifyingFormat')?.value || '';
  const lapsMin = document.getElementById('filterLapsMin')?.value;
  const lapsMax = document.getElementById('filterLapsMax')?.value;
  const isRealOnly = document.getElementById('filterIsReal')?.checked;

  return races.filter((race) => {
    if (year && String(race.year) !== year) return false;
    if (round && String(race.round) !== round) return false;

    if (dateFrom && race.date < dateFrom) return false;
    if (dateTo && race.date > dateTo) return false;

    if (officialName && !race.officialName.toLowerCase().includes(officialName)) return false;

    if (qualifyingFormat && race.qualifyingFormat !== qualifyingFormat) return false;

    if (lapsMin && race.laps < Number(lapsMin)) return false;
    if (lapsMax && race.laps > Number(lapsMax)) return false;

    if (isRealOnly && !race.isReal) return false;

    return true;
  });
}

// 📥 Form event’leri
function setupFilters() {
  const form = document.getElementById('raceFilters');
  const resetBtn = document.getElementById('resetFilters');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const filtered = getFilteredRaces();
      renderRaces(filtered);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      renderRaces(races);
    });
  }
}

// Modal açma
async function openRaceModal(raceId) {
  const race = races.find((r) => r.id === raceId);
  if (!race) return;

  const modal = document.getElementById('raceModal');
  const flagImg = document.getElementById('modalFlag');
  const titleEl = document.getElementById('modalTitle');
  const subtitleEl = document.getElementById('modalSubtitle');
  const bodyEl = document.getElementById('modalBody');

  if (!modal || !flagImg || !titleEl || !subtitleEl || !bodyEl) return;

  flagImg.src = race.image || '/placeholder.svg';
  flagImg.alt = race.circuit + ' image';
  titleEl.textContent = race.name;
  subtitleEl.textContent = `${race.officialName} • ${race.year}`;

  bodyEl.innerHTML = `
    <div class="modal-top">
      <p class="modal-description single-line">${race.description}</p>
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
        <div class="stat-icon">🔢</div>
        <div class="stat-content">
          <div class="stat-label">Round</div>
          <div class="stat-value">${race.round}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📍</div>
        <div class="stat-content">
          <div class="stat-label">Circuit</div>
          <div class="stat-value">${race.circuit}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🗓️</div>
        <div class="stat-content">
          <div class="stat-label">Race Date</div>
          <div class="stat-value">${race.date}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-content">
          <div class="stat-label">Qualifying Date</div>
          <div class="stat-value">${race.qualifyingDate || '-'}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🔁</div>
        <div class="stat-content">
          <div class="stat-label">Laps</div>
          <div class="stat-value">${race.laps}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🏁</div>
        <div class="stat-content">
          <div class="stat-label">Qualifying Format</div>
          <div class="stat-value">${race.qualifyingFormat}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📏</div>
        <div class="stat-content">
          <div class="stat-label">Track Length</div>
          <div class="stat-value">${race.trackLength}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🛰️</div>
        <div class="stat-content">
          <div class="stat-label">Is Real</div>
          <div class="stat-value">${race.isReal ? 'Yes' : 'No (simulated)'}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🏎️</div>
        <div class="stat-content">
          <div class="stat-label">Lap Record</div>
          <div class="stat-value">${race.lapRecord || '-'}<br/><small style="font-weight:400;opacity:.8">${race.recordHolder || ''}</small></div>
        </div>
      </div>
    </div>

  `;

  // append results placeholder
  const resultsContainer = document.createElement('div');
  resultsContainer.id = 'modalResults';
  resultsContainer.innerHTML = `<p class="loading">Loading results...</p>`;
  bodyEl.appendChild(resultsContainer);

  try {
    const results = await getRaceResults(raceId);
    resultsContainer.innerHTML = renderResultsTable(results);
  } catch (err) {
    console.error('Failed to load race results', err);
    resultsContainer.innerHTML = `<p class="error">Unable to load results.</p>`;
  }

  modal.classList.add('active');
}

// ----- race results helper: uses global raceDataMock when available -----
const _raceData = (window && window.raceDataMock) ? window.raceDataMock : [];
const raceResultsCache = new Map();

function getRaceResults(raceId) {
  if (raceResultsCache.has(raceId)) return Promise.resolve(raceResultsCache.get(raceId));
  const found = _raceData.filter((r) => Number(r.race_id) === Number(raceId));
  raceResultsCache.set(raceId, found);
  return Promise.resolve(found);
}

function renderResultsTable(results) {
  if (!results || !results.length) return `<p class="empty-state">No results available for this race.</p>`;

  const rows = results
    .sort((a, b) => Number(a.position_display_order) - Number(b.position_display_order))
    .map((r) => `
      <tr>
        <td class="td-pos">${r.position_display_order}</td>
        <td class="td-number">${r.driver_number}</td>
        <td class="td-driver">${r.driver_name || r.driver_id}</td>
        <td class="td-constructor">${r.constructor_name || r.constructor_id}</td>
        <td class="td-grid">${r.race_grid_position_number ?? '-'}</td>
        <td class="td-points">${Number(r.race_points).toFixed(1)}</td>
        <td class="td-pole">${r.race_pole_position ? 'P' : ''}</td>
      </tr>
    `)
    .join('');

  return `
    <h3 class="results-title">Results</h3>
    <div class="results-wrapper">
      <table class="results-table" cellpadding="0" cellspacing="0">
        <thead>
          <tr>
            <th>#</th>
            <th>No</th>
            <th>Driver</th>
            <th>Constructor</th>
            <th>Grid</th>
            <th>Pts</th>
            <th>Pole</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

// Modal kapatma
function closeRaceModal() {
  const modal = document.getElementById('raceModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Arka plana tıklayınca modalı kapat
document.addEventListener('click', (e) => {
  const modal = document.getElementById('raceModal');
  if (!modal) return;
  if (e.target.id === 'raceModal') {
    closeRaceModal();
  }
});

// ESC ile modal kapatma
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeRaceModal();
  }
});

// Sayfa yüklendiğinde: filtreleri bağla + tüm yarışları göster
window.addEventListener('DOMContentLoaded', () => {
  setupFilters();

  if (window.flatpickr) {
    flatpickr('#filterDateFrom', {
      dateFormat: 'Y-m-d',
      allowInput: false
    });

    flatpickr('#filterDateTo', {
      dateFormat: 'Y-m-d',
      allowInput: false
    });
  }

  renderRaces(races);
});

