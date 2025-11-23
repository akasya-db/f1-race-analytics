// Driver data (örnek set – istediğin gibi genişletebilirsin)
const drivers = [
  {
    id: 'verstappen',
    name: 'Max Verstappen',
    nationality: 'Netherlands',
    team: 'Red Bull Racing',
    number: '1',
    headshot: '/placeholder.svg?height=120&width=120',
    worldChampionships: '3',
    wins: '60+',
    poles: '40+',
    podiums: '100+',
    total_race_wins: 60,
    total_podiums: 100,
    total_points: 2600,
    total_pole_positions: 40,
    dateOfBirth: '1997-09-30',
    placeOfBirth: 'Hasselt, Belgium',
    bio: `Relentless pace and consistency have defined Verstappen's recent dominance, pairing raw speed with strategic racecraft.`
  },
  {
    id: 'leclerc',
    name: 'Charles Leclerc',
    nationality: 'Monaco',
    team: 'Scuderia Ferrari',
    number: '16',
    headshot: '/placeholder.svg?height=120&width=120',
    worldChampionships: '0',
    wins: '10+',
    poles: '20+',
    podiums: '40+',
    total_race_wins: 10,
    total_podiums: 40,
    total_points: 1200,
    total_pole_positions: 20,
    dateOfBirth: '1997-10-16',
    placeOfBirth: 'Monte Carlo, Monaco',
    bio: `Qualifying specialist with razor-sharp one-lap speed, driving Ferrari's charge with precision and flair.`
  },
  {
    id: 'hamilton',
    name: 'Lewis Hamilton',
    nationality: 'United Kingdom',
    team: 'Mercedes-AMG Petronas',
    number: '44',
    headshot: '/placeholder.svg?height=120&width=120',
    worldChampionships: '7',
    wins: '100+',
    poles: '100+',
    podiums: '190+',
    total_race_wins: 103,
    total_podiums: 197,
    total_points: 4500,
    total_pole_positions: 104,
    dateOfBirth: '1985-01-07',
    placeOfBirth: 'Stevenage, England',
    bio: `The most successful driver in F1 history by wins and poles; supreme tyre management and race intelligence.`
  },
  {
    id: 'norris',
    name: 'Lando Norris',
    nationality: 'United Kingdom',
    team: 'McLaren',
    number: '4',
    headshot: '/placeholder.svg?height=120&width=120',
    worldChampionships: '0',
    wins: '1+',
    poles: '1+',
    podiums: '20+',
    total_race_wins: 1,
    total_podiums: 20,
    total_points: 700,
    total_pole_positions: 1,
    dateOfBirth: '1999-11-13',
    placeOfBirth: 'Bristol, England',
    bio: `Explosive race pace and outstanding adaptability, spearheading McLaren’s resurgence.`
  },
  {
    id: 'alonso',
    name: 'Fernando Alonso',
    nationality: 'Spain',
    team: 'Aston Martin',
    number: '14',
    headshot: '/placeholder.svg?height=120&width=120',
    worldChampionships: '2',
    wins: '30+',
    poles: '20+',
    podiums: '100+',
    total_race_wins: 32,
    total_podiums: 106,
    total_points: 2200,
    total_pole_positions: 22,
    dateOfBirth: '1981-07-29',
    placeOfBirth: 'Oviedo, Spain',
    bio: `Legendary racecraft and tactical genius; still a podium threat with remarkable longevity.`
  },
  {
    id: 'russell',
    name: 'George Russell',
    nationality: 'United Kingdom',
    team: 'Mercedes-AMG Petronas',
    number: '63',
    headshot: '/placeholder.svg?height=120&width=120',
    worldChampionships: '0',
    wins: '1+',
    poles: '1+',
    podiums: '10+',
    total_race_wins: 1,
    total_podiums: 10,
    total_points: 400,
    total_pole_positions: 1,
    dateOfBirth: '1998-02-15',
    placeOfBirth: 'King’s Lynn, England',
    bio: `Clinical qualifying and consistent race pace; key to Mercedes’ next chapter.`
  },
  {
    id: 'sainz',
    name: 'Carlos Sainz',
    nationality: 'Spain',
    team: 'Scuderia Ferrari',
    number: '55',
    headshot: '/placeholder.svg?height=120&width=120',
    worldChampionships: '0',
    wins: '3+',
    poles: '3+',
    podiums: '20+',
    total_race_wins: 3,
    total_podiums: 20,
    total_points: 900,
    total_pole_positions: 3,
    dateOfBirth: '1994-09-01',
    placeOfBirth: 'Madrid, Spain',
    bio: `Measured, strategic racer with excellent tyre preservation and race management.`
  },
  {
    id: 'piastri',
    name: 'Oscar Piastri',
    nationality: 'Australia',
    team: 'McLaren',
    number: '81',
    headshot: '/placeholder.svg?height=120&width=120',
    worldChampionships: '0',
    wins: '1+ (sprint)',
    poles: '—',
    podiums: '5+',
    total_race_wins: 1,
    total_podiums: 5,
    total_points: 250,
    total_pole_positions: 0,
    dateOfBirth: '2001-04-06',
    placeOfBirth: 'Melbourne, Australia',
    bio: `Ultra-composed rookie-to-contender trajectory; strong foundations from feeder series titles.`
  },
  {
    id: 'perez',
    name: 'Sergio Pérez',
    nationality: 'Mexico',
    team: 'Red Bull Racing',
    number: '11',
    headshot: '/placeholder.svg?height=120&width=120',
    worldChampionships: '0',
    wins: '10+',
    poles: '3+',
    podiums: '40+',
    total_race_wins: 10,
    total_podiums: 40,
    total_points: 1600,
    total_pole_positions: 3,
    dateOfBirth: '1990-01-26',
    placeOfBirth: 'Guadalajara, Mexico',
    bio: `Tyre whisperer and overtaking ace; pivotal in strategic team results.`
  },
  {
    id: 'ocon',
    name: 'Esteban Ocon',
    nationality: 'France',
    team: 'Alpine',
    number: '31',
    headshot: '/placeholder.svg?height=120&width=120',
    worldChampionships: '0',
    wins: '1',
    poles: '—',
    podiums: '3+',
    total_race_wins: 1,
    total_podiums: 3,
    total_points: 350,
    total_pole_positions: 0,
    dateOfBirth: '1996-09-17',
    placeOfBirth: 'Évreux, France',
    bio: `Resilient and opportunistic, capable of big results in chaotic races.`
  }
];

