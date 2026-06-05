const config = window.PREDICTIVE_ENGINE_CONFIG || {};
const storageKeys = {
  session: "predictive_engine_supabase_session",
  tab: "predictive_engine_active_tab",
  matches: "predictive_engine_matches",
};

const initialMatches = [
  { id: "m1", date: "Today", dateStr: "OCT 24, 2024", teamA: "Team A", teamB: "Team B", kickoff: "20:00 (Local)", status: "locked", expectedA: 2, expectedB: 1, userGuessA: 2, userGuessB: 1 },
  { id: "m2", date: "Tomorrow", dateStr: "OCT 25, 2024", teamA: "Team E", teamB: "Team F", kickoff: "15:30 (Local)", status: "open", badge: "OPEN FOR ENTRIES" },
  { id: "m3", date: "Saturday", dateStr: "OCT 26, 2024", teamA: "Team C", teamB: "Team D", kickoff: "12:00 (Local)", status: "open", badge: "2 DAYS AWAY" },
  { id: "m4", date: "Saturday", dateStr: "OCT 26, 2024", teamA: "Team Alpha", teamB: "Team Bravo", kickoff: "18:00 (Local)", status: "open", badge: "2 DAYS AWAY" },
  { id: "m5", date: "Sunday", dateStr: "OCT 27, 2024", teamA: "Crestwood United", teamB: "Global Giants", kickoff: "17:00 (Local)", status: "open", badge: "3 DAYS AWAY" },
];

const state = {
  session: readJson(storageKeys.session, null),
  activeTab: localStorage.getItem(storageKeys.tab) || "calendar",
  matches: readJson(storageKeys.matches, initialMatches),
  alerts: [],
  dataApiStatus: "idle",
  dataApiPayload: null,
  profileOpen: false,
  mobileOpen: false,
  statsOpen: false,
  selectedDay: null,
  modelType: "neural",
  histWeight: 65,
  formWeight: 80,
  notificationsEnabled: true,
  risk: "moderate",
  settingsSubTab: "settings",
};

const app = document.getElementById("app");

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function icon(symbol) {
  const map = {
    calendar: "CAL",
    dashboard: "DASH",
    leaderboard: "RANK",
    settings: "SET",
    support: "HELP",
    logout: "OUT",
    menu: "MENU",
    bell: "!",
    user: "ME",
  };
  return `<span aria-hidden="true">${map[symbol] || symbol}</span>`;
}

function currentUserEmail() {
  return state.session?.user?.email || state.session?.email || "";
}

function getStats() {
  const predictedCount = state.matches.filter((match) => match.userGuessA !== undefined && match.userGuessB !== undefined).length;
  const bonus = state.matches.filter((match) => match.id !== "m1" && match.userGuessA !== undefined).length;
  return {
    upcomingMatches: 12,
    pendingGuesses: Math.max(0, 10 - predictedCount),
    accuracyTier: "A+",
    userPosition: Math.max(1, 14 - bonus),
    totalUsers: 2450,
    correctScores: 42 + bonus,
    correctOutcomes: 128 + bonus * 2,
  };
}

function notify(message) {
  state.alerts.push(message);
  render();
  window.setTimeout(() => {
    state.alerts.shift();
    render();
  }, 3800);
}

