import React, { useState } from 'react';
import { Settings, ShieldAlert, Sliders, Bell, HelpCircle, Send, CheckCircle } from 'lucide-react';

interface SettingsSupportViewProps {
  initialTab: 'settings' | 'support';
}

export function SettingsSupportView({ initialTab }: SettingsSupportViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'settings' | 'support'>(initialTab);

  // Settings states
  const [engineModel, setEngineModel] = useState('bayesian');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [riskAversion, setRiskAversion] = useState('moderate');

  // Support state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketStatus, setTicketStatus] = useState<'idle' | 'sending' | 'submitted'>('idle');

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    setTicketStatus('sending');
    setTimeout(() => {
      setTicketStatus('submitted');
      setTicketSubject('');
      setTicketMessage('');
      setTimeout(() => setTicketStatus('idle'), 4000);
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      
      {/* Tab Switch header */}
      <div className="flex border-b border-[#E2E8F0] gap-8">
        <button 
          onClick={() => setActiveSubTab('settings')}
          className={`pb-4 px-1 font-mono text-[11px] font-bold tracking-wider border-b-2 transition-all cursor-pointer uppercase ${
            activeSubTab === 'settings'
              ? 'text-black border-black'
              : 'text-[#515f74] hover:text-black border-transparent hover:border-black'
          }`}
        >
          System Settings
        </button>
        <button 
          onClick={() => setActiveSubTab('support')}
          className={`pb-4 px-1 font-mono text-[11px] font-bold tracking-wider border-b-2 transition-all cursor-pointer uppercase ${
            activeSubTab === 'support'
              ? 'text-black border-black'
              : 'text-[#515f74] hover:text-black border-transparent hover:border-black'
          }`}
        >
          Engine Support
        </button>
      </div>

      {activeSubTab === 'settings' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main settings options */}
          <div className="md:col-span-2 bg-white border border-[#E2E8F0] p-6 rounded-sm flex flex-col gap-6">
            
            <div className="flex items-center gap-2 border-b border-[#eceef0] pb-3">
              <Sliders className="w-5 h-5 text-[#515f74]" />
              <h3 className="font-sans text-base font-extrabold text-black">
                Algorithmic Configuration
              </h3>
            </div>

            {/* Model switch option */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[10px] text-[#45464d] uppercase font-bold tracking-wider">
                Active Predictive Model
              </label>
              <p className="text-xs text-[#515f74]">Select the primary probability algorithm for the prediction simulations.</p>
              <select 
                value={engineModel}
                onChange={(e) => setEngineModel(e.target.value)}
                className="w-full h-11 bg-[#f7f9fb] border border-[#c6c6cd] px-3 font-sans text-sm text-[#191c1e] focus:border-black outline-none rounded-xs cursor-pointer"
              >
                <option value="bayesian">Naive Bayesian Inference (Standard)</option>
                <option value="neural">Stratos Neural Tensor V2 (Experimental)</option>
                <option value="linear">Multivariate Logistic Regression</option>
              </select>
            </div>

            {/* Risk tolerance metric */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[10px] text-[#45464d] uppercase font-bold tracking-wider">
                Calculated Risk Vector
              </label>
              <p className="text-xs text-[#515f74]">Control the variance and aggression coefficients in game simulations.</p>
              <div className="grid grid-cols-3 gap-3">
                {['conservative', 'moderate', 'aggressive'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setRiskAversion(level)}
                    className={`h-11 border text-xs font-sans font-bold capitalize smooth-transition rounded-xs cursor-pointer ${
                      riskAversion === level
                        ? 'bg-black text-white border-black'
                        : 'bg-[#f7f9fb] border-[#c6c6cd] text-[#45464d] hover:border-black hover:text-black'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications toggle */}
            <div className="flex items-center justify-between bg-[#f8fafc] p-4 border border-[#eceef0] rounded-sm">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-slate-700" />
                <div className="flex flex-col">
                  <span className="font-sans text-xs font-bold text-black">System Alert Subscriptions</span>
                  <span className="text-[10px] text-[#515f74]">Receive instant alerts on active game status recalibrations.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-14 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                  notificationsEnabled ? 'bg-black' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                  notificationsEnabled ? 'transform translate-x-7' : ''
                }`}></div>
              </button>
            </div>

          </div>

          {/* Settings Sidebar instructions */}
          <div className="bg-[#131b2e] p-6 text-white border border-black rounded-sm flex flex-col gap-4">
            <div className="bg-slate-800 p-2.5 rounded-sm w-fit">
              <Settings className="w-5 h-5 text-indigo-300 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <h3 className="font-sans text-sm font-extrabold">Config Authority</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-sans">
              Changing system metrics recalibrates raw tensors instantly on our sandbox servers. Verify parameters prior to competitive match prediction lock times.
            </p>
            <div className="mt-2 p-3 bg-slate-900 border border-slate-800 text-[10px] text-indigo-350 font-mono flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              <span>SECURITY PROTOCOL OK • READ ONLY METADATA</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Support ticket submission */}
          <div className="md:col-span-2 bg-white border border-[#E2E8F0] p-6 rounded-sm flex flex-col gap-4">
            
            <div className="flex items-center gap-2 border-b border-[#eceef0] pb-3">
              <HelpCircle className="w-5 h-5 text-[#515f74]" />
              <h3 className="font-sans text-base font-extrabold text-black">
                Submit Security & Analytical Assistance Ticket
              </h3>
            </div>

            {ticketStatus === 'submitted' ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 animate-fadeIn text-center">
                <CheckCircle className="w-12 h-12 text-emerald-600 animate-bounce" />
                <h4 className="font-sans text-sm font-extrabold text-black">Ticket Received and Registered</h4>
                <p className="text-xs text-[#515f74] max-w-sm">
                  An administrator has logged the tensor configuration query. Response expected shortly on your corporate terminal.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] text-[#45464d] uppercase font-bold tracking-wider">
                    Query Category Subject
                  </label>
                  <input 
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="e.g. Recalibration lag query"
                    className="w-full h-11 bg-white border border-[#c6c6cd] px-3 font-sans text-sm text-[#191c1e] hover:border-black focus:border-[#000000] focus:ring-0 outline-none rounded-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] text-[#45464d] uppercase font-bold tracking-wider">
                    Detailed Analytics Problem Description
                  </label>
                  <textarea 
                    rows={4}
                    required
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Enter description of error coordinates..."
                    className="w-full p-3 bg-white border border-[#c6c6cd] font-sans text-sm text-[#191c1e] hover:border-black focus:border-[#000000] focus:ring-0 outline-none rounded-xs resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={ticketStatus === 'sending'}
                  className="h-11 bg-black text-white hover:bg-neutral-800 transition-colors font-sans text-xs uppercase font-extrabold tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer rounded-xs self-start px-6"
                >
                  {ticketStatus === 'sending' ? (
                    <span>Registering Ticket...</span>
                  ) : (
                    <>
                      <span>Transmit Ticket</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

          </div>

          {/* Support Informative instructions card */}
          <div className="bg-[#f8fafc] border border-[#E2E8F0] p-6 rounded-sm flex flex-col gap-4 text-black">
            <h4 className="font-sans text-sm font-extrabold">Support Resources</h4>
            <p className="text-xs text-[#515f74] leading-relaxed">
              Before raising support queries, review model calculations in the dashboard workspace, as standard lock timers cannot be overridden once countdown finishes.
            </p>
            <div className="flex flex-col gap-2 mt-2">
              <span className="text-[10px] font-mono font-bold uppercase text-[#45464d] block">EMERGENCY LINE IP</span>
              <span className="font-mono text-xs font-bold block text-indigo-950">10.24.1.25:3000 (SECURE SSL)</span>
              <span className="text-[10px] font-mono text-[#515f74]">Average Response Clock: 12 mins</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
