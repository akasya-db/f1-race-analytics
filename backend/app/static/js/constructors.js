// Constructor data
const constructors = [
    {
    id: 'red-bull',
    name: 'Red Bull Racing',
    nationality: 'Austria',
    logo: '/placeholder.svg?height=100&width=100',
    founded: '2005',
    base: 'Milton Keynes, United Kingdom',
    championships: '6',
    polePositions: '91',
    wins: '117',
    description: 'Red Bull Racing has dominated modern F1 with their innovative designs and exceptional driver lineup. Known for their aggressive racing style and cutting-edge aerodynamics, they\'ve set new standards in the sport.',
    teamPrincipal: 'Christian Horner',
    chassis: 'RB20',
    powerUnit: 'Red Bull Powertrains'
    },
    {
    id: 'ferrari',
    name: 'Scuderia Ferrari',
    nationality: 'Italy',
    logo: '/placeholder.svg?height=100&width=100',
    founded: '1950',
    base: 'Maranello, Italy',
    championships: '16',
    polePositions: '249',
    wins: '246',
    description: 'The most successful and iconic team in F1 history. Ferrari\'s passion, heritage, and the famous Prancing Horse represent the pinnacle of motorsport excellence and Italian racing spirit.',
    teamPrincipal: 'Fred Vasseur',
    chassis: 'SF-24',
    powerUnit: 'Ferrari'
    },
    {
    id: 'mercedes',
    name: 'Mercedes-AMG Petronas',
    nationality: 'Germany',
    logo: '/placeholder.svg?height=100&width=100',
    founded: '2010',
    base: 'Brackley, United Kingdom',
    championships: '8',
    polePositions: '138',
    wins: '125',
    description: 'Mercedes dominated the hybrid era with unprecedented consistency and engineering excellence. Their Silver Arrows have set records for consecutive championships and race wins.',
    teamPrincipal: 'Toto Wolff',
    chassis: 'W15',
    powerUnit: 'Mercedes'
    },
    {
    id: 'mclaren',
    name: 'McLaren Racing',
    nationality: 'United Kingdom',
    logo: '/placeholder.svg?height=100&width=100',
    founded: '1966',
    base: 'Woking, United Kingdom',
    championships: '8',
    polePositions: '156',
    wins: '183',
    description: 'A legendary British team with a rich history of innovation and success. McLaren combines cutting-edge technology with racing heritage, always pushing the boundaries of performance.',
    teamPrincipal: 'Andrea Stella',
    chassis: 'MCL38',
    powerUnit: 'Mercedes'
    },
    {
    id: 'aston-martin',
    name: 'Aston Martin Aramco',
    nationality: 'United Kingdom',
    logo: '/placeholder.svg?height=100&width=100',
    founded: '2021',
    base: 'Silverstone, United Kingdom',
    championships: '0',
    polePositions: '1',
    wins: '0',
    description: 'The ambitious British team backed by Lawrence Stroll, combining luxury automotive heritage with F1 racing. Their new factory and wind tunnel signal serious championship intentions.',
    teamPrincipal: 'Mike Krack',
    chassis: 'AMR24',
    powerUnit: 'Mercedes'
    },
    {
    id: 'alpine',
    name: 'BWT Alpine F1 Team',
    nationality: 'France',
    logo: '/placeholder.svg?height=100&width=100',
    founded: '2021',
    base: 'Enstone, United Kingdom',
    championships: '2',
    polePositions: '20',
    wins: '21',
    description: 'The French manufacturer team carrying the legacy of Renault F1. Alpine brings French flair and engineering prowess to the grid, constantly developing and improving.',
    teamPrincipal: 'Bruno Famin',
    chassis: 'A524',
    powerUnit: 'Renault'
    },
    {
    id: 'williams',
    name: 'Williams Racing',
    nationality: 'United Kingdom',
    logo: '/placeholder.svg?height=100&width=100',
    founded: '1977',
    base: 'Grove, United Kingdom',
    championships: '9',
    polePositions: '128',
    wins: '114',
    description: 'One of F1\'s most successful and respected teams. Williams\' independent spirit and engineering excellence have produced some of the sport\'s most iconic cars and champions.',
    teamPrincipal: 'James Vowles',
    chassis: 'FW46',
    powerUnit: 'Mercedes'
    },
    {
    id: 'haas',
    name: 'MoneyGram Haas F1 Team',
    nationality: 'United States',
    logo: '/placeholder.svg?height=100&width=100',
    founded: '2016',
    base: 'Kannapolis, United States',
    championships: '0',
    polePositions: '1',
    wins: '0',
    description: 'America\'s F1 team, bringing a unique transatlantic approach to Formula 1. Haas combines American racing spirit with European technical expertise.',
    teamPrincipal: 'Ayao Komatsu',
    chassis: 'VF-24',
    powerUnit: 'Ferrari'
    },
    {
    id: 'rb',
    name: 'Visa Cash App RB',
    nationality: 'Italy',
    logo: '/placeholder.svg?height=100&width=100',
    founded: '2006',
    base: 'Faenza, Italy',
    championships: '0',
    polePositions: '1',
    wins: '2',
    description: 'Red Bull\'s junior team, nurturing the next generation of F1 talent. Based in Italy, they combine Italian passion with Red Bull\'s racing expertise.',
    teamPrincipal: 'Laurent Mekies',
    chassis: 'VCARB 01',
    powerUnit: 'Red Bull Powertrains'
    },
    {
    id: 'sauber',
    name: 'Stake F1 Team Kick Sauber',
    nationality: 'Switzerland',
    logo: '/placeholder.svg?height=100&width=100',
    founded: '1993',
    base: 'Hinwil, Switzerland',
    championships: '0',
    polePositions: '1',
    wins: '1',
    description: 'The Swiss team transitioning to become Audi\'s works team in 2026. A storied history of developing young talent and consistent midfield performances.',
    teamPrincipal: 'Alessandro Alunni Bravi',
    chassis: 'C44',
    powerUnit: 'Ferrari'
    }
];

