import React from 'react';
import { Settings, ShieldCheck, Globe, Palette, Check, Sun, Moon } from 'lucide-react';
import { useTheme, ACCENT_PALETTES, AccentColor } from '../../context/ThemeContext';

export default function SettingsPage() {
  const { theme, setTheme, accent, setAccent, currentPalette } = useTheme();

  const accentEntries = Object.values(ACCENT_PALETTES);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Top Header */}
      <div className="pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Settings &amp; Preferences
        </h1>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
          Customize your dashboard appearance, accent colors, timezones, and worker execution parameters.
        </p>
      </div>

      {/* ── 1. Appearance & Accent Colors ────────────────────────────────────── */}
      <div className="p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xs font-mono uppercase font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <Palette className="w-4 h-4 text-zinc-500" />
            <span>Accent Theme &amp; Color Palette</span>
          </h2>

          {/* Light / Dark Mode Toggle Pills */}
          <div className="flex items-center p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-xs self-start sm:self-auto">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                theme === 'light'
                  ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                theme === 'dark'
                  ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-sky-400" />
              <span>Dark</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Select your preferred accent brand color. All active tabs, action buttons, status highlights, and focus rings will dynamically update.
        </p>

        {/* Accent Color Palette Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {accentEntries.map((item) => {
            const isSelected = accent === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setAccent(item.id)}
                className={`relative flex items-center gap-2.5 p-2.5 sm:p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-2 border-[var(--accent)] bg-zinc-50 dark:bg-zinc-900/80 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: item.hex }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {item.name}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    {item.id === 'orange' ? 'Reddit style' : item.id === 'violet' ? 'Default SaaS' : item.label.split('(')[1]?.replace(')', '') || item.name}
                  </div>
                </div>
                {isSelected && (
                  <div 
                    style={{ backgroundColor: item.hex }}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center text-white flex-shrink-0"
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Live Interactive Preview */}
        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40 space-y-3">
          <div className="text-[11px] font-mono font-semibold uppercase text-zinc-500 tracking-wider">
            Live Preview with Current Accent ({currentPalette.name})
          </div>
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button className="px-3.5 py-1.5 rounded-md btn-accent font-semibold text-xs shadow-sm">
              Primary Action
            </button>
            <span className="px-2.5 py-1 rounded text-xs font-semibold accent-badge">
              Active Highlight
            </span>
            <div className="flex items-center gap-2 px-3 py-1 rounded text-xs nav-active-accent">
              <span>Active Navigation Item</span>
            </div>
            <input
              type="text"
              readOnly
              value="Interactive Focus Ring"
              className="px-2.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-xs text-zinc-800 dark:text-zinc-200 focus-ring font-mono flex-1 sm:flex-initial min-w-[150px]"
            />
          </div>
        </div>
      </div>

      {/* ── 2. Timezone Configuration ────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none space-y-4">
        <h2 className="text-xs font-mono uppercase font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          <Globe className="w-4 h-4 text-zinc-500" />
          <span>Default Schedule Timezone</span>
        </h2>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          New cron jobs will be scheduled with this default timezone unless explicitly overridden during creation.
        </p>
        <div>
          <select
            defaultValue="UTC"
            className="w-full sm:w-72 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 font-mono focus-ring shadow-xs"
          >
            <option value="UTC">Coordinated Universal Time (UTC)</option>
            <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
            <option value="America/New_York">America/New_York (EST -5:00)</option>
            <option value="Europe/London">Europe/London (GMT +0:00)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST +9:00)</option>
            <option value="Europe/Berlin">Europe/Berlin (CET +1:00)</option>
          </select>
        </div>
      </div>

      {/* ── 3. Infrastructure Worker Security ────────────────────────────────── */}
      <div className="p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none space-y-4">
        <h2 className="text-xs font-mono uppercase font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-zinc-500" />
          <span>Infrastructure Worker Security</span>
        </h2>
        <div className="text-xs text-zinc-700 dark:text-zinc-300 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 border border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-50 dark:bg-zinc-900/60 font-mono">
            <span>SSRF Protection Mode</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Strict (Private CIDR Blocked)
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 border border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-50 dark:bg-zinc-900/60 font-mono">
            <span>Max Request Timeout</span>
            <span className="text-zinc-900 dark:text-zinc-200 font-semibold">30 seconds</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 border border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-50 dark:bg-zinc-900/60 font-mono">
            <span>Worker Concurrency Limit</span>
            <span className="text-zinc-900 dark:text-zinc-200 font-semibold">50 threads</span>
          </div>
        </div>
      </div>
    </div>
  );
}
