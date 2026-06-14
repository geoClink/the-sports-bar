document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("matrix-display-root");

    let allGames = [];
    let activeSport = "ALL";
    let nbaOffseasonData = null;
    let selectedDate = null;

    function buildDayButtons() {
        const container = document.getElementById("day-filter-buttons");
        if (!container) return;

        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
            const label = i === 0 ? "Today" : date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/New_York' });

            const btn = document.createElement("button");
            btn.className = "filter-btn" + (i === 0 ? " active-filter" : "");
            btn.textContent = label;
            btn.dataset.date = dateStr;

            btn.addEventListener("click", () => {
                document.querySelectorAll(".day-filters .filter-btn").forEach(b => b.classList.remove("active-filter"));
                btn.classList.add("active-filter");
                selectedDate = dateStr;
                loadGames();
            });

            container.appendChild(btn);
        }
    }

    async function loadGames() {
        root.innerHTML = `<p style="padding: 2rem; color: var(--fg-muted); font-family: var(--f-mono); font-size: 0.9rem;">Loading games...</p>`;

        const url = selectedDate ? `/api/v1/games?date=${selectedDate}` : "/api/v1/games";

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();
            if (!data.success) throw new Error("API returned failure");

            allGames = data.games;
            nbaOffseasonData = data.nbaOffseason;
            updateDashboard(data.activeLiveCount);
            renderGames(nbaOffseasonData);
        } catch (err) {
            root.innerHTML = `<p style="padding: 2rem; color: var(--fg-muted); font-family: var(--f-mono); font-size: 0.9rem;">Could not load games — make sure the server is running on port 3000.</p>`;
            console.error("Games fetch failed:", err);
        }
    }

    function updateDashboard(liveCount) {
        const upcoming = allGames.filter(g => !g.isLive).length;

        const liveValueEl = document.querySelector(".mini-stat-value.neon-amber");
        if (liveValueEl) liveValueEl.textContent = liveCount;

        const allStatValues = document.querySelectorAll(".mini-stat-value");
        if (allStatValues[1]) allStatValues[1].textContent = upcoming;

        const navIndicator = document.querySelector(".live-indicator");
        if (navIndicator) navIndicator.textContent = `${liveCount} LIVE`;
    }

    function renderGames(nbaOffseason = null) {
        const filtered = activeSport === "ALL"
            ? allGames
            : allGames.filter(g => g.sport === activeSport);

        if (filtered.length === 0) {
            const showNBABanner = nbaOffseason && (activeSport === "ALL" || activeSport === "NBA");
            if (showNBABanner) {
                root.innerHTML = renderOffseasonBanner(nbaOffseason);
                return;
            }
            const label = activeSport === "ALL" ? "today" : activeSport;
            root.innerHTML = `<p style="padding: 2rem; color: var(--fg-muted); font-family: var(--f-mono); font-size: 0.9rem;">No games scheduled ${label === "today" ? "today" : `for ${label} today`}.</p>`;
            return;
        }

        const rows = filtered.map(game => {
            const statusCell = game.isLive
                ? `<span class="status-badge-live">● LIVE</span>`
                : `<span class="col-data-status">${game.time}</span>`;

            return `
                <div class="matrix-row">
                    <span class="sport-badge">${game.sport}</span>
                    <span class="col-data-matchup">
                        ${game.awayTeam}
                        <span class="matchup-vs-divider">vs</span>
                        ${game.homeTeam}
                    </span>
                    <span class="col-data-time">${game.isLive || game.isFinal ? `${game.awayScore}–${game.homeScore}` : `—`}</span>
                    <span class="col-data-tv">${game.tvChannel}</span>
                    <span class="col-data-zone">${game.floorZone}</span>
                    <span>${statusCell}</span>
                </div>
            `;
        }).join("");

        const showNBABanner = nbaOffseason && (activeSport === "ALL" || activeSport === "NBA");

        root.innerHTML = `
            <div class="date-group-block">
                <div class="date-group-header">
                    <span class="date-title">Today</span>
                    <span class="game-count-label">${filtered.length} GAME${filtered.length !== 1 ? "S" : ""}</span>
                </div>
                <div class="matrix-table-frame">
                    <div class="matrix-header-row">
                        <span class="cdr-hdr">Sport</span>
                        <span class="cdr-hdr">Matchup</span>
                        <span class="cdr-hdr">Score / Time</span>
                        <span class="cdr-hdr">Channel</span>
                        <span class="cdr-hdr">Zone</span>
                        <span class="cdr-hdr">Status</span>
                    </div>
                    ${rows}
                </div>
            </div>
            ${showNBABanner ? renderOffseasonBanner(nbaOffseason) : ""}
        `;
    }

    function renderOffseasonBanner(config) {
        if (!config) return "";
        return `
            <div class="date-group-block" style="margin-top: 2rem;">
                <div class="date-group-header">
                    <span class="date-title">NBA</span>
                    <span class="game-count-label">OFFSEASON</span>
                </div>
                <div class="matrix-table-frame" style="padding: 2rem 1.5rem;">
                    <span class="sport-badge" style="margin-bottom: 1rem; display: inline-block;">NBA</span>
                    <p style="font-family: var(--f-display); font-size: 1.6rem; font-weight: 800; color: var(--fg); margin: 0.5rem 0;">
                        ${config.champion !== "TBD" ? `${config.champion} are the ${config.season} Champions.` : `${config.season} Champions TBD.`}
                    </p>
                    <p style="font-family: var(--f-mono); font-size: 0.85rem; color: var(--fg-muted); margin-top: 0.5rem;">
                        Next season tips off ${config.nextSeasonStart}.
                    </p>
                </div>
            </div>
        `;
    }

    document.querySelectorAll(".sport-filters .filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".sport-filters .filter-btn").forEach(b => b.classList.remove("active-filter"));
            btn.classList.add("active-filter");
            activeSport = btn.textContent.trim() === "All" ? "ALL" : btn.textContent.trim();
            renderGames(nbaOffseasonData);
        });
    });

    buildDayButtons();
    loadGames();
});