// === RENDER ===
function renderDrivers(list = drivers) {
  const grid = document.getElementById('driversGrid');
  if (!grid) return;

  if (!list.length) {
    grid.innerHTML = `<p class="empty-state">No drivers match the selected filters.</p>`;
    return;
  }

  grid.innerHTML = list.map(d => `
    <div class="card" onclick="openDriverModal('${d.id}')">
      <div class="logo-wrapper">
        <img class="logo" src="${d.headshot}" alt="${d.name} photo"/>
      </div>
      <div class="team-info">
        <div class="name">${d.name}</div>
        <div class="nation">${d.nationality} • #${d.number} • ${d.team}</div>
        <div class="stats">
          <div class="stat-item">
            <span class="stat-label">Titles</span>
            <span class="stat-value">${d.worldChampionships}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Wins</span>
            <span class="stat-value">${d.wins}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Poles</span>
            <span class="stat-value">${d.poles}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Podiums</span>
            <span class="stat-value">${d.podiums}</span>
          </div>
        </div>
      </div>
      <button class="btn">View Driver</button>
    </div>
  `).join('');
}

// === FILTER LOGIC ===
function getFilteredDrivers() {
  const nameInput = (document.getElementById('filterDriverName')?.value || '').toLowerCase().trim();
  const nationality = document.getElementById('filterDriverNationality')?.value || '';
  const team = document.getElementById('filterDriverTeam')?.value || '';
  const titlesMinRaw = document.getElementById('filterTitlesMin')?.value;
  const winsMinRaw = document.getElementById('filterWinsMin')?.value;
  const podiumsMinRaw = document.getElementById('filterPodiumsMin')?.value;
  const pointsMinRaw = document.getElementById('filterPointsMin')?.value;
  const polesMinRaw = document.getElementById('filterPolesMin')?.value;
  const birthPlaceInput = (document.getElementById('filterBirthPlace')?.value || '').toLowerCase().trim();
  const birthYearFromRaw = document.getElementById('filterBirthYearFrom')?.value;
  const birthYearToRaw = document.getElementById('filterBirthYearTo')?.value;

  const titlesMin = titlesMinRaw ? Number(titlesMinRaw) : null;
  const winsMin = winsMinRaw ? Number(winsMinRaw) : null;
  const podiumsMin = podiumsMinRaw ? Number(podiumsMinRaw) : null;
  const pointsMin = pointsMinRaw ? Number(pointsMinRaw) : null;
  const polesMin = polesMinRaw ? Number(polesMinRaw) : null;
  const birthYearFrom = birthYearFromRaw ? Number(birthYearFromRaw) : null;
  const birthYearTo = birthYearToRaw ? Number(birthYearToRaw) : null;

  return drivers.filter(d => {
    // Search (name + team)
    if (nameInput) {
      const haystack = (d.name + ' ' + d.team).toLowerCase();
      if (!haystack.includes(nameInput)) return false;
    }

    // Nationality
    if (nationality && d.nationality !== nationality) return false;

    // Team
    if (team && d.team !== team) return false;

    // Min world championships
    if (titlesMin !== null && !Number.isNaN(titlesMin)) {
      const titles = parseInt(d.worldChampionships, 10) || 0;
      if (titles < titlesMin) return false;
    }

    // Min wins
    if (winsMin !== null && !Number.isNaN(winsMin)) {
      if ((d.total_race_wins || 0) < winsMin) return false;
    }

    // Min podiums
    if (podiumsMin !== null && !Number.isNaN(podiumsMin)) {
      if ((d.total_podiums || 0) < podiumsMin) return false;
    }

    // Min points
    if (pointsMin !== null && !Number.isNaN(pointsMin)) {
      if ((d.total_points || 0) < pointsMin) return false;
    }

    // Min poles
    if (polesMin !== null && !Number.isNaN(polesMin)) {
      if ((d.total_pole_positions || 0) < polesMin) return false;
    }

    // Birthplace (text search)
    if (birthPlaceInput) {
      const place = (d.placeOfBirth || '').toLowerCase();
      if (!place.includes(birthPlaceInput)) return false;
    }

    // Birth year range
    if (birthYearFrom !== null || birthYearTo !== null) {
      const dob = d.dateOfBirth || d.dateOfBirth || d.date_of_birth;
      if (dob) {
        const year = Number(String(dob).slice(0, 4));
        if (birthYearFrom !== null && year < birthYearFrom) return false;
        if (birthYearTo !== null && year > birthYearTo) return false;
      }
    }

    return true;
  });
}

