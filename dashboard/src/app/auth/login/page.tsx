'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';


const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

console.log("NEXT_PUBLIC_API_URL =", process.env.NEXT_PUBLIC_API_URL);
console.log("API_BASE =", API_BASE);
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Incorrect email or password');
      }
      const data = await res.json();
      localStorage.setItem('auth_token', data.access_token);
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-slate-100 flex items-center justify-center p-4">
      {/* Background radial glow */}
      <div className="absolute h-96 w-96 bg-indigo-500/5 blur-[120px] rounded-full top-1/4 left-1/4 pointer-events-none" />
      <div className="absolute h-96 w-96 bg-emerald-500/5 blur-[120px] rounded-full bottom-1/4 right-1/4 pointer-events-none" />

      <div className="w-full max-w-md bg-darkSurface border border-darkBorder rounded-2xl p-8 shadow-2xl relative overflow-hidden select-none">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md mx-auto mb-4">
            W
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">Welcome Back</h1>
          <p className="text-xs text-slate-400 mt-1.5">Access your workspace automation logs and rules.</p>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-brandRed/10 border border-brandRed/20 text-xs font-medium text-brandRed flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 p-3 rounded-lg bg-brandGreen/10 border border-brandGreen/20 text-xs font-medium text-brandGreen flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Sign in successful! Redirecting...
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@acme.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brandIndigo transition-colors"
                required
              />
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <Link href="/auth/forgot-password" className="text-[10px] font-semibold text-brandIndigo hover:underline">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brandIndigo transition-colors"
                required
              />
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || success}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Social login divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-darkBorder/60"></div>
          </div>
          <span className="relative px-3 text-[10px] bg-darkSurface text-slate-500 uppercase tracking-wider">
            Or continue with
          </span>
        </div>

        {/* Google OAuth CTA */}
        <button
          onClick={handleLogin}
          className="w-full py-2.5 bg-darkBg hover:bg-slate-800/40 border border-darkBorder rounded-lg text-xs font-medium text-slate-300 flex items-center justify-center gap-2 transition-all outline-none"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.65 4.5 1.8l2.4-2.4C17.3 1.7 14.85 1 12.24 1 6.59 1 2 5.59 2 11.24s4.59 10.24 10.24 10.24c5.9 0 9.8-4.13 9.8-9.98 0-.67-.06-1.32-.19-1.93l-7.61-.29z" />
          </svg>
          Google Workspace Account
        </button>

        {/* Signup CTA */}
        <p className="text-[11px] text-slate-400 text-center mt-6">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="font-semibold text-brandIndigo hover:underline">
            Register Workspace
          </Link>
        </p>
      </div>
    </div>
  );
}
