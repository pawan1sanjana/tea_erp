import React, { useState, useEffect } from 'react';
import { Moon, Sun, Leaf, Lock, Mail, ChevronRight } from 'lucide-react';
import { apiClient } from '../api/client';

export default function LoginPage({ onLogin, theme, onToggleTheme }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.success) {
        localStorage.setItem('token', response.token);
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
        }
        onLogin();
      } else {
        setError(response.error || 'Invalid credentials');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check the backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans">
      <div className="flex flex-1 flex-col justify-center pt-6 pb-10 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96 animate-fade-in">
          <div className="flex flex-col group cursor-default">
            <div className="flex items-center gap-5 mb-3">
              <img src="/logo.png" alt="Evergreen Logo" className="h-20 w-20 object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105" />
              <div className="flex flex-col">
                <h2 className="text-3xl font-black tracking-tighter font-outfit leading-none">
                  <span className="bg-gradient-to-r from-tea-600 to-emerald-600 dark:from-tea-400 dark:to-emerald-400 bg-clip-text text-transparent">Evergreen</span>
                  <span className="block text-slate-900 dark:text-white mt-1 text-2xl">Estate ERP</span>
                </h2>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.4em] px-2 mt-0.5">
              Plantation Management
            </p>
          </div>

          <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">
            Sign in to your dashboard
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Welcome back to the Evergreen Estate ERP.
          </p>

          <div className="mt-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 text-left">
                  Work Email
                </label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 placeholder-slate-400 shadow-sm focus:border-tea-500 focus:outline-none focus:ring-1 focus:ring-tea-500 sm:text-sm text-slate-900 dark:text-white transition-all"
                    placeholder="admin@estate-intelligence.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 text-left">
                  Security Password
                </label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 placeholder-slate-400 shadow-sm focus:border-tea-500 focus:outline-none focus:ring-1 focus:ring-tea-500 sm:text-sm text-slate-900 dark:text-white transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-tea-600 focus:ring-tea-500 dark:border-slate-600 dark:bg-slate-900"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">
                    Stay logged in
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-tea-600 hover:text-tea-500 dark:text-tea-400 dark:hover:text-tea-300">
                    Forgot Password?
                  </a>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400 font-medium animate-pulse">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center rounded-xl border border-transparent bg-tea-600 py-3 px-4 text-sm font-bold text-white shadow-lg shadow-tea-600/30 hover:bg-tea-700 focus:outline-none focus:ring-2 focus:ring-tea-500 focus:ring-offset-2 transition-all active:scale-95 disabled:opacity-60"
                >
                  {loading ? 'Authenticating Gateway...' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Visual Hero Section */}
      <div className="relative hidden md:flex flex-1 lg:flex-[1.5] animate-fade-in">
        <img
          className="absolute inset-0 h-full w-full object-cover rounded-l-[40px] shadow-2xl"
          src="/tea-hero.png"
          alt="Lush green tea plantation"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-tea-900/90 to-slate-900/40 rounded-l-[40px] mix-blend-multiply" />

        <div className="absolute bottom-20 left-20 right-20 text-white max-w-2xl px-6 border-l-4 border-tea-500 translate-y-0 hover:-translate-y-2 transition-transform duration-500">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-white drop-shadow-lg font-outfit">
            Next-Generation Tea Estate Management Platform <br />
          </h1>
          <p className="text-lg opacity-90 drop-shadow-md text-slate-200">
            Smart field monitoring, GIS-based plantation mapping, and end-to-end supply chain visibility to power smarter, data-driven tea estate management.
          </p>
        </div>

        {/* Floating Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="absolute top-8 right-8 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md shadow-sm ring-1 ring-white/20 hover:bg-white/20 transition-all active:scale-90"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </div>
  );
}
