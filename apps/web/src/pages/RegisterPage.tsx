import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Lock, Mail, User as UserIcon, ArrowRight, Sun, Moon } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await register(name, email, password);
      navigate('/dashboard/schedules');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors ${
      theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'
    }`}>
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className={`p-2 rounded border transition-colors ${
            theme === 'dark' ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white' : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
          }`}
          title="Toggle Light / Dark Mode"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center font-mono font-bold text-sm">
            SC
          </div>
          <span className="font-bold text-lg tracking-tight">Samast Cron</span>
        </Link>
        <h2 className="text-xl font-semibold tracking-tight">Create your account</h2>
        <p className="mt-1 text-xs text-zinc-500">Deploy scheduled HTTP automation in seconds.</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`py-8 px-6 border rounded-lg shadow-sm sm:px-10 space-y-6 ${
          theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Dev Admin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`pl-9 pr-3 py-2 w-full text-xs rounded border focus-ring ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="admin@samast.pro"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-9 pr-3 py-2 w-full text-xs rounded border focus-ring ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-9 pr-3 py-2 w-full text-xs rounded border focus-ring ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 rounded bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Creating account...' : 'Create Account'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="text-center text-xs text-zinc-500 pt-2 border-t border-zinc-800/60">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-zinc-400 hover:text-zinc-200 underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
