'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                         process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

      if (isMockMode) {
        // Mock successful login in demo mode
        await new Promise((resolve) => setTimeout(resolve, 800));
        router.push('/dashboard');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030305] text-[#e2e8f0] flex items-center justify-center p-4 tech-grid relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none pulse-light" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-[120px] pointer-events-none pulse-light" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-md p-8 rounded-2xl glass-panel relative z-10 animate-fade-in border border-white/[0.04]">
        
        {/* Glowing top line */}
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-indigo-500 to-teal-500 mb-4 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <Sparkles className="h-5 w-5 text-white animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight uppercase display-font">SociallyIntelligent</h2>
          <span className="text-[9px] uppercase tracking-wider text-teal-400 font-mono font-bold mt-1">Cognitive analytics workspace</span>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.02] text-rose-400 text-xs font-mono animate-fade-in">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[9px] text-gray-500 font-bold uppercase tracking-wider font-mono mb-1.5">Email Address</label>
            <input
              type="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#08080c] border border-white/[0.04] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50 transitionplaceholder-gray-700 font-medium"
            />
          </div>

          <div>
            <label className="block text-[9px] text-gray-500 font-bold uppercase tracking-wider font-mono mb-1.5">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#08080c] border border-white/[0.04] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition placeholder-gray-700 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] disabled:opacity-50 mt-6"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <>
                Access Account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 pt-5 border-t border-white/[0.04]">
          <p className="text-xs text-gray-500">
            Need a workspace?{' '}
            <Link href="/auth/register" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
              Initialize here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
