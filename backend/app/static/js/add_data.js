let savedData = {
  constructor: null,
  driver: null,
  race: null,
  raceData: []
};

let sectionMode = 'custom'; // 'custom' | 'existing'
let raceMode = 'custom'; // 'custom' | 'existing'
let driverMode = 'custom'; // 'custom' | 'existing'
let driverSearchAbort = null;
let sectionSearchAbort = null;

// Toast notification function
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
let raceSearchAbort = null;

function setSectionMode(mode){
  sectionMode = mode;
  const btns = document.querySelectorAll('#constructor-section .mode-btn');
  btns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  document.getElementById('section-mode-custom').style.display = mode === 'custom' ? 'block' : 'none';
  document.getElementById('section-mode-existing').style.display = mode === 'existing' ? 'block' : 'none';
}

function setRaceMode(mode){
  raceMode = mode;
  const btns = document.querySelectorAll('#race-section .mode-btn');
  btns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  document.getElementById('race-mode-custom').style.display = mode === 'custom' ? 'block' : 'none';
  document.getElementById('race-mode-existing').style.display = mode === 'existing' ? 'block' : 'none';
}

function setDriverMode(mode){
  driverMode = mode;
  const btns = document.querySelectorAll('#driver-section .mode-btn');
  btns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));

  document.getElementById('driver-mode-custom').style.display   = mode === 'custom' ? 'block' : 'none';
  document.getElementById('driver-mode-existing').style.display = mode === 'existing' ? 'block' : 'none';
}


function toggleSection(sectionName){
  const section = document.getElementById(`${sectionName}-section`);
  if(!section) return;
  const header = section.previousElementSibling;
  const chevron = header?.querySelector('.chevron');
  const hidden = section.style.display === 'none' || section.style.display === '';
  section.style.display = hidden ? 'block' : 'none';
  if(chevron) chevron.style.transform = hidden ? 'rotate(180deg)' : 'rotate(0deg)';
}

// Save custom constructor data (insert on submit)
function saveConstructor(){
  if (sectionMode !== 'custom') {
    showToast('Switch to "Add custom constructor" mode first', 'warning');
    return;
  }
  const form = document.getElementById('constructorForm');
  if(!form.checkValidity()){ form.reportValidity(); return; }

  const fd = new FormData(form);
  const data = {
    mode: 'custom',
    data: {
      country_id: fd.get('constructor_country'),
      name: fd.get('constructor_name'),
      best_championship_position: fd.get('best_championship_position') || null,
      total_championship_wins: parseInt(fd.get('total_championship_wins'), 10),
      total_race_starts: parseInt(fd.get('total_race_starts'), 10),
      total_podiums: parseInt(fd.get('total_podiums'), 10),
      total_points: parseFloat(fd.get('total_points')),
      total_pole_positions: parseInt(fd.get('total_pole_positions'), 10)
    }
  };

  savedData.constructor = data;
  renderSummary();
  showToast('Constructor saved locally', 'success');
}

// Search existing constructors (typeahead)
async function fetchSectionOptions(query){
  const select = document.getElementById('existingSectionSelect');
  if (!select) return;

  // Abort previous request if still pending
  if (sectionSearchAbort) sectionSearchAbort.abort();
  sectionSearchAbort = new AbortController();

  // Use backend API: /api/constructors?name=...
  const params = new URLSearchParams();
  params.append('page', '1');
  if (query) params.append('name', query);

  try{
    const res = await fetch(`/api/constructors?${params.toString()}`, { signal: sectionSearchAbort.signal });
    if(!res.ok) throw new Error('Failed to load constructors');
    const json = await res.json();
    const list = json.constructors || [];

    select.innerHTML = list.map(t => 
      `<option value="${t.id}">${t.name}${t.nationality ? ' — ' + t.nationality : ''}</option>`
    ).join('') || `<option disabled>No results</option>`;
  }catch(e){
    if(e.name !== 'AbortError'){
      select.innerHTML = `<option disabled>Error loading</option>`;
      console.error(e);
    }
  }
}

