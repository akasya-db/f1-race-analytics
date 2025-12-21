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
    const typeValue = document.querySelector('input[name="filterType"]:checked')?.value || 'all';
    const aboveAvgChecked = document.getElementById('filterAboveAvg')?.checked || false;
    // create URL params
    const params = new URLSearchParams();
    params.append('page', page);
    if (name) params.append('name', name);
    if (nationality) params.append('nationality', nationality);
    if (champsMin) params.append('champs_min', champsMin);
    if (totalPointsMin) params.append('total_points_min', totalPointsMin);
    if (totalPointsMax) params.append('total_points_max', totalPointsMax)
    if (typeValue !== 'all') {
        params.append('type', typeValue);
    }
    if (aboveAvgChecked) {params.append('above_avg', 'true');}

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

// Pagination rendering
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

// Setup filter form submission and reset
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
            document.querySelector('input[name="filterType"][value="all"]').checked = true;
            fetchConstructors();
        });
    }
}

// Populate Nationality Filter Options
async function populateNationalityFilter() {
    const select = document.getElementById('filterNationality');
    if (!select) return;

    try {
        const response = await fetch('/api/constructor-countries');
        const countries = await response.json();

        // Clear existing dynamic options but keep "All"
        select.innerHTML = '<option value="">All</option>';

        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating nationality filter:', error);
    }
}

function openModal(teamId) {
    // Find the team in the current list using the ID
    const team = currentConstructors.find(t => t.id == teamId); 
    if (!team) return;

    const modal = document.getElementById('teamModal');
    modal.classList.add('active');

    // Set Header Information
    document.getElementById('modalTitle').textContent = team.name;
    document.getElementById('modalSubtitle').textContent = `${team.nationality} Team`;

    document.body.style.overflow = 'hidden';

    // Calculate and Display Average Comparison if available
    let averageSection = '';
    if (team.country_avg !== undefined && team.country_avg !== null) {
        const avg = parseFloat(team.country_avg);
        const teamPoints = parseFloat(team.total_points || 0);
        const diff = (teamPoints - avg).toFixed(1);
        const isAbove = teamPoints >= avg;
        
        averageSection = `
            <div class="stat-card insight-card" style="grid-column: span 2; border-left: 4px solid ${isAbove ? '#00e08d' : '#ff1e15'}; margin-top: 10px;">
                <div class="stat-icon">
                    <span style="color: ${isAbove ? '#00e08d' : '#ff1e15'}">${isAbove ? '▲' : '▼'}</span>
                </div>
                <div class="stat-content">
                    <span class="stat-label">vs. National Average (${team.nationality})</span>
                    <span class="stat-value" style="color: ${isAbove ? '#00e08d' : '#ff1e15'}">
                        ${isAbove ? '+' : ''}${diff} Points ${isAbove ? 'Ahead' : 'Behind'}
                    </span>
                    <small style="color: var(--f1-grey); display: block; margin-top: 4px;">
                        Country Mean: ${avg.toFixed(1)}
                    </small>
                </div>
            </div>
        `;
    }

    // Fill the Modal Body with Stats from the Schema
    document.getElementById('modalBody').innerHTML = `
        <div class="modal-stats-grid">
            <div class="modal-stat-card">
                <span class="label">World Championships</span>
                <span class="value">${team.total_championship_wins}</span>
            </div>
            <div class="modal-stat-card">
                <span class="label">Total Points</span>
                <span class="value">${parseFloat(team.total_points).toLocaleString()}</span>
            </div>
            <div class="modal-stat-card">
                <span class="label">Podiums</span>
                <span class="value">${team.total_podiums}</span>
            </div>
            <div class="modal-stat-card">
                <span class="label">Pole Positions</span>
                <span class="value">${team.total_pole_positions}</span>
            </div>
            <div class="modal-stat-card">
                <span class="label">Race Starts</span>
                <span class="value">${team.total_race_starts}</span>
            </div>
            <div class="modal-stat-card">
                <span class="label">Best Finish</span>
                <span class="value">${team.best_championship_position || '-'}</span>
            </div>
        </div>

        ${averageSection}
        
        <div class="modal-footer-info">
            <span class="badge ${team.is_real ? 'real-badge' : 'user-badge'}">
                ${team.is_real ? 'Official F1 Team' : 'User Created Team'}
            </span>
        </div>
    `;

    document.getElementById('teamModal').classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('teamModal');
    modal.classList.remove('active');
    
    // Re-enable scrolling
    document.body.style.overflow = 'auto'; 
}

