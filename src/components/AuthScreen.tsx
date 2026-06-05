import React, { useState } from 'react';
import { ShieldCheck, Mail, KeyRound, AlertCircle } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (email: string) => void;
}

export function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [email, setEmail] = useState('user@company.com');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simulate network authentication delay
    setTimeout(() => {
      // Allow user@company.com with admin, or any email ending in company.com/etc with admin or password
      if (email.trim() && password === 'admin') {
        onLoginSuccess(email.trim());
      } else {
        setError('Invalid credentials. Please contact administration.');
        // Auto hide error after 4 seconds
        setTimeout(() => setError(null), 4000);
      }
      setIsLoading(false);
    }, 600);
  };

  return (
    <div id="auth-screen" className="min-h-screen w-full flex items-center justify-center bg-[#f7f9fb] p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-[#c6c6cd] p-10 flex flex-col gap-6 rounded-lg shadow-sm transition-transform duration-300 hover:shadow-md">
        
        {/* Title Block */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-black text-3xl font-bold">query_stats</span>
            <h1 className="font-sans text-3xl font-extrabold tracking-tight text-black">
              Predictive Engine
            </h1>
          </div>
          <p className="font-sans text-sm text-[#45464d]">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Error alert container */}
        {error && (
          <div className="flex items-center gap-3 bg-[#ffdad6] text-[#93000a] p-3 rounded-lg border border-[#ffb4ab] animate-shake">
            <span className="material-symbols-outlined text-xl flex-shrink-0">error</span>
            <span className="font-sans text-sm font-medium">{error}</span>
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* Corporate Email Field */}
          <div className="flex flex-col gap-1.5Packed">
            <label 
              className="font-mono text-[10px] text-[#45464d] uppercase tracking-wider font-semibold block" 
              htmlFor="email"
            >
              Corporate Email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 bg-white border border-[#c6c6cd] px-4 font-sans text-sm text-[#191c1e] hover:border-black focus:border-[#000000] focus:ring-0 outline-none transition-colors rounded-sm"
                placeholder="user@company.com"
                required
              />
            </div>
          </div>

          {/* Access Key Field */}
          <div className="flex flex-col gap-1.5">
            <label 
              className="font-mono text-[10px] text-[#45464d] uppercase tracking-wider font-semibold block" 
              htmlFor="password"
            >
              Access Key
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 bg-white border border-[#c6c6cd] px-4 font-sans text-sm text-[#191c1e] hover:border-black focus:border-[#000000] focus:ring-0 outline-none transition-colors rounded-sm"
                placeholder="••••••••"
                required
              />
              <span className="absolute right-3 top-3.5 text-xs text-gray-400 select-none cursor-help font-mono" title="Demo password is 'admin'">
                (admin)
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 h-12 bg-black text-white font-sans text-sm font-bold hover:bg-neutral-800 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 rounded-sm"
          >
            {isLoading ? (
              <span className="animate-pulse">Verifying credentials...</span>
            ) : (
              <>
                <span>Sign In</span>
                <span className="material-symbols-outlined text-[18px]">key</span>
              </>
            )}
          </button>
        </form>

        <div className="border-t border-[#eceef0] pt-4 text-center">
          <p className="font-mono text-[10px] text-[#76777d]">
            AUTHORIZED ACCESS ONLY • PORT 3000 SSL SECURE
          </p>
        </div>
      </div>
    </div>
  );
}
