import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Activity, Calendar as CalendarIcon, Cpu, TrendingUp } from 'lucide-react';

interface MyDashboardViewProps {
  onNavigateToView: (view: 'calendar' | 'dashboard' | 'leaderboard') => void;
}

export function MyDashboardView({ onNavigateToView }: MyDashboardViewProps) {
  // Interactive stats calibration variables
  const [modelType, setModelType] = useState<'neural' | 'bayesian' | 'linear'>('neural');
  const [histWeight, setHistWeight] = useState(65);
  const [formWeight, setFormWeight] = useState(80);

  // Compute confidence on the fly based on parameters for true interactive quality!
  const calculatedConfidence = (
    84.2 + 
    (histWeight - 65) * 0.15 + 
    (formWeight - 80) * 0.08 + 
    (modelType === 'bayesian' ? -3.4 : modelType === 'linear' ? -7.8 : 0)
  ).toFixed(1);

  // Active parameter statistics
  const [activeSessionCount, setActiveSessionCount] = useState(12);

  // Sept calendar details
  const days = [
    { num: 28, isPrev: true },
    { num: 29, isPrev: true },
    { num: 30, isPrev: true },
    { num: 1, isPrev: false },
    { num: 2, isPrev: false, event: 'MATCH #A21', eventType: 'normal' },
    { num: 3, isPrev: false },
    { num: 4, isPrev: false },
    { num: 5, isPrev: false },
    { num: 6, isPrev: false },
    { num: 7, isPrev: false, event: 'MAJOR EVENT', eventType: 'major' },
    { num: 8, isPrev: false },
    { num: 9, isPrev: false },
    { num: 10, isPrev: false },
    { num: 11, isPrev: false }
  ];

  // Calendar selected day detail simulation
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-6 font-sans">
      
      {/* Bento Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Confidence Recalibrator Card */}
        <div className="md:col-span-2 flex flex-col gap-4 p-6 bg-white border border-[#E2E8F0] rounded-sm hover:shadow-xs transition-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f2f4f6] pb-4">
            <div>
              <span className="text-[10px] font-mono font-medium text-[#45464d] uppercase tracking-widest block">
                Prediction Confidence
              </span>
              <h2 className="font-sans text-5xl font-black text-black">
                {calculatedConfidence}%
              </h2>
            </div>

            {/* Simulated parameter switchers */}
            <div className="flex items-center gap-1.5 bg-[#f7f9fb] p-1 border border-[#E2E8F0] rounded-sm self-start">
              {(['neural', 'bayesian', 'linear'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setModelType(type)}
                  className={`px-3 py-1 text-[10px] font-mono uppercase font-bold tracking-tight rounded-sm transition-colors cursor-pointer ${
                    modelType === type
                      ? 'bg-black text-white'
                      : 'text-[#515f74] hover:text-[#191c1e]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <p className="font-sans text-sm text-[#45464d] leading-relaxed">
            The current model indicates a high variance for upcoming Q3 matches. Adjust historical weights and team form metrics below for real-time recalibration.
          </p>

          {/* Recalibrator Sliders Container */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#f8fafc]/80 p-4 border border-[#eceef0] rounded-sm mt-1">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[9px] text-[#515f74] uppercase font-bold">Historical Data Weight</span>
                <span className="font-sans text-xs font-black text-black">{histWeight}%</span>
              </div>
              <input 
                type="range" 
                min="40" 
                max="90" 
                value={histWeight} 
                onChange={(e) => setHistWeight(Number(e.target.value))}
                className="w-full accent-black h-1 bg-gray-200 rounded-lg cursor-pointer"
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[9px] text-[#515f74] uppercase font-bold">Form Recency Weight</span>
                <span className="font-sans text-xs font-black text-[#515f74]">{formWeight}%</span>
              </div>
              <input 
                type="range" 
                min="50" 
                max="100" 
                value={formWeight} 
                onChange={(e) => setFormWeight(Number(e.target.value))}
                className="w-full accent-black h-1 bg-gray-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Active Sessions Card */}
        <div className="flex flex-col justify-between p-6 bg-black text-white rounded-sm hover:shadow-xs transition-shadow">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mb-1">
              Active Sessions
            </span>
            <div className="flex items-center justify-between">
              <span className="font-sans text-5xl font-black">{activeSessionCount}</span>
              <span className="material-symbols-outlined text-4xl text-slate-300">monitoring</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>SYSTEM LOAD</span>
              <span>75% CAPACITY</span>
            </div>
            <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-500" 
                style={{ width: '75%' }}
              ></div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 border-t border-neutral-900 pt-3 text-[10px] font-mono text-gray-500">
            <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>CALIBRATION SERVER ACTIVE • LATENCY 4MS</span>
          </div>
        </div>

      </div>

      {/* Tabs Switcher Section (Synced back to layouts) */}
      <div className="flex flex-col gap-6 mt-4">
        
        <div className="flex border-b border-[#E2E8F0] gap-8">
          <button 
            onClick={() => onNavigateToView('calendar')}
            className="pb-4 px-1 font-mono text-[11px] font-bold tracking-wider text-[#515f74] hover:text-black border-b-2 border-transparent hover:border-black transition-all cursor-pointer uppercase"
          >
            Match Calendar
          </button>
          <button 
            className="pb-4 px-1 font-mono text-[11px] font-bold tracking-wider text-black border-b-2 border-black transition-all cursor-pointer uppercase"
          >
            My Dashboard
          </button>
          <button 
            onClick={() => onNavigateToView('leaderboard')}
            className="pb-4 px-1 font-mono text-[11px] font-bold tracking-wider text-[#515f74] hover:text-black border-b-2 border-transparent hover:border-black transition-all cursor-pointer uppercase"
          >
            Leaderboard
          </button>
        </div>

        {/* Predictive Data Grid layout (Asymmetric) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Grid: month calendar */}
          <div className="lg:col-span-8 flex flex-col gap-4 bg-white border border-[#E2E8F0] p-6 rounded-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                <h3 className="font-sans text-lg font-extrabold text-black">
                  September 2023
                </h3>
              </div>
              <div className="flex gap-1 bg-[#f7f9fb] p-1 border border-[#E2E8F0] rounded-sm">
                <button className="p-1 hover:bg-[#eceef0] transition-colors rounded-sm cursor-pointer text-[#515f74]">
                  <span className="material-symbols-outlined text-sm font-semibold">chevron_left</span>
                </button>
                <button className="p-1 hover:bg-[#eceef0] transition-colors rounded-sm cursor-pointer text-[#515f74]">
                  <span className="material-symbols-outlined text-sm font-semibold">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Simplified Predictive Grid */}
            <div className="grid grid-cols-7 gap-[1px] bg-[#c6c6cd] border border-[#c6c6cd] overflow-hidden rounded-sm">
              {/* Day headers */}
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                <div key={day} className="bg-[#f2f4f6] text-center py-2 font-mono text-[10px] font-bold tracking-tight text-[#515f74] uppercase">
                  {day}
                </div>
              ))}

              {/* Day grids rendering matching the images exactly */}
              {days.map((day, idx) => {
                const isSelected = selectedDay === day.num && !day.isPrev;
                
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (!day.isPrev) setSelectedDay(isSelected ? null : day.num);
                    }}
                    className={`h-24 p-2 relative transition-colors cursor-pointer flex flex-col justify-between ${
                      day.isPrev 
                        ? 'bg-[#d8dadc]/40 text-gray-400 cursor-not-allowed opacity-50' 
                        : isSelected
                        ? 'bg-neutral-50 border-2 border-black text-black'
                        : 'bg-white hover:bg-[#f7f9fb] border-r border-b border-[#E2E8F0] text-black'
                    }`}
                  >
                    <span className={`font-mono text-[10px] ${day.eventType === 'major' ? 'font-bold' : ''}`}>
                      {day.num}
                    </span>

                    {/* Render event markers */}
                    {day.event && day.eventType === 'normal' && (
                      <div className="p-1 bg-[#d5e3fd] text-[#57657b] border border-[#b9c7e0] rounded-sm text-[9px] font-mono font-bold tracking-tight text-center leading-none">
                        {day.event}
                      </div>
                    )}

                    {day.event && day.eventType === 'major' && (
                      <div className="p-1 bg-black text-white text-[9px] font-mono font-black tracking-widest text-center leading-none rounded-xs select-none">
                        {day.event}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Day details helper on click */}
            {selectedDay !== null && (
              <div className="mt-4 p-4 bg-[#f8fafc] border border-[#eceef0] rounded-sm flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
                  <span className="font-sans text-xs text-gray-700">
                    Day selected: <strong className="text-black font-extrabold">Sept {selectedDay}, 2023</strong> - Predictive confidence status is optimal.
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedDay(null)}
                  className="font-mono text-[10px] uppercase font-bold text-gray-400 hover:text-black cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>

          {/* Right Column: analytics list & visual feeds */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Predictions List */}
            <div className="flex flex-col gap-4 p-6 bg-white border border-[#E2E8F0] rounded-sm">
              <h4 className="font-sans text-sm font-extrabold text-black">
                Upcoming Predictions
              </h4>
              <div className="flex flex-col gap-1 text-sm border-[#f2f4f6]/80">
                <div className="flex items-center justify-between p-3 border-b border-[#eceef0]/80">
                  <span className="font-sans text-xs text-black font-semibold">Team Alpha vs Bravo</span>
                  <span className="font-mono text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-200/50 rounded-xs font-bold uppercase tracking-wider">
                    HIGH
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 border-b border-[#eceef0]/80">
                  <span className="font-sans text-xs text-gray-600">Crestwood United</span>
                  <span className="font-mono text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 border border-amber-200/50 rounded-xs font-bold uppercase tracking-wider">
                    MID
                  </span>
                </div>
                <div className="flex items-center justify-between p-3">
                  <span className="font-sans text-xs text-gray-600">Global Giants</span>
                  <span className="font-mono text-[10px] text-red-600 bg-red-50 px-2 py-0.5 border border-red-200/50 rounded-xs font-bold uppercase tracking-wider">
                    LOW
                  </span>
                </div>
              </div>

              {/* View Match Calendar shortcut */}
              <button 
                onClick={() => onNavigateToView('calendar')}
                className="w-full py-2.5 bg-[#f2f4f6] font-sans font-bold text-xs hover:bg-[#e6e8ea] transition-colors rounded-sm cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <span>Navigate to Fixtures</span>
                <span className="material-symbols-outlined text-sm font-bold">arrow_right_alt</span>
              </button>
            </div>

            {/* Decorative analytic card */}
            <div className="relative overflow-hidden rounded-sm aspect-square border border-[#E2E8F0] group cursor-pointer block">
              <img 
                alt="Analytics Visual" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsKZ2rxttjGaQC1h6pwBV9y-zrch0O-TJDyqn81XR_epwlEp3u9mRl2g_OpZg5_EXsHPK1Bfj0xiRIcYlgUUlQxV-jdrmyU6a4ft4vEVon2k11jCCy-92N3tcOe3nct5_pGzvx_18YoJohv2UBoln5gm5LfIQpj8fv3bo5t-G4j8Q06WifxLqyprmunn_3WwkIuXZc8p3Ll8DOxS-OQ9UcNyTbW_UOY2OGrwZcxswE75cm-uX72GjiPo6I29R44Huwe_88Dq-l9Beq"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-neutral-900/40 opacity-80 group-hover:opacity-60 transition-opacity"></div>
              <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
                <span className="font-mono text-[9px] text-[#f7f9fb] bg-[#ba1a1a] px-2 py-0.5 w-fit rounded-xs font-bold tracking-widest uppercase mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span> LIVE STREAM
                </span>
                <p className="font-sans text-xs font-bold text-[#f7f9fb] tracking-tight">
                  Network Stability: Nominal
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