// Render constructor cards
function renderConstructors(list = constructors) {
    const grid = document.getElementById('constructorsGrid');
    if (!grid) return;

    if (!list.length) {
        grid.innerHTML = `<p class="empty-state">No constructors match the selected filters.</p>`;
        return;
    }
    grid.innerHTML = list.map(team => `
    <div class="card" onclick="openModal('${team.id}')">
        <div class="logo-wrapper">
        <img class="logo" src="${team.logo}" alt="${team.name} logo"/>
        </div>
        <div class="team-info">
        <div class="name">${team.name}</div>
        <div class="nation">${team.nationality}</div>
        <div class="stats">
            <div class="stat-item">
            <span class="stat-label">Titles</span>
            <span class="stat-value">${team.championships}</span>
            </div>
            <div class="stat-item">
            <span class="stat-label">Wins</span>
            <span class="stat-value">${team.wins}</span>
            </div>
        </div>
        </div>
        <button class="btn">View Team</button>
    </div>
    `).join('');
}

function getFilteredConstructors() {
    const name = (document.getElementById('filterName')?.value || '').toLowerCase();
    const nationality = document.getElementById('filterNationality')?.value || '';
    const champsMin = document.getElementById('filterChampsMin')?.value;
    const powerUnit = document.getElementById('filterPowerUnit')?.value || '';

    return constructors.filter(team => {
        if (name && !team.name.toLowerCase().includes(name)) return false;
        if (nationality && team.nationality !== nationality) return false;
        if (champsMin && Number(team.championships) < Number(champsMin)) return false;
        if (powerUnit && team.powerUnit !== powerUnit) return false;
        return true;
    });
}

// Setup form event listeners
function setupFilters() {
    const form = document.getElementById('constructorFilters');
    const resetBtn = document.getElementById('resetFilters');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const filtered = getFilteredConstructors();
            renderConstructors(filtered);
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            form.reset();
            renderConstructors();
        });
    }
}

// Open modal with team details
function openModal(teamId) {
    const team = constructors.find(t => t.id === teamId);
    if (!team) return;

    document.getElementById('modalLogo').src = team.logo;
    document.getElementById('modalTitle').textContent = team.name;
    document.getElementById('modalSubtitle').textContent = `${team.nationality} • Founded ${team.founded}`;

    document.getElementById('modalBody').innerHTML = `
    <div class="info-section">
        <div class="info-title">About</div>
        <div class="info-text">${team.description}</div>
    </div>

    <div class="stats-grid">
        <div class="stat-box">
        <div class="stat-box-label">Championships</div>
        <div class="stat-box-value">${team.championships}</div>
        </div>
        <div class="stat-box">
        <div class="stat-box-label">Race Wins</div>
        <div class="stat-box-value">${team.wins}</div>
        </div>
        <div class="stat-box">
        <div class="stat-box-label">Pole Positions</div>
        <div class="stat-box-value">${team.polePositions}</div>
        </div>
    </div>

    <div class="info-section">
        <div class="info-title">Team Details</div>
        <div class="info-text">
        <strong>Base:</strong> ${team.base}<br>
        <strong>Team Principal:</strong> ${team.teamPrincipal}<br>
        <strong>Current Chassis:</strong> ${team.chassis}<br>
        <strong>Power Unit:</strong> ${team.powerUnit}
        </div>
    </div>
    `;

    document.getElementById('teamModal').classList.add('active');
}

// Close modal
function closeModal() {
    document.getElementById('teamModal').classList.remove('active');
}

// Close modal on background click
document.getElementById('teamModal').addEventListener('click', (e) => {
    if (e.target.id === 'teamModal') {
    closeModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
    closeModal();
    }
});

// Initialize

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

  renderConstructors();
});


