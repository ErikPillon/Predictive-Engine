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
  authMode: "signin",
  authNotice: "",
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
  const matches = state.matches || [];
  const upcomingMatches = matches.length;
  const predictedCount = matches.filter((match) => 
    (match.userGuessA !== undefined && match.userGuessA !== null && match.userGuessA !== "") && 
    (match.userGuessB !== undefined && match.userGuessB !== null && match.userGuessB !== "")
  ).length;
  
  const pendingGuesses = Math.max(0, upcomingMatches - predictedCount);
  
  // Calculate accuracy based on matches that have results (expected scores)
  const completedMatches = matches.filter(m => 
    (m.expectedA !== undefined && m.expectedA !== null && m.expectedA !== "") && 
    (m.expectedB !== undefined && m.expectedB !== null && m.expectedB !== "")
  );
  const correctScores = completedMatches.filter(m => 
    Number(m.userGuessA) === Number(m.expectedA) && 
    Number(m.userGuessB) === Number(m.expectedB)
  ).length;
  
  let accuracyTier = "A+";
  if (completedMatches.length > 0) {
    const ratio = correctScores / completedMatches.length;
    if (ratio > 0.8) accuracyTier = "S";
    else if (ratio > 0.5) accuracyTier = "A+";
    else if (ratio > 0.3) accuracyTier = "A";
    else accuracyTier = "B";
  }

  const bonus = matches.filter((match) => match.id !== "m1" && (match.userGuessA !== undefined && match.userGuessA !== null)).length;
  return {
    upcomingMatches,
    pendingGuesses,
    accuracyTier,
    userPosition: Math.max(1, 14 - bonus),
    totalUsers: 2450,
    correctScores: correctScores,
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

async function signUpWithSupabase(email, password) {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error("Supabase Auth is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to .env.");
  }

  const response = await fetch(`${config.supabaseUrl.replace(/\/$/, "")}/auth/v1/signup`, {
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
    throw new Error(payload.error_description || payload.msg || payload.error || "Supabase sign-up failed.");
  }

  if (payload.access_token) {
    state.session = payload;
    writeJson(storageKeys.session, payload);
    await fetchDataApi();
    notify("Account created. Supabase session established.");
    return;
  }

  state.authMode = "signin";
  state.authNotice = "Account created. Check your email to confirm the account, then sign in.";
}

async function fetchDataApi() {
  if (!config.supabaseDataApi) {
    state.dataApiStatus = "missing";
    return;
  }

  state.dataApiStatus = "loading";
  render();

  try {
    let apiUrl = config.supabaseDataApi;
    // Ensure we are hitting the matches table with a join on predictions
    if (apiUrl.endsWith("/rest/v1/") || apiUrl.endsWith("/rest/v1")) {
      apiUrl = `${apiUrl.replace(/\/$/, "")}/matches?select=*,predictions(*)`;
    } else if (!apiUrl.includes("select=")) {
      const separator = apiUrl.includes("?") ? "&" : "?";
      apiUrl = `${apiUrl}${separator}select=*,predictions(*)`;
    }

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${state.session?.access_token || config.supabaseAnonKey}`,
      },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.message || payload?.error || `Data API returned ${response.status}`);
    }

    if (Array.isArray(payload)) {
      state.matches = payload.map((m) => {
        const d = new Date(m.kickoff_time || m.kickoff_date || m.date);
        // Extract prediction if available (Supabase join returns an array)
        const prediction = Array.isArray(m.predictions) ? m.predictions[0] : null;
        
        return {
          id: String(m.id || Math.random()),
          date: m.kickoff_date || m.date || "Upcoming",
          dateStr: isNaN(d.getTime()) ? (m.date || "TBD") : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase(),
          teamA: m.team_home || m.teamA || "TBD",
          teamB: m.team_away || m.teamB || "TBD",
          kickoff: m.time || m.kickoff || "TBD",
          kickoff_time: m.kickoff_time || m.kickoff_date || m.date,
          status: m.status || "open",
          badge: m.badge || (prediction ? "PREDICTED" : "SYNCED"),
          userGuessA: prediction ? prediction.user_guess_a : (m.user_guess_a ?? m.userGuessA),
          userGuessB: prediction ? prediction.user_guess_b : (m.user_guess_b ?? m.userGuessB),
          expectedA: m.expected_a ?? m.expectedA,
          expectedB: m.expected_b ?? m.expectedB,
        };
      });
      writeJson(storageKeys.matches, state.matches);
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
  const isSignup = state.authMode === "signup";
  app.innerHTML = `
    <main class="auth-page">
      <section class="auth-card">
        <div class="brand-row" style="gap:12px">
          <div class="brand-mark">PE</div>
          <div>
            <h1>Predictive Engine</h1>
            <p class="muted" style="margin:4px 0 0">${isSignup ? "Create a Supabase account to start predicting" : "Sign in with your Supabase account"}</p>
          </div>
        </div>
        ${error ? `<div class="alert-error">${escapeHtml(error)}</div>` : ""}
        ${state.authNotice ? `<div class="alert-error" style="background:#d1fae5;color:#065f46;border-color:#a7f3d0">${escapeHtml(state.authNotice)}</div>` : ""}
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
            <input class="field" id="password" type="password" autocomplete="${isSignup ? "new-password" : "current-password"}" placeholder="${isSignup ? "Choose a password" : "Supabase password"}" minlength="6" required />
          </label>
          <button class="primary-button" type="submit">${isSignup ? "Create Account" : "Sign In With Supabase"}</button>
        </form>
        <button class="ghost-button" id="auth-mode-toggle" style="margin-top:16px;width:100%;min-height:36px">
          ${isSignup ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
        <div class="auth-footer">
          DATA API: ${config.supabaseDataApi ? "CONFIGURED" : "MISSING"} | AUTH API: ${config.supabaseUrl ? "CONFIGURED" : "MISSING"}
        </div>
      </section>
    </main>
  `;

  document.getElementById("auth-mode-toggle").addEventListener("click", () => {
    state.authMode = isSignup ? "signin" : "signup";
    state.authNotice = "";
    renderLogin();
  });

  document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.target.querySelector("button");
    button.disabled = true;
    button.textContent = isSignup ? "Creating account..." : "Verifying Supabase session...";
    try {
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      if (isSignup) {
        await signUpWithSupabase(email, password);
      } else {
        await signInWithSupabase(email, password);
      }
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
        <div class="brand-row" style="gap:12px">
          <div class="brand-mark">PE</div>
          <span>
            <span class="brand-title">Predictive Engine</span>
            <span class="brand-kicker">Corporate Intelligence</span>
          </span>
        </div>
        <button class="profile-row nav-glass" data-action="profile">
          <span class="avatar">${escapeHtml(currentUserEmail().slice(0, 2).toUpperCase() || "PE")}</span>
          <span>
            <span class="profile-name">Predictive Analyst</span>
            <span class="profile-email">${escapeHtml(currentUserEmail())}</span>
          </span>
        </button>
      </div>
      <div class="nav-section-label">Workspace</div>
      <nav class="side-nav">
        ${navButton("calendar", "Match Calendar")}
        ${navButton("dashboard", "My Dashboard")}
        ${navButton("leaderboard", "Leaderboard")}
      </nav>
      <div class="nav-health-card">
        <span class="health-dot"></span>
        <div>
          <strong>Supabase Link</strong>
          <span>${config.supabaseKeyType || "configured"} key active</span>
        </div>
      </div>
      <div class="side-actions">
        <div class="nav-section-label">Operations</div>
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
  const now = new Date();
  const isLocked = (m) => m.status === "locked" || (m.kickoff_time && new Date(m.kickoff_time) < now);

  const sortedMatches = [...state.matches].sort((a, b) => {
    const timeA = new Date(a.kickoff_time || a.date).getTime();
    const timeB = new Date(b.kickoff_time || b.date).getTime();
    
    // Primary sort: Date/Time Descending
    if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) return timeB - timeA;
    
    // Secondary sort: Locked status (though descending time usually handles this)
    const lockA = isLocked(a);
    const lockB = isLocked(b);
    if (lockA !== lockB) return lockA ? -1 : 1;
    return 0;
  });

  const dates = [...new Set(sortedMatches.map((match) => match.date))];
  return `
    ${renderDataStatus()}
    <div class="grid-3">
      ${metricCard("Upcoming Matches", stats.upcomingMatches, "metric-value-matches")}
      ${metricCard("Pending Guesses", String(stats.pendingGuesses).padStart(2, "0"), "metric-value-guesses")}
      ${metricCard("Accuracy Tier", `${stats.accuracyTier} <span style="font-size:12px;color:#059669">(TOP 1%)</span>`, "metric-value-tier")}
    </div>
    <div class="section-stack">
      ${sortedMatches.length === 0 ? `
        <div class="card" style="text-align: center; padding: 48px; border: 1px dashed var(--line-dark)">
          <p class="muted" style="margin-bottom: 16px">No matches detected in the current predictive cycle.</p>
          <button class="primary-button" data-action="fetch-data">Sync with Supabase</button>
        </div>
      ` : dates.map((date) => {
        const matchesForDate = sortedMatches.filter((match) => match.date === date);
        return `
          <section>
            <div class="date-header"><h2>${escapeHtml(date)}</h2><div class="rule"></div><span class="date-code">${escapeHtml(matchesForDate[0].dateStr)}</span></div>
            <div class="match-list">${matchesForDate.map(renderMatchCard).join("")}</div>
          </section>
        `;
      }).join("")}
    </div>
  `;
}

function metricCard(label, value, id) {
  return `<div class="card"><span class="mono-label">${label}</span><span class="metric-value" ${id ? `id="${id}"` : ""}>${value}</span></div>`;
}

function renderMatchCard(match) {
  const now = new Date();
  const isExpired = match.kickoff_time && new Date(match.kickoff_time) < now;
  const locked = match.status === "locked" || isExpired;
  
  const hasGuess = (match.userGuessA !== undefined && match.userGuessA !== null && match.userGuessA !== "") || 
                   (match.userGuessB !== undefined && match.userGuessB !== null && match.userGuessB !== "");
  
  return `
    <article class="match-card ${locked ? "locked" : ""}">
      ${locked ? `<div class="lock-ribbon">${hasGuess ? "PREDICTION RECORDED" : "LOCK CLOSED"}</div>` : ""}
      <div class="teams">
        ${teamBlock(match.teamA)}
        <span class="versus">vs</span>
        ${teamBlock(match.teamB)}
      </div>
      <div class="match-detail">
        <span class="match-state">${escapeHtml(locked ? (isExpired ? "Match Started" : "Live Calculation") : match.badge || "OPEN FOR ENTRIES")}</span>
        <span class="muted" style="font-size:12px">Kickoff: ${escapeHtml(match.kickoff)}</span>
      </div>
      <div class="row" style="gap:12px; justify-content:end">
        <div class="score-box" style="${hasGuess ? "border-color: #10b981; background: #f0fdf4" : ""}">
          <input class="score-input" data-score="${match.id}:a" maxlength="2" ${locked ? "disabled" : ""} value="${escapeHtml(match.userGuessA ?? "")}" placeholder="${escapeHtml(locked ? match.expectedA ?? "-" : "-")}" />
          <strong>:</strong>
          <input class="score-input" data-score="${match.id}:b" maxlength="2" ${locked ? "disabled" : ""} value="${escapeHtml(match.userGuessB ?? "")}" placeholder="${escapeHtml(locked ? match.expectedB ?? "-" : "-")}" />
        </div>
        <button class="primary-button" ${locked ? "disabled" : ""} data-save-match="${match.id}">${locked ? "Locked" : (hasGuess ? "Update Guess" : "Save Guess")}</button>
      </div>
    </article>
  `;
}

function getFlagUrl(team) {
  if (!team) return "";
  const filename = team.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  return `/assets/flags/${filename}.svg`;
}

function teamBlock(team) {
  const flagUrl = getFlagUrl(team);
  return `
    <div class="team">
      <div class="shield">
        <img src="${flagUrl}" alt="${escapeHtml(team)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid'" style="width:100%; height:100%; object-fit:cover; border-radius:inherit" />
        <div class="flag-placeholder" style="display:none">PE</div>
      </div>
      <span class="team-name">${escapeHtml(team)}</span>
    </div>
  `;
}

function renderDashboard() {
  const pastMatches = state.matches.filter(m => {
    const isPast = m.kickoff_time && new Date(m.kickoff_time) < new Date();
    const hasGuess = (m.userGuessA !== undefined && m.userGuessA !== null && m.userGuessA !== "");
    return isPast && hasGuess;
  }).sort((a, b) => new Date(b.kickoff_time) - new Date(a.kickoff_time));

  return `
    ${renderDataStatus()}
    <div class="dashboard-grid" style="grid-template-columns: 1fr">
      <div class="card elegant-card">
        <div class="row" style="justify-content:space-between; margin-bottom: 24px">
          <div>
            <h3 class="elegant-title">Analytical Performance</h3>
            <p class="muted">Historical accuracy and prediction archives.</p>
          </div>
          <span class="badge">Archives Verified</span>
        </div>
        
        <div class="expandable-section">
          <button class="expand-toggle" data-action="toggle-past">
            <span>Past Predictions & Results</span>
            <span class="icon">${icon("menu")}</span>
          </button>
          <div class="expand-content ${state.pastPredictionsOpen ? "open" : ""}">
            ${pastMatches.length === 0 ? `
              <div class="empty-state">No historical predictions recorded in the current session.</div>
            ` : `
              <div class="past-list">
                ${pastMatches.map(m => `
                  <div class="past-item">
                    <div class="past-info">
                      <strong>${escapeHtml(m.teamA)} vs ${escapeHtml(m.teamB)}</strong>
                      <span class="muted">${escapeHtml(m.date)}</span>
                    </div>
                    <div class="past-scores">
                      <div class="score-pair">
                        <span class="mono-label">Guess</span>
                        <strong>${m.userGuessA} : ${m.userGuessB}</strong>
                      </div>
                      <div class="score-pair">
                        <span class="mono-label">Result</span>
                        <strong class="${m.expectedA !== undefined ? "final" : "pending"}">
                          ${m.expectedA !== undefined ? `${m.expectedA} : ${m.expectedB}` : "TBD"}
                        </strong>
                      </div>
                    </div>
                  </div>
                `).join("")}
              </div>
            `}
          </div>
        </div>
      </div>
    </div>

    <div class="tabs" style="margin-top:32px">
      <button class="tab-button" data-tab="calendar">Match Calendar</button>
      <button class="tab-button active">My Dashboard</button>
      <button class="tab-button" data-tab="leaderboard">Leaderboard</button>
    </div>
    
    <div class="calendar-layout-elegant" style="margin-top:24px">
      <div class="card elegant-card">
        <div class="row" style="justify-content:space-between; margin-bottom: 20px">
          <h3 class="elegant-title">Operational Calendar</h3>
          <div class="month-nav">
             <button class="icon-button">${icon("<")}</button>
             <strong style="font-family: var(--font-mono)">JUNE 2026</strong>
             <button class="icon-button">${icon(">")}</button>
          </div>
        </div>
        <div class="elegant-month-grid">
          ${["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => `<div class="day-head-elegant">${day}</div>`).join("")}
          ${renderElegantDays()}
        </div>
      </div>
      
      <div class="side-panel-elegant">
        <h3 class="elegant-title" style="color: white">System Feed</h3>
        <div class="feed-item">
          <span class="feed-dot"></span>
          <div>
            <strong>Next Major Sync</strong>
            <p>Automatic recalibration in 4h 12m</p>
          </div>
        </div>
        <div class="feed-item">
          <span class="feed-dot active"></span>
          <div>
            <strong>API Connectivity</strong>
            <p>Supabase nodes operating at 100%</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderElegantDays() {
  // Simplified elegant day renderer for June 2026
  // Starts on a Monday (June 1st, 2026 is a Monday)
  const days = [];
  for (let i = 1; i <= 30; i++) {
    const dateStr = `2026-06-${String(i).padStart(2, '0')}`;
    const matchesOnDay = state.matches.filter(m => {
       const mDate = new Date(m.kickoff_time || m.kickoff_date || m.date);
       return mDate.getDate() === i && mDate.getMonth() === 5 && mDate.getFullYear() === 2026;
    });
    
    days.push(`
      <div class="day-cell-elegant ${matchesOnDay.length > 0 ? "has-matches" : ""}">
        <span class="day-num">${i}</span>
        ${matchesOnDay.length > 0 ? `
          <div class="match-indicator">
            ${matchesOnDay.length} Match${matchesOnDay.length > 1 ? "es" : ""}
          </div>
        ` : ""}
      </div>
    `);
  }
  return days.join("");
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
      if (action === "toggle-past") { state.pastPredictionsOpen = !state.pastPredictionsOpen; render(); }
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