// Save selection of existing constructor (no insert)
async function saveExistingSection(){
  if (sectionMode !== 'existing') {
    showToast('Switch to "Select existing" mode first', 'warning');
    return;
  }
  const select = document.getElementById('existingSectionSelect');
  if(!select || !select.value){
    showToast('Please select a constructor from the list', 'warning');
    return;
  }
  
  const constructorId = select.value;
  
  try {
    // Fetch full constructor details
    const res = await fetch(`/api/constructors/${constructorId}`);
    if(!res.ok) throw new Error('Failed to load constructor details');
    const constructor = await res.json();
    
    console.log('Fetched constructor:', constructor); // Debug log
    
    // Fetch country name - the API already returns nationality
    let countryName = constructor.nationality || '-';
    
    savedData.constructor = {
      mode: 'existing',
      id: constructor.id,
      name: constructor.name || constructor.full_name || '-',
      countryName: countryName,
      best_championship_position: constructor.best_championship_position || null,
      total_championship_wins: constructor.total_championship_wins || 0,
      total_race_starts: constructor.total_race_starts || 0,
      total_podiums: constructor.total_podiums || 0,
      total_points: constructor.total_points || 0,
      total_pole_positions: constructor.total_pole_positions || 0
    };
    
    console.log('Saved data:', savedData.constructor); // Debug log
    
    renderSummary();
    showToast('Constructor selected successfully', 'success');
  } catch(e) {
    showToast('Error loading constructor: ' + e.message, 'error');
    console.error(e);
  }
}


// Save custom race data (insert on submit)
function saveRace(){
  if (raceMode !== 'custom') {
    showToast('Switch to "Add custom race" mode first', 'warning');
    return;
  }
  const form = document.getElementById('raceForm');
  if(!form.checkValidity()){ form.reportValidity(); return; }

  const fd = new FormData(form);
  const data = {
    mode: 'custom',
    data: {
      circuit_id: fd.get('race_circuit'),
      official_name: fd.get('race_official_name'),
      year: parseInt(fd.get('race_year'), 10),
      round: parseInt(fd.get('race_round'), 10),
      date: fd.get('race_date'),
      qualifying_format: fd.get('race_qualifying_format'),
      laps: parseInt(fd.get('race_laps'), 10),
      qualifying_date: fd.get('race_qualifying_date') || null
    }
  };

  savedData.race = data;
  renderSummary();
  showToast('Race saved locally', 'success');
}

// Search existing races (typeahead)
async function fetchRaceOptions(query){
  const select = document.getElementById('existingRaceSelect');
  if (!select) return;

  // Abort previous request if still pending
  if (raceSearchAbort) raceSearchAbort.abort();
  raceSearchAbort = new AbortController();

  // Use backend API: /api/races?official_name=...
  const params = new URLSearchParams();
  params.append('page', '1');
  if (query) params.append('official_name', query);

  try{
    const res = await fetch(`/api/races?${params.toString()}`, { signal: raceSearchAbort.signal });
    if(!res.ok) throw new Error('Failed to load races');
    const json = await res.json();
    const list = json.races || [];

    select.innerHTML = list.map(r => 
      `<option value="${r.id}">${r.official_name} (${r.year}, Round ${r.round})</option>`
    ).join('') || `<option disabled>No results</option>`;
  }catch(e){
    if(e.name !== 'AbortError'){
      select.innerHTML = `<option disabled>Error loading</option>`;
      console.error(e);
    }
  }
}

