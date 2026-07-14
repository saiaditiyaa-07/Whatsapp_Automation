'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ShieldAlert, ArrowRight, CheckCircle2, User, Building } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function SignupPage() {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!workspaceName.trim() || !fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Registration failed');
      }

      // Auto login
      const loginRes = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      if (!loginRes.ok) {
        throw new Error('Registration succeeded but auto-login failed. Please log in manually.');
      }
      const data = await loginRes.json();
      localStorage.setItem('auth_token', data.access_token);
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-slate-100 flex items-center justify-center p-4">
      {/* Glow shapes */}
      <div className="absolute h-96 w-96 bg-indigo-500/5 blur-[120px] rounded-full top-1/4 left-1/4 pointer-events-none" />
      <div className="absolute h-96 w-96 bg-emerald-500/5 blur-[120px] rounded-full bottom-1/4 right-1/4 pointer-events-none" />

      <div className="w-full max-w-md bg-darkSurface border border-darkBorder rounded-2xl p-8 shadow-2xl relative overflow-hidden select-none">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md mx-auto mb-4">
            W
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">Create Workspace</h1>
          <p className="text-xs text-slate-400 mt-1.5">Register a tenant workspace to start automating WhatsApp triggers.</p>
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
            Workspace successfully built! Logging in...
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Workspace Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="e.g. Acme Corp Automation"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brandIndigo transition-colors"
                required
              />
              <Building className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-505" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Your Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brandIndigo transition-colors"
                required
              />
              <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-550" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
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
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brandIndigo transition-colors"
                required
              />
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
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
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-505 text-white rounded-lg text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? 'Creating Account...' : 'Register Workspace'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Login redirect */}
        <p className="text-[11px] text-slate-400 text-center mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold text-brandIndigo hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
