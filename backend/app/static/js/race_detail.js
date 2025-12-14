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

  el.innerHTML = `
    <h2>${r.official_name || r.circuit_name}</h2>
    <p><strong>Year:</strong> ${formatValue(r.year)}</p>
    <p><strong>Round:</strong> ${formatValue(r.round)}</p>
    <p><strong>Date:</strong> ${formatValue(r.date)}</p>
    <p><strong>Format:</strong> ${prettifyText(r.qualifying_format)}</p>
    <p><strong>Laps:</strong> ${formatValue(r.laps)}</p>
  `;

  const c = document.getElementById('circuitInfo');
  if (!c) return;

  const location = [r.circuit_place_name, r.circuit_country].filter(Boolean).join(' • ');
  const stats = [
    { label: 'Length', value: formatDecimal(r.circuit_length, 3, ' km') },
    { label: 'Turns', value: formatValue(r.circuit_turns) },
    { label: 'Direction', value: prettifyText(r.circuit_direction) },
    { label: 'Type', value: prettifyText(r.circuit_type) },
    { label: 'Total races', value: formatValue(r.circuit_total_races) },
    {
      label: 'Coordinates',
      value:
        Number.isFinite(Number(r.circuit_latitude)) &&
        Number.isFinite(Number(r.circuit_longitude))
          ? `${Number(r.circuit_latitude).toFixed(3)}, ${Number(r.circuit_longitude).toFixed(3)}`
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
        ? `<div class="detail-actions"><a class="btn secondary" href="/circuits/${r.circuit_id}">View Circuit Detail</a></div>`
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

  // Build table: position, driver, constructor, number, grid, qualification, points
  const parts = [];
  parts.push('<h3>Race Results</h3>');
  parts.push('<table class="results-table">');
  parts.push('<thead><tr><th>#</th><th>Driver</th><th>Constructor</th><th>No</th><th>Grid</th><th>Qual</th><th>Points</th></tr></thead>');
  parts.push('<tbody>');

  for (const r of rows) {
    parts.push(`
      <tr>
        <td>${r.position_display_order ?? '-'}</td>
        <td>${r.driver_name ?? r.driver_id}</td>
        <td>${r.constructor_name ?? r.constructor_id}</td>
        <td>${r.driver_number ?? '-'}</td>
        <td>${r.race_grid_position_number ?? '-'}</td>
        <td>${r.race_qualification_position_number ?? '-'}</td>
        <td>${r.race_points ?? '-'}</td>
      </tr>
    `);
  }

  parts.push('</tbody></table>');
  el.innerHTML = parts.join('');
}

window.addEventListener('DOMContentLoaded', loadRaceDetail);
