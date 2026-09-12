import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, ShieldCheck, Clock, Terminal, Activity, Sun, Moon, Lock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const [codeTab, setCodeTab] = useState<'curl' | 'node' | 'python'>('curl');
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  return (
    <div className={`min-h-screen font-sans selection:bg-zinc-800 flex flex-col transition-colors ${
      theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'
    }`}>
      {/* Header Bar */}
      <header className={`h-14 border-b px-6 flex items-center justify-between sticky top-0 z-40 ${
        theme === 'dark' ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-white'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs ${
            theme === 'dark' ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-900 text-zinc-100'
          }`}>
            SC
          </div>
          <span className="font-semibold text-sm tracking-tight">
            Samast Cron
          </span>
        </div>

        <nav className="flex items-center gap-6 text-xs text-zinc-400">
          <a href="#features" className="hover:text-zinc-100 transition-colors">Features</a>
          <a href="#code" className="hover:text-zinc-100 transition-colors">API</a>
          <Link to="/docs" className="hover:text-zinc-100 transition-colors">Documentation</Link>
          <a href="/api/docs" target="_blank" rel="noreferrer" className="hover:text-zinc-100 transition-colors flex items-center gap-1">
            <span>OpenAPI</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </nav>

        <div className="flex items-center gap-3 text-xs">
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded border transition-colors ${
              theme === 'dark' ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white' : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
            title="Toggle Light / Dark Mode"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {!isAuthenticated && (
            <Link
              to="/login"
              className="text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1 font-medium"
            >
              Sign In
            </Link>
          )}

          <Link
            to={isAuthenticated ? "/dashboard/schedules" : "/register"}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded transition-colors ${
              theme === 'dark' ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800'
            }`}
          >
            <span>{isAuthenticated ? 'Open Console' : 'Get Started'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-6 max-w-5xl mx-auto text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded border text-xs font-mono mb-6 ${
            theme === 'dark' ? 'border-zinc-800 bg-zinc-900 text-zinc-400' : 'border-zinc-200 bg-zinc-100 text-zinc-600'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Infrastructure Status: 100% Operational</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-3xl mx-auto leading-tight mb-4">
            Reliable scheduled HTTP requests.
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Create cron schedules that call your URLs automatically. Monitor every execution, inspect headers and payloads, and receive alerts when an endpoint fails.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link
              to={isAuthenticated ? "/dashboard/schedules" : "/register"}
              className={`px-4 py-2 rounded font-semibold text-xs transition-colors flex items-center gap-1.5 ${
                theme === 'dark' ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800'
              }`}
            >
              <span>Manage Schedules</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <a
              href="/api/docs"
              target="_blank"
              rel="noreferrer"
              className={`px-4 py-2 rounded border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                theme === 'dark' ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white' : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              <span>Swagger API Specs</span>
            </a>
          </div>
        </section>

        {/* Feature Section */}
        <section id="features" className={`py-16 px-6 max-w-5xl mx-auto border-t ${
          theme === 'dark' ? 'border-zinc-900' : 'border-zinc-200'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-5 border rounded space-y-2 ${
              theme === 'dark' ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-white'
            }`}>
              <Clock className="w-5 h-5 text-zinc-400" />
              <h3 className="text-sm font-semibold">Cron Expressions</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Supports standard 5-part cron syntax with real-time schedule translation and execution window previews.
              </p>
            </div>

            <div className={`p-5 border rounded space-y-2 ${
              theme === 'dark' ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-white'
            }`}>
              <Activity className="w-5 h-5 text-zinc-400" />
              <h3 className="text-sm font-semibold">Execution History</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Inspect every HTTP request status code, response time, request body, headers, and failure traces.
              </p>
            </div>

            <div className={`p-5 border rounded space-y-2 ${
              theme === 'dark' ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-white'
            }`}>
              <ShieldCheck className="w-5 h-5 text-zinc-400" />
              <h3 className="text-sm font-semibold">Worker Sandboxing</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                SSRF protected worker pools enforce metadata blocking and strict timeouts on all HTTP calls.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={`border-t py-8 px-6 text-xs text-zinc-500 ${
        theme === 'dark' ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-zinc-100'
      }`}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-zinc-400">Samast Cron</span> — Scheduled HTTP Infrastructure.
          </div>

          <div className="flex items-center gap-6">
            <Link to="/docs" className="hover:text-zinc-300 transition-colors">Documentation</Link>
            <a href="/api/docs" target="_blank" rel="noreferrer" className="hover:text-zinc-300 transition-colors">OpenAPI Docs</a>
            <Link to="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
