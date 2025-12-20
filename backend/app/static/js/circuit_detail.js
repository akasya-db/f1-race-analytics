async function loadCircuitDetail() {
  const circuitId = window.__CIRCUIT_ID__;
  if (!circuitId) return;

  try {
    const res = await fetch(`/api/circuits/${encodeURIComponent(circuitId)}`);
    if (!res.ok) throw new Error('Circuit not found');
    const payload = await res.json();
    const circuit = payload.circuit || {};
    const stats = payload.stats || {};
    const races = payload.races || [];

    renderCircuitHero(circuit, stats);
    renderCircuitOverview(circuit, stats);
    renderCircuitHighlights(stats);
    renderCircuitMap(circuit);
    renderCircuitRaces(races);
  } catch (error) {
    console.error('Circuit detail error', error);
    document.getElementById('circuitOverview').innerHTML =
      '<p class="error-state">Unable to load circuit data.</p>';
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
  if (value === null || value === undefined || value === '') return 'N/A';
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

function renderCircuitHero(circuit, stats = {}) {
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
        { label: 'Country', value: circuit.country_name || 'N/A' },
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

function renderCircuitOverview(circuit, stats = {}) {
  const coordinateText = formatCoordinatePair(circuit.latitude, circuit.longitude);
  const overview = document.getElementById('circuitOverview');
  overview.innerHTML = `
    <div class="overview-header">
      <h3>Track Snapshot</h3>
      <p>
        ${circuit.full_name || 'This circuit'} spans
        <strong>${formatDecimal(circuit.length, 3, ' km')}</strong> with
        <strong>${formatValue(circuit.turns)}</strong> turns in
        <strong>${prettify(circuit.direction)}</strong> direction. It has hosted
        <strong>${formatValue(stats.total_races ?? circuit.total_races_held)}</strong> events between
        <strong>${formatValue(stats.first_year)}</strong> and
        <strong>${formatValue(stats.last_year)}</strong>, located near
        <strong>${circuit.place_name || 'N/A'}</strong>,
        <strong>${circuit.country_name || 'N/A'}</strong>.
      </p>
    </div>
    <div class="snapshot-grid">
      ${[
        { label: 'Official Races', value: formatValue(stats.official_races) },
        { label: 'Average Laps', value: formatDecimal(stats.avg_laps, 1) },
        { label: 'Unique Winners', value: formatValue(stats.unique_winners) }
      ]
        .map(
          (item) => `
            <div class="snapshot-tile">
              <span class="label">${item.label}</span>
              <span class="value">${item.value}</span>
            </div>
          `
        )
        .join('')}
    </div>
  `;

}

function renderCircuitHighlights(stats = {}) {
  const highlightContainer = document.getElementById('circuitHighlights');
  if (!highlightContainer) return;

  const highlightItems = [
    {
      title: 'Home Constructors',
      primary: formatValue(stats.home_constructors),
      secondary: 'Constructors from this circuit’s country'
    },
    {
      title: 'Home Drivers',
      primary: formatValue(stats.home_drivers),
      secondary: 'Drivers from this circuit’s country'
    },
    {
      title: 'First Event',
      primary: formatValue(stats.first_year),
      secondary: 'Historic debut'
    },
    {
      title: 'Most Recent',
      primary: formatValue(stats.last_year),
      secondary: 'Latest season'
    }
  ];

  highlightContainer.innerHTML = highlightItems
    .map(
      (item) => `
        <div class="highlight-card">
          <span class="label">${item.title}</span>
          <span class="value">${item.primary}</span>
          <span class="meta">${item.secondary}</span>
        </div>
      `
    )
    .join('');
}

function renderCircuitMap(circuit) {
  const mapBox = document.getElementById('circuitMap');
  if (!mapBox) return;

  const coordsAvailable =
    Number.isFinite(Number(circuit.latitude)) && Number.isFinite(Number(circuit.longitude));
  if (!coordsAvailable) {
    mapBox.innerHTML = `
      <div class="map-placeholder">Map preview coming soon.</div>
    `;
    return;
  }

  const lat = Number(circuit.latitude).toFixed(5);
  const lon = Number(circuit.longitude).toFixed(5);

  // Use Google Maps embed with zoom animation parameters
  const mapSrc = `https://www.google.com/maps?q=${lat},${lon}&z=13&layer=c&output=embed`;

  mapBox.innerHTML = `
    <iframe
      title="Circuit Map"
      src="${mapSrc}"
      allowfullscreen
      referrerpolicy="no-referrer-when-downgrade">
    </iframe>
  `;
}

function renderCircuitRaces(races = []) {
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
      const raceMeta = [race.year, race.date].filter(Boolean).join(' • ');
      const winnerText = race.winner?.driver_name
        ? `Winner: ${race.winner.driver_name}`
        : 'Winner TBD';
      return `
        <a class="race-pill" href="${raceUrl}">
          <div class="info">
            <div class="title">${race.official_name || `Round ${race.round}`}</div>
            <div class="meta">${raceMeta}</div>
            <div class="meta">${winnerText}</div>
          </div>
          <div class="meta participants">Participants: ${race.participant_count ?? 0}</div>
          <span class="badge ${badgeClass}">${race.is_real ? 'Official' : 'Simulated'}</span>
        </a>
      `;
    })
    .join('');
}

window.addEventListener('DOMContentLoaded', loadCircuitDetail);
