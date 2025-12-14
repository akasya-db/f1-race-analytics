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

function renderRaceInfo(r) {
  const el = document.getElementById('raceInfo');
  if (!el) return;

  el.innerHTML = `
    <h2>${r.official_name || r.circuit_name}</h2>
    <p><strong>Year:</strong> ${r.year}</p>
    <p><strong>Round:</strong> ${r.round}</p>
    <p><strong>Date:</strong> ${r.date}</p>
  <p><strong>Format:</strong> ${r.qualifying_format || 'Standard'}</p>
  `;

  // also populate circuit box with quick info
  const c = document.getElementById('circuitInfo');
  if (c) {
    c.innerHTML = `
      <h3>${r.circuit_name || 'Circuit'}</h3>
      <p><strong>Country:</strong> ${r.country_name || r.country || '-'}</p>
      <p><strong>Location:</strong> ${r.location || '-'}</p>
      <p><strong>Full name:</strong> ${r.full_name || '-'}</p>
    `;
  }
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
