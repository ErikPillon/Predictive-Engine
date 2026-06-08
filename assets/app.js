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
  currentMonth: 5, // June
  currentYear: 2026,
  modelType: "neural",
  histWeight: 65,
  formWeight: 80,
  notificationsEnabled: true,
  risk: "moderate",
  settingsSubTab: "settings",
  pastPredictionsOpen: false,
  leaderboard: [],
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

// ... (helper functions)

async function fetchLeaderboardApi() {
  if (!config.supabaseDataApi || !state.session) return;
  const apiUrl = config.supabaseDataApi.replace(/\/$/, "").replace(/\?.*/, "") + "/leaderboard?select=*";
  try {
    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${state.session.access_token}`
      }
    });
    const leaderboardData = await response.json().catch(() => []);
    
    if (Array.isArray(leaderboardData)) {
      const lb = leaderboardData.map((row, index) => ({
        rank: index + 1,
        userId: row.user_id,
        email: row.email || `Analyst_${row.user_id.substring(0, 4).toUpperCase()}`,
        points: row.total_points || 0
      })).sort((a, b) => b.points - a.points);
      
      // Re-assign ranks after sort just in case view isn't pre-sorted
      lb.forEach((user, index) => { user.rank = index + 1; });
      state.leaderboard = lb;
    }
  } catch (error) {
    console.error("Failed to fetch leaderboard", error);
  }
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

  let correctScores = 0;
  let correctOutcomes = 0;

  completedMatches.forEach(m => {
    const guessA = Number(m.userGuessA);
    const guessB = Number(m.userGuessB);
    const expA = Number(m.expectedA);
    const expB = Number(m.expectedB);

    if (guessA === expA && guessB === expB) {
      correctScores++;
    } else if ((guessA > guessB && expA > expB) || 
               (guessA < guessB && expA < expB) || 
               (guessA === guessB && expA === expB)) {
      correctOutcomes++;
    }
  });

  return {
    upcomingMatches,
    pendingGuesses,
    correctScores,
    correctOutcomes,
    totalUsers: state.leaderboard.length || 0
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
      cache: "no-store",
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
        const timeStr = m.kickoff_time || m.kickoff_date || m.date || "";
        const d = new Date(timeStr);
        // Extract YYYY-MM-DD for grouping
        const isoDate = !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : (m.date || "Upcoming");
        
        // Extract prediction if available (Supabase join returns an array)
        const prediction = Array.isArray(m.predictions) && m.predictions.length > 0 ? m.predictions[0] : null;
        
        // Format time properly from timestamp
        const kickoffDisplay = !isNaN(d.getTime()) 
          ? d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
          : (m.time || m.kickoff || "TBD");
          
        const existingMatch = state.matches.find(sm => sm.id === String(m.id || "")) || {};
        
        return {
          id: String(m.id || Math.random()),
          date: isoDate,
          dateStr: isNaN(d.getTime()) ? (m.date || "TBD") : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZoneName: "short" }).toUpperCase(),
          teamA: m.team_home || m.teamA || "TBD",
          teamB: m.team_away || m.teamB || "TBD",
          kickoff: kickoffDisplay,
          kickoff_time: timeStr,
          status: m.status || "open",
          badge: prediction ? "PREDICTED" : "OPEN",
          userGuessA: prediction ? prediction.pred_home : "",
          userGuessB: prediction ? prediction.pred_away : "",
          expectedA: m.expected_a ?? m.expectedA,
          expectedB: m.expected_b ?? m.expectedB,
        };
      });
      writeJson(storageKeys.matches, state.matches);
    }

    state.dataApiStatus = "ready";
    state.dataApiPayload = payload;
    
    // Fetch leaderboard data after matches are loaded
    await fetchLeaderboardApi();
    
  } catch (error) {
    state.dataApiStatus = "error";
    state.dataApiPayload = { message: error.message };
  }
  render();
}

function signOut() {
  // 1. Clear session and navigation state
  state.session = null;
  state.activeTab = "calendar";
  
  // 2. COMPLETELY WIPE THE DATA STATE (The missing piece)
  state.matches = []; 
  state.dataApiPayload = null;
  state.dataApiStatus = "idle";
  
  // If you store leaderboard data in state, clear that too:
  // state.leaderboard = []; 

  // 3. WIPE ALL LOCAL STORAGE CACHES
  localStorage.removeItem(storageKeys.session);
  localStorage.removeItem(storageKeys.tab);
  
  // THIS is the line that kills the ghost predictions:
  localStorage.removeItem(storageKeys.matches); 
  
  // Note: If your app doesn't store anything else important, 
  // you can safely replace all the localStorage.removeItem lines with:
  // localStorage.clear();

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
            <span class="badge">2026 FIFA World Cup</span>
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
          ${["calendar", "dashboard", "leaderboard", "support"].map((tab) => navButton(tab, tab)).join("")}
        </nav>
        <button class="danger-button" data-action="signout" style="width:100%; margin-top:24px">Sign Out</button>
      </aside>
    </div>
  `;
}

function renderActiveTab(stats) {
  if (state.activeTab === "dashboard") return renderDashboard();
  if (state.activeTab === "leaderboard") return renderLeaderboard(stats);
  if (state.activeTab === "support") return renderSupport();
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
    
    // Primary sort: Date/Time Ascending
    if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) return timeA - timeB;
    
    // Secondary sort: Locked status
    const lockA = isLocked(a);
    const lockB = isLocked(b);
    if (lockA !== lockB) return lockA ? -1 : 1;
    return 0;
  });

  const dates = [...new Set(sortedMatches.map((match) => match.date))];
  
  const currentUserId = state.session?.user?.id || "";
  const myLeaderboardEntry = state.leaderboard.find(u => u.userId === currentUserId);
  const currentUserRank = myLeaderboardEntry ? myLeaderboardEntry.rank : "-";
  const totalPlayers = state.leaderboard.length > 0 ? state.leaderboard.length : "-";

  return `
    ${renderDataStatus()}
    <div class="grid-3">
      ${metricCard("Upcoming Matches", stats.upcomingMatches, "metric-value-matches")}
      ${metricCard("Pending Guesses", String(stats.pendingGuesses).padStart(2, "0"), "metric-value-guesses")}
      ${metricCard("Current Position", `${currentUserRank} <span style="font-size:16px;color:#64748b;font-weight:600;letter-spacing:0">/ ${totalPlayers}</span>`, "metric-value-tier")}
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
  return `<div class="card elegant-card"><span class="mono-label" style="letter-spacing: 0.1em; color: #64748b">${label}</span><span class="metric-value elegant-metric" ${id ? `id="${id}"` : ""}>${value}</span></div>`;
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
    const hasGuess = (m.userGuessA !== undefined && m.userGuessA !== null && m.userGuessA !== "");
    return hasGuess;
  }).sort((a, b) => new Date(b.kickoff_time) - new Date(a.kickoff_time));

  const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  const displayMonth = `${monthNames[state.currentMonth]} ${state.currentYear}`;

  let selectedDaySummary = `<div class="empty-state" style="padding: 24px 0">Select a day on the calendar to view scheduled matches.</div>`;
  
  if (state.selectedDay) {
    const dayStr = `${state.currentYear}-${String(state.currentMonth + 1).padStart(2, '0')}-${String(state.selectedDay).padStart(2, '0')}`;
    const matchesOnDay = state.matches.filter(m => m.date === dayStr).sort((a,b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());
    
    if (matchesOnDay.length > 0) {
      selectedDaySummary = `<div class="daily-match-list">` + matchesOnDay.map(m => `
        <div class="feed-item" style="margin-top: 16px; align-items: center">
          <span class="feed-dot active"></span>
          <div style="flex: 1">
            <strong>${escapeHtml(m.teamA)} vs ${escapeHtml(m.teamB)}</strong>
            <p>${m.kickoff} | ${m.status === "locked" ? "LOCKED" : "OPEN"}</p>
          </div>
        </div>
      `).join("") + `</div>`;
    } else {
      selectedDaySummary = `<div class="empty-state" style="padding: 24px 0">No matches scheduled for this date.</div>`;
    }
  }

  const chevronLeft = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`;
  const chevronRight = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`;

  return `
    ${renderDataStatus()}
    <div class="dashboard-grid" style="grid-template-columns: 1fr">
      <div class="card elegant-card">
        <div class="row" style="justify-content:space-between; margin-bottom: 24px">
          <div>
            <h3 class="elegant-title">Analytical Performance</h3>
            <p class="muted">Your recorded predictions and match results.</p>
          </div>
          <span class="badge">Archives Verified</span>
        </div>
        
        <div class="expandable-section">
          <button class="expand-toggle" data-action="toggle-past">
            <span>Your Predictions</span>
            <span class="icon">${icon("menu")}</span>
          </button>
          <div class="expand-content ${state.pastPredictionsOpen ? "open" : ""}">
            ${pastMatches.length === 0 ? `
              <div class="empty-state">No predictions recorded yet. Submit your guesses in the Match Calendar.</div>
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
          <div class="month-nav" style="display: flex; align-items: center; gap: 12px">
             <button class="icon-button" data-action="prev-month" style="border: 1px solid var(--line); border-radius: 50%">${chevronLeft}</button>
             <strong style="font-family: var(--font-mono); min-width: 100px; text-align: center">${displayMonth}</strong>
             <button class="icon-button" data-action="next-month" style="border: 1px solid var(--line); border-radius: 50%">${chevronRight}</button>
          </div>
        </div>
        <div class="elegant-month-grid">
          ${["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => `<div class="day-head-elegant">${day}</div>`).join("")}
          ${renderElegantDays()}
        </div>
      </div>
      
      <div class="side-panel-elegant">
        <h3 class="elegant-title" style="color: white">Daily Summary</h3>
        ${state.selectedDay ? `<p class="muted" style="margin-top: 4px">${monthNames[state.currentMonth]} ${state.selectedDay}, ${state.currentYear}</p>` : ""}
        ${selectedDaySummary}
      </div>
    </div>
  `;
}

