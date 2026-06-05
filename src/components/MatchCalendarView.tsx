import React, { useState } from 'react';
import { Match, Stats } from '../types';

interface MatchCalendarViewProps {
  matches: Match[];
  onSaveGuess: (matchId: string, guessA: number, guessB: number) => void;
  stats: Stats;
}

export function MatchCalendarView({ matches, onSaveGuess, stats }: MatchCalendarViewProps) {
  // Local state to manage notification feedback for each match ID
  const [saveStates, setSaveStates] = useState<Record<string, 'initial' | 'saving' | 'saved' | 'error'>>({});
  
  // Track temporary input fields
  const [inputs, setInputs] = useState<Record<string, { a: string; b: string }>>(() => {
    const initialInputs: Record<string, { a: string; b: string }> = {};
    matches.forEach(m => {
      initialInputs[m.id] = {
        a: m.userGuessA !== undefined ? String(m.userGuessA) : '',
        b: m.userGuessB !== undefined ? String(m.userGuessB) : ''
      };
    });
    return initialInputs;
  });

  const handleInputChange = (matchId: string, side: 'a' | 'b', value: string) => {
    // Keep only integers
    const cleaned = value.replace(/[^0-9]/g, '');
    setInputs(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [side]: cleaned
      }
    }));
  };

  const triggerSave = (matchId: string) => {
    const matchInput = inputs[matchId];
    if (!matchInput || matchInput.a === '' || matchInput.b === '') {
      setSaveStates(prev => ({ ...prev, [matchId]: 'error' }));
      setTimeout(() => {
        setSaveStates(prev => ({ ...prev, [matchId]: 'initial' }));
      }, 1500);
      return;
    }

    setSaveStates(prev => ({ ...prev, [matchId]: 'saving' }));
    
    // Simulate high-fidelity system processing
    setTimeout(() => {
      const valA = parseInt(matchInput.a, 10);
      const valB = parseInt(matchInput.b, 10);
      onSaveGuess(matchId, valA, valB);
      
      setSaveStates(prev => ({ ...prev, [matchId]: 'saved' }));
      
      // Keep "SAVED" badge style momentarily then transition nicely
      setTimeout(() => {
        setSaveStates(prev => ({ ...prev, [matchId]: 'initial' }));
      }, 2500);
    }, 600);
  };

  // Group matches by their header date (e.g. 'Today', 'Tomorrow', 'Saturday')
  const uniqueDates = Array.from(new Set(matches.map(m => m.date)));

  return (
    <div className="flex flex-col gap-6 font-sans">
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E2E8F0] p-6 hover:shadow-xs rounded-sm smooth-transition">
          <span className="text-[10px] font-mono font-medium text-[#45464d] uppercase tracking-wider block mb-1">
            Upcoming Matches
          </span>
          <span className="font-sans text-5xl font-black text-black">
            {stats.upcomingMatches}
          </span>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-6 hover:shadow-xs rounded-sm smooth-transition">
          <span className="text-[10px] font-mono font-medium text-[#45464d] uppercase tracking-wider block mb-1">
            Pending Guesses
          </span>
          <span className="font-sans text-5xl font-black text-[#515f74]">
            {String(stats.pendingGuesses).padStart(2, '0')}
          </span>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-6 hover:shadow-xs rounded-sm smooth-transition">
          <span className="text-[10px] font-mono font-medium text-[#45464d] uppercase tracking-wider block mb-1">
            Accuracy Tier
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-sans text-5xl font-black text-black">
              {stats.accuracyTier}
            </span>
            <span className="text-xs text-emerald-600 font-mono font-bold tracking-tight">
              (TOP 1%)
            </span>
          </div>
        </div>
      </div>

      {/* Match Calendar Grouped Sections */}
      <div className="flex flex-col gap-10 mt-2">
        {uniqueDates.map(dateKey => {
          const dateMatches = matches.filter(m => m.date === dateKey);
          const firstMatch = dateMatches[0];
          
          return (
            <section key={dateKey} className="group/section">
              {/* Date Group Header */}
              <div className="flex items-center gap-4 mb-5">
                <h2 className="font-sans text-xl font-extrabold tracking-tight text-black">
                  {dateKey}
                </h2>
                <div className="h-[1px] flex-grow bg-[#E2E8F0]"></div>
                <span className="font-mono text-xs text-[#515f74] font-medium tracking-wider uppercase">
                  {firstMatch?.dateStr}
                </span>
              </div>

              {/* Match Cards List */}
              <div className="grid grid-cols-1 gap-4">
                {dateMatches.map(match => {
                  const isLocked = match.status === 'locked';
                  const matchState = saveStates[match.id] || 'initial';
                  const currInput = inputs[match.id] || { a: '', b: '' };

                  return (
                    <div 
                      key={match.id}
                      className={`relative bg-white border border-[#E2E8F0] p-6 rounded-sm smooth-transition flex flex-col md:flex-row items-center gap-6 ${
                        isLocked 
                          ? 'bg-[#f2f4f6]/60 border-[#eceef0] opacity-80 select-none' 
                          : 'hover:border-black hover:shadow-sm'
                      }`}
                    >
                      {/* Locked Overlay Indicator */}
                      {isLocked && (
                        <div className="absolute top-0 right-0 bg-[#45464d] text-white px-3 py-1 font-mono text-[10px] uppercase font-bold flex items-center gap-1.5 rounded-bl-sm">
                          <span className="material-symbols-outlined text-[12px] font-bold">lock</span> LOCK CLOSED
                        </div>
                      )}

                      <div className="flex-1 flex flex-col md:flex-row items-center justify-between w-full gap-6">
                        
                        {/* Teams */}
                        <div className="flex items-center justify-center gap-8 w-full md:w-auto">
                          {/* Team A */}
                          <div className="flex flex-col items-center gap-2 w-24">
                            <div className={`w-14 h-14 bg-[#eceef0] flex items-center justify-center rounded-lg ${isLocked ? 'grayscale' : 'text-slate-700 bg-slate-100'}`}>
                              <span className="material-symbols-outlined text-3xl">shield</span>
                            </div>
                            <span className="font-sans text-sm font-bold text-black text-center truncate w-full">
                              {match.teamA}
                            </span>
                          </div>

                          {/* VS text */}
                          <span className="font-mono text-xs font-semibold text-[#515f74] uppercase tracking-widest italic">
                            vs
                          </span>

                          {/* Team B */}
                          <div className="flex flex-col items-center gap-2 w-24">
                            <div className={`w-14 h-14 bg-[#eceef0] flex items-center justify-center rounded-lg ${isLocked ? 'grayscale' : 'text-slate-700 bg-slate-100'}`}>
                              <span className="material-symbols-outlined text-3xl">shield</span>
                            </div>
                            <span className="font-sans text-sm font-bold text-black text-center truncate w-full">
                              {match.teamB}
                            </span>
                          </div>
                        </div>

                        {/* Status detail */}
                        <div className="flex flex-col items-center gap-1">
                          {isLocked ? (
                            <span className="font-mono text-[11px] text-[#ba1a1a] font-bold uppercase tracking-wider flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] animate-ping"></span> Live Calculation
                            </span>
                          ) : (
                            <span className="font-mono text-[11px] text-[#131b2e] font-bold uppercase tracking-wider">
                              {match.badge || 'OPEN FOR ENTRIES'}
                            </span>
                          )}
                          <span className="font-sans text-xs text-[#515f74]">
                            Kickoff: {match.kickoff}
                          </span>
                        </div>

                        {/* Prediction inputs */}
                        <div className="flex items-center gap-3 bg-[#f7f9fb] p-2 border border-[#E2E8F0] rounded-sm">
                          <input 
                            type="text"
                            maxLength={2}
                            disabled={isLocked}
                            value={currInput.a}
                            onChange={(e) => handleInputChange(match.id, 'a', e.target.value)}
                            placeholder={isLocked ? String(match.expectedA ?? '-') : '-'}
                            className={`w-12 h-12 text-center font-sans text-xl font-extrabold bg-transparent outline-none border-none p-0 focus:ring-0 select-all ${
                              isLocked ? 'cursor-not-allowed text-gray-400' : 'text-black'
                            }`}
                          />
                          <span className="font-mono text-lg font-bold text-gray-400 select-none">:</span>
                          <input 
                            type="text"
                            maxLength={2}
                            disabled={isLocked}
                            value={currInput.b}
                            onChange={(e) => handleInputChange(match.id, 'b', e.target.value)}
                            placeholder={isLocked ? String(match.expectedB ?? '-') : '-'}
                            className={`w-12 h-12 text-center font-sans text-xl font-extrabold bg-transparent outline-none border-none p-0 focus:ring-0 select-all ${
                              isLocked ? 'cursor-not-allowed text-gray-400' : 'text-black'
                            }`}
                          />
                        </div>

                      </div>

                      {/* Action Button */}
                      {isLocked ? (
                        <button 
                          className="w-full md:w-36 h-12 bg-gray-200 text-gray-500 font-sans text-xs uppercase font-bold tracking-wider cursor-not-allowed flex items-center justify-center gap-1.5 rounded-sm"
                          disabled
                        >
                          <span className="material-symbols-outlined text-[16px]">lock_clock</span> Locked
                        </button>
                      ) : (
                        <button 
                          onClick={() => triggerSave(match.id)}
                          disabled={matchState === 'saving'}
                          className={`w-full md:w-36 h-12 font-sans font-bold text-sm select-none tracking-tight smooth-transition flex items-center justify-center gap-1.5 cursor-pointer rounded-sm ${
                            matchState === 'saved' 
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                              : matchState === 'error'
                              ? 'bg-red-600 text-white'
                              : 'bg-black text-white hover:bg-neutral-800'
                          }`}
                        >
                          {matchState === 'saving' ? (
                            <span className="animate-pulse text-xs">Calibrating...</span>
                          ) : matchState === 'saved' ? (
                            <>
                              <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
                              <span>SAVED</span>
                            </>
                          ) : matchState === 'error' ? (
                            <span>Enter Score</span>
                          ) : (
                            <>
                              <span>Save Guess</span>
                              <span className="material-symbols-outlined text-sm">rocket_launch</span>
                            </>
                          )}
                        </button>
                      )}

                    </div>
                  );
                })}
              </div>

            </section>
          );
        })}
      </div>

    </div>
  );
}
