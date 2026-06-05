import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { MatchCalendarView } from './components/MatchCalendarView';
import { MyDashboardView } from './components/MyDashboardView';
import { LeaderboardView } from './components/LeaderboardView';
import { SettingsSupportView } from './components/SettingsSupportView';
import { Match, Stats } from './types';
import { 
  Calendar, 
  LayoutDashboard, 
  Trophy, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Bell, 
  Menu, 
  X, 
  User, 
  Award,
  TrendingUp,
  Sliders,
  Sparkles
} from 'lucide-react';

// Initial matches representing the exact image requirements with additional interactive ones
const INITIAL_MATCHES: Match[] = [
  {
    id: 'm1',
    date: 'Today',
    dateStr: 'OCT 24, 2024',
    teamA: 'Team A',
    teamB: 'Team B',
    startsIn: 'Starts in 2h 15m',
    kickoff: '20:00 (Local)',
    status: 'locked',
    expectedA: 2,
    expectedB: 1,
    userGuessA: 2,
    userGuessB: 1
  },
  {
    id: 'm2',
    date: 'Tomorrow',
    dateStr: 'OCT 25, 2024',
    teamA: 'Team E',
    teamB: 'Team F',
    kickoff: '15:30 (Local)',
    status: 'open',
    badge: 'OPEN FOR ENTRIES'
  },
  {
    id: 'm3',
    date: 'Saturday',
    dateStr: 'OCT 26, 2024',
    teamA: 'Team C',
    teamB: 'Team D',
    kickoff: '12:00 (Local)',
    status: 'open',
    badge: '2 DAYS AWAY'
  },
  {
    id: 'm4',
    date: 'Saturday',
    dateStr: 'OCT 26, 2024',
    teamA: 'Team Alpha',
    teamB: 'Team Bravo',
    kickoff: '18:00 (Local)',
    status: 'open',
    badge: '2 DAYS AWAY'
  },
  {
    id: 'm5',
    date: 'Sunday',
    dateStr: 'OCT 27, 2024',
    teamA: 'Crestwood United',
    teamB: 'Global Giants',
    kickoff: '17:00 (Local)',
    status: 'open',
    badge: '3 DAYS AWAY'
  }
];