function renderElegantDays() {
  const days = [];
  const firstDay = new Date(state.currentYear, state.currentMonth, 1).getDay();
  const daysInMonth = new Date(state.currentYear, state.currentMonth + 1, 0).getDate();
  
  // Adjust so Monday is 0, Sunday is 6
  let startOffset = firstDay === 0 ? 6 : firstDay - 1;

  for (let i = 0; i < startOffset; i++) {
    days.push(`<div class="day-cell-elegant empty" style="background: transparent; border: 0"></div>`);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const dayStr = `${state.currentYear}-${String(state.currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const matchesOnDay = state.matches.filter(m => m.date === dayStr);
    
    const isSelected = state.selectedDay === i ? "selected" : "";
    const hasMatches = matchesOnDay.length > 0 ? "has-matches" : "";

    days.push(`
      <button class="day-cell-elegant ${hasMatches} ${isSelected}" data-action="select-day" data-day="${i}" style="border:0; cursor:pointer; font-family:inherit">
        <span class="day-num">${i}</span>
        ${matchesOnDay.length > 0 ? `
          <div class="match-indicator">
            ${matchesOnDay.length} Match${matchesOnDay.length > 1 ? "es" : ""}
          </div>
        ` : ""}
      </button>
    `);
  }
  return days.join("");
}

function rangeControl(label, name, value, min, max) {
  return `<label><span class="mono-label">${label}: ${value}%</span><input class="range" type="range" min="${min}" max="${max}" value="${value}" data-range="${name}" /></label>`;
}

function renderLeaderboard(stats) {
  let currentUserRank = stats.userPosition;
  let currentUserPoints = 0;
  
  const currentUserId = state.session?.user?.id || "";
  const myLeaderboardEntry = state.leaderboard.find(u => u.userId === currentUserId);
  if (myLeaderboardEntry) {
    currentUserRank = myLeaderboardEntry.rank;
    currentUserPoints = myLeaderboardEntry.points;
  }

  const displayUsers = state.leaderboard.slice(0, 50).map(u => {
    const isMe = u.userId === currentUserId;
    const emailStr = u.email;
    const initials = isMe ? emailStr.slice(0,2).toUpperCase() : u.userId.substring(0, 2).toUpperCase();
    
    return [u.rank, initials, emailStr, u.points, isMe];
  });

  return `
    ${renderDataStatus()}
    <div class="leaderboard-layout">
      <section>
        <h2>Global Leaderboard</h2>
        <p class="muted">2026 FIFA World Cup ranking of the top predictive analysts.</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Rank</th><th>User Profile</th><th>Points</th></tr></thead>
            <tbody>
              ${displayUsers.length > 0 ? displayUsers.map(([rank, initials, email, points, isMe]) => `
                <tr class="${isMe ? 'leader-row-current' : ''}">
                  <td class="rank">#${rank}</td>
                  <td>
                    <span class="avatar" style="display:inline-grid;margin-right:12px">${initials}</span>
                    <strong>${escapeHtml(email)}</strong> ${isMe ? '<span class="badge">You</span>' : ''}
                  </td>
                  <td><strong>${points.toLocaleString()}</strong></td>
                </tr>
              `).join("") : `<tr><td colspan="3" style="text-align:center;color:#6b7280;padding:32px">No ranking data available yet.</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
      <aside class="side-panel">
        <h2>Your Performance</h2>
        <p class="muted" style="color:#9ca3af">2026 FIFA World Cup Ranking</p>
        <div class="card" style="background:#111827;color:white;border-color:#1f2937">
          <span class="mono-label" style="color:#9ca3af">Position</span>
          <span class="metric-value" style="color:white">${currentUserRank}</span>
          <span>/ ${Math.max(stats.totalUsers, state.leaderboard.length).toLocaleString()} users</span>
        </div>
        <p>Correct Scores: <strong>${stats.correctScores}</strong></p>
        <p>Correct Outcomes: <strong>${stats.correctOutcomes}</strong></p>
        <p>Total Points: <strong>${currentUserPoints.toLocaleString()}</strong></p>
        <button class="primary-button" data-action="stats" style="background:white;color:black;width:100%">Analyze Stats History</button>
      </aside>
    </div>
  `;
}

function renderSupport() {
  return `
    <div class="support-grid" style="grid-template-columns: 1fr">
      <section class="card elegant-card">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px">
          <span class="badge" style="background: #fef08a; color: #92400e; border: 1px solid #fde047">WORK IN PROGRESS</span>
          <h3 style="margin: 0" class="elegant-title">Support & Feedback</h3>
        </div>
        <p class="muted">The Predictive Engine is currently a work in progress. Bugs, glitches, and recalibration issues are expected.</p>
        <p class="muted" style="margin-bottom: 24px">If you encounter any problems, please describe the issue below or contact <strong>Erik Pillon</strong> directly via Email or Microsoft Teams.</p>
        
        <form id="support-form" class="form-stack">
          <label><span class="mono-label">Issue Description</span><textarea class="textarea" required placeholder="Describe what went wrong..."></textarea></label>
          <button class="primary-button" type="submit">Submit Issue</button>
        </form>
      </section>
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

async function savePredictionToSupabase(matchId, guessA, guessB) {
  if (!config.supabaseDataApi || !state.session) return false;
  
  const apiUrl = config.supabaseDataApi.replace(/\/$/, "").replace(/\?.*/, "") + "/predictions?on_conflict=user_id,match_id";
  
  // We use an upsert to insert or update the existing prediction
  const payload = {
    user_id: state.session.user.id,
    match_id: parseInt(matchId), // Ensure numeric if ID is numeric, or leave string if UUID
    pred_home: guessA,
    pred_away: guessB
  };
  
  // If matchId is not a number, keep it as string
  if (isNaN(payload.match_id)) {
    payload.match_id = matchId;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Prefer": "resolution=merge-duplicates",
        "apikey": config.supabaseAnonKey,
        "Authorization": `Bearer ${state.session.access_token}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to save prediction:", errorData);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Network error saving prediction:", error);
    return false;
  }
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
      if (action === "prev-month") {
        state.currentMonth--;
        if (state.currentMonth < 0) { state.currentMonth = 11; state.currentYear--; }
        state.selectedDay = null; // Reset selection on month change
        render();
      }
      if (action === "next-month") {
        state.currentMonth++;
        if (state.currentMonth > 11) { state.currentMonth = 0; state.currentYear++; }
        state.selectedDay = null;
        render();
      }
      if (action === "select-day") {
        const value = Number(element.dataset.day);
        state.selectedDay = state.selectedDay === value ? null : value;
        render();
      }
    });
  });

  document.querySelectorAll("[data-score]").forEach((input) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/[^0-9]/g, "");
    });
  });

  document.querySelectorAll("[data-save-match]").forEach((button) => {
    button.addEventListener("click", async () => {
      const matchId = button.dataset.saveMatch;
      const inputA = document.querySelector(`[data-score="${matchId}:a"]`);
      const inputB = document.querySelector(`[data-score="${matchId}:b"]`);
      if (!inputA.value || !inputB.value) {
        notify("Enter both score values before saving.");
        return;
      }
      
      const guessA = Number(inputA.value);
      const guessB = Number(inputB.value);
      
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = "Saving...";

      const success = await savePredictionToSupabase(matchId, guessA, guessB);
      
      if (success) {
        state.matches = state.matches.map((match) => match.id === matchId ? { ...match, userGuessA: guessA, userGuessB: guessB, badge: "PREDICTION LOCKED" } : match);
        writeJson(storageKeys.matches, state.matches);
        notify("Guess logged and saved to Supabase.");
      } else {
        notify("Failed to save to Supabase. Check console.");
      }
      
      render();
    });
  });

  const supportForm = document.getElementById("support-form");
  if (supportForm) {
    supportForm.addEventListener("submit", (event) => {
      event.preventDefault();
      supportForm.innerHTML = `<div class="alert-error" style="background:#fef2f2;color:#991b1b;border-color:#fecaca">Feature not implemented yet. Please contact Erik Pillon directly via email or Teams.</div>`;
    });
  }
}

if (state.session) {
  fetchDataApi();
} else {
  render();
}
