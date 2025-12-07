// global variables
let currentConstructors = [];
let currentPage = 1;

async function fetchConstructors(page = 1) {
    currentPage = page;
    // get values from HTML inputs
    const name = document.getElementById('filterName')?.value || '';
    const nationality = document.getElementById('filterNationality')?.value || '';
    const champsMin = document.getElementById('filterChampsMin')?.value || '';
    const totalPointsMin = document.getElementById('filterTotalPointsMin')?.value || '';
    const totalPointsMax = document.getElementById('filterTotalPointsMax')?.value || '';
    // create URL params
    const params = new URLSearchParams();
    params.append('page', page);
    if (name) params.append('name', name);
    if (nationality) params.append('nationality', nationality);
    if (champsMin) params.append('champs_min', champsMin);
    if (totalPointsMin) params.append('total_points_min', totalPointsMin);
    if (totalPointsMax) params.append('total_points_max', totalPointsMax)

    try {
        const response = await fetch(`/api/constructors?${params.toString()}`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        currentConstructors = data.constructors;

        renderConstructors(data.constructors);
        renderPagination(data.pagination);

    } catch (error) {
        console.error('Error fetching constructors:', error);
        document.getElementById('constructorsGrid').innerHTML = 
            `<p class="empty-state">Error loading data. Please try again later.</p>`;
    }
}

function renderConstructors(list) {
    const grid = document.getElementById('constructorsGrid');
    if (!grid) return;

    if (!list || list.length === 0) {
        grid.innerHTML = `<p class="empty-state">No constructors match the selected filters.</p>`;
        return;
    }

    grid.innerHTML = list.map(team => `
    <div class="card" onclick="openModal('${team.id}')">
        <div class="logo-wrapper">
            <img class="logo" src="${team.logo || '/static/img/placeholder.png'}" alt="${team.name} logo"/>
        </div>
        <div class="team-info">
            <div class="name">${team.name}</div>
            <div class="nation">${team.nationality}</div>
            <div class="stats">
                <div class="stat-item">
                    <span class="stat-label">Titles</span>
                    <span class="stat-value">${team.total_championship_wins}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Points</span>
                    <span class="stat-value">${team.total_points}</span>
                </div>
            </div>
        </div>
        <button class="btn">View Team</button>
    </div>
    `).join('');
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
        <button class="page-btn nav-btn" onclick="fetchConstructors(1)" ${prevDisabled}>
            &laquo; </button>
        <button class="page-btn nav-btn" onclick="fetchConstructors(${current_page - 1})" ${prevDisabled}>
            &lsaquo; </button>
    `;

    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="page-btn ${i === current_page ? 'active' : ''}" 
                onclick="fetchConstructors(${i})">
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
    const form = document.getElementById('constructorFilters');
    const resetBtn = document.getElementById('resetFilters');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            fetchConstructors();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            form.reset();
            fetchConstructors();
        });
    }
}

function openModal(teamId) {

    const team = currentConstructors.find(t => t.id == teamId); 
    if (!team) return;

    const modalLogo = document.getElementById('modalLogo');
    if(modalLogo) modalLogo.src = team.logo || '/static/img/placeholder.png';
    
    document.getElementById('modalTitle').textContent = team.name;
    document.getElementById('modalSubtitle').textContent = `${team.nationality} • Founded ${team.founded}`;

    document.getElementById('modalBody').innerHTML = `
    `;

    document.getElementById('teamModal').classList.add('active');
}

function closeModal() {
    document.getElementById('teamModal').classList.remove('active');
}

document.getElementById('teamModal').addEventListener('click', (e) => {
    if (e.target.id === 'teamModal') closeModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// initialize the page
document.addEventListener('DOMContentLoaded', () => {
    setupFilters();

    // load initial data
    fetchConstructors();
});