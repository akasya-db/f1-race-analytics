async function loadCircuitDetail() {
  const circuitId = window.__CIRCUIT_ID__;
  if (!circuitId) return;

  try {
    const res = await fetch(`/api/circuits/${encodeURIComponent(circuitId)}`);
    if (!res.ok) throw new Error('Circuit not found');
    const circuit = await res.json();
    renderCircuitHero(circuit);
    renderCircuitOverview(circuit);
  } catch (error) {
    console.error('Circuit detail error', error);
    document.getElementById('circuitOverview').innerHTML =
      '<p class="error-state">Unable to load circuit data.</p>';
  }

  try {
    await loadCircuitRaces(circuitId);
  } catch (error) {
    console.error('Circuit races error', error);
    const racesBox = document.getElementById('circuitRaces');
    if (racesBox) {
      racesBox.innerHTML = '<p class="error-state">Unable to load races.</p>';
    }
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

const prettify = (value) => {
  if (!value) return 'Unknown';
  return value
    .toString()
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatCoordinatePair = (lat, lon) => {
  const latNum = Number(lat);
  const lonNum = Number(lon);
  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) return 'N/A';

  const formatAxis = (value, positive, negative) => {
    const dir = value >= 0 ? positive : negative;
    return `${Math.abs(value).toFixed(3)}° ${dir}`;
  };

  return `${formatAxis(latNum, 'N', 'S')}, ${formatAxis(lonNum, 'E', 'W')}`;
};

function renderCircuitHero(circuit) {
  document.getElementById('circuitName').textContent = circuit.full_name || circuit.name;
  document.getElementById('circuitLocation').textContent =
    [circuit.place_name, circuit.country_name].filter(Boolean).join(' • ');

  const coordinateText = formatCoordinatePair(circuit.latitude, circuit.longitude);
  const heroStats = document.getElementById('circuitHeroStats');
  heroStats.innerHTML = `
    <div class="stat-row">
      ${[
        { label: 'Length', value: formatDecimal(circuit.length, 3, ' km') },
        { label: 'Turns', value: formatValue(circuit.turns) },
        { label: 'Direction', value: prettify(circuit.direction) },
        { label: 'Type', value: prettify(circuit.type) },
        { label: 'Total races', value: formatValue(circuit.total_races_held) },
        { label: 'Country', value: circuit.country_name || 'N/A' },
        { label: 'City / Place', value: circuit.place_name || 'N/A' },
        { label: 'Coordinates', value: coordinateText }
      ]
        .map(
          (stat) => `
            <div class="stat-chip">
              <span class="label">${stat.label}</span>
              <span class="value">${stat.value}</span>
            </div>
          `
        )
        .join('')}
    </div>
  `;
}

function renderCircuitOverview(circuit) {
  const coordinateText = formatCoordinatePair(circuit.latitude, circuit.longitude);
  const overview = document.getElementById('circuitOverview');
  overview.innerHTML = `
    <h3>Track Snapshot</h3>
    <p>
      ${circuit.full_name || 'This circuit'} has hosted
      <strong>${formatValue(circuit.total_races_held)}</strong> races in
      <strong>${circuit.country_name || 'N/A'}</strong>, near
      <strong>${circuit.place_name || 'N/A'}</strong>. Its exact coordinates are
      <strong>${coordinateText}</strong>, giving you a precise spot on the map.
    </p>
  `;

  const mapBox = document.getElementById('circuitMap');
  mapBox.innerHTML = renderCircuitMap(circuit);
}

function renderCircuitMap(circuit) {
  const coordsAvailable =
    Number.isFinite(Number(circuit.latitude)) && Number.isFinite(Number(circuit.longitude));
  if (!coordsAvailable) {
    return `
      <div class="map-placeholder">Map preview coming soon.</div>
    `;
  }

  const lat = Number(circuit.latitude).toFixed(5);
  const lon = Number(circuit.longitude).toFixed(5);

  // Use Google Maps embed with zoom animation parameters
  const mapSrc = `https://www.google.com/maps?q=${lat},${lon}&z=13&layer=c&output=embed`;

  return `
    <iframe
      title="Circuit Map"
      src="${mapSrc}"
      allowfullscreen
      referrerpolicy="no-referrer-when-downgrade">
    </iframe>
  `;
}

async function loadCircuitRaces(circuitId) {
  const res = await fetch(`/api/circuits/${encodeURIComponent(circuitId)}/races`);
  if (!res.ok) throw new Error('Failed to load races');
  const payload = await res.json();
  renderCircuitRaces(payload.races || []);
}

function renderCircuitRaces(races) {
  const container = document.getElementById('circuitRaces');
  if (!container) return;

  if (!races.length) {
    container.innerHTML = '<p class="empty-state">No races recorded for this circuit.</p>';
    return;
  }

  container.innerHTML = races
    .map((race) => {
      const badgeClass = race.is_real ? 'real' : 'fake';
      const raceUrl = `/races/${race.id}`;
      return `
        <a class="race-pill" href="${raceUrl}">
          <div class="info">
            <div class="title">${race.official_name || `Round ${race.round}`}</div>
          </div>
          <div class="meta participants">Participants: ${race.participant_count ?? 0}</div>
          <span class="badge ${badgeClass}">${race.is_real ? 'Official' : 'Simulated'}</span>
        </a>
      `;
    })
    .join('');
}

window.addEventListener('DOMContentLoaded', loadCircuitDetail);
