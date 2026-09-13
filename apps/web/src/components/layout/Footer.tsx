import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ShieldCheck, Zap, Globe, Layers } from 'lucide-react';

interface FooterProps {
  dark?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ dark = true }) => {
  return (
    <footer
      className={`border-t py-12 px-4 sm:px-6 lg:px-8 text-xs transition-colors ${dark
        ? 'border-zinc-800/80 bg-zinc-950 text-zinc-400'
        : 'border-zinc-200 bg-zinc-50 text-zinc-600'
        }`}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div
                style={{ backgroundColor: 'var(--accent)' }}
                className="w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs text-white shadow-xs"
              >
                SC
              </div>
              <span className={`font-bold tracking-tight text-sm ${dark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                Samast Cron
              </span>
            </div>
            <p className={`text-xs leading-relaxed ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Reliable, millisecond-accurate scheduled HTTP request infrastructure & background job execution platform.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                All Systems Operational
              </span>
            </div>
          </div>

          {/* Col 2: Samast Ecosystem / Products */}
          <div className="space-y-3">
            <h3 className={`font-mono text-[11px] font-bold uppercase tracking-wider ${dark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              Products
            </h3>
            <ul className="space-y-2 font-medium">
              <li>
                <a
                  href="https://samast.pro"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-emerald-500 transition-colors"
                >
                  <span>Samast</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://forms.samast.pro"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-emerald-500 transition-colors"
                >
                  <span>Samast Forms</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://pages.samast.pro"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-emerald-500 transition-colors"
                >
                  <span>Samast Pages</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://cron.samast.pro"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-emerald-500 transition-colors"
                >
                  <span>Samast Cron</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Platform Resources */}
          <div className="space-y-3">
            <h3 className={`font-mono text-[11px] font-bold uppercase tracking-wider ${dark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              Platform & Docs
            </h3>
            <ul className="space-y-2 font-medium">
              <li>
                <Link to="/pricing" className="hover:text-emerald-500 transition-colors">
                  Pricing &amp; Plans
                </Link>
              </li>
              <li>
                <Link to="/docs" className="hover:text-emerald-500 transition-colors">
                  Documentation & Guides
                </Link>
              </li>
              <li>
                <a
                  href="/api/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-emerald-500 transition-colors"
                >
                  <span>OpenAPI / Swagger Spec</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <Link to="/status/system-health" className="hover:text-emerald-500 transition-colors">
                  Public Status Monitor
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-emerald-500 transition-colors">
                  Control Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Security */}
          <div className="space-y-3">
            <h3 className={`font-mono text-[11px] font-bold uppercase tracking-wider ${dark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              Legal & Open Source
            </h3>
            <ul className="space-y-2 font-medium">
              <li>
                <Link to="/privacy" className="hover:text-emerald-500 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-emerald-500 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/kachakaran6/cron"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-emerald-500 transition-colors"
                >
                  <span>GitHub Repository (MIT)</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright bar */}
        <div className={`pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] ${dark ? 'border-zinc-800/80 text-zinc-500' : 'border-zinc-200 text-zinc-500'
          }`}>
          <div>
            © {new Date().getFullYear()} Samast Infrastructure. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Security Verified
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> High-Availability Cluster
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
