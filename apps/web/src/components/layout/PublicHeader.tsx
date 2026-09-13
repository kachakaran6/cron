import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ExternalLink, ArrowRight, Sun, Moon } from 'lucide-react';

export const PublicHeader: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight text-base">
          <span className="text-zinc-900 dark:text-zinc-100 font-extrabold tracking-tight">Samast Cron</span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-5 text-xs font-medium">
          <Link to="/tools/crontab-generator" className="hidden sm:inline-block text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            Cron Generator
          </Link>
          <Link to="/pricing" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            Pricing
          </Link>
          <Link to="/docs" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            Docs
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            title="Toggle Theme"
          >
            {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {user ? (
            <Link
              to="/dashboard"
              className="px-3.5 py-1.5 rounded-lg btn-accent font-semibold shadow-xs inline-flex items-center gap-1.5"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-lg btn-accent font-semibold shadow-xs"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