async function signInWithSupabase(email, password) {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error("Supabase Auth is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to .env.");
  }

  const response = await fetch(`${config.supabaseUrl.replace(/\/$/, "")}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
    },
    body: JSON.stringify({ email, password }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error_description || payload.msg || payload.error || "Supabase login failed.");
  }

  state.session = payload;
  writeJson(storageKeys.session, payload);
  await fetchDataApi();
  notify("Welcome back. Supabase session established.");
}

async function fetchDataApi() {
  if (!config.supabaseDataApi) {
    state.dataApiStatus = "missing";
    return;
  }

  state.dataApiStatus = "loading";
  render();

  try {
    const response = await fetch(config.supabaseDataApi, {
      headers: {
        Accept: "application/json",
        ...(state.session?.access_token ? { Authorization: `Bearer ${state.session.access_token}` } : {}),
        ...(config.supabaseAnonKey ? { apikey: config.supabaseAnonKey } : {}),
      },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.message || payload?.error || `Data API returned ${response.status}`);
    }
    state.dataApiStatus = "ready";
    state.dataApiPayload = payload;
  } catch (error) {
    state.dataApiStatus = "error";
    state.dataApiPayload = { message: error.message };
  }
  render();
}

function signOut() {
  state.session = null;
  state.activeTab = "calendar";
  state.dataApiPayload = null;
  state.dataApiStatus = "idle";
  localStorage.removeItem(storageKeys.session);
  localStorage.removeItem(storageKeys.tab);
  render();
}

function render() {
  if (!state.session) {
    renderLogin();
    return;
  }
  renderShell();
}

function renderLogin(error = "") {
  app.innerHTML = `
    <main class="auth-page">
      <section class="auth-card">
        <div class="brand-row" style="gap:12px">
          <div class="brand-mark">PE</div>
          <div>
            <h1>Predictive Engine</h1>
            <p class="muted" style="margin:4px 0 0">Sign in with your Supabase account</p>
          </div>
        </div>
        ${error ? `<div class="alert-error">${escapeHtml(error)}</div>` : ""}
        ${!config.supabaseUrl || !config.supabaseAnonKey ? `
          <div class="alert-error">
            Missing Supabase Auth config. Add SUPABASE_URL and SUPABASE_ANON_KEY to .env, then restart py server.py.
          </div>
        ` : ""}
        <form id="login-form" class="form-stack">
          <label>
            <span class="mono-label">Corporate Email</span>
            <input class="field" id="email" type="email" autocomplete="email" placeholder="user@company.com" required />
          </label>
          <label>
            <span class="mono-label">Password</span>
            <input class="field" id="password" type="password" autocomplete="current-password" placeholder="Supabase password" required />
          </label>
          <button class="primary-button" type="submit">Sign In With Supabase</button>
        </form>
        <div class="auth-footer">
          DATA API: ${config.supabaseDataApi ? "CONFIGURED" : "MISSING"} | AUTH API: ${config.supabaseUrl ? "CONFIGURED" : "MISSING"}
        </div>
      </section>
    </main>
  `;

  document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.target.querySelector("button");
    button.disabled = true;
    button.textContent = "Verifying Supabase session...";
    try {
      await signInWithSupabase(
        document.getElementById("email").value.trim(),
        document.getElementById("password").value,
      );
      render();
    } catch (authError) {
      renderLogin(authError.message);
    }
  });
}

function renderShell() {
  const stats = getStats();
  const title = {
    calendar: "Match Calendar",
    dashboard: "My Dashboard",
    leaderboard: "Global Leaderboard",
    settings: "System Settings",
    support: "Engine Support",
  }[state.activeTab];

  app.innerHTML = `
    <div class="app-shell">
      <div class="alerts">${state.alerts.map((alert) => `<div class="toast">${escapeHtml(alert)}</div>`).join("")}</div>
      ${renderSidebar()}
      <main class="main">
        <header class="topbar">
          <div class="row" style="gap:12px">
            <button class="icon-button mobile-menu" data-action="open-mobile">${icon("menu")}</button>
            <h1>${title}</h1>
          </div>
          <div class="row" style="gap:10px">
            <button class="icon-button" data-action="notify">${icon("bell")}<span class="notification-dot"></span></button>
            <span class="badge">Active Season: 2024/25</span>
            <button class="avatar" data-action="profile">${escapeHtml(currentUserEmail().slice(0, 2).toUpperCase() || "PE")}</button>
          </div>
        </header>
        <section class="content">${renderActiveTab(stats)}</section>
      </main>
      ${renderMobileBottom()}
      ${state.mobileOpen ? renderMobileDrawer() : ""}
      ${state.profileOpen ? renderProfileModal(stats) : ""}
      ${state.statsOpen ? renderStatsModal() : ""}
    </div>
  `;
  bindShellEvents();
}

function renderSidebar() {
  return `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-row" style="gap:10px"><div class="brand-mark">PE</div><span class="brand-title">Predictive Engine</span></div>
        <button class="profile-row" data-action="profile">
          <span class="avatar">${escapeHtml(currentUserEmail().slice(0, 2).toUpperCase() || "PE")}</span>
          <span><span class="profile-name">Predictive Analyst</span><span class="profile-email">${escapeHtml(currentUserEmail())}</span></span>
        </button>
      </div>
      <nav class="side-nav">
        ${navButton("calendar", "Match Calendar")}
        ${navButton("dashboard", "My Dashboard")}
        ${navButton("leaderboard", "Leaderboard")}
      </nav>
      <div class="side-actions">
        ${navButton("settings", "Settings")}
        ${navButton("support", "Support")}
        <button class="danger-button" data-action="signout">${icon("logout")} Sign Out</button>
      </div>
    </aside>
  `;
}

function navButton(tab, label) {
  return `<button class="nav-button ${state.activeTab === tab ? "active" : ""}" data-tab="${tab}">${icon(tab)} ${label}</button>`;
}

function renderMobileBottom() {
  return `
    <nav class="mobile-bottom">
      ${["calendar", "dashboard", "leaderboard"].map((tab) => `<button class="${state.activeTab === tab ? "active" : ""}" data-tab="${tab}">${tab}</button>`).join("")}
      <button data-action="profile">profile</button>
    </nav>
  `;
}

function renderMobileDrawer() {
  return `
    <div class="drawer-backdrop" data-action="close-mobile">
      <aside class="drawer" onclick="event.stopPropagation()">
        <div class="row" style="justify-content:space-between; margin-bottom:22px">
          <strong>Navigation</strong>
          <button class="icon-button" data-action="close-mobile">X</button>
        </div>
        <nav class="side-nav">
          ${["calendar", "dashboard", "leaderboard", "settings", "support"].map((tab) => navButton(tab, tab)).join("")}
        </nav>
        <button class="danger-button" data-action="signout" style="width:100%; margin-top:24px">Sign Out</button>
      </aside>
    </div>
  `;
}

function renderActiveTab(stats) {
  if (state.activeTab === "dashboard") return renderDashboard();
  if (state.activeTab === "leaderboard") return renderLeaderboard(stats);
  if (state.activeTab === "settings" || state.activeTab === "support") return renderSettingsSupport();
  return renderCalendar(stats);
}

function renderDataStatus() {
  const status = {
    idle: "Data API has not been called yet.",
    missing: "SUPABASE_DATA_API is missing from .env.",
    loading: "Fetching Supabase data...",
    ready: "Supabase data loaded successfully.",
    error: `Data API error: ${state.dataApiPayload?.message || "Unknown error"}`,
  }[state.dataApiStatus];

  return `
    <div class="card" style="margin-bottom:24px">
      <span class="mono-label">Supabase Data API</span>
      <div class="row" style="justify-content:space-between; gap:16px">
        <p class="muted" style="margin:0">${escapeHtml(status)}</p>
        <button class="secondary-button" data-action="fetch-data">Refresh Data</button>
      </div>
    </div>
  `;
}

function renderCalendar(stats) {
  const dates = [...new Set(state.matches.map((match) => match.date))];
  return `
    ${renderDataStatus()}
    <div class="grid-3">
      ${metricCard("Upcoming Matches", stats.upcomingMatches)}
      ${metricCard("Pending Guesses", String(stats.pendingGuesses).padStart(2, "0"))}
      ${metricCard("Accuracy Tier", `${stats.accuracyTier} <span style="font-size:12px;color:#059669">(TOP 1%)</span>`)}
    </div>
    <div class="section-stack">
      ${dates.map((date) => {
        const matches = state.matches.filter((match) => match.date === date);
        return `
          <section>
            <div class="date-header"><h2>${escapeHtml(date)}</h2><div class="rule"></div><span class="date-code">${escapeHtml(matches[0].dateStr)}</span></div>
            <div class="match-list">${matches.map(renderMatchCard).join("")}</div>
          </section>
        `;
      }).join("")}
    </div>
  `;
}

function metricCard(label, value) {
  return `<div class="card"><span class="mono-label">${label}</span><span class="metric-value">${value}</span></div>`;
}

function renderMatchCard(match) {
  const locked = match.status === "locked";
  return `
    <article class="match-card ${locked ? "locked" : ""}">
      ${locked ? `<div class="lock-ribbon">Lock Closed</div>` : ""}
      <div class="teams">
        ${teamBlock(match.teamA)}
        <span class="versus">vs</span>
        ${teamBlock(match.teamB)}
      </div>
      <div class="match-detail">
        <span class="match-state">${escapeHtml(locked ? "Live Calculation" : match.badge || "OPEN FOR ENTRIES")}</span>
        <span class="muted" style="font-size:12px">Kickoff: ${escapeHtml(match.kickoff)}</span>
      </div>
      <div class="row" style="gap:12px; justify-content:end">
        <div class="score-box">
          <input class="score-input" data-score="${match.id}:a" maxlength="2" ${locked ? "disabled" : ""} value="${escapeHtml(match.userGuessA ?? "")}" placeholder="${escapeHtml(locked ? match.expectedA ?? "-" : "-")}" />
          <strong>:</strong>
          <input class="score-input" data-score="${match.id}:b" maxlength="2" ${locked ? "disabled" : ""} value="${escapeHtml(match.userGuessB ?? "")}" placeholder="${escapeHtml(locked ? match.expectedB ?? "-" : "-")}" />
        </div>
        <button class="primary-button" ${locked ? "disabled" : ""} data-save-match="${match.id}">${locked ? "Locked" : "Save Guess"}</button>
      </div>
    </article>
  `;
}

function teamBlock(team) {
  return `<div class="team"><div class="shield">PE</div><span class="team-name">${escapeHtml(team)}</span></div>`;
}

function renderDashboard() {
  const confidence = (84.2 + (state.histWeight - 65) * 0.15 + (state.formWeight - 80) * 0.08 + (state.modelType === "bayesian" ? -3.4 : state.modelType === "linear" ? -7.8 : 0)).toFixed(1);
  const days = [
    [28, true], [29, true], [30, true], [1], [2, false, "MATCH #A21"], [3], [4],
    [5], [6], [7, false, "MAJOR EVENT", "major"], [8], [9], [10], [11],
  ];
  return `
    ${renderDataStatus()}
    <div class="dashboard-grid">
      <div class="card">
        <div class="row" style="justify-content:space-between; gap:16px; border-bottom:1px solid #f2f4f6; padding-bottom:16px">
          <div><span class="mono-label">Prediction Confidence</span><span class="metric-value">${confidence}%</span></div>
          <div class="switcher">${["neural", "bayesian", "linear"].map((type) => `<button class="${state.modelType === type ? "active" : ""}" data-model="${type}">${type}</button>`).join("")}</div>
        </div>
        <p class="muted">Adjust historical weights and team form metrics below for real-time recalibration.</p>
        <div class="slider-grid">
          ${rangeControl("Historical Data Weight", "hist", state.histWeight, 40, 90)}
          ${rangeControl("Form Recency Weight", "form", state.formWeight, 50, 100)}
        </div>
      </div>
      <div class="dark-card">
        <span class="mono-label" style="color:#9ca3af">Active Sessions</span>
        <span class="metric-value" style="color:white">12</span>
        <p style="color:#9ca3af; font-family:var(--font-mono); font-size:10px">CALIBRATION SERVER ACTIVE | LATENCY 4MS</p>
      </div>
    </div>
    <div class="tabs" style="margin-top:32px">
      <button class="tab-button" data-tab="calendar">Match Calendar</button>
      <button class="tab-button active">My Dashboard</button>
      <button class="tab-button" data-tab="leaderboard">Leaderboard</button>
    </div>
    <div class="calendar-layout" style="margin-top:24px">
      <div class="card">
        <h3>September 2023</h3>
        <div class="month-grid">
          ${["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => `<div class="day-head">${day}</div>`).join("")}
          ${days.map(([num, prev, event, type]) => `<button class="day-cell ${prev ? "prev" : ""} ${state.selectedDay === num && !prev ? "selected" : ""}" ${prev ? "disabled" : ""} data-day="${num}"><span>${num}</span>${event ? `<span class="event ${type === "major" ? "major" : ""}">${event}</span>` : ""}</button>`).join("")}
        </div>
        ${state.selectedDay ? `<p class="muted"><strong>Sept ${state.selectedDay}, 2023</strong> selected. Predictive confidence status is optimal.</p>` : ""}
      </div>
      <div class="card">
        <h3>Upcoming Predictions</h3>
        <p><strong>Team Alpha vs Bravo</strong> <span class="badge">High</span></p>
        <p class="muted">Crestwood United <span class="badge">Mid</span></p>
        <p class="muted">Global Giants <span class="badge">Low</span></p>
        <button class="secondary-button" data-tab="calendar">Navigate to Fixtures</button>
      </div>
    </div>
  `;
}

function rangeControl(label, name, value, min, max) {
  return `<label><span class="mono-label">${label}: ${value}%</span><input class="range" type="range" min="${min}" max="${max}" value="${value}" data-range="${name}" /></label>`;
}

function renderLeaderboard(stats) {
  const users = [
    [1, "JD", "jane.data@analytics.io", 12450],
    [2, "MS", "mark.stat@predict.com", 11820],
    [3, "AW", "alice.w@logic.net", 10950],
    [4, "CB", "charlie.bravo@defense.gov", 9400],
    [5, "ES", "elena.s@neural.ai", 8210],
  ];
  return `
    ${renderDataStatus()}
    <div class="leaderboard-layout">
      <section>
        <h2>Global Leaderboard</h2>
        <p class="muted">Seasonal ranking of the top predictive analysts.</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Rank</th><th>User Profile</th><th>Points</th></tr></thead>
            <tbody>
              ${users.map(([rank, initials, email, points]) => `<tr><td class="rank">#${rank}</td><td><span class="avatar" style="display:inline-grid;margin-right:12px">${initials}</span><strong>${email}</strong></td><td><strong>${points.toLocaleString()}</strong></td></tr>`).join("")}
              <tr class="leader-row-current"><td class="rank">#${stats.userPosition}</td><td><span class="avatar" style="display:inline-grid;margin-right:12px">${escapeHtml(currentUserEmail().slice(0, 2).toUpperCase())}</span><strong>${escapeHtml(currentUserEmail())}</strong> <span class="badge">You</span></td><td><strong>7,840</strong></td></tr>
            </tbody>
          </table>
        </div>
      </section>
      <aside class="side-panel">
        <h2>Your Performance</h2>
        <p class="muted" style="color:#9ca3af">Current Season Ranking</p>
        <div class="card" style="background:#111827;color:white;border-color:#1f2937"><span class="mono-label" style="color:#9ca3af">Position</span><span class="metric-value" style="color:white">${stats.userPosition}</span><span>/ ${stats.totalUsers.toLocaleString()} users</span></div>
        <p>Correct Scores: <strong>${stats.correctScores}</strong></p>
        <p>Correct Outcomes: <strong>${stats.correctOutcomes}</strong></p>
        <button class="primary-button" data-action="stats" style="background:white;color:black;width:100%">Analyze Stats History</button>
      </aside>
    </div>
  `;
}

function renderSettingsSupport() {
  state.settingsSubTab = state.activeTab === "support" ? "support" : state.settingsSubTab;
  return `
    <div class="tabs">
      <button class="tab-button ${state.settingsSubTab === "settings" ? "active" : ""}" data-subtab="settings">System Settings</button>
      <button class="tab-button ${state.settingsSubTab === "support" ? "active" : ""}" data-subtab="support">Engine Support</button>
    </div>
    <div style="margin-top:24px">${state.settingsSubTab === "support" ? renderSupport() : renderSettings()}</div>
  `;
}

function renderSettings() {
  return `
    <div class="settings-grid">
      <section class="card">
        <h3>Algorithmic Configuration</h3>
        <label><span class="mono-label">Active Predictive Model</span><select class="select"><option>Naive Bayesian Inference</option><option>Stratos Neural Tensor V2</option><option>Multivariate Logistic Regression</option></select></label>
        <div style="margin-top:18px"><span class="mono-label">Calculated Risk Vector</span><div class="slider-grid">${["conservative", "moderate", "aggressive"].map((risk) => `<button class="pill-button ${state.risk === risk ? "active" : ""}" data-risk="${risk}">${risk}</button>`).join("")}</div></div>
        <div class="row" style="justify-content:space-between;margin-top:20px;background:#f8fafc;padding:16px;border:1px solid #eceef0">
          <span><strong>System Alert Subscriptions</strong><br><small class="muted">Receive instant alerts on recalibrations.</small></span>
          <button class="toggle ${state.notificationsEnabled ? "on" : ""}" data-action="toggle-notifications"><span></span></button>
        </div>
      </section>
      <aside class="side-panel"><h3>Config Authority</h3><p style="color:#9ca3af">Changing metrics recalibrates raw tensors instantly on sandbox servers.</p><p class="badge">Security protocol OK</p></aside>
    </div>
  `;
}

function renderSupport() {
  return `
    <div class="support-grid">
      <section class="card">
        <h3>Submit Security & Analytical Assistance Ticket</h3>
        <form id="support-form" class="form-stack">
          <label><span class="mono-label">Query Category Subject</span><input class="field" required placeholder="e.g. Recalibration lag query" /></label>
          <label><span class="mono-label">Detailed Analytics Problem Description</span><textarea class="textarea" required placeholder="Enter description of error coordinates..."></textarea></label>
          <button class="primary-button" type="submit">Transmit Ticket</button>
        </form>
      </section>
      <aside class="card"><h3>Support Resources</h3><p class="muted">Review model calculations before raising support queries.</p><span class="mono-label">Emergency Line IP</span><strong>10.24.1.25:3000</strong></aside>
    </div>
  `;
}

function renderProfileModal(stats) {
  return `
    <div class="modal-backdrop" data-action="close-profile">
      <section class="modal" onclick="event.stopPropagation()">
        <div class="modal-title"><h3>Predictive Analyst</h3><button class="icon-button" data-action="close-profile">X</button></div>
        <div class="row" style="gap:14px;margin:22px 0"><span class="avatar">${escapeHtml(currentUserEmail().slice(0, 2).toUpperCase())}</span><div><strong>${escapeHtml(currentUserEmail())}</strong><br><span class="muted">Supabase authenticated session</span></div></div>
        <div class="grid-3" style="grid-template-columns:1fr 1fr"><div class="card"><span class="mono-label">Role Type</span><strong>Lead Analyst</strong></div><div class="card"><span class="mono-label">Level Standing</span><strong>Tier ${stats.accuracyTier}</strong></div></div>
        <button class="primary-button" data-action="close-profile" style="width:100%;margin-top:18px">Close Profile</button>
      </section>
    </div>
  `;
}

function renderStatsModal() {
  const rounds = [[1, 480, 310], [2, 520, 340], [3, 610, 395], [4, 490, 350], [5, 710, 410], [6, 680, 430]];
  return `
    <div class="modal-backdrop" data-action="close-stats">
      <section class="modal" onclick="event.stopPropagation()">
        <div class="modal-title"><h3>Predictive Stats Performance History</h3><button class="icon-button" data-action="close-stats">X</button></div>
        ${rounds.map(([round, score, avg]) => `<div class="history-row"><div class="row" style="justify-content:space-between"><span class="mono-label">Round ${round}</span><small>Your points: ${score} | Avg: ${avg}</small></div><div class="bar-box"><div class="bar" style="width:${score / 7.5}%"></div><div class="bar avg" style="width:${avg / 7.5}%"></div></div></div>`).join("")}
        <button class="primary-button" data-action="close-stats" style="float:right">Close Analysis</button>
      </section>
    </div>
  `;
}

function bindShellEvents() {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      state.mobileOpen = false;
      localStorage.setItem(storageKeys.tab, state.activeTab);
      render();
    });
  });

  document.querySelectorAll("[data-action]").forEach((element) => {
    element.addEventListener("click", async () => {
      const action = element.dataset.action;
      if (action === "signout") signOut();
      if (action === "profile") { state.profileOpen = true; render(); }
      if (action === "close-profile") { state.profileOpen = false; render(); }
      if (action === "open-mobile") { state.mobileOpen = true; render(); }
      if (action === "close-mobile") { state.mobileOpen = false; render(); }
      if (action === "notify") notify("All predictive calibration filters are correctly optimized.");
      if (action === "stats") { state.statsOpen = true; render(); }
      if (action === "close-stats") { state.statsOpen = false; render(); }
      if (action === "fetch-data") await fetchDataApi();
      if (action === "toggle-notifications") { state.notificationsEnabled = !state.notificationsEnabled; render(); }
    });
  });

  document.querySelectorAll("[data-score]").forEach((input) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/[^0-9]/g, "");
    });
  });

  document.querySelectorAll("[data-save-match]").forEach((button) => {
    button.addEventListener("click", () => {
      const matchId = button.dataset.saveMatch;
      const inputA = document.querySelector(`[data-score="${matchId}:a"]`);
      const inputB = document.querySelector(`[data-score="${matchId}:b"]`);
      if (!inputA.value || !inputB.value) {
        notify("Enter both score values before saving.");
        return;
      }
      state.matches = state.matches.map((match) => match.id === matchId ? { ...match, userGuessA: Number(inputA.value), userGuessB: Number(inputB.value), badge: "PREDICTION LOCKED" } : match);
      writeJson(storageKeys.matches, state.matches);
      notify("Guess logged. Probability metrics updated.");
      render();
    });
  });

  document.querySelectorAll("[data-model]").forEach((button) => {
    button.addEventListener("click", () => { state.modelType = button.dataset.model; render(); });
  });

  document.querySelectorAll("[data-range]").forEach((range) => {
    range.addEventListener("input", () => {
      if (range.dataset.range === "hist") state.histWeight = Number(range.value);
      if (range.dataset.range === "form") state.formWeight = Number(range.value);
      render();
    });
  });

  document.querySelectorAll("[data-day]").forEach((day) => {
    day.addEventListener("click", () => {
      const value = Number(day.dataset.day);
      state.selectedDay = state.selectedDay === value ? null : value;
      render();
    });
  });

  document.querySelectorAll("[data-risk]").forEach((button) => {
    button.addEventListener("click", () => { state.risk = button.dataset.risk; render(); });
  });

  document.querySelectorAll("[data-subtab]").forEach((button) => {
    button.addEventListener("click", () => { state.settingsSubTab = button.dataset.subtab; render(); });
  });

  const supportForm = document.getElementById("support-form");
  if (supportForm) {
    supportForm.addEventListener("submit", (event) => {
      event.preventDefault();
      supportForm.innerHTML = `<div class="alert-error" style="background:#d1fae5;color:#065f46;border-color:#a7f3d0">Ticket received and registered.</div>`;
    });
  }
}

if (state.session) {
  fetchDataApi();
} else {
  render();
}