// Save selection of existing race (no insert)
async function saveExistingRace(){
  if (raceMode !== 'existing') {
    showToast('Switch to "Select existing" mode first', 'warning');
    return;
  }
  const select = document.getElementById('existingRaceSelect');
  if(!select || !select.value){
    showToast('Please select a race from the list', 'warning');
    return;
  }
  
  const raceId = select.value;
  
  try {
    // Fetch full race details
    const res = await fetch(`/api/races/${raceId}`);
    if(!res.ok) throw new Error('Failed to load race details');
    const race = await res.json();
    
    savedData.race = {
      mode: 'existing',
      id: race.id,
      official_name: race.official_name,
      year: race.year,
      round: race.round,
      date: race.date,
      circuit_name: race.circuit_name,
      country_name: race.country_name,
      qualifying_format: race.qualifying_format,
      laps: race.laps
    };
    
    renderSummary();
    showToast('Race selected successfully', 'success');
  } catch(e) {
    showToast('Error loading race: ' + e.message, 'error');
    console.error(e);
  }
}

function saveDriver(){
  if (driverMode !== 'custom') {
    showToast('Switch to "Add custom driver" mode first', 'warning');
    return;
  }

  const form = document.getElementById('driverForm');
  if(!form.checkValidity()){ form.reportValidity(); return; }

  const fd = new FormData(form);

  const data = {
    mode: 'custom',
    data: {
      name: fd.get('driver_name'),
      abbreviation: fd.get('driver_abbreviation') || null,
      permanent_number: fd.get('driver_permanent_number')
        ? parseInt(fd.get('driver_permanent_number'), 10)
        : null,
      gender: fd.get('driver_gender') || null,

      date_of_birth: fd.get('driver_date_of_birth'),
      place_of_birth: fd.get('driver_place_of_birth') || null,

      country_of_birth_country_id: fd.get('driver_country_of_birth_country_id'),
      nationality_country_id: fd.get('driver_nationality_country_id'),

      best_championship_position: fd.get('driver_best_championship_position') || null,
      best_race_result: fd.get('driver_best_race_result') || null,

      total_championship_wins: parseInt(fd.get('driver_total_championship_wins') || '0', 10),
      total_race_starts: parseInt(fd.get('driver_total_race_starts') || '0', 10),
      total_race_wins: parseInt(fd.get('driver_total_race_wins') || '0', 10),
      total_race_laps: parseInt(fd.get('driver_total_race_laps') || '0', 10),
      total_podiums: parseInt(fd.get('driver_total_podiums') || '0', 10),
      total_points: parseFloat(fd.get('driver_total_points') || '0'),
      total_pole_positions: parseInt(fd.get('driver_total_pole_positions') || '0', 10),
    }
  };

  savedData.driver = data;
  renderSummary();
  showToast('Driver saved locally', 'success');
}
async function fetchDriverOptions(query){
  const select = document.getElementById('existingDriverSelect');
  if (!select) return;

  if (driverSearchAbort) driverSearchAbort.abort();
  driverSearchAbort = new AbortController();

  const params = new URLSearchParams();
  params.append('page', '1');
  if (query) params.append('name', query);

  try{
    const res = await fetch(`/api/drivers?${params.toString()}`, { signal: driverSearchAbort.signal });
    if(!res.ok) throw new Error('Failed to load drivers');
    const json = await res.json();
    const list = json.drivers || [];

    select.innerHTML = list.map(d =>
      `<option value="${d.id}">${d.name}${d.nationality ? ' — ' + d.nationality : ''}</option>`
    ).join('') || `<option disabled>No results</option>`;
  }catch(e){
    if(e.name !== 'AbortError'){
      select.innerHTML = `<option disabled>Error loading</option>`;
      console.error(e);
    }
  }
}

async function saveExistingDriver(){
  if (driverMode !== 'existing') {
    showToast('Switch to "Select existing" mode first', 'warning');
    return;
  }

  const select = document.getElementById('existingDriverSelect');
  if(!select || !select.value){
    showToast('Please select a driver from the list', 'warning');
    return;
  }

  const driverId = select.value;

  try{
    const res = await fetch(`/api/drivers/${driverId}`);
    if(!res.ok) throw new Error('Failed to load driver details');
    const d = await res.json();

    savedData.driver = {
      mode: 'existing',
      id: d.id,
      name: d.name || d.full_name || '-',
      nationality: d.nationality || '-',
      date_of_birth: d.date_of_birth || null,
      total_championship_wins: d.total_championship_wins || 0,
      total_race_starts: d.total_race_starts || 0,
      total_points: d.total_points || 0,
      total_podiums: d.total_podiums || 0,
      total_pole_positions: d.total_pole_positions || 0
    };

    renderSummary();
    showToast('Driver selected successfully', 'success');
  }catch(e){
    showToast('Error loading driver: ' + e.message, 'error');
    console.error(e);
  }
}

