import React, { useState } from 'react';
import { LeaderboardUser, Stats } from '../types';
import { Trophy, Award, BarChart3, LineChart, CheckCircle2, TrendingUp, X } from 'lucide-react';

interface LeaderboardViewProps {
  stats: Stats;
  currentUserEmail: string;
}

export function LeaderboardView({ stats, currentUserEmail }: LeaderboardViewProps) {
  // Hardcoded leading analysts based on image specifications
  const users: LeaderboardUser[] = [
    {
      rank: 1,
      initials: 'JD',
      email: 'jane.data@analytics.io',
      badge: 'Consistent Top Performer',
      points: 12450
    },
    {
      rank: 2,
      initials: 'MS',
      email: 'mark.stat@predict.com',
      badge: 'Rising Star',
      points: 11820
    },
    {
      rank: 3,
      initials: 'AW',
      email: 'alice.w@logic.net',
      badge: 'Logic Master',
      points: 10950
    },
    {
      rank: 4,
      initials: 'CB',
      email: 'charlie.bravo@defense.gov',
      points: 9400
    },
    {
      rank: 5,
      initials: 'ES',
      email: 'elena.s@neural.ai',
      points: 8210
    }
  ];

  // Optional: insert user's current account dynamically in a highlight block so they feel integrated!
  const formattedUserEmail = currentUserEmail || 'user@company.com';
  const displayInitials = formattedUserEmail.substring(0, 2).toUpperCase();

  // State for interactive popups (Analyze Stats History)
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Demo round performance values
  const roundsPerformance = [
    { round: "Round 1", score: 480, avg: 310 },
    { round: "Round 2", score: 520, avg: 340 },
    { round: "Round 3", score: 610, avg: 395 },
    { round: "Round 4", score: 490, avg: 350 },
    { round: "Round 5", score: 710, avg: 410 },
    { round: "Round 6", score: 680, avg: 430 }
  ];

  return (
    <div className="flex flex-col gap-6 font-sans">
      
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 w-full">
        
        {/* Left Column: Leaderboard stand table */}
        <div className="flex-grow flex flex-col gap-6 min-w-0">
          
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="font-sans text-2xl font-black text-black tracking-tight self-center">
                Global Leaderboard
              </h1>
              <p className="font-sans text-sm text-[#515f74]">
                Seasonal ranking of the top predictive analysts.
              </p>
            </div>
            <div className="hidden sm:block">
              <span className="font-mono text-[10px] text-[#45464d] px-3 py-1.5 bg-[#eceef0] rounded-sm font-semibold">
                Last updated: 5 mins ago
              </span>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] overflow-hidden rounded-sm hover:shadow-xs transition-shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-[#f2f4f6]/70 border-b border-[#E2E8F0]">
                    <th className="px-6 py-3 font-mono text-[10px] font-bold text-[#45464d] uppercase tracking-widest w-24 text-center">
                      Rank
                    </th>
                    <th className="px-6 py-3 font-mono text-[10px] font-bold text-[#45464d] uppercase tracking-widest">
                      User Profile
                    </th>
                    <th className="px-6 py-3 font-mono text-[10px] font-bold text-[#45464d] uppercase tracking-widest text-right">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eceef0]/80">
                  {users.map((user) => {
                    return (
                      <tr key={user.rank} className="hover:bg-slate-50/50 transition-colors group">
                        {/* Metallic Rank Badges */}
                        <td className="px-6 py-5 text-center">
                          <div className="flex justify-center">
                            {user.rank === 1 ? (
                              <span className="material-symbols-outlined text-[#D4AF37] text-3xl font-black animate-pulse leading-none select-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                                workspace_premium
                              </span>
                            ) : user.rank === 2 ? (
                              <span className="material-symbols-outlined text-[#C0C0C0] text-3xl font-black leading-none select-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                                workspace_premium
                              </span>
                            ) : user.rank === 3 ? (
                              <span className="material-symbols-outlined text-[#CD7F32] text-3xl font-black leading-none select-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                                workspace_premium
                              </span>
                            ) : (
                              <span className="font-mono text-sm font-bold text-[#515f74]">
                                #{user.rank}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Profiles */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            {/* Avatar Badge initials mapping */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-sans text-xs flex-shrink-0 ${
                              user.rank === 1 
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                                : user.rank === 2 
                                ? 'bg-sky-100 text-sky-700 border border-sky-200' 
                                : user.rank === 3 
                                ? 'bg-slate-100 text-slate-700 border border-slate-200' 
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                              {user.initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-sans text-sm font-extrabold text-black truncate">
                                {user.email}
                              </span>
                              {user.badge && (
                                <span className="text-[10px] text-[#515f74] font-mono font-bold uppercase tracking-wider mt-0.5">
                                  {user.badge}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Points */}
                        <td className="px-6 py-4 text-right">
                          <span className="font-sans text-lg font-black tabular-nums text-black">
                            {user.points.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Highlights section: current user's profile inline */}
                  <tr className="bg-[#f2f4f6]/30 border-t-2 border-black/80">
                    <td className="px-6 py-4 text-center">
                      <span className="font-mono text-xs font-black bg-black text-white px-2 py-0.5 rounded-xs">
                        #{stats.userPosition}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-extrabold font-sans text-xs flex-shrink-0">
                          {displayInitials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-sans text-sm font-extrabold text-black truncate flex items-center gap-1.5">
                            {formattedUserEmail}
                            <span className="bg-neutral-100 text-[#45464d] text-[8px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-sm">YOU</span>
                          </span>
                          <span className="text-[10px] text-[#45464d] font-mono font-semibold uppercase mt-0.5">
                            Pending Calibration standing
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6.5 py-4 text-right">
                      <span className="font-sans text-lg font-black tabular-nums text-black">
                        7,840
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Personal Stats bar & decorations */}
        <div className="lg:w-80 flex flex-col gap-6 flex-shrink-0 w-full">
          
          {/* Performance Summary block */}
          <div className="bg-[#131b2e] p-6 flex flex-col gap-6 border border-black text-white rounded-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-sm bg-slate-800 flex items-center justify-center text-white flex-shrink-0">
                <span className="material-symbols-outlined text-2xl font-black">person</span>
              </div>
              <div>
                <h2 className="font-sans text-lg font-extrabold text-white">
                  Your Performance
                </h2>
                <p className="text-slate-400 font-mono text-[9px] uppercase tracking-wider">
                  Current Season Ranking
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Position Card */}
              <div className="bg-slate-900/50 p-4 border border-slate-800 rounded-sm">
                <span className="block text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                  Position
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-sans text-4xl font-black text-white">
                    {stats.userPosition}
                  </span>
                  <span className="text-slate-400 font-mono text-xs">
                    / {stats.totalUsers.toLocaleString()} users
                  </span>
                </div>
              </div>

              {/* Counts metrics */}
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-slate-900/40 p-4 border border-slate-800/80 rounded-sm flex items-center justify-between">
                  <div>
                    <span className="block text-slate-400 font-mono text-[9px] uppercase font-bold tracking-wider mb-0.5">
                      Correct Scores
                    </span>
                    <span className="font-sans text-xl font-black text-white">
                      {stats.correctScores}
                    </span>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                </div>

                <div className="bg-slate-900/40 p-4 border border-slate-800/80 rounded-sm flex items-center justify-between">
                  <div>
                    <span className="block text-slate-400 font-mono text-[9px] uppercase font-bold tracking-wider mb-0.5">
                      Correct Outcomes
                    </span>
                    <span className="font-sans text-xl font-black text-white">
                      {stats.correctOutcomes}
                    </span>
                  </div>
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
            </div>

            {/* Simulated Action popup click */}
            <button 
              onClick={() => setShowStatsModal(true)}
              className="w-full py-3 bg-white text-black font-sans font-extrabold text-xs tracking-tight rounded-sm transition-colors hover:bg-slate-100 cursor-pointer block"
            >
              Analyze Stats History
            </button>
          </div>

          {/* Decorative Predictive glass card */}
          <div className="relative overflow-hidden border border-[#E2E8F0] aspect-square rounded-sm group cursor-pointer flex flex-col justify-end p-6">
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent z-10 transition-opacity"></div>
            <img 
              alt="Analytical visualizations" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXAJAy_JDqxYNPS7tc_f3hI4VyMdE_bAuusdQpAjcnCWoZyalb4EkPHSOQMrx-rHJYbRJVEo0QC31zh-LtIp1vZYKegozFQRZoms-Ih0nky59djWxV04O45QXzofCsty7rBbOvC9SsFAI2ScQ7POwhGLtP7G03Jx2W0aeMj1z7LANiFbxq-z_0my8GfO8lAHHEKE_zH71HKxZm_X1drv290Htao5mXb0ISbfyO3U-CgWhE4CmK8Fx-YF0i_UZqeJ4dNSwraV4nc91u"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            
            <div className="relative z-20 text-white">
              <span className="inline-block bg-[#dae2fd] text-[#131b2e] font-mono text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-sm uppercase mb-2">
                Predictive Insight
              </span>
              <h3 className="font-sans text-base font-extrabold text-white mb-1">
                Next Match Prediction
              </h3>
              <p className="text-slate-350 text-xs leading-relaxed font-sans">
                Our engine predicts a 74% confidence level for the upcoming London Derby outcome.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Stats History modal details simulated */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-[#c6c6cd] max-w-lg w-full p-6 flex flex-col gap-6 rounded-sm shadow-xl animate-scaleUp">
            
            <div className="flex items-center justify-between border-b border-[#eceef0] pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-black" />
                <h3 className="font-sans text-base font-extrabold text-black">
                  Predictive Stats Performance History
                </h3>
              </div>
              <button 
                onClick={() => setShowStatsModal(false)}
                className="p-1 text-gray-400 hover:text-black transition-colors cursor-pointer rounded-xs"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="font-sans text-xs text-[#515f74]">
              Seasonal comparison of your points score versus the league average prediction correctness quotient. Performance indicators suggest strong model calibration.
            </p>

            {/* Clean bar chart representation */}
            <div className="flex flex-col gap-4 py-2">
              {roundsPerformance.map((rp, idx) => {
                const maxVal = 750;
                const scorePerc = (rp.score / maxVal) * 100;
                const avgPerc = (rp.avg / maxVal) * 100;

                return (
                  <div key={idx} className="flex flex-col gap-1 text-xs">
                    <div className="flex justify-between font-mono text-[10px] text-[#45464d] font-semibold">
                      <span>{rp.round}</span>
                      <span>Your points: {rp.score} <span className="text-gray-300 font-normal">|</span> Avg: {rp.avg}</span>
                    </div>
                    
                    {/* Scores Comparison Bars */}
                    <div className="flex flex-col gap-1 bg-gray-50 p-1 border border-gray-100 rounded-sm">
                      <div className="h-2 bg-indigo-600 rounded-sm" style={{ width: `${scorePerc}%` }} title="Your Points"></div>
                      <div className="h-1.5 bg-gray-300 rounded-sm" style={{ width: `${avgPerc}%` }} title="League Avg"></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#eceef0]">
              <button 
                onClick={() => setShowStatsModal(false)}
                className="px-4 py-2 bg-black text-white font-sans text-xs font-bold hover:bg-neutral-800 cursor-pointer rounded-xs"
              >
                Close Analysis
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
