let savedData = {
  constructor: null,
  driver: null,
  race: null,
  raceData: []
};

let sectionMode = 'custom'; // 'custom' | 'existing'
let raceMode = 'custom'; // 'custom' | 'existing'
let sectionSearchAbort = null;
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
    alert('Switch mode to "Add custom constructor" to use this form.');
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
  alert('Constructor (custom) saved locally. Use "Submit Data" to write to DB.');
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
    alert('Switch mode to "Select existing constructor" to use this.');
    return;
  }
  const select = document.getElementById('existingSectionSelect');
  if(!select || !select.value){
    alert('Please select a constructor from the list.');
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
    alert('Existing constructor selected with full details.');
  } catch(e) {
    alert('Error loading constructor details: ' + e.message);
    console.error(e);
  }
}


// Save custom race data (insert on submit)
function saveRace(){
  if (raceMode !== 'custom') {
    alert('Switch mode to "Add custom race" to use this form.');
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
  alert('Race (custom) saved locally. Use "Submit Data" to write to DB.');
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
    alert('Switch mode to "Select existing race" to use this.');
    return;
  }
  const select = document.getElementById('existingRaceSelect');
  if(!select || !select.value){
    alert('Please select a race from the list.');
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
    alert('Existing race selected with full details.');
  } catch(e) {
    alert('Error loading race details: ' + e.message);
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
        document.getElementById('constructorForm').reset();
        savedData.constructor = { mode:'existing', id: json.constructor_id, name: payload.name };
      } else {
        messages.push('Existing constructor selected.');
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
        document.getElementById('raceForm').reset();
        savedData.race = { mode:'existing', id: json.race_id, official_name: payload.official_name };
      } else {
        messages.push('Existing race selected.');
      }
    }

    if (messages.length === 0) {
      alert('No data to submit. Please save at least one section first.');
    } else {
      alert(messages.join('\n'));
    }

    renderSummary();
  }catch(err){
    alert('Error: ' + err.message);
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
        <div class="summary-block">
          <h4>Constructor (custom)</h4>
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
        <div class="summary-block">
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
    parts.push(`
      <div class="summary-block">
        <h4>Driver</h4>
        <div class="summary-list"><div class="summary-item">Saved</div></div>
      </div>
    `);
  }
  if(savedData.race){
    if(savedData.race.mode === 'custom'){
      const r = savedData.race.data;
      const circuitSelect = document.getElementById('race_circuit');
      const circuitName = circuitSelect && r.circuit_id
        ? circuitSelect.querySelector(`option[value="${r.circuit_id}"]`)?.textContent || r.circuit_id
        : '-';
      parts.push(`
        <div class="summary-block">
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
    } else {
      parts.push(`
        <div class="summary-block">
          <h4>Race (existing)</h4>
          <div class="summary-list">
            <div class="summary-item"><b>Name:</b> ${savedData.race.official_name || '-'}</div>
            <div class="summary-item"><b>Circuit:</b> ${savedData.race.circuit_name || '-'}</div>
            <div class="summary-item"><b>Year:</b> ${savedData.race.year ?? '-'}</div>
            <div class="summary-item"><b>Round:</b> ${savedData.race.round ?? '-'}</div>
            <div class="summary-item"><b>Date:</b> ${savedData.race.date || '-'}</div>
            <div class="summary-item"><b>Format:</b> ${savedData.race.qualifying_format || '-'}</div>
            <div class="summary-item"><b>Laps:</b> ${savedData.race.laps ?? '-'}</div>
          </div>
        </div>
      `);
    }
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

  renderSummary();
});

// Simple debounce
function debounce(fn, delay){
  let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), delay); };
}