async function submitAllData(){
  const btn = document.getElementById('submitAllBtn');
  
  btn.disabled = true; btn.textContent = 'Submitting...';
  try{
    let messages = [];
    
    // Handle constructor submission
    if (savedData.constructor) {
      if (savedData.constructor.mode === 'custom') {
        const payload = savedData.constructor.data;
        const res = await fetch('/api/add-constructor', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if(!res.ok) throw new Error(json.error || 'Failed to add constructor');

        messages.push('Constructor added successfully!');
        // capture currently selected country label before reset (custom select may hide native select)
        const constructorCountrySelect = document.getElementById('constructor_country');
        const constructorCountryLabel = constructorCountrySelect?.selectedOptions[0]?.textContent || '-';
        document.getElementById('constructorForm').reset();
        // Keep full details but mark as existing with the new ID
        savedData.constructor = {
          mode: 'existing',
          id: json.constructor_id,
          name: payload.name,
          countryName: constructorCountryLabel,
          best_championship_position: payload.best_championship_position,
          total_championship_wins: payload.total_championship_wins,
          total_race_starts: payload.total_race_starts,
          total_podiums: payload.total_podiums,
          total_points: payload.total_points,
          total_pole_positions: payload.total_pole_positions
        };
      } else {
        messages.push('Existing constructor selected.');
      }
    }

        // Handle driver submission
    if (savedData.driver) {
      if (savedData.driver.mode === 'custom') {
        const payload = savedData.driver.data;
        const res = await fetch('/api/add-driver', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if(!res.ok) throw new Error(json.error || 'Failed to add driver');

        messages.push('Driver added successfully!');

        document.getElementById('driverForm')?.reset();

        savedData.driver = {
          mode: 'existing',
          id: json.driver_id,              
          name: payload.name,
          nationality: '-',                
          date_of_birth: payload.date_of_birth || null,
          total_championship_wins: payload.total_championship_wins,
          total_race_starts: payload.total_race_starts,
          total_points: payload.total_points,
          total_podiums: payload.total_podiums,
          total_pole_positions: payload.total_pole_positions
        };
      } else {
        messages.push('Existing driver selected.');
      }
    }

    // Handle race submission
    if (savedData.race) {
      if (savedData.race.mode === 'custom') {
        const payload = savedData.race.data;
        const res = await fetch('/api/add-race', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if(!res.ok) throw new Error(json.error || 'Failed to add race');

        messages.push('Race added successfully!');
        // capture circuit label before reset
        const raceCircuitSelect = document.getElementById('race_circuit');
        const raceCircuitLabel = raceCircuitSelect?.selectedOptions[0]?.textContent || '-';
        document.getElementById('raceForm').reset();
        // Keep full details but mark as existing with the new ID
        savedData.race = {
          mode: 'existing',
          id: json.race_id,
          official_name: payload.official_name,
          year: payload.year,
          round: payload.round,
          date: payload.date,
          circuit_name: raceCircuitLabel,
          qualifying_format: payload.qualifying_format,
          laps: payload.laps
        };
      } else {
        messages.push('Existing race selected.');
      }
    }

    if (messages.length === 0) {
      showToast('No data to submit. Please save at least one section first.', 'warning');
    } else {
      showToast(messages.join(' | '), 'success');
    }

    renderSummary();
  }catch(err){
    showToast('Error: ' + err.message, 'error');
  }finally{
    btn.disabled = false; btn.textContent = 'Submit Data';
  }
}

// Live summary (constructor supports both modes)
function renderSummary(){
  const wrap = document.getElementById('savedSummary');
  if(!wrap) return;

  const parts = [];

  if(savedData.constructor){
    if(savedData.constructor.mode === 'custom'){
      const c = savedData.constructor.data;
      const countrySelect = document.getElementById('constructor_country');
      const countryName = countrySelect && c.country_id
        ? countrySelect.querySelector(`option[value="${c.country_id}"]`)?.textContent || c.country_id
        : '-';
      parts.push(`
        <div class="summary-block" id="summary-constructor">
          <button type="button" class="btn-delete-summary" onclick="removeItem('constructor')" title="Remove">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
          <h4>Constructor (custom) </h4>
          <div class="summary-list">
            <div class="summary-item"><b>Name:</b> ${c.name}</div>
            <div class="summary-item"><b>Country:</b> ${countryName}</div>
            <div class="summary-item"><b>Best pos:</b> ${c.best_championship_position ?? '-'}</div>
            <div class="summary-item"><b>Wins:</b> ${c.total_championship_wins}</div>
            <div class="summary-item"><b>Starts:</b> ${c.total_race_starts}</div>
            <div class="summary-item"><b>Podiums:</b> ${c.total_podiums}</div>
            <div class="summary-item"><b>Points:</b> ${c.total_points}</div>
            <div class="summary-item"><b>Poles:</b> ${c.total_pole_positions}</div>
          </div>
        </div>
      `);
    } else {
      parts.push(`
        <div class="summary-block" id="summary-constructor">
          <button type="button" class="btn-delete-summary" onclick="removeItem('constructor')" title="Remove">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
          <h4>Constructor (existing)</h4>
          <div class="summary-list">
            <div class="summary-item"><b>Name:</b> ${savedData.constructor.name}</div>
            <div class="summary-item"><b>Country:</b> ${savedData.constructor.countryName}</div>
            <div class="summary-item"><b>Best pos:</b> ${savedData.constructor.best_championship_position ?? '-'}</div>
            <div class="summary-item"><b>Wins:</b> ${savedData.constructor.total_championship_wins}</div>
            <div class="summary-item"><b>Starts:</b> ${savedData.constructor.total_race_starts}</div>
            <div class="summary-item"><b>Podiums:</b> ${savedData.constructor.total_podiums}</div>
            <div class="summary-item"><b>Points:</b> ${savedData.constructor.total_points}</div>
            <div class="summary-item"><b>Poles:</b> ${savedData.constructor.total_pole_positions}</div>
          </div>
        </div>
      `);
    }
  }

    if(savedData.driver){
    if(savedData.driver.mode === 'custom'){
      const d = savedData.driver.data;
      parts.push(`
        <div class="summary-block" id="summary-driver">
          <button type="button" class="btn-delete-summary" onclick="removeItem('driver')" title="Remove">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>

          <h4>Driver (custom)</h4>
          <div class="summary-list">
            <div class="summary-item"><b>Name:</b> ${d.name}</div>
            <div class="summary-item"><b>DOB:</b> ${d.date_of_birth || '-'}</div>
            <div class="summary-item"><b>Wins:</b> ${d.total_championship_wins}</div>
            <div class="summary-item"><b>Starts:</b> ${d.total_race_starts}</div>
            <div class="summary-item"><b>Podiums:</b> ${d.total_podiums}</div>
            <div class="summary-item"><b>Points:</b> ${d.total_points}</div>
            <div class="summary-item"><b>Poles:</b> ${d.total_pole_positions}</div>
          </div>
        </div>
      `);
    } else {
      parts.push(`
        <div class="summary-block" id="summary-driver">
          <button type="button" class="btn-delete-summary" onclick="deleteSavedDriverFromDB()" title="Delete from DB">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>

          <h4>Driver (existing)</h4>
          <div class="summary-list">
            <div class="summary-item"><b>Name:</b> ${savedData.driver.name}</div>
            <div class="summary-item"><b>Nationality:</b> ${savedData.driver.nationality || '-'}</div>
            <div class="summary-item"><b>DOB:</b> ${savedData.driver.date_of_birth || '-'}</div>
            <div class="summary-item"><b>Wins:</b> ${savedData.driver.total_championship_wins}</div>
            <div class="summary-item"><b>Starts:</b> ${savedData.driver.total_race_starts}</div>
            <div class="summary-item"><b>Podiums:</b> ${savedData.driver.total_podiums}</div>
            <div class="summary-item"><b>Points:</b> ${savedData.driver.total_points}</div>
            <div class="summary-item"><b>Poles:</b> ${savedData.driver.total_pole_positions}</div>
            <div class="summary-item"><b>ID:</b> ${savedData.driver.id}</div>
          </div>
        </div>
      `);
    }
  }

  if(savedData.race){
      const r = savedData.race.data;
      const circuitSelect = document.getElementById('race_circuit');
      const circuitName = circuitSelect && r.circuit_id
        ? circuitSelect.querySelector(`option[value="${r.circuit_id}"]`)?.textContent || r.circuit_id
        : '-';
      parts.push(`
        <div class="summary-block" id="summary-race">
          <button type="button" class="btn-delete-summary" onclick="removeItem('race')" title="Remove">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
          <h4>Race (custom)</h4>
          <div class="summary-list">
            <div class="summary-item"><b>Name:</b> ${r.official_name}</div>
            <div class="summary-item"><b>Circuit:</b> ${circuitName}</div>
            <div class="summary-item"><b>Year:</b> ${r.year}</div>
            <div class="summary-item"><b>Round:</b> ${r.round}</div>
            <div class="summary-item"><b>Date:</b> ${r.date}</div>
            <div class="summary-item"><b>Format:</b> ${r.qualifying_format}</div>
            <div class="summary-item"><b>Laps:</b> ${r.laps}</div>
          </div>
        </div>
      `);
  }
  if(savedData.raceData?.length){
    parts.push(`
      <div class="summary-block">
        <h4>Race Data</h4>
        <div class="summary-list"><div class="summary-item"><b>Entries:</b> ${savedData.raceData.length}</div></div>
      </div>
    `);
  }

  wrap.innerHTML = parts.length ? parts.join('') : `<div class="summary-empty">No data saved yet. Save a section to see it here.</div>`;
}

function removeItem(type) {
    // 1. Veriyi temizle
    if (type === 'raceData') {
        savedData.raceData = [];
    } else {
        savedData[type] = null;
    }

    const block = document.getElementById(`summary-${type}`);
    if (block) {
        block.classList.add('summary-item-fade-out');
        setTimeout(() => {
            renderSummary();
        }, 300);
    } else {
        renderSummary();
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  // keep all sections collapsed initially
  document.querySelectorAll('.section-content').forEach(sec => sec.style.display = 'none');
  document.querySelectorAll('.section-header .chevron').forEach(ch => ch.style.transform = 'rotate(0deg)');

  // Constructor search listeners
  const search = document.getElementById('sectionSearch');
  if (search) {
    const debounced = debounce((v)=>fetchSectionOptions(v), 250);
    search.addEventListener('input', (e)=> debounced(e.target.value.trim()));
    // load first page blank
    fetchSectionOptions('');
  }

  // Race search listeners
  const raceSearch = document.getElementById('raceSearch');
  if (raceSearch) {
    const debouncedRace = debounce((v)=>fetchRaceOptions(v), 250);
    raceSearch.addEventListener('input', (e)=> debouncedRace(e.target.value.trim()));
    // load first page blank
    fetchRaceOptions('');
  }
    // Driver search listeners
  const driverSearch = document.getElementById('driverSearch');
  if (driverSearch) {
    const debouncedDriver = debounce((v)=>fetchDriverOptions(v), 250);
    driverSearch.addEventListener('input', (e)=> debouncedDriver(e.target.value.trim()));
    fetchDriverOptions('');
  }

  // Enhance native selects with themed custom selects for better UI
  enhanceThemedSelect('#constructor_country');
  enhanceThemedSelect('#race_circuit');
  enhanceThemedSelect('#race_qualifying_format');

  renderSummary();
});

// Simple debounce
function debounce(fn, delay){
  let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), delay); };
}