export default function App() {
  // Auth State
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('predict_user_email');
  });

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'calendar' | 'dashboard' | 'leaderboard' | 'settings' | 'support'>(() => {
    return (localStorage.getItem('predict_active_tab') as any) || 'calendar';
  });

  // Mobile Menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Profile Popup Modal
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Match Fixtures list state
  const [matches, setMatches] = useState<Match[]>(() => {
    const saved = localStorage.getItem('predict_matches_data');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_MATCHES;
  });

  // Custom alert notifications state
  const [alerts, setAlerts] = useState<string[]>([]);
  const [activeNotificationCount, setActiveNotificationCount] = useState(3);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('predict_matches_data', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('predict_active_tab', activeTab);
  }, [activeTab]);

  const handleLogin = (email: string) => {
    setCurrentUserEmail(email);
    localStorage.setItem('predict_user_email', email);
    setAlerts(['Welcome back Predictive Analyst. Model weights calibrated successfully.']);
    setTimeout(() => setAlerts([]), 5000);
  };

  const handleSignOut = () => {
    setCurrentUserEmail(null);
    localStorage.removeItem('predict_user_email');
    localStorage.removeItem('predict_active_tab');
    setActiveTab('calendar');
    setMobileMenuOpen(false);
  };

  const handleSaveGuess = (matchId: string, guessA: number, guessB: number) => {
    setMatches(prevMatches => 
      prevMatches.map(m => 
        m.id === matchId 
          ? { ...m, userGuessA: guessA, userGuessB: guessB, badge: 'PREDICTION LOCKED' } 
          : m
      )
    );

    // Dynamic alert notification feedback
    setAlerts(prev => [...prev, 'Guess logged. Probability metrics updated.']);
    setTimeout(() => {
      setAlerts(prev => prev.slice(1));
    }, 4000);
  };

  // Derive live performance statistics dynamically!
  const stats: Stats = React.useMemo(() => {
    const totalCount = 12; // Static base scale representing total round fixtures
    const predictedCount = matches.filter(m => m.userGuessA !== undefined && m.userGuessB !== undefined).length;
    // Calculation: remaining matches to predict out of total active games
    const pendingCount = Math.max(0, 10 - predictedCount); 

    const baseCorrectScores = 42;
    const baseCorrectOutcomes = 128;
    // If the user saves new guesses, let's slightly adjust statistics to reward them!
    const additionalGuessedBonus = matches.filter(m => m.id !== 'm1' && m.userGuessA !== undefined).length;

    return {
      upcomingMatches: totalCount,
      pendingGuesses: pendingCount,
      accuracyTier: 'A+',
      userPosition: Math.max(1, 14 - additionalGuessedBonus), // Rank crawls up as they predict!
      totalUsers: 2450,
      correctScores: baseCorrectScores + additionalGuessedBonus,
      correctOutcomes: baseCorrectOutcomes + additionalGuessedBonus * 2
    };
  }, [matches]);

  const navigateToView = (view: 'calendar' | 'dashboard' | 'leaderboard') => {
    setActiveTab(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Rendering conditional: Auth screen vs Authenticated App Shell
  if (!currentUserEmail) {
    return <AuthScreen onLoginSuccess={handleLogin} />;
  }

  // Active navigation tab header translation
  const activeTabTitle = {
    calendar: 'Match Calendar',
    dashboard: 'My Dashboard',
    leaderboard: 'Global Leaderboard',
    settings: 'System Settings',
    support: 'Engine Support'
  }[activeTab];

  return (
    <div className="min-h-screen flex bg-[#f7f9fb] text-[#191c1e] font-sans antialiased">
      
      {/* 5. TOP FLOATING ALERTS (Dynamic telemetry notifications) */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {alerts.map((alertText, index) => (
          <div 
            key={index} 
            className="pointer-events-auto bg-black text-white text-xs border border-gray-800 px-4 py-3 shadow-md flex items-center gap-2 rounded-sm border-l-4 border-l-indigo-400 animate-slideIn"
          >
            <span className="material-symbols-outlined text-sm font-bold text-indigo-400">info</span>
            <span className="font-sans font-medium">{alertText}</span>
          </div>
        ))}
      </div>

      {/* LEFT SIDE NAVIGATION (DESKTOP ASIDE PANEL) */}
      <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-white border-r border-[#E2E8F0] p-6 gap-8 z-30 pt-4">
        
        {/* Brand Block */}
        <div className="flex flex-col gap-1.5 border-b border-[#ECEEF0] pb-5 select-none">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-black font-extrabold text-2xl">insights</span>
            <span className="font-sans text-lg font-black tracking-tight text-black">
              Predictive Engine
            </span>
          </div>

          {/* Connected User Badge */}
          <div className="flex items-center gap-3 mt-4">
            <div 
              onClick={() => setShowProfileModal(true)}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-[#E2E8F0] overflow-hidden cursor-pointer hover:border-black transition-colors"
              title="View profile metadata"
            >
              <img 
                alt="Analytical analyst user profile" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCc2LCfkPCHpxY6r2vvbwLf9qGpwwcvomLQ4zcTVzwi_Lo28APb-hrfOScBVIQbxT2kJZwsDM156jC2CNuXOSY2Pbzc6_h6FWNBTf3q7efDb1L5TMOL4RoVvWbsiUD6B777Uk1rSbBzhNoYo-_47nlWaJke1Dx6ZRVXvY9XbNURB5BAk5vYJQivdQ_AWlgHhFrntEBWUOPG1GwMg_u7nLBnV0NaKv1aZFPF6IuIm8jtA5cxPG0vSUxNANTSbQTzkoRkDInXJ8X_7I02"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col overflow-hidden leading-tight">
              <span className="font-sans text-xs font-black text-black">Predictive Analyst</span>
              <span className="text-[10px] font-mono text-gray-500 truncate w-32 tracking-tight">
                {currentUserEmail}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-3 text-left w-full rounded-sm px-3 py-2.5 smooth-transition font-sans text-xs font-bold uppercase tracking-wider group cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-[#d5e3fd] text-[#0d1c2f] border-l-2 border-slate-900'
                : 'text-gray-600 hover:text-black hover:bg-[#eceef0]/60'
            }`}
          >
            <Calendar className={`w-4 h-4 ${activeTab === 'calendar' ? 'text-black' : 'text-gray-500'}`} />
            <span>Match Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 text-left w-full rounded-sm px-3 py-2.5 smooth-transition font-sans text-xs font-bold uppercase tracking-wider group cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#d5e3fd] text-[#0d1c2f] border-l-2 border-slate-900'
                : 'text-gray-600 hover:text-black hover:bg-[#eceef0]/60'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-black' : 'text-gray-500'}`} />
            <span>My Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-3 text-left w-full rounded-sm px-3 py-2.5 smooth-transition font-sans text-xs font-bold uppercase tracking-wider group cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-[#d5e3fd] text-[#0d1c2f] border-l-2 border-slate-900'
                : 'text-gray-600 hover:text-black hover:bg-[#eceef0]/60'
            }`}
          >
            <Trophy className={`w-4 h-4 ${activeTab === 'leaderboard' ? 'text-black' : 'text-gray-500'}`} />
            <span>Leaderboard</span>
          </button>
        </nav>

        {/* Footer/System Actions navigation panel */}
        <div className="mt-auto flex flex-col gap-1 border-t border-[#ECEEF0] pt-5">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 text-left w-full rounded-sm px-3 py-2.5 smooth-transition font-sans text-xs font-bold uppercase tracking-wider cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#d5e3fd] text-[#0d1c2f] border-l-2 border-slate-900'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <Settings className="w-4 h-4 text-gray-500" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`flex items-center gap-3 text-left w-full rounded-sm px-3 py-2.5 smooth-transition font-sans text-xs font-bold uppercase tracking-wider cursor-pointer ${
              activeTab === 'support'
                ? 'bg-[#d5e3fd] text-[#0d1c2f] border-l-2 border-slate-900'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-gray-500" />
            <span>Support</span>
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 text-left w-full rounded-sm px-3 py-2.5 text-red-600 hover:bg-red-50 smooth-transition font-sans text-xs font-extrabold uppercase mt-4 border border-dashed border-red-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-600" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN APPLICATION RUNNING CONTAINER */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen pb-24 md:pb-12">
        
        {/* TOP COMPACT APP HEADER BAR */}
        <header className="flex justify-between items-center w-full px-6 md:px-16 h-16 z-20 bg-white border-b border-[#E2E8F0] sticky top-0 shadow-xs">
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar burger toggle */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1 text-gray-700 hover:text-black hover:bg-slate-100 rounded-sm cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-sans text-base md:text-lg font-black tracking-tight text-black uppercase">
              {activeTabTitle}
            </h1>
          </div>

          {/* Quick links & Profile block */}
          <div className="flex items-center gap-3">
            
            {/* Notification alert counter */}
            <button 
              onClick={() => {
                setAlerts(prev => [...prev, 'All predictive calibration filters are correctly optimized.']);
                setActiveNotificationCount(0);
                setTimeout(() => setAlerts(prev => prev.slice(1)), 4000);
              }}
              className="p-1.5 hover:bg-slate-100 rounded-sm relative text-[#515f74] hover:text-black cursor-pointer"
              title="System Alerts"
            >
              <Bell className="w-4.5 h-4.5" />
              {activeNotificationCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#ba1a1a] rounded-full animate-pulse"></span>
              )}
            </button>

            <span className="hidden md:inline-block text-[10px] bg-[#eceef0] text-[#515f74] px-2.5 py-1 rounded-sm uppercase tracking-wider font-mono font-bold">
              Active Season: 2024/25
            </span>

            {/* Profile trigger */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="w-8 h-8 rounded-full border border-[#E2E8F0] overflow-hidden bg-slate-100 hover:border-black transition-colors cursor-pointer"
              title="Operational Profile"
            >
              <img 
                alt="Analyst face avatar" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB5DnG27UzbuTMFKK9hYpdjrYgcHUMwWxXJzaPFla828QdbOb51dH_kd9YLigo6v__aXN-7yKB6c_IC_rI0aM2ETYvwJ6UVJ1xTHIZ8dPBv_bW3xsMuvLTEUyEX9xZj7te-saiTaHbXyq8yFsh12nETomkWxivbec9Z0f2eJdFdagbOc4V1QwapVxKcZieVoVMOZmxVTIYWeP6sOdHTaZNc2nifLPtRRX6ImRKlB-by5Go07Jxx7SuDxJaFuaZ6RpkgXyyGfwz3FZef"
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </header>

        {/* PRIMARY SCROLLABLE TAB PAGE BODY */}
        <section className="p-6 md:p-16 max-w-7xl mx-auto w-full flex-grow">
          {activeTab === 'calendar' && (
            <MatchCalendarView 
              matches={matches} 
              onSaveGuess={handleSaveGuess} 
              stats={stats} 
            />
          )}

          {activeTab === 'dashboard' && (
            <MyDashboardView onNavigateToView={navigateToView} />
          )}

          {activeTab === 'leaderboard' && (
            <LeaderboardView stats={stats} currentUserEmail={currentUserEmail} />
          )}

          {activeTab === 'settings' && (
            <SettingsSupportView initialTab="settings" />
          )}

          {activeTab === 'support' && (
            <SettingsSupportView initialTab="support" />
          )}
        </section>

      </main>

      {/* MOBILE BOTTOM NAVIGATION TAB BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] flex justify-around items-center h-16 px-4 z-40 shadow-lg">
        <button 
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center gap-1 cursor-pointer flex-1 py-1 ${
            activeTab === 'calendar' ? 'text-black' : 'text-gray-400'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] font-sans font-bold">Calendar</span>
        </button>

        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 cursor-pointer flex-1 py-1 ${
            activeTab === 'dashboard' ? 'text-black' : 'text-gray-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-sans font-bold">Dashboard</span>
        </button>

        <button 
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center gap-1 cursor-pointer flex-1 py-1 ${
            activeTab === 'leaderboard' ? 'text-black' : 'text-gray-400'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] font-sans font-bold">Ranks</span>
        </button>

        <button 
          onClick={() => setShowProfileModal(true)}
          className="flex flex-col items-center gap-1 cursor-pointer flex-1 py-1 text-gray-400"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-sans font-bold">Profile</span>
        </button>
      </nav>

      {/* MOBILE NAVIGATION SIDEBAR DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-fadeIn">
          {/* Black backdrop click-away */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />
          
          <aside className="relative w-64 max-w-xs bg-white h-full p-6 flex flex-col gap-6 shadow-xl animate-slideRight">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <span className="font-sans text-base font-extrabold text-black uppercase">
                Navigation
              </span>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 flex flex-col gap-1.5">
              <button
                onClick={() => { setActiveTab('calendar'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 text-left w-full px-3 py-2.5 rounded-sm font-sans text-xs font-bold uppercase tracking-wider cursor-pointer ${
                  activeTab === 'calendar' ? 'bg-[#d5e3fd] text-[#0d1c2f]' : 'text-gray-600'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Calendar</span>
              </button>

              <button
                onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 text-left w-full px-3 py-2.5 rounded-sm font-sans text-xs font-bold uppercase tracking-wider cursor-pointer ${
                  activeTab === 'dashboard' ? 'bg-[#d5e3fd] text-[#0d1c2f]' : 'text-gray-600'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => { setActiveTab('leaderboard'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 text-left w-full px-3 py-2.5 rounded-sm font-sans text-xs font-bold uppercase tracking-wider cursor-pointer ${
                  activeTab === 'leaderboard' ? 'bg-[#d5e3fd] text-[#0d1c2f]' : 'text-gray-600'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Leaderboard</span>
              </button>

              <button
                onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 text-left w-full px-3 py-2.5 rounded-sm font-sans text-xs font-bold uppercase tracking-wider cursor-pointer ${
                  activeTab === 'settings' ? 'bg-[#d5e3fd] text-[#0d1c2f]' : 'text-gray-650'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => { setActiveTab('support'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 text-left w-full px-3 py-2.5 rounded-sm font-sans text-xs font-bold uppercase tracking-wider cursor-pointer ${
                  activeTab === 'support' ? 'bg-[#d5e3fd] text-[#0d1c2f]' : 'text-gray-650'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Support</span>
              </button>
            </nav>

            <button
              onClick={handleSignOut}
              className="w-full py-2.5 border border-dashed border-red-300 text-red-650 font-sans text-xs font-bold uppercase hover:bg-red-50 rounded-sm cursor-pointer mt-auto"
            >
              Sign Out
            </button>
          </aside>
        </div>
      )}

      {/* USER PROFILE MODAL DIALOG POPUP */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-[#c6c6cd] p-6 max-w-sm w-full flex flex-col gap-5 rounded-sm shadow-xl animate-scaleUp text-center">
            
            <div className="flex justify-end">
              <button 
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-black p-1 rounded-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-3 border-b border-[#eceef0] pb-5">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-2 border-black overflow-hidden shadow-xs">
                <img 
                  alt="Corporate Predictive Analyst" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCc2LCfkPCHpxY6r2vvbwLf9qGpwwcvomLQ4zcTVzwi_Lo28APb-hrfOScBVIQbxT2kJZwsDM156jC2CNuXOSY2Pbzc6_h6FWNBTf3q7efDb1L5TMOL4RoVvWbsiUD6B777Uk1rSbBzhNoYo-_47nlWaJke1Dx6ZRVXvY9XbNURB5BAk5vYJQivdQ_AWlgHhFrntEBWUOPG1GwMg_u7nLBnV0NaKv1aZFPF6IuIm8jtA5cxPG0vSUxNANTSbQTzkoRkDInXJ8X_7I02"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <h3 className="font-sans text-base font-extrabold text-black">Predictive Analyst</h3>
                <span className="font-mono text-[11px] text-[#515f74] font-medium mt-0.5">{currentUserEmail}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="bg-[#f8fafc] p-3 border border-[#E2E8F0] rounded-sm">
                <span className="text-[9px] font-mono font-bold text-gray-500 uppercase block mb-0.5">ROLE TYPE</span>
                <span className="text-xs font-sans font-bold text-black flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Lead Analyst
                </span>
              </div>
              <div className="bg-[#f8fafc] p-3 border border-[#E2E8F0] rounded-sm">
                <span className="text-[9px] font-mono font-bold text-gray-500 uppercase block mb-0.5">LEVEL STANDING</span>
                <span className="text-xs font-sans font-bold text-black">Tier A+ Standing</span>
              </div>
            </div>

            <p className="text-[10px] text-gray-500 font-mono italic">
              Calibration Security token expires at UTC end of month
            </p>

            <button 
              onClick={() => setShowProfileModal(false)}
              className="py-2.5 bg-black text-white hover:bg-neutral-800 transition-colors font-sans text-xs uppercase font-extrabold tracking-wider rounded-sm cursor-pointer"
            >
              Close Profile
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
