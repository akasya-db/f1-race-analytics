// backend/app/static/js/races.js

// Race data (şimdilik statik, sonra DB’den çekebilirsin)
const races = [
  {
    id: 'bahrain',
    name: 'Bahrain Grand Prix',
    country: 'Bahrain',
    circuit: 'Bahrain International Circuit',
    date: '2025-03-15',
    laps: 57,
    distance: '308.238 km',
    trackLength: '5.412 km',
    firstHeld: 2004,
    lapRecord: '1:31.447',
    recordHolder: 'Pedro de la Rosa (2005)',
    description:
      'A night race in the desert featuring long straights and heavy braking zones, offering great overtaking opportunities and dramatic racing.',
    image: '/placeholder.svg?height=100&width=160'
  },
  {
    id: 'monaco',
    name: 'Monaco Grand Prix',
    country: 'Monaco',
    circuit: 'Circuit de Monaco',
    date: '2025-05-25',
    laps: 78,
    distance: '260.286 km',
    trackLength: '3.337 km',
    firstHeld: 1929,
    lapRecord: '1:12.909',
    recordHolder: 'Lewis Hamilton (2021)',
    description:
      'The most iconic and prestigious race on the calendar, with narrow streets, zero margin for error, and incredible driver skill on display.',
    image: '/placeholder.svg?height=100&width=160'
  },
  {
    id: 'monza',
    name: 'Italian Grand Prix',
    country: 'Italy',
    circuit: 'Autodromo Nazionale Monza',
    date: '2025-09-07',
    laps: 53,
    distance: '306.720 km',
    trackLength: '5.793 km',
    firstHeld: 1950,
    lapRecord: '1:21.046',
    recordHolder: 'Rubens Barrichello (2004)',
    description:
      'Known as the Temple of Speed, Monza is all about long straights, low downforce, and insane top speeds through the Italian forest.',
    image: '/placeholder.svg?height=100&width=160'
  }
];

// Kartları bastığımız fonksiyon
function renderRaces() {
  const grid = document.getElementById('racesGrid');
  if (!grid) return;

  grid.innerHTML = races
    .map((race) => {
      return `
      <div class="card" onclick="openRaceModal('${race.id}')">
        <div class="logo-wrapper">
          <img class="logo" src="${race.image}" alt="${race.circuit} layout"/>
        </div>
        <div class="team-info">
          <div class="name">${race.name}</div>
          <div class="nation">${race.country} • ${race.circuit}</div>
          <div class="stats">
            <div class="stat-item">
              <span class="stat-label">Date</span>
              <span class="stat-value">${race.date}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Laps</span>
              <span class="stat-value">${race.laps}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Distance</span>
              <span class="stat-value">${race.distance}</span>
            </div>
          </div>
        </div>
        <button class="btn">View Race</button>
      </div>
      `;
    })
    .join('');
}

// Modal açma
function openRaceModal(raceId) {
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
  subtitleEl.textContent = `${race.circuit} • ${race.country}`;

  bodyEl.innerHTML = `
    <p class="modal-description">${race.description}</p>
    <div class="modal-grid">
      <div class="modal-stat-item">
        <span class="modal-stat-label">Date</span>
        <span class="modal-stat-value">${race.date}</span>
      </div>
      <div class="modal-stat-item">
        <span class="modal-stat-label">Laps</span>
        <span class="modal-stat-value">${race.laps}</span>
      </div>
      <div class="modal-stat-item">
        <span class="modal-stat-label">Race Distance</span>
        <span class="modal-stat-value">${race.distance}</span>
      </div>
      <div class="modal-stat-item">
        <span class="modal-stat-label">Track Length</span>
        <span class="modal-stat-value">${race.trackLength}</span>
      </div>
      <div class="modal-stat-item">
        <span class="modal-stat-label">First Held</span>
        <span class="modal-stat-value">${race.firstHeld}</span>
      </div>
      <div class="modal-stat-item">
        <span class="modal-stat-label">Lap Record</span>
        <span class="modal-stat-value">${race.lapRecord}<br/><small>${race.recordHolder}</small></span>
      </div>
    </div>
  `;

  modal.classList.add('active');
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

// Sayfa yüklendiğinde kartları render et
window.addEventListener('DOMContentLoaded', renderRaces);
