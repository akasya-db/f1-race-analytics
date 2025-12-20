// race_detail.js

async function loadRaceDetail() {
  // extract race id from url (/races/<id>)
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const raceId = pathParts.length ? pathParts[pathParts.length - 1] : null;
  if (!raceId) {
    document.getElementById('raceInfo').innerText = 'Invalid race id';
    return;
  }

  try {
    // fetch race meta
    const res = await fetch(`/api/races/${raceId}`);
    if (!res.ok) throw new Error('Race not found');
    const race = await res.json();

    renderRaceInfo(race);
  } catch (err) {
    console.error('Error fetching race:', err);
    document.getElementById('raceInfo').innerHTML = '<p class="error-state">Unable to load race information.</p>';
  }

  try {
    // fetch race results using existing helper if available
    const payload = window.fetchRaceData
      ? await window.fetchRaceData({ raceId: raceId, page: 1 })
      : await (await fetch(`/api/race_data?race_id=${raceId}`)).json();

    const rows = payload?.race_data || [];
    renderResults(rows);
  } catch (err) {
    console.error('Error fetching results:', err);
    document.getElementById('resultsBox').innerHTML = '<p class="error-state">Unable to load results.</p>';
  }

  // Fetch both standings in parallel
  try {
    const [driverRes, constructorRes] = await Promise.all([
      fetch(`/api/races/${raceId}/driver-standings`),
      fetch(`/api/races/${raceId}/constructor-standings`)
    ]);

    if (driverRes.ok) {
      const driverData = await driverRes.json();
      renderDriverStandings(driverData.standings);
    } else {
      document.getElementById('driverStandingsBox').innerHTML = '<p class="empty-state">No driver standings available.</p>';
    }

    if (constructorRes.ok) {
      const constructorData = await constructorRes.json();
      renderConstructorStandings(constructorData.standings);
    } else {
      document.getElementById('constructorStandingsBox').innerHTML = '<p class="empty-state">No constructor standings available.</p>';
    }
  } catch (err) {
    console.error('Error fetching standings:', err);
    document.getElementById('driverStandingsBox').innerHTML = '<p class="error-state">Unable to load standings.</p>';
    document.getElementById('constructorStandingsBox').innerHTML = '<p class="error-state">Unable to load standings.</p>';
  }
}

const formatValue = (value, suffix = '') => {
  if (value === null || value === undefined || value === '') return 'N/A';
  return suffix ? `${value}${suffix}` : value;
};

const formatDecimal = (value, digits = 3, suffix = '') => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 'N/A';
  return `${num.toFixed(digits)}${suffix}`;
};

