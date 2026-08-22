'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Mail, Lock, User, Phone, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { useToast } from './Toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login' }: AuthModalProps) {
  const { showToast } = useToast();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (err) throw err;

        showToast('Welcome back!', 'Successfully signed into your Triqna account.', 'success');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        // Sign Up
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone_number: phone,
            },
          },
        });

        if (err) throw err;

        showToast('Account Created!', 'Your profile has been created successfully.', 'success');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative flex flex-col gap-6">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col gap-1 text-center items-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl mb-1 border border-blue-200">
            T
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {mode === 'login' ? 'Welcome Back to Triqna' : 'Create Your Triqna Account'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {mode === 'login' ? 'Log in to manage rides and coordinate bookings' : 'Sign up to offer rides or book cost-sharing seats'}
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold text-center rounded-lg transition-all cursor-pointer ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold text-center rounded-lg transition-all cursor-pointer ${
              mode === 'signup' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-xs text-red-700 font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Full Name</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="text"
                    placeholder="e.g. Youssef El Alami"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-airbnb w-full pl-9 pr-3 py-2.5 outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Phone Number</label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="tel"
                    placeholder="+212 600 000 000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-airbnb w-full pl-9 pr-3 py-2.5 outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                required
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-airbnb w-full pl-9 pr-3 py-2.5 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-airbnb w-full pl-9 pr-3 py-2.5 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-blue w-full py-3 text-xs flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {loading ? 'Processing...' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        {/* Switch Mode Footer Link */}
        <div className="text-center text-xs text-slate-500 font-medium pt-1">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                className="text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Sign Up for free
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); }}
                className="text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Log In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
