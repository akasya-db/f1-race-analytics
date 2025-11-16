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
    dateOfBirth: '1996-09-17',
    placeOfBirth: 'Évreux, France',
    bio: `Resilient and opportunistic, capable of big results in chaotic races.`
  }
];

// Render driver cards
function renderDrivers() {
  const grid = document.getElementById('driversGrid');
  grid.innerHTML = drivers.map(d => `
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

// Open modal with driver details
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

// Close modal helpers
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

// Init
renderDrivers();