const prettifyText = (value) => {
  if (!value) return 'Unknown';
  return value
    .toString()
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

function renderRaceInfo(r) {
  const el = document.getElementById('raceInfo');
  if (!el) return;

  // Compact horizontal layout for race meta
  const metaItems = [
    { label: 'Year', value: formatValue(r.year) },
    { label: 'Round', value: formatValue(r.round) },
    { label: 'Date', value: formatValue(r.date) },
    { label: 'Format', value: prettifyText(r.qualifying_format) },
    { label: 'Laps', value: formatValue(r.laps) }
  ];

  el.innerHTML = `
    <h2>${r.official_name || r.circuit_name}</h2>
    <div class="race-meta">
      ${metaItems.map(item => `
        <div class="race-meta-item">
          <span class="label">${item.label}:</span>
          <span class="value">${item.value}</span>
        </div>
      `).join('')}
    </div>
  `;

  const c = document.getElementById('circuitInfo');
  if (!c) return;

  const location = [r.circuit_place_name, r.circuit_country].filter(Boolean).join(' • ');
  const stats = [
    { label: 'Length', value: formatDecimal(r.circuit_length, 3, ' km') },
    { label: 'Turns', value: formatValue(r.circuit_turns) },
    { label: 'Direction', value: prettifyText(r.circuit_direction) },
    { label: 'Type', value: prettifyText(r.circuit_type) },
    { label: 'Races', value: formatValue(r.circuit_total_races) },
    {
      label: 'Coords',
      value:
        Number.isFinite(Number(r.circuit_latitude)) &&
        Number.isFinite(Number(r.circuit_longitude))
          ? `${Number(r.circuit_latitude).toFixed(2)}, ${Number(r.circuit_longitude).toFixed(2)}`
          : 'N/A'
    }
  ];

  c.innerHTML = `
    <h3>${r.circuit_name || 'Circuit'}</h3>
    <p class="circuit-location">${location || 'Location unknown'}</p>
    <div class="circuit-stats-grid">
      ${stats
        .map(
          (item) => `
        <div class="circuit-stat">
          <span class="label">${item.label}</span>
          <span class="value">${item.value}</span>
        </div>
      `
        )
        .join('')}
    </div>
    ${
      r.circuit_id
        ? `<div class="detail-actions"><a class="btn secondary" href="/circuits/${r.circuit_id}">View Circuit</a></div>`
        : ''
    }
  `;
}

function renderResults(rows) {
  const el = document.getElementById('resultsBox');
  if (!el) return;

  if (!rows || rows.length === 0) {
    el.innerHTML = '<p class="empty-state">No results available for this race.</p>';
    return;
  }

  // Build table: position, number, driver, constructor, grid, qualification, points
  const parts = [];
  parts.push('<h3>Race Results</h3>');
  parts.push('<table class="results-table">');
  parts.push('<thead><tr><th>P</th><th>No</th><th>Driver</th><th>Constructor</th><th>Grid</th><th>Qual</th><th>Points</th></tr></thead>');
  parts.push('<tbody>');

  rows.forEach((r, index) => {
    parts.push(`
      <tr>
        <td>${index + 1}</td>
        <td>${r.driver_number ?? '-'}</td>
        <td>${r.driver_name ?? r.driver_id}</td>
        <td>${r.constructor_name ?? r.constructor_id}</td>
        <td>${r.race_grid_position_number ?? '-'}</td>
        <td>${r.race_qualification_position_number ?? '-'}</td>
        <td>${r.race_points ?? '-'}</td>
      </tr>
    `);
  });

  parts.push('</tbody></table>');
  el.innerHTML = parts.join('');
}

function renderDriverStandings(standings) {
  const el = document.getElementById('driverStandingsBox');
  if (!el) return;

  if (!standings || standings.length === 0) {
    el.innerHTML = '<p class="empty-state">No driver standings available.</p>';
    return;
  }

  const parts = [];
  parts.push('<h3>🏆 Driver Championship</h3>');
  parts.push('<table class="standings-table">');
  parts.push('<thead><tr><th>P</th><th>Driver</th><th>Nat</th><th>Pts</th></tr></thead>');
  parts.push('<tbody>');

  for (const s of standings) {
    parts.push(`
      <tr>
        <td>${s.position_number ?? '-'}</td>
        <td>${s.driver_name ?? s.driver_id}</td>
        <td>${s.nationality ?? '-'}</td>
        <td>${s.points ?? '-'}</td>
      </tr>
    `);
  }

  parts.push('</tbody></table>');
  el.innerHTML = parts.join('');
}

function renderConstructorStandings(standings) {
  const el = document.getElementById('constructorStandingsBox');
  if (!el) return;

  if (!standings || standings.length === 0) {
    el.innerHTML = '<p class="empty-state">No constructor standings available.</p>';
    return;
  }

  const parts = [];
  parts.push('<h3>🏎️ Constructor Championship</h3>');
  parts.push('<table class="standings-table">');
  parts.push('<thead><tr><th>P</th><th>Team</th><th>Nat</th><th>Pts</th></tr></thead>');
  parts.push('<tbody>');

  for (const s of standings) {
    parts.push(`
      <tr>
        <td>${s.position_number ?? '-'}</td>
        <td>${s.constructor_name ?? s.constructor_id}</td>
        <td>${s.country_name ?? '-'}</td>
        <td>${s.points ?? '-'}</td>
      </tr>
    `);
  }

  parts.push('</tbody></table>');
  el.innerHTML = parts.join('');
}

window.addEventListener('DOMContentLoaded', loadRaceDetail);
