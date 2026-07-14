'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ShieldAlert, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 800));
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Verification trigger failed. Please try again.');
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
          <h1 className="text-lg font-bold text-white tracking-tight">Recover Password</h1>
          <p className="text-xs text-slate-400 mt-1.5">
            We will send a password reset verification link to your registered email address.
          </p>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-brandRed/10 border border-brandRed/20 text-xs font-medium text-brandRed flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-6 text-center py-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-brandGreen flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">Verification Link Sent</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Please check your inbox at <b className="text-slate-200">{email}</b> and follow the instructions to reset your account credentials.
              </p>
            </div>
            <Link 
              href="/auth/login" 
              className="inline-flex items-center gap-2 text-xs font-semibold text-brandIndigo hover:underline pt-2 outline-none"
            >
              <ArrowLeft className="h-4 w-4" /> Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Registered Email Address
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

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending Link...' : 'Request Recovery Link'}
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Back link */}
            <div className="text-center mt-6">
              <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 font-semibold transition-all">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
