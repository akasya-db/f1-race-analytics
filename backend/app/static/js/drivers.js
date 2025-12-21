let currentDrivers = [];
let currentPage = 1;
let currentTopLimit = 10;


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
    const driverType = document.querySelector('input[name="driverType"]:checked')?.value;


    if (name) params.append("name", name);
    if (nationality) params.append("nationality", nationality);
    if (place) params.append("place_of_birth", place);
    if (winsMin) params.append("wins_min", winsMin);
    if (podiumsMin) params.append("podiums_min", podiumsMin);
    if (pointsMin) params.append("points_min", pointsMin);
    if (polesMin) params.append("poles_min", polesMin);
    if (birthFrom) params.append("birth_from", birthFrom);
    if (birthTo) params.append("birth_to", birthTo);
    if (driverType === "real") params.append("is_real", "true");
    if (driverType === "user") params.append("is_real", "false");


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
            <div class="team-info">
                <div class="name">${d.full_name}</div>

                <!-- ÜST SATIR: doğum yeri -->
                <div class="nation">
                   Born: ${d.nationality} •  ${d.place_of_birth || "-"}
                </div>

                <!-- ALT SATIR: doğum tarihi + wins yan yana -->
                <div style="display:flex; justify-content:space-between; gap:16px; margin-top:10px; align-items:flex-start;">
                    <div>
                        <div style="font-size:12px; opacity:.7; letter-spacing:.08em;">DATE OF BIRTH</div>
                        <div style="font-weight:600;">${d.date_of_birth || "-"}</div>
                    </div>

                    <div style="text-align:right;">
                        <div style="font-size:12px; opacity:.7; letter-spacing:.08em;">WINS</div>
                        <div style="font-weight:800; font-size:22px; line-height:1;">${d.total_race_wins ?? 0}</div>
                    </div>
                </div>
            </div>

            <button class="btn" type="button">View Driver</button>
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

    const prevDisabled = current_page === 1 ? "disabled" : "";
    const nextDisabled = current_page === total_pages ? "disabled" : "";

    html += `
        <button class="page-btn nav-btn" onclick="fetchDrivers(1)" ${prevDisabled}>&laquo;</button>
        <button class="page-btn nav-btn" onclick="fetchDrivers(${current_page - 1})" ${prevDisabled}>&lsaquo;</button>
    `;

    let start = Math.max(1, current_page - 3);
    let end = Math.min(total_pages, current_page + 3);

    if (current_page <= 4) {
        start = 1;
        end = Math.min(7, total_pages);
    }
    if (current_page > total_pages - 4) {
        end = total_pages;
        start = Math.max(1, total_pages - 6);
    }

    if (start > 1) {
        html += `<button class="page-btn dots">...</button>`;
    }

    for (let i = start; i <= end; i++) {
        html += `
            <button class="page-btn ${i === current_page ? "active" : ""}"
                onclick="fetchDrivers(${i})">${i}</button>
        `;
    }

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
        `${d.nationality} • Born in ${d.place_of_birth || "-"}`;

    document.getElementById("driverModalBody").innerHTML = `
        <div><strong>Date of Birth:</strong> ${d.date_of_birth}</div>
        ${d.date_of_death ? `<div><strong>Date of Death:</strong> ${d.date_of_death}</div>` : ""}
        <div><strong>Birthplace:</strong> ${d.place_of_birth || "-"}</div>
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
    const section = document.getElementById("leaderboardSection");
    const btn = document.getElementById("toggleLeaderboard");
    if (section && btn) {
    // default display:none ise, buton kırmızı başlasın
    if (section.style.display === "none" || getComputedStyle(section).display === "none") {
      btn.classList.add("btn-danger");
      btn.classList.remove("secondary");
      btn.textContent = "Show Leaderboard";
    }
  }
    document.querySelectorAll(".top-n-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".top-n-btn")
                .forEach(b => b.classList.remove("active"));

            btn.classList.add("active");
            currentTopLimit = btn.dataset.limit;
        });
    });
});


// ---------------- LEADERBOARD ----------------

document.getElementById("toggleLeaderboard").addEventListener("click", () => {
    const section = document.getElementById("leaderboardSection");
    const btn = document.getElementById("toggleLeaderboard");

    const isOpen = section.style.display !== "none";

    if (isOpen) {
        section.style.display = "none";
        btn.textContent = "Show Leaderboard";

        // kapalıyken KIRMIZI
        btn.classList.add("btn-danger");
        btn.classList.remove("secondary");
    } else {
        section.style.display = "block";
        btn.textContent = "Close Leaderboard";

        // açıkken NORMAL
        btn.classList.remove("btn-danger");
        btn.classList.add("secondary");
    }
});



document.getElementById("loadLeaderboard").addEventListener("click", async () => {
    const from = document.getElementById("leaderboardYearFrom").value;
    const to = document.getElementById("leaderboardYearTo").value;

    const tbody = document.getElementById("leaderboardTable");
    tbody.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;

    const params = new URLSearchParams();
    if (from) params.append("year_from", from);
    if (to) params.append("year_to", to);
    params.append("limit", currentTopLimit);


    try {
        const res = await fetch(`/api/driver-leaderboard?${params.toString()}`);
        const data = await res.json();

        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="5">No data found</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map((d, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${d.full_name}</td>
              <td>${d.championship_wins}</td>
              <td>${d.race_wins}</td>
              <td>${d.total_points}</td>
            </tr>
        `).join("");

    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="5">Error loading leaderboard</td></tr>`;
    }
});
