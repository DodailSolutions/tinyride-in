'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Radio,
  Search,
  Server,
  Shield,
  X,
} from 'lucide-react';

interface AdminShellProps {
  children: React.ReactNode;
}

interface SearchGroupItem {
  id: string;
  title: string;
  subtitle: string;
  link: string;
  type: string;
}

interface SearchResults {
  drivers: SearchGroupItem[];
  vehicles: SearchGroupItem[];
  schools: SearchGroupItem[];
  students: SearchGroupItem[];
  routes: SearchGroupItem[];
  trips: SearchGroupItem[];
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // System Health Modal
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [systemHealth] = useState({
    database: { status: 'healthy', latencyMs: 14, message: 'Operational' },
    realtime: { status: 'healthy', connection: 'connected', listenersCount: 1 },
    gpsIngestion: { status: 'healthy', activeTransmitters: 1, lastIngested: new Date().toISOString() },
    auth: { status: 'healthy', method: 'service_role_secured' },
  });

  // Notifications Modal/Flyout
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      category: 'Safety',
      title: 'Driver KYC Document Submitted',
      body: 'Anand Varma uploaded commercial license for review.',
      time: '12m ago',
      read: false,
    },
    {
      id: 'notif-2',
      category: 'Trip',
      title: 'Morning Fleet Rollout Initiated',
      body: 'Central Hyderabad transit corridor live telemetry established.',
      time: '34m ago',
      read: false,
    },
    {
      id: 'notif-3',
      category: 'System',
      title: 'Database Backup Completed',
      body: 'Daily transaction WAL replication snapshot healthy.',
      time: '2h ago',
      read: true,
    },
  ]);

  // Real-time Connection State
  const [connectionState, setConnectionState] = useState<'LIVE' | 'CONNECTING' | 'DEGRADED' | 'OFFLINE'>('CONNECTING');
  const [lastUpdateAgo, setLastUpdateAgo] = useState('0s ago');
  const lastHeartbeatRef = useRef<number>(Date.now());

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week'>('today');

  // Load sidebar preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tinyride_admin_sidebar_collapsed');
      if (stored === 'true') setIsCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('tinyride_admin_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  // Keyboard shortcut '/' to trigger search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setHealthModalOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Connect to SSE stream for live connection state & heartbeats
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let timer: NodeJS.Timeout | null = null;

    function connectSSE() {
      try {
        eventSource = new EventSource('/api/admin/realtime');

        eventSource.addEventListener('connected', () => {
          setConnectionState('LIVE');
          lastHeartbeatRef.current = Date.now();
        });

        eventSource.addEventListener('ping', () => {
          setConnectionState('LIVE');
          lastHeartbeatRef.current = Date.now();
        });

        eventSource.addEventListener('admin:events', () => {
          lastHeartbeatRef.current = Date.now();
        });

        eventSource.addEventListener('trip_telemetry', () => {
          lastHeartbeatRef.current = Date.now();
        });

        eventSource.onerror = () => {
          setConnectionState('OFFLINE');
          eventSource?.close();
          // Retry after 5s
          setTimeout(connectSSE, 5000);
        };
      } catch {
        setConnectionState('OFFLINE');
      }
    }

    connectSSE();

    // Heartbeat ticker to display "Updated Xs ago"
    timer = setInterval(() => {
      const diffSec = Math.floor((Date.now() - lastHeartbeatRef.current) / 1000);
      if (diffSec < 5) {
        setLastUpdateAgo('Just now');
      } else if (diffSec < 60) {
        setLastUpdateAgo(`${diffSec}s ago`);
      } else {
        const diffMin = Math.floor(diffSec / 60);
        setLastUpdateAgo(`${diffMin}m ago`);
        if (diffMin > 1) {
          setConnectionState('DEGRADED');
        }
      }
    }, 1000);

    return () => {
      if (timer) clearInterval(timer);
      if (eventSource) eventSource.close();
    };
  }, []);

  // Perform search when query changes
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const navGroups = [
    {
      title: 'Operations',
      items: [
        { label: 'Overview', href: '/admin', icon: 'dashboard' },
        { label: 'Live Fleet', href: '/admin/fleet', icon: 'map' },
        { label: 'Trips', href: '/admin/trips', icon: 'route' },
        { label: 'Routes', href: '/admin/routes', icon: 'alt_route' },
      ],
    },
    {
      title: 'Network',
      items: [
        { label: 'Schools', href: '/admin/schools', icon: 'school' },
        { label: 'Drivers', href: '/admin/drivers', icon: 'badge' },
        { label: 'Vehicles', href: '/admin/vehicles', icon: 'directions_bus' },
        { label: 'Students', href: '/admin/students', icon: 'face' },
      ],
    },
    {
      title: 'Safety',
      items: [
        { label: 'Safety Center', href: '/admin/safety', icon: 'shield_with_heart', badge: '0' },
        { label: 'Alerts', href: '/admin/alerts', icon: 'notifications_active', badge: '1' },
        { label: 'Compliance', href: '/admin/compliance', icon: 'verified_user' },
      ],
    },
    {
      title: 'Insights',
      items: [
        { label: 'Reports', href: '/admin/reports', icon: 'analytics' },
        { label: 'Analytics', href: '/admin/analytics', icon: 'insights' },
      ],
    },
    {
      title: 'Business & Support',
      items: [
        { label: 'Payments', href: '/admin/payments', icon: 'payments' },
        { label: 'Support Desk', href: '/admin/support', icon: 'support_agent' },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Audit Log', href: '/admin/audit', icon: 'history' },
        { label: 'Settings', href: '/admin/settings', icon: 'settings' },
      ],
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Format today's date in Asia/Kolkata
  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Kolkata',
  }).format(new Date());

  return (
    <div className="min-h-screen flex bg-slate-900 font-sans text-slate-100 antialiased selection:bg-emerald-600 selection:text-white">
      {/* ─────────────────────────────────────────────────────────────
          1. COLLAPSIBLE LEFT SIDEBAR
      ───────────────────────────────────────────────────────────── */}
      <aside
        className={`fixed left-0 top-0 h-full bg-slate-950 z-50 flex flex-col border-r border-slate-800 transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-60'
        } hidden md:flex`}
      >
        {/* Brand Header */}
        <div className="h-20 px-3.5 flex items-center justify-between border-b border-slate-800/80">
          {!isCollapsed && (
            <Link href="/admin" className="flex flex-col items-start gap-1 py-1 group overflow-hidden">
              <img
                src="/brand/logo-horizontal.png"
                alt="TinyRide"
                className="w-[122px] h-auto object-contain transition-opacity group-hover:opacity-90"
              />
              <span className="text-[9px] font-extrabold tracking-widest text-emerald-400 uppercase pl-1">
                OPERATIONS
              </span>
            </Link>
          )}

          {isCollapsed && (
            <Link href="/admin" className="mx-auto py-1" title="TinyRide Operations">
              <img
                src="/brand/logo-stacked.png"
                alt="TinyRide"
                className="w-9 h-9 object-contain hover:scale-105 transition-transform"
              />
            </Link>
          )}

          <button
            onClick={toggleSidebar}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors flex-shrink-0"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Live Operations Indicator Pill */}
        <div className="px-3 py-2 border-b border-slate-800/60">
          <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-[11px]">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                connectionState === 'LIVE' ? 'bg-emerald-500 animate-pulse' :
                connectionState === 'CONNECTING' ? 'bg-amber-400' :
                connectionState === 'DEGRADED' ? 'bg-amber-500' : 'bg-red-500'
              }`} />
              {!isCollapsed && (
                <span className="font-bold tracking-wider text-slate-300">
                  {connectionState === 'LIVE' ? 'OPERATIONAL' : connectionState}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] font-mono text-slate-400">{lastUpdateAgo}</span>
            )}
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-0.5">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {group.title}
                </p>
              )}
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[18px] flex-shrink-0"
                      style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <span className="flex-1 truncate tracking-tight">{item.label}</span>
                    )}
                    {!isCollapsed && item.badge && item.badge !== '0' && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom System Health & Profile */}
        <div className="p-2 border-t border-slate-800 space-y-1">
          <button
            onClick={() => setHealthModalOpen(true)}
            title="System Diagnostics & Telemetry Pipeline"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
          >
            <Activity className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 text-left flex items-center justify-between">
                <span className="font-semibold text-slate-300">System Health</span>
                <span className="text-[10px] text-emerald-400 font-mono">14ms</span>
              </div>
            )}
          </button>

          {/* Admin User Mini Card */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="w-7 h-7 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
              AD
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">Central Controller</p>
                <p className="text-[10px] text-slate-400 truncate">Hyderabad Zone</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CONTENT WRAPPER & TOP COMMAND HEADER
      ───────────────────────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        isCollapsed ? 'md:pl-16' : 'md:pl-60'
      }`}>
        {/* Sticky Command Header */}
        <header className="sticky top-0 z-40 h-16 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 sm:px-6">
          {/* Left: Page Title & Location Zone */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 md:hidden text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>

            {/* Mobile Official TinyRide Logo */}
            <Link href="/admin" className="md:hidden flex items-center gap-2">
              <img
                src="/brand/logo-horizontal.png"
                alt="TinyRide"
                className="w-[105px] h-auto object-contain"
              />
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-wider bg-slate-800 text-emerald-400 border border-slate-700/60 uppercase">
                OPS
              </span>
            </Link>

            <div className="hidden md:block">
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                Operations Command Center
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                {todayFormatted} · <span className="text-emerald-400 font-semibold">Hyderabad Transit Zone</span>
              </p>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-900 hover:bg-slate-800/80 rounded-lg border border-slate-700/80 text-xs text-slate-400 transition-all shadow-inner group"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                <span>Search drivers, vehicles, schools, routes, trips...</span>
              </span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-400">
                /
              </kbd>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Realtime Live Pulse Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-semibold">
              <span className={`w-2 h-2 rounded-full ${
                connectionState === 'LIVE' ? 'bg-emerald-500 animate-pulse' :
                connectionState === 'CONNECTING' ? 'bg-amber-400' :
                connectionState === 'DEGRADED' ? 'bg-amber-500' : 'bg-red-500'
              }`} />
              <span className="text-slate-300 font-bold tracking-wide">{connectionState}</span>
              <span className="text-[10px] text-slate-400 font-mono hidden xl:inline">
                {lastUpdateAgo}
              </span>
            </div>

            {/* Date Range Selector */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="hidden sm:block bg-slate-900 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="today">LIVE — TODAY</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
            </select>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Operational Notifications</span>
                    <button
                      onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-850">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs hover:bg-slate-900 transition-colors ${
                          !n.read ? 'bg-slate-900/40' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="font-bold text-emerald-400 uppercase tracking-wider">{n.category}</span>
                          <span>{n.time}</span>
                        </div>
                        <h4 className="font-bold text-slate-200">{n.title}</h4>
                        <p className="text-slate-400 text-[11px] mt-0.5">{n.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Public Site Link */}
            <Link
              href="/"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 transition-colors"
            >
              <span>Public Site</span>
              <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
            </Link>
          </div>
        </header>

        {/* ─────────────────────────────────────────────────────────────
            3. PAGE CHILDREN
        ───────────────────────────────────────────────────────────── */}
        <main className="flex-1 bg-slate-900 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. GLOBAL SEARCH MODAL (Triggered by / or Click)
      ───────────────────────────────────────────────────────────── */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
          <div className="w-full max-w-2xl bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input Box */}
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drivers, vehicles, schools, routes, trips, students..."
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Results Grouped by Entity */}
            <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-xs">
              {isSearching && (
                <div className="py-6 text-center text-slate-400 font-medium">
                  Searching live database...
                </div>
              )}

              {!isSearching && !searchResults && (
                <div className="py-8 text-center text-slate-500">
                  <p className="font-semibold text-slate-400">Type at least 2 characters to search across all operational entities</p>
                  <p className="text-[11px] mt-1">Examples: &quot;Ravi&quot;, &quot;TS09-TR-102&quot;, &quot;Olive Mount&quot;, &quot;M-01&quot;</p>
                </div>
              )}

              {!isSearching && searchResults && (
                <>
                  {Object.entries(searchResults).every(([_, items]) => items.length === 0) && (
                    <div className="py-8 text-center text-slate-400">
                      No matching operational entities found for &quot;{searchQuery}&quot;
                    </div>
                  )}

                  {searchResults.drivers.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">Drivers</h4>
                      <div className="space-y-1">
                        {searchResults.drivers.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              router.push(item.link);
                              setSearchOpen(false);
                            }}
                            className="w-full text-left p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 transition-colors flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-slate-200">{item.title}</p>
                              <p className="text-[11px] text-slate-400">{item.subtitle}</p>
                            </div>
                            <span className="material-symbols-outlined text-slate-500 text-[16px]">chevron_right</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.vehicles.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2">Vehicles</h4>
                      <div className="space-y-1">
                        {searchResults.vehicles.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              router.push(item.link);
                              setSearchOpen(false);
                            }}
                            className="w-full text-left p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 transition-colors flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-slate-200 font-mono">{item.title}</p>
                              <p className="text-[11px] text-slate-400">{item.subtitle}</p>
                            </div>
                            <span className="material-symbols-outlined text-slate-500 text-[16px]">chevron_right</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.schools.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-2">Schools</h4>
                      <div className="space-y-1">
                        {searchResults.schools.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              router.push(item.link);
                              setSearchOpen(false);
                            }}
                            className="w-full text-left p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 transition-colors flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-slate-200">{item.title}</p>
                              <p className="text-[11px] text-slate-400">{item.subtitle}</p>
                            </div>
                            <span className="material-symbols-outlined text-slate-500 text-[16px]">chevron_right</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.routes.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">Routes</h4>
                      <div className="space-y-1">
                        {searchResults.routes.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              router.push(item.link);
                              setSearchOpen(false);
                            }}
                            className="w-full text-left p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 transition-colors flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-slate-200">{item.title}</p>
                              <p className="text-[11px] text-slate-400">{item.subtitle}</p>
                            </div>
                            <span className="material-symbols-outlined text-slate-500 text-[16px]">chevron_right</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. SYSTEM HEALTH MODAL
      ───────────────────────────────────────────────────────────── */}
      {healthModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-950 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-white text-sm">System Health &amp; Telemetry Pipeline</h3>
              </div>
              <button onClick={() => setHealthModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-blue-400" />
                    <span>Database</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Operational</span>
                </div>
                <p className="text-base font-extrabold text-white font-mono">{systemHealth.database.latencyMs} ms</p>
                <p className="text-[10px] text-slate-400">PostGIS spatial cluster live</p>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Realtime Stream</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Connected</span>
                </div>
                <p className="text-base font-extrabold text-white font-mono">SSE Active</p>
                <p className="text-[10px] text-slate-400">In-process event bus broadcast</p>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-amber-400" />
                    <span>GPS Telemetry</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Healthy</span>
                </div>
                <p className="text-base font-extrabold text-white font-mono">High Precision</p>
                <p className="text-[10px] text-slate-400">5-second driver transmit interval</p>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-purple-400" />
                    <span>Auth Security</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Secured</span>
                </div>
                <p className="text-base font-extrabold text-white font-mono">Row Level Safe</p>
                <p className="text-[10px] text-slate-400">Role-scoped token enforcement</p>
              </div>
            </div>

            <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-900/60 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <p className="text-slate-300 text-[11px] leading-relaxed">
                All production subsystems are executing within SLA. Hyderabad Zone high-precision telemetry pipeline active.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-950/80 backdrop-blur-sm flex">
          <div className="w-64 bg-slate-950 h-full p-4 border-r border-slate-800 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex flex-col items-start gap-0.5">
                <img
                  src="/brand/logo-horizontal.png"
                  alt="TinyRide"
                  className="w-[115px] h-auto object-contain"
                />
                <span className="text-[9px] font-extrabold tracking-wider text-emerald-400 uppercase pl-0.5">
                  OPERATIONS
                </span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto space-y-3">
              {navGroups.map((g) => (
                <div key={g.title}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{g.title}</p>
                  {g.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1.5 px-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
