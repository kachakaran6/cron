import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, Home, HelpCircle } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Glow Backdrop */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full text-center space-y-6 z-10">
        {/* Animated Icon Badge */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2 shadow-inner">
          <Clock className="w-10 h-10 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h1 className="text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            404
          </h1>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-200">
            Execution Target Not Found
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            The schedule, job, or dashboard view you are attempting to reach has either expired, been moved, or does not exist in this namespace.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          
          <Link
            to="/dashboard/jobs"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>

        <div className="pt-8 border-t border-slate-900 text-xs text-slate-500 flex items-center justify-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Need assistance? Check the <a href="/api/docs" className="text-indigo-400 hover:underline">API Documentation</a></span>
        </div>
      </div>
    </div>
  );
}