/* Themed custom select replacement (basic) */
function enhanceThemedSelect(selector){
  const sel = document.querySelector(selector);
  if(!sel || sel.dataset.themed === '1') return;

  // Only replace single-selects (skip multi size lists)
  if(sel.multiple) return;

  sel.dataset.themed = '1';
  sel.classList.add('themed-hidden-select');

  const wrapper = document.createElement('div'); wrapper.className = 'custom-select-wrapper';
  const trigger = document.createElement('button'); trigger.type = 'button'; trigger.className = 'custom-select-trigger';
  trigger.setAttribute('aria-haspopup','listbox');
  trigger.setAttribute('aria-expanded','false');

  const labelSpan = document.createElement('span'); labelSpan.className = 'custom-select-label';
  const arrow = document.createElement('span'); arrow.className = 'custom-select-arrow'; arrow.innerHTML = '\u25BE';
  trigger.appendChild(labelSpan); trigger.appendChild(arrow);

  const options = document.createElement('div'); options.className = 'custom-options'; options.style.display = 'none';

  // Build options list
  Array.from(sel.options).forEach((opt, idx) => {
    const item = document.createElement('div');
    item.className = 'custom-option' + (opt.disabled ? ' disabled' : '');
    item.setAttribute('data-value', opt.value);
    item.setAttribute('role','option');
    item.textContent = opt.textContent;
    if(opt.disabled) item.setAttribute('aria-disabled','true');
    if(opt.selected) { item.classList.add('active'); labelSpan.textContent = opt.textContent; }
    item.addEventListener('click', ()=>{
      if(opt.disabled) return;
      // sync to original select
      sel.value = opt.value;
      // update UI
      options.querySelectorAll('.custom-option').forEach(o=>o.classList.remove('active'));
      item.classList.add('active');
      labelSpan.textContent = opt.textContent;
      // close
      options.style.display = 'none'; trigger.setAttribute('aria-expanded','false');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    options.appendChild(item);
  });

  // default label
  if(!labelSpan.textContent) labelSpan.textContent = sel.selectedOptions[0]?.textContent || sel.options[0]?.textContent || '';

  trigger.addEventListener('click', (e)=>{
    e.preventDefault();
    const open = options.style.display !== 'block';
    // close other open selects
    document.querySelectorAll('.custom-options').forEach(o=>o.style.display='none');
    document.querySelectorAll('.custom-select-trigger').forEach(t=>t.setAttribute('aria-expanded','false'));
    options.style.display = open ? 'block' : 'none';
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // close when clicking outside
  document.addEventListener('click', (e)=>{
    if(!wrapper.contains(e.target)){
      options.style.display = 'none'; trigger.setAttribute('aria-expanded','false');
    }
  });

  wrapper.appendChild(trigger);
  wrapper.appendChild(options);
  sel.parentNode.insertBefore(wrapper, sel.nextSibling);
}

async function deleteSavedDriverFromDB(){
  if(!savedData.driver || savedData.driver.mode !== 'existing' || !savedData.driver.id){
    showToast('No existing driver to delete', 'warning');
    return;
  }

  const driverId = savedData.driver.id;

  try{
    const res = await fetch(`/api/delete-driver/${encodeURIComponent(driverId)}`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'}
    });

    const json = await res.json().catch(()=> ({}));

    if(!res.ok || json.success === false){
      throw new Error(json.error || 'Delete failed');
    }

    savedData.driver = null;
    renderSummary();
    showToast('Driver deleted successfully', 'success');
  }catch(e){
    showToast('Error deleting driver: ' + e.message, 'error');
    console.error(e);
  }
}
