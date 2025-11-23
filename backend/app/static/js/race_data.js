// backend/app/static/js/race_data.js
// Mock `race_data` verisi (DB yoksa frontend üzerinden test etmek için)
// Alanlar: id, race_id, driver_id, driver_name, constructor_id, constructor_name,
// position_display_order, driver_number, race_points, race_pole_position,
// race_qualification_position_number, race_grid_position_number, is_real, created_at
const raceDataMock = [
  // Bahrain 2024
  {
    id: 1001,
    race_id: 1,
    driver_id: 'hamilton',
    driver_name: 'Lewis Hamilton',
    constructor_id: 'mercedes',
    constructor_name: 'Mercedes',
    position_display_order: 1,
    driver_number: '44',
    race_points: 25.0,
    race_pole_position: true,
    race_qualification_position_number: 1,
    race_grid_position_number: 1,
    is_real: true,
    created_at: '2024-03-02T15:00:00Z'
  },
  {
    id: 1002,
    race_id: 1,
    driver_id: 'vettel',
    driver_name: 'Sebastian Vettel',
    constructor_id: 'aston_martin',
    constructor_name: 'Aston Martin',
    position_display_order: 2,
    driver_number: '5',
    race_points: 18.0,
    race_pole_position: false,
    race_qualification_position_number: 2,
    race_grid_position_number: 2,
    is_real: true,
    created_at: '2024-03-02T15:05:00Z'
  },
  {
    id: 1003,
    race_id: 1,
    driver_id: 'alonso',
    driver_name: 'Fernando Alonso',
    constructor_id: 'aston_martin',
    constructor_name: 'Aston Martin',
    position_display_order: 3,
    driver_number: '14',
    race_points: 15.0,
    race_pole_position: false,
    race_qualification_position_number: 3,
    race_grid_position_number: 3,
    is_real: true,
    created_at: '2024-03-02T15:10:00Z'
  },
  // Example: Monaco 2023 (id:4)
  {
    id: 2001,
    race_id: 4,
    driver_id: 'leclerc',
    driver_name: 'Charles Leclerc',
    constructor_id: 'ferrari',
    constructor_name: 'Ferrari',
    position_display_order: 1,
    driver_number: '16',
    race_points: 25.0,
    race_pole_position: false,
    race_qualification_position_number: 1,
    race_grid_position_number: 1,
    is_real: true,
    created_at: '2023-05-28T14:00:00Z'
  }
  // Daha fazla mock satır gerekirse buraya ekleyebilirsin
];

// Expose to the global scope explicitly for non-module environment
window.raceDataMock = raceDataMock;