async function openTrackStatsModal() {
    const modal = document.getElementById('trackStatsModal');
    const body = document.getElementById('trackStatsBody');
    
    // Open modal and show loading state
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    body.innerHTML = '<div style="text-align:center; padding:40px; color:#a9bdd1;">Loading complex query results...</div>';

    try {
        const response = await fetch('/api/stats/track-performance');
        const data = await response.json();

        // Create table HTML
        let tableHTML = `
            <table class="stats-table" style="width:100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th style="text-align:left">Constructor</th>
                        <th>Nationality</th>
                        <th>Races</th>
                        <th>Street Points</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach(row => {
            tableHTML += `
                <tr>
                    <td class="col-number" style="text-align:center; color: var(--f1-yellow); font-weight:800;">#${row.rank_position}</td>
                    <td style="font-weight:700;">${row.constructor_name}</td>
                    <td style="color:var(--f1-grey); text-align:center;">${row.nationality}</td>
                    <td style="text-align:center;">${row.total_races}</td>
                    <td class="col-number" style="text-align:center; color: var(--f1-red);">${row.total_points}</td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        
        // Insert table into modal body
        body.innerHTML = tableHTML;

    } catch (error) {
        console.error('Error:', error);
        body.innerHTML = '<p style="color:red; text-align:center;">Failed to load analysis report.</p>';
    }
}

function closeTrackStatsModal() {
    const modal = document.getElementById('trackStatsModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

async function openActivityModal() {
    const modal = document.getElementById('activityModal');
    const body = document.getElementById('activityBody');
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    body.innerHTML = '<div style="text-align:center; padding:40px;">Checking database integrity...</div>';

    try {
        const response = await fetch('/api/stats/activity-audit');
        const data = await response.json();

        let tableHTML = `
            <table class="stats-table" style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="text-align:left">Constructor</th>
                        <th>Nationality</th>
                        <th>Total Entries</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach(row => {
            // Determine if the constructor is inactive
            const isInactive = row.total_race_entries === 0;
            const rowStyle = isInactive ? 'opacity: 0.7;' : '';
            const statusBadge = isInactive 
                ? '<span class="badge" style="background:rgba(255,255,255,0.1); color:#ccc;">Never Raced</span>'
                : '<span class="badge" style="background:var(--f1-green); color:#000;">Active</span>';

            tableHTML += `
                <tr style="${rowStyle}">
                    <td style="font-weight:700;">${row.constructor_name}</td>
                    <td style="color:var(--f1-grey); text-align:center;">${row.nationality}</td>
                    <td style="text-align:center; font-weight:bold;">${row.total_race_entries}</td>
                    <td style="text-align:center;">${statusBadge}</td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        body.innerHTML = tableHTML;

    } catch (error) {
        console.error('Error:', error);
        body.innerHTML = '<p style="color:red; text-align:center;">Failed to load audit.</p>';
    }
}

function closeActivityModal() {
    document.getElementById('activityModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Initialize the page and setup event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load initial data
    setupFilters();
    populateNationalityFilter();
    fetchConstructors();

    // Track Stats Modal
    const trackModal = document.getElementById('trackStatsModal');
    if (trackModal) {
        trackModal.addEventListener('click', (e) => {
            // Close modal if clicking outside content
            if (e.target === trackModal) {
                closeTrackStatsModal();
            }
        });
    }

    // 3. Activity Audit Modal (Outer Join)
    const activityModal = document.getElementById('activityModal');
    if (activityModal) {
        activityModal.addEventListener('click', (e) => {
            if (e.target === activityModal) {
                closeActivityModal();
            }
        });
    }

    // 4. Team Detail Modal
    const teamModal = document.getElementById('teamModal');
    if (teamModal) {
        teamModal.addEventListener('click', (e) => {
            if (e.target === teamModal) {
                closeModal(); 
            }
        });
    }
});