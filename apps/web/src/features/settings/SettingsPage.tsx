import React, { useState, useEffect, useRef } from 'react';
import { Settings, ShieldCheck, Globe, Palette, Check, Sun, Moon, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useTheme, ACCENT_PALETTES, AccentColor } from '../../context/ThemeContext';

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'Coordinated Universal Time (UTC +0:00)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +5:30)' },
  { value: 'America/New_York', label: 'America/New_York (EST -5:00)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST -8:00)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST -6:00)' },
  { value: 'Europe/London', label: 'Europe/London (GMT +0:00)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET +1:00)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET +1:00)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST +9:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT +8:00)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST +4:00)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST +10:00)' },
];

export default function SettingsPage() {
  const { theme, setTheme, accent, setAccent } = useTheme();

  const [timezone, setTimezone] = useState(() => {
    return localStorage.getItem('samast_default_timezone') || 'Asia/Kolkata';
  });
  const [isTzOpen, setIsTzOpen] = useState(false);
  const [tzSavedMsg, setTzSavedMsg] = useState(false);
  const tzRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tzRef.current && !tzRef.current.contains(e.target as Node)) {
        setIsTzOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTimezone = (tzValue: string) => {
    setTimezone(tzValue);
    localStorage.setItem('samast_default_timezone', tzValue);
    setIsTzOpen(false);
    setTzSavedMsg(true);
    setTimeout(() => setTzSavedMsg(false), 2500);
  };

  const accentEntries = Object.values(ACCENT_PALETTES);

  const getSimpleName = (id: AccentColor) => {
    switch (id) {
      case 'violet': return 'Violet';
      case 'orange': return 'Orange';
      case 'emerald': return 'Emerald';
      case 'cyan': return 'Cyan';
      case 'rose': return 'Crimson';
      case 'amber': return 'Amber';
      default: return 'Color';
    }
  };

  const selectedTzObj = TIMEZONE_OPTIONS.find((t) => t.value === timezone) || TIMEZONE_OPTIONS[0];

  return (
    <div className="w-full space-y-6">
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
      <div className="p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xs font-mono uppercase font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <Palette className="w-4 h-4 text-zinc-500" />
            <span>Accent Theme &amp; Color Palette</span>
          </h2>

          {/* Light / Dark Mode Toggle Pills */}
          <div className="flex items-center p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-xs self-start sm:self-auto">
            <button
              type="button"
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
              type="button"
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
          Select your accent brand color. All active tabs, action buttons, status highlights, and focus rings update dynamically.
        </p>

        {/* Clean Simple Accent Color Palette Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {accentEntries.map((item) => {
            const isSelected = accent === item.id;
            const simpleName = getSimpleName(item.id);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setAccent(item.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-2 border-[var(--accent)] bg-zinc-50 dark:bg-zinc-900/80 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: item.hex }}
                />
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {simpleName}
                </span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 ml-auto text-[var(--accent)] stroke-[3] flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. Timezone Configuration (Shadcn UI Custom Dropdown) ────────── */}
      <div className="p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <Globe className="w-4 h-4 text-zinc-500" />
            <span>Default Schedule Timezone</span>
          </h2>

          {tzSavedMsg && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-150">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Saved</span>
            </span>
          )}
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          New cron jobs will be scheduled with this default timezone unless explicitly overridden during creation.
        </p>

        <div className="relative w-full sm:w-96" ref={tzRef}>
          {/* Custom Trigger Button */}
          <button
            type="button"
            onClick={() => setIsTzOpen(!isTzOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus-ring shadow-xs transition-all font-mono"
          >
            <span className="truncate">{selectedTzObj.label}</span>
            <ChevronDown className={`w-4 h-4 ml-2 text-zinc-400 transition-transform duration-150 ${isTzOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Popover Dropdown Menu */}
          {isTzOpen && (
            <div className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {TIMEZONE_OPTIONS.map((item) => {
                const isSelected = item.value === timezone;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleSelectTimezone(item.value)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-mono transition-colors ${
                      isSelected
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-[var(--accent)] font-semibold'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 ml-2 text-[var(--accent)] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Infrastructure Worker Security ────────────────────────────────── */}
      <div className="p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none space-y-4">
        <h2 className="text-xs font-mono uppercase font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-zinc-500" />
          <span>Infrastructure Worker Security</span>
        </h2>
        <div className="text-xs text-zinc-700 dark:text-zinc-300 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3.5 border border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-50 dark:bg-zinc-900/60 font-mono">
            <span>SSRF Protection Mode</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Strict (Private CIDR Blocked)
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3.5 border border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-50 dark:bg-zinc-900/60 font-mono">
            <span>Max Request Timeout</span>
            <span className="text-zinc-900 dark:text-zinc-200 font-semibold">30 seconds</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3.5 border border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-50 dark:bg-zinc-900/60 font-mono">
            <span>Worker Concurrency Limit</span>
            <span className="text-zinc-900 dark:text-zinc-200 font-semibold">50 threads</span>
          </div>
        </div>
      </div>
    </div>
  );
}
