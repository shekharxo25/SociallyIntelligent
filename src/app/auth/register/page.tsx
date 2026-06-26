'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                         process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

      if (isMockMode) {
        // Mock successful register in demo mode
        await new Promise((resolve) => setTimeout(resolve, 800));
        setSuccessMessage('Registration successful! Redirecting to dashboard...');
        setTimeout(() => router.push('/dashboard'), 1500);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage('Check your email for a confirmation link to complete registration!');
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-[#F3F4F6] flex items-center justify-center p-4">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05),transparent_50%)] pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-2xl border border-[#1E1E24] bg-[#0E0E12] shadow-2xl relative z-10">
        
        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 mb-3 shadow-lg">
            <Sparkles className="h-6 w-6 text-white animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Create your account</h2>
          <p className="text-xs text-gray-500 mt-1.5 text-center">
            Sign up for a free MeltMini workspace and start listening.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg border border-rose-900/30 bg-rose-950/20 text-rose-400 text-xs">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg border border-emerald-900/30 bg-emerald-950/20 text-emerald-400 text-xs">
            {successMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-[10px] text-gray-500 font-semibold uppercase mb-1 tracking-wider">Email Address</label>
            <input
              type="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#14141A] border border-[#1E1E24] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition placeholder-gray-600"
            />
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 font-semibold uppercase mb-1 tracking-wider">Password</label>
            <input
              type="password"
              required
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#14141A] border border-[#1E1E24] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition placeholder-gray-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/10 disabled:opacity-50 mt-6"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Register Account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 pt-6 border-t border-[#1E1E24]">
          <p className="text-xs text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-indigo-400 font-medium hover:underline">
              Sign in here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