function setupDriverFilters() {
  const form = document.getElementById('driverFilters');
  const resetBtn = document.getElementById('resetDriverFilters');
  const natSelect = document.getElementById('filterDriverNationality');
  const teamSelect = document.getElementById('filterDriverTeam');

  // Dinamik nationality listesi
  if (natSelect) {
    const nats = Array.from(new Set(drivers.map(d => d.nationality))).sort();
    nats.forEach(n => {
      const opt = document.createElement('option');
      opt.value = n;
      opt.textContent = n;
      natSelect.appendChild(opt);
    });
  }

  // Dinamik team listesi
  if (teamSelect) {
    const teams = Array.from(new Set(drivers.map(d => d.team))).sort();
    teams.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      teamSelect.appendChild(opt);
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const filtered = getFilteredDrivers();
      renderDrivers(filtered);
    });
  }

  if (resetBtn && form) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      renderDrivers(drivers);
    });
  }
}

// === MODAL LOGIC ===
function openDriverModal(driverId) {
  const d = drivers.find(x => x.id === driverId);
  if (!d) return;

  document.getElementById('driverModalPhoto').src = d.headshot;
  document.getElementById('driverModalTitle').textContent = d.name;
  document.getElementById('driverModalSubtitle').textContent =
    `${d.nationality} • #${d.number} • ${d.team}`;

  document.getElementById('driverModalBody').innerHTML = `
    <div class="info-section">
      <div class="info-title">About</div>
      <div class="info-text">${d.bio}</div>
    </div>

    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-box-label">World Championships</div>
        <div class="stat-box-value">${d.worldChampionships}</div>
      </div>
      <div class="stat-box">
        <div class="stat-box-label">Wins</div>
        <div class="stat-box-value">${d.wins}</div>
      </div>
      <div class="stat-box">
        <div class="stat-box-label">Poles</div>
        <div class="stat-box-value">${d.poles}</div>
      </div>
      <div class="stat-box">
        <div class="stat-box-label">Podiums</div>
        <div class="stat-box-value">${d.podiums}</div>
      </div>
    </div>

    <div class="info-section">
      <div class="info-title">Driver Details</div>
      <div class="info-text">
        <strong>Date of Birth:</strong> ${d.dateOfBirth}<br>
        <strong>Place of Birth:</strong> ${d.placeOfBirth}<br>
        <strong>Team:</strong> ${d.team}<br>
        <strong>Nationality:</strong> ${d.nationality}<br>
        <strong>Number:</strong> ${d.number}
      </div>
    </div>
  `;

  document.getElementById('driverModal').classList.add('active');
}

function closeDriverModal() {
  document.getElementById('driverModal').classList.remove('active');
}

// Background click closes modal
document.getElementById('driverModal').addEventListener('click', (e) => {
  if (e.target.id === 'driverModal') {
    closeDriverModal();
  }
});

// Escape key closes modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDriverModal();
});

// === INIT ===
setupDriverFilters();
renderDrivers();
