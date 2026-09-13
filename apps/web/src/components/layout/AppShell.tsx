import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, 
  Clock, 
  Activity, 
  ShieldCheck, 
  Bell, 
  Key, 
  Settings, 
  ExternalLink,
  BookOpen,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  Server,
  BarChart3,
  Users,
  Terminal,
  Sliders,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function AppShell() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('samast_sidebar_collapsed') === 'true';
  });
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSidebar = () => {
    const nextState = !sidebarCollapsed;
    setSidebarCollapsed(nextState);
    localStorage.setItem('samast_sidebar_collapsed', String(nextState));
  };

  interface NavItem {
    label: string;
    to: string;
    icon: any;
    exact?: boolean;
    badge?: string;
  }

  const isAdmin =
    user?.role === 'admin' ||
    user?.email?.toLowerCase() === 'kachak331@gmail.com' ||
    user?.email?.toLowerCase() === 'kachakaran@gmail.com' ||
    user?.email?.toLowerCase() === 'kachakaran6@gmail.com' ||
    user?.email?.toLowerCase() === 'kachakaran06@gmail.com';
  const isDeveloperAdmin = isAdmin;

  const baseNavItems: NavItem[] = [
    { label: 'Overview', to: '/dashboard', icon: LayoutGrid, exact: true },
    { label: 'Schedules', to: '/dashboard/schedules', icon: Clock },
    { label: 'Execution History', to: '/dashboard/executions', icon: Activity },
    { label: 'Monitors', to: '/dashboard/monitors', icon: ShieldCheck },
    { label: 'Notifications', to: '/dashboard/notifications', icon: Bell },
    { label: 'API Keys', to: '/dashboard/api-keys', icon: Key },
    { label: 'Billing & Pro', to: '/dashboard/billing', icon: CreditCard },
    { label: 'Settings', to: '/dashboard/settings', icon: Settings },
  ];

  const adminSubNavItems: NavItem[] = [
    { label: 'Admin Overview', to: '/dashboard/admin/overview', icon: Shield },
    { label: 'Plans & Pricing', to: '/dashboard/admin/plans', icon: Sparkles },
    { label: 'Gumroad & MRR', to: '/dashboard/admin/gumroad', icon: CreditCard },
    { label: 'System State', to: '/dashboard/admin/state', icon: Server },
    { label: 'System Analytics', to: '/dashboard/admin/analytics', icon: BarChart3 },
    { label: 'User Directory', to: '/dashboard/admin/users', icon: Users },
    { label: 'System Logs', to: '/dashboard/admin/logs', icon: Terminal },
    { label: 'Runtime Config', to: '/dashboard/admin/config', icon: Sliders },
  ];

  const mobileQuickItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutGrid, exact: true },
    { label: 'Schedules', to: '/dashboard/schedules', icon: Clock },
    { label: 'History', to: '/dashboard/executions', icon: Activity },
    { label: 'Settings', to: '/dashboard/settings', icon: Settings },
  ];

  const userInitial = user?.name ? user.name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : 'A');

  return (
    <div className="h-screen overflow-hidden flex flex-col font-sans transition-colors bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-zinc-300 dark:selection:bg-zinc-800">
      {/* Compact Header Bar */}
      <header className="h-14 border-b px-3 sm:px-6 flex items-center justify-between flex-shrink-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-zinc-200 dark:border-zinc-800 shadow-xs z-20">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 -ml-1 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div 
              style={{ backgroundColor: 'var(--accent)' }}
              className="w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs text-white shadow-sm transition-colors"
            >
              SC
            </div>
            <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
              Samast Cron
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 text-xs">
          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded border transition-colors border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-xs"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-zinc-700" />}
          </button>

          <Link
            to="/docs"
            className="hidden sm:flex text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors items-center gap-1 py-1 px-2 font-medium"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Docs</span>
          </Link>

          <a
            href="/api/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors items-center gap-1 py-1 px-2 font-medium"
          >
            <span>OpenAPI</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {/* User Profile Circle Avatar with Popover Dropdown */}
          <div className="relative pl-1.5 sm:pl-2 border-l border-zinc-200 dark:border-zinc-800" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="w-8 h-8 rounded-full border border-zinc-300 dark:border-zinc-700 bg-[var(--accent)] text-white font-bold text-xs flex items-center justify-center shadow-xs hover:opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              title="Account options"
            >
              {userInitial}
            </button>

            {/* Profile Popover Menu */}
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {/* Account Header */}
                <div className="p-2.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-white font-bold text-sm flex items-center justify-center shadow-sm flex-shrink-0">
                    {userInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {user?.name || 'Administrator'}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                      {user?.email || 'admin@samast.pro'}
                    </div>
                    <div className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60">
                      Personal Workspace
                    </div>
                  </div>
                </div>

                {/* Quick Navigation */}
                <div className="py-1">
                  <Link
                    to="/dashboard/billing"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-indigo-500" />
                    <span>Billing &amp; Pro Plan</span>
                  </Link>
                  <Link
                    to="/dashboard/settings"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-zinc-500" />
                    <span>Account &amp; Settings</span>
                  </Link>
                  <Link
                    to="/dashboard/api-keys"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <Key className="w-4 h-4 text-zinc-500" />
                    <span>API Keys &amp; Tokens</span>
                  </Link>
                  <Link
                    to="/docs"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-zinc-500" />
                    <span>Documentation</span>
                  </Link>
                </div>

                {/* Sign Out Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Slide-out Sheet */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 p-4 flex flex-col justify-between transform transition-transform duration-250 ease-in-out md:hidden shadow-2xl ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-4 overflow-y-auto">
          {/* Mobile Drawer Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <Link 
              to="/dashboard" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5"
            >
              <div 
                style={{ backgroundColor: 'var(--accent)' }}
                className="w-7 h-7 rounded flex items-center justify-center font-mono font-bold text-xs text-white shadow-sm"
              >
                SC
              </div>
              <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                Samast Cron
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1">
                Platform
              </div>
              {baseNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact 
                  ? (location.pathname === item.to || location.pathname === '/dashboard/') && !location.pathname.startsWith('/dashboard/admin')
                  : location.pathname.startsWith(item.to) && !location.pathname.startsWith('/dashboard/admin');

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'nav-active-accent font-semibold'
                        : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            {isAdmin && (
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="flex items-center justify-between px-2 py-1 mb-0.5">
                  <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Developer Admin
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    ADMIN
                  </span>
                </div>
                {adminSubNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to || (item.to === '/dashboard/admin/overview' && location.pathname === '/dashboard/admin');

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/30'
                          : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-600 dark:text-amber-400' : ''}`} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>

          {/* Additional Links */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
            <div className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1">
              Resources
            </div>
            <Link
              to="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <BookOpen className="w-4 h-4 flex-shrink-0" />
              <span>Documentation</span>
            </Link>
            <a
              href="/api/docs"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <span className="flex items-center gap-3">
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                <span>OpenAPI Specs</span>
              </span>
            </a>
          </div>
        </div>

        {/* Mobile Drawer Footer */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex-shrink-0">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[130px]">
                  {user?.email || 'admin@samast.pro'}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">Console Active</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="p-2 rounded-md border border-zinc-200 dark:border-zinc-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-zinc-900"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-900">
            <span>Samast Engine</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900">v1.4.2</span>
          </div>
        </div>
      </div>

      {/* Main Layout Body (Locked Layout, Collapsible Sidebar, Scrollable Body) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Desktop Collapsible Navigation Sidebar */}
        <aside
          className={`${
            sidebarCollapsed ? 'w-16' : 'w-56'
          } relative h-full flex-shrink-0 border-r p-3 hidden md:flex flex-col justify-between overflow-visible transition-all duration-300 ease-in-out border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950`}
        >
          {/* Floating Border Toggle Arrow Button */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden md:flex absolute -right-3 top-5 z-40 w-6 h-6 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 items-center justify-center shadow-md hover:scale-110 transition-all cursor-pointer"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="space-y-1">
              {!sidebarCollapsed && (
                <div className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1 mb-0.5 animate-in fade-in duration-200">
                  Platform
                </div>
              )}
              {baseNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact 
                  ? (location.pathname === item.to || location.pathname === '/dashboard/') && !location.pathname.startsWith('/dashboard/admin')
                  : location.pathname.startsWith(item.to) && !location.pathname.startsWith('/dashboard/admin');

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={item.label}
                    className={`flex items-center gap-2.5 py-2 rounded-md text-xs font-medium transition-all ${
                      isActive
                        ? 'nav-active-accent font-semibold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                    } ${sidebarCollapsed ? 'justify-center px-0' : 'px-2.5'}`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>

            {isAdmin && (
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 space-y-1">
                {!sidebarCollapsed && (
                  <div className="flex items-center justify-between px-2 py-1 mb-0.5">
                    <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Developer Admin
                    </span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      ADMIN
                    </span>
                  </div>
                )}
                {adminSubNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to || (item.to === '/dashboard/admin/overview' && location.pathname === '/dashboard/admin');

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      title={item.label}
                      className={`flex items-center gap-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/30'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                      } ${sidebarCollapsed ? 'justify-center px-0' : 'px-2.5'}`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-600 dark:text-amber-400' : ''}`} />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>

          <div
            className={`px-2 py-2 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center text-[11px] font-mono text-zinc-500 dark:text-zinc-400 ${
              sidebarCollapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            {!sidebarCollapsed && <span>Samast Engine</span>}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 font-bold">
              {sidebarCollapsed ? 'v1.4' : 'v1.4.2'}
            </span>
          </div>
        </aside>

        {/* Dynamic Route Scrollable View Area */}
        <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 w-full pb-20 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sticky Bottom Quick-Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around h-14 px-2 shadow-lg">
        {mobileQuickItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? location.pathname === item.to || location.pathname === '/dashboard/'
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-[var(--accent)] font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* More/Drawer button in bottom bar */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            mobileMenuOpen 
              ? 'text-[var(--accent)] font-semibold' 
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
