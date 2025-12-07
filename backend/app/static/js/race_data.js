// backend/app/static/js/race_data.js
// Fetch race_data from backend API. Errors are propagated; there is no
// fallback to in-browser mock data. The UI should handle and display
// any fetch errors (e.g. backend or DB unavailable).

async function fetchRaceData({ raceId = null, page = 1, isReal = null } = {}) {
  const params = new URLSearchParams();
  if (raceId !== null) params.append('race_id', raceId);
  if (page) params.append('page', page);
  if (isReal !== null) params.append('is_real', isReal ? 'true' : 'false');

  const res = await fetch(`/api/race_data?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch race_data: ${res.status} ${res.statusText} ${text}`);
  }

  const body = await res.json();
  return body; // { race_data: [...], pagination: {...} }
}

// Expose function to global scope for the rest of the frontend code to use
window.fetchRaceData = fetchRaceData;
