let currentDrivers = [];
let currentPage = 1;

async function fetchDrivers(page = 1) {
    currentPage = page;

    const params = new URLSearchParams();
    params.append("page", page);

    const read = id => document.getElementById(id)?.value || "";

    const name = read("filterDriverName");
    const nationality = read("filterDriverNationality");
    const place = read("filterBirthPlace");
    const birthFrom = read("filterBirthYearFrom");
    const birthTo = read("filterBirthYearTo");
    const winsMin = read("filterWinsMin");
    const podiumsMin = read("filterPodiumsMin");
    const pointsMin = read("filterPointsMin");
    const polesMin = read("filterPolesMin");
    const isReal = document.getElementById("filterIsReal")?.checked;

    if (name) params.append("name", name);
    if (nationality) params.append("nationality", nationality);
    if (place) params.append("place_of_birth", place);
    if (winsMin) params.append("wins_min", winsMin);
    if (podiumsMin) params.append("podiums_min", podiumsMin);
    if (pointsMin) params.append("points_min", pointsMin);
    if (polesMin) params.append("poles_min", polesMin);
    if (birthFrom) params.append("birth_from", birthFrom);
    if (birthTo) params.append("birth_to", birthTo);
    if (isReal) params.append("is_real", "true");

    try {
        const res = await fetch(`/api/drivers?${params.toString()}`);
        if (!res.ok) throw new Error("fetch error");

        const data = await res.json();
        currentDrivers = data.drivers;

        renderDrivers(data.drivers);
        renderPagination(data.pagination);

    } catch (err) {
        console.error("Driver fetch error:", err);
        document.getElementById("driversGrid").innerHTML =
            `<p class="empty-state">Error loading drivers.</p>`;
    }
}

function renderDrivers(list) {
    const grid = document.getElementById("driversGrid");
    if (!list.length) {
        grid.innerHTML = `<p class="empty-state">No drivers found.</p>`;
        return;
    }

    grid.innerHTML = list.map(d => `
        <div class="card" onclick="openDriverModal('${d.id}')">
            <div class="logo-wrapper">
                <img class="logo" src="/static/img/driver_placeholder.png" alt="${d.full_name}" />
            </div>
            <div class="team-info">
                <div class="name">${d.full_name}</div>
                <div class="nation">${d.nationality} • Born: ${d.date_of_birth}</div>

                <div class="stats">
                    <div class="stat-item"><span class="stat-label">Wins</span><span class="stat-value">${d.total_race_wins}</span></div>
                    <div class="stat-item"><span class="stat-label">Podiums</span><span class="stat-value">${d.total_podiums}</span></div>
                    <div class="stat-item"><span class="stat-label">Points</span><span class="stat-value">${d.total_points}</span></div>
                    <div class="stat-item"><span class="stat-label">Poles</span><span class="stat-value">${d.total_pole_positions}</span></div>
                </div>
            </div>
            <button class="btn">View Driver</button>
        </div>
    `).join("");
}

function renderPagination(p) {
    const container = document.getElementById("pagination");
    if (!container) return;

    const { current_page, total_pages } = p;
    if (total_pages <= 1) {
        container.innerHTML = "";
        return;
    }

    let html = "";

    // Navigation buttons
    const prevDisabled = current_page === 1 ? "disabled" : "";
    const nextDisabled = current_page === total_pages ? "disabled" : "";

    html += `
        <button class="page-btn nav-btn" onclick="fetchDrivers(1)" ${prevDisabled}>&laquo;</button>
        <button class="page-btn nav-btn" onclick="fetchDrivers(${current_page - 1})" ${prevDisabled}>&lsaquo;</button>
    `;

    // Max 7 visible page buttons
    const maxButtons = 7;
    let start = Math.max(1, current_page - 3);
    let end = Math.min(total_pages, current_page + 3);

    // Adjust boundaries if near edges
    if (current_page <= 4) {
        start = 1;
        end = Math.min(7, total_pages);
    }
    if (current_page > total_pages - 4) {
        end = total_pages;
        start = Math.max(1, total_pages - 6);
    }

    // Show "..." before
    if (start > 1) {
        html += `<button class="page-btn dots">...</button>`;
    }

    // Page buttons
    for (let i = start; i <= end; i++) {
        html += `
            <button class="page-btn ${i === current_page ? "active" : ""}"
                onclick="fetchDrivers(${i})">${i}</button>
        `;
    }

    // Show "..." after
    if (end < total_pages) {
        html += `<button class="page-btn dots">...</button>`;
    }

    html += `
        <button class="page-btn nav-btn" onclick="fetchDrivers(${current_page + 1})" ${nextDisabled}>&rsaquo;</button>
        <button class="page-btn nav-btn" onclick="fetchDrivers(${total_pages})" ${nextDisabled}>&raquo;</button>
    `;

    container.innerHTML = html;
}


function setupDriverFilters() {
    const form = document.getElementById("driverFilters");
    form.addEventListener("submit", e => {
        e.preventDefault();
        fetchDrivers(1);
    });

    document.getElementById("resetDriverFilters").addEventListener("click", () => {
        form.reset();
        fetchDrivers(1);
    });
}

function openDriverModal(id) {
    const d = currentDrivers.find(x => x.id === id);
    if (!d) return;

    document.getElementById("driverModalTitle").textContent = d.full_name;
    document.getElementById("driverModalSubtitle").textContent =
        `${d.nationality} • Born in ${d.place_of_birth}`;

    document.getElementById("driverModalBody").innerHTML = `
        <div><strong>Date of Birth:</strong> ${d.date_of_birth}</div>
        ${d.date_of_death ? `<div><strong>Date of Death:</strong> ${d.date_of_death}</div>` : ""}
        <div><strong>Birthplace:</strong> ${d.place_of_birth}</div>
        <hr>
        <div><strong>Total Wins:</strong> ${d.total_race_wins}</div>
        <div><strong>Total Podiums:</strong> ${d.total_podiums}</div>
        <div><strong>Total Points:</strong> ${d.total_points}</div>
        <div><strong>Pole Positions:</strong> ${d.total_pole_positions}</div>
    `;

    document.getElementById("driverModal").classList.add("active");
}

function closeDriverModal() {
    document.getElementById("driverModal").classList.remove("active");
}

document.addEventListener("DOMContentLoaded", () => {
    setupDriverFilters();
    fetchDrivers();
});
