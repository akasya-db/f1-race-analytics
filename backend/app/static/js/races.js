// global variables
let currentRaces = [];
let currentPage = 1;


async function fetchRaces(page = 1) {
  currentPage = page;

  // get values from HTML inputs
  const year = document.getElementById('filterYear')?.value || '';
  const round = document.getElementById('filterRound')?.value || '';
  const circuitId = document.getElementById('filterCircuit')?.value || '';
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
  if (circuitId) params.append('circuit_id', circuitId);
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
      // Reset the searchable circuit dropdown
      const circuitInput = document.getElementById('filterCircuitSearch');
      const circuitHidden = document.getElementById('filterCircuit');
      if (circuitInput) circuitInput.value = '';
      if (circuitInput) circuitInput.placeholder = 'All Circuits';
      if (circuitHidden) circuitHidden.value = '';
      fetchRaces(1);
    });
  }
}

// Circuit dropdown data storage
let allCircuits = [];

// Fetch and populate circuits dropdown
async function loadCircuits() {
  const wrapper = document.getElementById('circuitSelectWrapper');
  const dropdown = document.getElementById('circuitDropdown');
  const searchInput = document.getElementById('filterCircuitSearch');
  const hiddenInput = document.getElementById('filterCircuit');
  
  if (!wrapper || !dropdown || !searchInput || !hiddenInput) return;

  try {
    const response = await fetch('/api/circuits');
    if (!response.ok) throw new Error('Failed to fetch circuits');
    
    const data = await response.json();
    allCircuits = data.circuits;
    
    // Render initial dropdown options
    renderCircuitOptions(allCircuits);
    
    // Setup event listeners
    setupCircuitDropdown(wrapper, dropdown, searchInput, hiddenInput);
    
  } catch (error) {
    console.error('Error loading circuits:', error);
  }
}

function renderCircuitOptions(circuits) {
  const dropdown = document.getElementById('circuitDropdown');
  if (!dropdown) return;
  
  if (circuits.length === 0) {
    dropdown.innerHTML = '<div class="searchable-select-no-results">No circuits found</div>';
    return;
  }
  
  // Add "All Circuits" option first
  let html = '<div class="searchable-select-option" data-value="" data-name="All Circuits">All Circuits</div>';
  
  // Add circuit options
  html += circuits.map(circuit => {
    const displayName = `${circuit.full_name} (${circuit.country_name || circuit.place_name || 'Unknown'})`;
    return `<div class="searchable-select-option" data-value="${circuit.id}" data-name="${displayName}">${displayName}</div>`;
  }).join('');
  
  dropdown.innerHTML = html;
}

function setupCircuitDropdown(wrapper, dropdown, searchInput, hiddenInput) {
  // Toggle dropdown on input click
  searchInput.addEventListener('click', (e) => {
    e.stopPropagation();
    wrapper.classList.toggle('open');
  });
  
  // Filter options as user types
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    wrapper.classList.add('open');
    
    if (!searchTerm) {
      renderCircuitOptions(allCircuits);
    } else {
      const filtered = allCircuits.filter(circuit => {
        const name = circuit.full_name.toLowerCase();
        const country = (circuit.country_name || circuit.place_name || '').toLowerCase();
        return name.includes(searchTerm) || country.includes(searchTerm);
      });
      renderCircuitOptions(filtered);
    }
    
    // Re-attach click handlers to new options
    attachOptionHandlers(wrapper, dropdown, searchInput, hiddenInput);
  });
  
  // Handle keyboard navigation
  searchInput.addEventListener('keydown', (e) => {
    const options = dropdown.querySelectorAll('.searchable-select-option');
    const highlighted = dropdown.querySelector('.searchable-select-option.highlighted');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      wrapper.classList.add('open');
      if (!highlighted && options.length > 0) {
        options[0].classList.add('highlighted');
      } else if (highlighted && highlighted.nextElementSibling) {
        highlighted.classList.remove('highlighted');
        highlighted.nextElementSibling.classList.add('highlighted');
        highlighted.nextElementSibling.scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (highlighted && highlighted.previousElementSibling) {
        highlighted.classList.remove('highlighted');
        highlighted.previousElementSibling.classList.add('highlighted');
        highlighted.previousElementSibling.scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlighted) {
        selectCircuitOption(highlighted, searchInput, hiddenInput, wrapper);
      }
    } else if (e.key === 'Escape') {
      wrapper.classList.remove('open');
    }
  });
  
  // Attach click handlers to options
  attachOptionHandlers(wrapper, dropdown, searchInput, hiddenInput);
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      wrapper.classList.remove('open');
    }
  });
}

function attachOptionHandlers(wrapper, dropdown, searchInput, hiddenInput) {
  const options = dropdown.querySelectorAll('.searchable-select-option');
  options.forEach(option => {
    option.addEventListener('click', () => {
      selectCircuitOption(option, searchInput, hiddenInput, wrapper);
    });
  });
}

function selectCircuitOption(option, searchInput, hiddenInput, wrapper) {
  const value = option.dataset.value;
  const name = option.dataset.name;
  
  hiddenInput.value = value;
  searchInput.value = value ? name : '';
  searchInput.placeholder = value ? 'All Circuits' : 'All Circuits';
  
  // Update selected state
  wrapper.querySelectorAll('.searchable-select-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  option.classList.add('selected');
  
  wrapper.classList.remove('open');
  
  // Trigger filter
  fetchRaces(1);
}


// Note: Modal functionality removed. Cards now link to a dedicated page at /races/<id>

// Remove any remaining references to modal DOM elements in case they exist
document.getElementById('raceModal')?.remove?.();

// Başlat
window.addEventListener('DOMContentLoaded', () => {
  setupFilters();
  loadCircuits(); // Load circuits for dropdown

  if (window.flatpickr) {
    flatpickr('#filterDateFrom', { dateFormat: 'Y-m-d', allowInput: false });
    flatpickr('#filterDateTo', { dateFormat: 'Y-m-d', allowInput: false });
  }

  fetchRaces(); // İlk yükleme
});
