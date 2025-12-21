/**
 * Compare Data Page - Cascading Selection Logic
 * 
 * Flow:
 * 1. User selects a circuit (shared between both sides)
 * 2. On each side: Year input appears
 * 3. After valid year (race exists): Constructor dropdown appears
 * 4. After constructor selected: Driver dropdown appears
 */

document.addEventListener('DOMContentLoaded', function() {
    // State for both sides
    const state = {
        circuit: { id: null, name: null },
        left: { raceId: null, year: null, constructorId: null, constructorName: null, driverId: null, driverName: null },
        right: { raceId: null, year: null, constructorId: null, constructorName: null, driverId: null, driverName: null }
    };

    // Cache for circuits and constructors
    let circuitsCache = [];

    // ============================================
    // Initialize
    // ============================================
    loadCircuits();
    setupCircuitDropdown();
    setupSide('left');
    setupSide('right');

    // ============================================
    // Circuit Selection (Shared)
    // ============================================
    async function loadCircuits() {
        const dropdown = document.getElementById('circuit-dropdown');
        dropdown.innerHTML = '<div class="dropdown-item no-results">Loading circuits...</div>';
        
        try {
            const response = await fetch('/api/circuits');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Circuits API response:', data);
            
            // Handle both formats: {success: true, circuits: [...]} or just {circuits: [...]}
            const circuits = data.circuits || [];
            if (circuits.length > 0) {
                circuitsCache = circuits;
                console.log('Loaded circuits:', circuitsCache.length);
                renderCircuitDropdown(circuitsCache);
            } else {
                console.error('No circuits found or API error:', data.error);
                dropdown.innerHTML = '<div class="dropdown-item no-results">No circuits available</div>';
            }
        } catch (error) {
            console.error('Failed to load circuits:', error);
            console.error('Error details:', error.message, error.stack);
            dropdown.innerHTML = `<div class="dropdown-item no-results">Error: ${error.message}</div>`;
        }
    }

    function setupCircuitDropdown() {
        const searchInput = document.getElementById('circuit-search');
        const dropdown = document.getElementById('circuit-dropdown');
        const hiddenInput = document.getElementById('circuit-select');

        searchInput.addEventListener('focus', () => {
            dropdown.classList.add('open');
            // If circuits haven't loaded yet, try again
            if (circuitsCache.length === 0) {
                loadCircuits();
            }
        });

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (circuitsCache.length === 0) {
                dropdown.innerHTML = '<div class="dropdown-item no-results">Loading...</div>';
                dropdown.classList.add('open');
                return;
            }
            
            let filtered;
            if (query === '') {
                filtered = circuitsCache;
            } else {
                filtered = circuitsCache.filter(c => 
                    c.full_name.toLowerCase().includes(query) ||
                    c.country_name.toLowerCase().includes(query)
                );
            }
            renderCircuitDropdown(filtered);
            dropdown.classList.add('open');
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.searchable-dropdown')) {
                dropdown.classList.remove('open');
            }
        });
    }

    function renderCircuitDropdown(circuits) {
        const dropdown = document.getElementById('circuit-dropdown');
        
        if (circuits.length === 0) {
            dropdown.innerHTML = '<div class="dropdown-item no-results">No circuits found</div>';
            return;
        }

        dropdown.innerHTML = circuits.map(c => `
            <div class="dropdown-item" data-id="${c.id}" data-name="${c.full_name} (${c.country_name})">
                <div class="item-name">${c.full_name} (${c.country_name})</div>
            </div>
        `).join('');

        // Add click handlers
        dropdown.querySelectorAll('.dropdown-item:not(.no-results)').forEach(item => {
            item.addEventListener('click', () => selectCircuit(item));
        });
    }

    function selectCircuit(item) {
        const id = item.dataset.id;
        const name = item.dataset.name;
        
        state.circuit = { id, name };
        
        document.getElementById('circuit-search').value = name;
        document.getElementById('circuit-select').value = id;
        document.getElementById('circuit-dropdown').classList.remove('open');

        // Reset both sides when circuit changes
        resetSide('left');
        resetSide('right');

        // Show year inputs on both sides
        document.getElementById('year-group-left').classList.add('visible');
        document.getElementById('year-group-right').classList.add('visible');
    }

    // ============================================
    // Side Setup (Left/Right)
    // ============================================
    function setupSide(side) {
        const yearInput = document.getElementById(`year-${side}`);
        const constructorSearch = document.getElementById(`constructor-search-${side}`);
        const constructorDropdown = document.getElementById(`constructor-dropdown-${side}`);
        const driverSelect = document.getElementById(`driver-${side}`);

        // Year input - debounced validation
        let yearTimeout;
        yearInput.addEventListener('input', (e) => {
            clearTimeout(yearTimeout);
            const year = e.target.value;
            
            // Hide subsequent fields when year changes
            hideField(`constructor-group-${side}`);
            hideField(`driver-group-${side}`);
            hideElement(`race-info-${side}`);
            hideElement(`error-${side}`);
            hideElement(`summary-${side}`);
            
            state[side].raceId = null;
            state[side].constructorId = null;
            state[side].driverId = null;
            
            if (year.length === 4) {
                yearTimeout = setTimeout(() => validateYear(side, year), 300);
            }
            
            updateCompareButton();
        });

        // Constructor searchable dropdown
        constructorSearch.addEventListener('focus', () => {
            constructorDropdown.classList.add('open');
        });

        constructorSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            filterConstructors(side, query);
            constructorDropdown.classList.add('open');
            
            // Reset driver when constructor search changes
            hideField(`driver-group-${side}`);
            state[side].constructorId = null;
            state[side].driverId = null;
            updateCompareButton();
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest(`#constructor-group-${side}`)) {
                constructorDropdown.classList.remove('open');
            }
        });

        // Driver select
        driverSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            state[side].driverId = e.target.value;
            state[side].driverName = selectedOption.text;
            
            if (state[side].driverId) {
                updateSummary(side);
                showElement(`summary-${side}`);
            } else {
                hideElement(`summary-${side}`);
            }
            
            updateCompareButton();
        });
    }

    async function validateYear(side, year) {
        if (!state.circuit.id) {
            showError(side, 'Please select a circuit first');
            return;
        }

        try {
            const response = await fetch(`/api/validate-race?circuit_id=${state.circuit.id}&year=${year}`);
            const data = await response.json();

            if (data.success && data.race) {
                state[side].raceId = data.race.id;
                state[side].year = year;
                
                // Show race info
                document.getElementById(`race-name-${side}`).textContent = data.race.official_name;
                document.getElementById(`race-details-${side}`).textContent = `${data.race.date} • ${data.race.laps} laps`;
                showElement(`race-info-${side}`);
                hideElement(`error-${side}`);
                
                // Load constructors and show field
                await loadConstructors(side, data.race.id);
                showField(`constructor-group-${side}`);
            } else {
                showError(side, `No race found at ${state.circuit.name} in ${year}`);
                hideElement(`race-info-${side}`);
            }
        } catch (error) {
            showError(side, 'Failed to validate race');
            console.error(error);
        }
    }

    let constructorsCache = { left: [], right: [] };

    async function loadConstructors(side, raceId) {
        try {
            const response = await fetch(`/api/constructors-by-race?race_id=${raceId}`);
            const data = await response.json();
            
            if (data.success) {
                constructorsCache[side] = data.constructors;
                renderConstructorDropdown(side, data.constructors);
            }
        } catch (error) {
            console.error('Failed to load constructors:', error);
        }
    }

    function renderConstructorDropdown(side, constructors) {
        const dropdown = document.getElementById(`constructor-dropdown-${side}`);
        
        if (constructors.length === 0) {
            dropdown.innerHTML = '<div class="dropdown-item no-results">No constructors found</div>';
            return;
        }

        dropdown.innerHTML = constructors.map(c => `
            <div class="dropdown-item" data-id="${c.id}" data-name="${c.name}">
                <div class="item-name">${c.name}</div>
                <div class="item-detail">${c.full_name}</div>
            </div>
        `).join('');

        // Add click handlers
        dropdown.querySelectorAll('.dropdown-item:not(.no-results)').forEach(item => {
            item.addEventListener('click', () => selectConstructor(side, item));
        });
    }

    function filterConstructors(side, query) {
        const filtered = constructorsCache[side].filter(c => 
            c.name.toLowerCase().includes(query) || 
            c.full_name.toLowerCase().includes(query)
        );
        renderConstructorDropdown(side, filtered);
    }

    async function selectConstructor(side, item) {
        const id = item.dataset.id;
        const name = item.dataset.name;
        
        state[side].constructorId = id;
        state[side].constructorName = name;
        
        document.getElementById(`constructor-search-${side}`).value = name;
        document.getElementById(`constructor-${side}`).value = id;
        document.getElementById(`constructor-dropdown-${side}`).classList.remove('open');

        // Reset driver
        state[side].driverId = null;
        state[side].driverName = null;
        hideElement(`summary-${side}`);

        // Load drivers
        await loadDrivers(side, state[side].raceId, id);
        showField(`driver-group-${side}`);
        
        updateCompareButton();
    }

    async function loadDrivers(side, raceId, constructorId) {
        try {
            const response = await fetch(`/api/drivers-by-race-constructor?race_id=${raceId}&constructor_id=${constructorId}`);
            const data = await response.json();
            
            if (data.success) {
                const select = document.getElementById(`driver-${side}`);
                select.innerHTML = '<option value="">Select a driver</option>';
                
                data.drivers.forEach(d => {
                    const option = document.createElement('option');
                    option.value = d.id;
                    option.textContent = `${d.name} (${d.abbreviation || 'N/A'})`;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load drivers:', error);
        }
    }

    // ============================================
    // Helper Functions
    // ============================================
    function resetSide(side) {
        state[side] = { raceId: null, year: null, constructorId: null, constructorName: null, driverId: null, driverName: null };
        
        document.getElementById(`year-${side}`).value = '';
        document.getElementById(`constructor-search-${side}`).value = '';
        document.getElementById(`constructor-${side}`).value = '';
        document.getElementById(`driver-${side}`).selectedIndex = 0;
        
        hideField(`year-group-${side}`);
        hideField(`constructor-group-${side}`);
        hideField(`driver-group-${side}`);
        hideElement(`race-info-${side}`);
        hideElement(`error-${side}`);
        hideElement(`summary-${side}`);
        
        updateCompareButton();
    }

    function showField(id) {
        document.getElementById(id).classList.add('visible');
    }

    function hideField(id) {
        document.getElementById(id).classList.remove('visible');
    }

    function showElement(id) {
        document.getElementById(id).classList.add('visible');
    }

    function hideElement(id) {
        document.getElementById(id).classList.remove('visible');
    }

    function showError(side, message) {
        const errorEl = document.getElementById(`error-${side}`);
        errorEl.textContent = message;
        errorEl.classList.add('visible');
    }

    function updateSummary(side) {
        document.getElementById(`summary-year-${side}`).textContent = state[side].year || '-';
        document.getElementById(`summary-constructor-${side}`).textContent = state[side].constructorName || '-';
        document.getElementById(`summary-driver-${side}`).textContent = state[side].driverName || '-';
    }

    function updateCompareButton() {
        const btn = document.getElementById('compare-btn');
        const leftReady = state.left.driverId && state.left.raceId;
        const rightReady = state.right.driverId && state.right.raceId;
        
        if (leftReady && rightReady) {
            btn.classList.add('ready');
        } else {
            btn.classList.remove('ready');
        }
    }

    // Compare button click handler
    document.getElementById('compare-btn').addEventListener('click', async () => {
        const btn = document.getElementById('compare-btn');
        if (!btn.classList.contains('ready')) {
            return;
        }
        
        console.log('Comparing drivers:', {
            circuit: state.circuit,
            left: state.left,
            right: state.right
        });
        
        // Show loading state
        btn.classList.add('loading');
        btn.textContent = 'Comparing';
        
        try {
            const response = await fetch('/api/compare-drivers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    circuit_id: state.circuit.id,
                    driver_1_id: state.left.driverId,
                    race_1_id: state.left.raceId,
                    driver_2_id: state.right.driverId,
                    race_2_id: state.right.raceId
                })
            });
            
            const data = await response.json();
            console.log('Comparison results:', data);
            
            if (data.success) {
                displayResults(data.comparison);
            } else {
                showComparisonError(data.error || 'Failed to compare drivers');
            }
        } catch (error) {
            console.error('Comparison error:', error);
            showComparisonError(`An error occurred: ${error.message}`);
        } finally {
            btn.classList.remove('loading');
            btn.textContent = 'Compare Drivers';
        }
    });

    // ============================================
    // Display Comparison Results
    // ============================================
    function displayResults(data) {
        const resultsContainer = document.getElementById('comparison-results');
        
        // Populate circuit header
        if (data.circuit) {
            document.getElementById('result-circuit-name').textContent = data.circuit.name || 'Circuit';
            const details = [
                data.circuit.location,
                data.circuit.country,
                data.circuit.length ? `${data.circuit.length}km` : null,
                data.circuit.turns ? `${data.circuit.turns} turns` : null
            ].filter(Boolean).join(' • ');
            document.getElementById('result-circuit-details').textContent = details;
        }
        
        // Populate Driver 1 (left)
        populateDriverResults('d1', data.driver_1, 'left');
        
        // Populate Driver 2 (right)
        populateDriverResults('d2', data.driver_2, 'right');
        
        // Highlight better stats
        highlightWinners(data.driver_1, data.driver_2);
        
        // Show results
        resultsContainer.style.display = 'block';
        
        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function populateDriverResults(prefix, driverData, side) {
        if (!driverData) return;
        
        const info = driverData.info || {};
        const race = driverData.race_performance || {};
        const circuit = driverData.circuit_history || {};
        const season = driverData.season_stats || {};
        
        // Driver header
        document.getElementById(`result-${prefix}-number`).textContent = info.number || '#';
        document.getElementById(`result-${prefix}-name`).textContent = info.name || 'Unknown Driver';
        document.getElementById(`result-${prefix}-details`).textContent = 
            [info.nationality, info.constructor].filter(Boolean).join(' • ') || '-';
        
        // Race performance
        document.getElementById(`result-${prefix}-year`).textContent = race.year || '-';
        document.getElementById(`result-${prefix}-finish`).textContent = formatPosition(race.finish_position);
        document.getElementById(`result-${prefix}-grid`).textContent = formatPosition(race.grid_position);
        document.getElementById(`result-${prefix}-quali`).textContent = formatPosition(race.qualifying_position);
        document.getElementById(`result-${prefix}-points`).textContent = formatNumber(race.points);
        document.getElementById(`result-${prefix}-gained`).textContent = formatGained(race.positions_gained);
        document.getElementById(`result-${prefix}-pole`).textContent = race.pole ? '✓' : '-';
        
        // Circuit history
        document.getElementById(`result-${prefix}-circuit-races`).textContent = formatNumber(circuit.total_races);
        document.getElementById(`result-${prefix}-circuit-wins`).textContent = formatNumber(circuit.wins);
        document.getElementById(`result-${prefix}-circuit-podiums`).textContent = formatNumber(circuit.podiums);
        document.getElementById(`result-${prefix}-circuit-poles`).textContent = formatNumber(circuit.poles);
        document.getElementById(`result-${prefix}-circuit-avg-finish`).textContent = formatDecimal(circuit.avg_finish);
        document.getElementById(`result-${prefix}-circuit-best`).textContent = formatPosition(circuit.best_finish);
        document.getElementById(`result-${prefix}-circuit-avg-points`).textContent = formatDecimal(circuit.avg_points);
        document.getElementById(`result-${prefix}-circuit-total-points`).textContent = formatNumber(circuit.total_points);
        
        // Season stats
        document.getElementById(`result-${prefix}-season-pos`).textContent = formatPosition(season.championship_position);
        document.getElementById(`result-${prefix}-season-points`).textContent = formatNumber(season.season_points);
        document.getElementById(`result-${prefix}-season-wins`).textContent = formatNumber(season.season_wins);
        document.getElementById(`result-${prefix}-season-podiums`).textContent = formatNumber(season.season_podiums);
    }

    function formatPosition(val) {
        if (val === null || val === undefined) return '-';
        return `P${val}`;
    }

    function formatNumber(val) {
        if (val === null || val === undefined) return '-';
        return val.toString();
    }

    function formatDecimal(val) {
        if (val === null || val === undefined) return '-';
        return parseFloat(val).toFixed(1);
    }

    function formatGained(val) {
        if (val === null || val === undefined) return '-';
        const num = parseInt(val);
        if (num > 0) return `+${num}`;
        if (num < 0) return num.toString();
        return '0';
    }

    function highlightWinners(driver1, driver2) {
        // Compare key metrics and highlight the better one
        const comparisons = [
            // Race performance - lower is better for positions
            { d1: 'result-d1-finish', d2: 'result-d2-finish', 
              v1: driver1?.race_performance?.finish_position, 
              v2: driver2?.race_performance?.finish_position, 
              lowerBetter: true },
            { d1: 'result-d1-grid', d2: 'result-d2-grid', 
              v1: driver1?.race_performance?.grid_position, 
              v2: driver2?.race_performance?.grid_position, 
              lowerBetter: true },
            { d1: 'result-d1-points', d2: 'result-d2-points', 
              v1: driver1?.race_performance?.points, 
              v2: driver2?.race_performance?.points, 
              lowerBetter: false },
            
            // Circuit history - higher is better
            { d1: 'result-d1-circuit-wins', d2: 'result-d2-circuit-wins', 
              v1: driver1?.circuit_history?.wins, 
              v2: driver2?.circuit_history?.wins, 
              lowerBetter: false },
            { d1: 'result-d1-circuit-podiums', d2: 'result-d2-circuit-podiums', 
              v1: driver1?.circuit_history?.podiums, 
              v2: driver2?.circuit_history?.podiums, 
              lowerBetter: false },
            { d1: 'result-d1-circuit-avg-finish', d2: 'result-d2-circuit-avg-finish', 
              v1: driver1?.circuit_history?.avg_finish, 
              v2: driver2?.circuit_history?.avg_finish, 
              lowerBetter: true },
            
            // Season stats
            { d1: 'result-d1-season-pos', d2: 'result-d2-season-pos', 
              v1: driver1?.season_stats?.championship_position, 
              v2: driver2?.season_stats?.championship_position, 
              lowerBetter: true },
            { d1: 'result-d1-season-points', d2: 'result-d2-season-points', 
              v1: driver1?.season_stats?.season_points, 
              v2: driver2?.season_stats?.season_points, 
              lowerBetter: false }
        ];

        comparisons.forEach(({ d1, d2, v1, v2, lowerBetter }) => {
            const el1 = document.getElementById(d1)?.closest('.stat-item');
            const el2 = document.getElementById(d2)?.closest('.stat-item');
            
            if (!el1 || !el2) return;
            
            // Remove existing winner class
            el1.classList.remove('winner');
            el2.classList.remove('winner');
            
            if (v1 === null || v1 === undefined || v2 === null || v2 === undefined) return;
            
            const n1 = parseFloat(v1);
            const n2 = parseFloat(v2);
            
            if (isNaN(n1) || isNaN(n2)) return;
            
            if (lowerBetter) {
                if (n1 < n2) el1.classList.add('winner');
                else if (n2 < n1) el2.classList.add('winner');
            } else {
                if (n1 > n2) el1.classList.add('winner');
                else if (n2 > n1) el2.classList.add('winner');
            }
        });
    }

    function showComparisonError(message) {
        const resultsContainer = document.getElementById('comparison-results');
        resultsContainer.innerHTML = `
            <div class="comparison-error">
                <h3>Comparison Failed</h3>
                <p>${message}</p>
            </div>
        `;
        resultsContainer.style.display = 'block';
    }
});
