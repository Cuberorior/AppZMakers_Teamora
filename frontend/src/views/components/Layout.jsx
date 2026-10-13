import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard, Clock, CalendarDays, User, Users, CheckSquare,
  FileText, Building2, ShieldCheck, DollarSign, Settings,
  Bell, LogOut, Menu, X, ChevronRight, BarChart3, Sun, Moon, HelpCircle, Video, Gamepad2
} from 'lucide-react';

const navByRole = {
  employee: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leave', label: 'Leave Requests', icon: CalendarDays },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'client-notifications', label: 'Notifications', icon: Bell },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'game', label: 'Relaxation Game', icon: Gamepad2 },
  ],
  hr: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'today-attendance', label: "Today's Attendance", icon: Clock },
    { id: 'leave-approvals', label: 'Leave Approvals', icon: CheckSquare },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'client-notifications', label: 'Notifications', icon: Bell },
    { id: 'game', label: 'Relaxation Game', icon: Gamepad2 },
  ],
  company: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'My Employees', icon: Users },
    { id: 'attendance', label: 'Attendance Log', icon: Clock },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'shift-notices', label: 'Shift Messages', icon: Bell },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'game', label: 'Relaxation Game', icon: Gamepad2 },
  ],
  superadmin: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'today-attendance', label: "Today's Attendance", icon: Clock },
    { id: 'leave-approvals', label: 'Leave Approvals', icon: CheckSquare },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'reports', label: 'System Reports', icon: FileText },
    { id: 'companies', label: 'Clients/Leads', icon: Building2 },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'faqs', label: 'FAQ Management', icon: HelpCircle },
    { id: 'knowledge-sessions', label: 'Learning & Development Programs', icon: Video },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'game', label: 'Relaxation Game', icon: Gamepad2 },
  ],
};

const roleColors = {
  employee: 'bg-indigo-500',
  hr: 'bg-sky-500',
  company: 'bg-emerald-500',
  superadmin: 'bg-violet-500',
};

const getRoleLabel = (role, isTeam) => {
  if (role === 'company') return isTeam ? 'Team Lead' : 'Client';
  const labels = {
    employee: 'Employee',
    hr: 'HR Manager',
    superadmin: 'Super Admin',
  };
  return labels[role] || role;
};

const userNames = {
  employee: 'Sarah Johnson',
  hr: 'Amanda Foster',
  company: 'Client Partner',
  superadmin: 'System Admin',
};

const userInitials = {
  employee: 'SJ',
  hr: 'AF',
  company: 'CP',
  superadmin: 'SA',
};

const rolePrefixes = {
  employee: 'employee',
  hr: 'hr',
  company: 'company',
  superadmin: 'admin',
};

import { BACKEND_URL } from '../../config';
import logoImg from '../../assets/AppZLogo2.png';
import appzMakersLogo from '../../assets/APPZ New Logo.png';

import { WelcomeAnimation } from './WelcomeAnimation';
import morningRobImg from '../../assets/MorningRob.png';
import afternoonRobImg from '../../assets/AfternoonRob.png';
import eveningRobImg from '../../assets/EveningRob.png';

export function Layout({ role, onLogout, auth, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [unreadCount, setUnreadCount] = useState(0);
  const [readIds, setReadIds] = useState([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('justLoggedIn') === 'true') {
      setShowWelcome(true);
      sessionStorage.removeItem('justLoggedIn');
    }
  }, []);

  const getDynamicRobImg = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return morningRobImg;
    if (hour >= 12 && hour < 17) return afternoonRobImg;
    return eveningRobImg;
  };

  const themeKey = auth?.userId ? `theme_${auth.userId}` : 'theme';
  const [theme, setTheme] = useState(() => localStorage.getItem(themeKey) || 'light');

  const location = useLocation();
  const navigate = useNavigate();


  useEffect(() => {
    const loadReadIds = () => {
      if (!auth?.userId) return;
      try {
        const stored = localStorage.getItem(`readNoticeIds_${auth.userId}`);
        setReadIds(stored ? JSON.parse(stored) : []);
      } catch {
        setReadIds([]);
      }
    };
    loadReadIds();
    window.addEventListener('storage', loadReadIds);
    return () => window.removeEventListener('storage', loadReadIds);
  }, [auth]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (auth && theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(themeKey, theme);
  }, [theme, auth, themeKey]);

  useEffect(() => {
    // Cleanup theme on unmount (e.g. sign out)
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);

  useEffect(() => {
    if (!auth) return;
    const fetchCounts = async () => {
      try {
        let url = '';
        if (role === 'employee') {
          url = `${BACKEND_URL}/employees/${auth.userId}/shift-notices`;
        } else if (role === 'hr') {
          url = `${BACKEND_URL}/hr/shift-notices`;
        }

        if (url) {
          const res = await fetch(url);
          if (res.ok) {
            const notices = await res.json();
            let unread = notices.filter(n => {
              const readKey = `${n._id}_${n.updatedAt || n.createdAt}`;
              return !readIds.includes(readKey);
            }).length;

            if (role === 'employee') {
              const [kssRes, celebRes] = await Promise.all([
                fetch(`${BACKEND_URL}/employees/${auth.userId}/knowledge-sessions`),
                fetch(`${BACKEND_URL}/employees/${auth.userId}/celebrations`)
              ]);

              if (kssRes.ok) {
                const kssNotices = await kssRes.json();
                const unreadKss = kssNotices.filter(session => {
                  const readKey = `${session._id}_${session.updatedAt || session.createdAt}`;
                  return !readIds.includes(readKey);
                }).length;
                unread += unreadKss;
              }

              if (celebRes.ok) {
                const celebNotices = await celebRes.json();
                const unreadCeleb = celebNotices.filter(session => {
                  const readKey = `${session._id}_${session.updatedAt || session.createdAt}`;
                  return !readIds.includes(readKey);
                }).length;
                unread += unreadCeleb;
              }
            }

            setUnreadCount(unread);
          }
        }

        // Fetch pending leaves count for Employee, HR, and Admin
        if (role === 'employee' || role === 'hr' || role === 'superadmin') {
          const endpoint = role === 'employee' ? `employees/${auth.userId}` : (role === 'superadmin' ? 'admin' : 'hr');
          const res = await fetch(`${BACKEND_URL}/${endpoint}/leaves`);
          if (res.ok) {
            const leaves = await res.json();
            const pending = leaves.filter(l => l.status === 'pending').length;
            setPendingLeavesCount(pending);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 10000); // Poll every 10 seconds for real-time responsiveness
    return () => clearInterval(interval);
  }, [role, auth, location.pathname, readIds]);


  let navItems = navByRole[role] || [];
  if (role === 'company' && auth?.isTeam) {
    navItems = navItems.filter(item => item.id !== 'shift-notices' && item.id !== 'faq');
  }
  const badgeColor = roleColors[role] || 'bg-slate-500';
  const pathPrefix = rolePrefixes[role] || role;

  // Find active nav item based on URL path
  const activeItem = navItems.find(item => location.pathname === `/${pathPrefix}/${item.id}`) || navItems[0];
  const currentPage = activeItem ? activeItem.id : 'dashboard';

  const roleLabel = getRoleLabel(role, auth?.isTeam);
  const displayName = auth?.name || userNames[role] || 'User';
  const displayInitials = displayName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const formatDate = (d) => d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const Sidebar = () => (
    <div className="flex flex-col flex-1 w-full h-full min-h-0" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-200/60 dark:border-slate-800/60 flex-shrink-0">
        <div className="flex items-center justify-center dark:bg-white/95 dark:p-3 dark:rounded-2xl dark:shadow-md">
          <img src={logoImg} alt="AppzMaker Logo" className="w-full max-h-24 h-auto object-contain drop-shadow-sm" />
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 py-4 flex-shrink-0">
        <div className="bg-slate-50/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-3 flex items-center gap-3 shadow-inner">
          <div className={`w-10 h-10 ${badgeColor} rounded-xl flex items-center justify-center text-white text-sm font-black shadow-md overflow-hidden flex-shrink-0`}>
            {auth?.avatar && auth.avatar.startsWith('data:image/') ? (
              <img src={auth.avatar} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              displayInitials
            )}
          </div>
          <div className="min-w-0">
            <div className="text-slate-800 dark:text-slate-100 text-sm font-black truncate">{displayName}</div>
            <div className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">{roleLabel}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto mt-2 min-h-0">
        <div className="text-slate-400 text-[10px] font-black px-3 py-2 uppercase tracking-widest">Navigation</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { navigate(`/${pathPrefix}/${item.id}`); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${isActive
                ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 shadow-sm border border-indigo-100/50 dark:border-indigo-800/50'
                : 'text-slate-500 dark:text-slate-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 hover:translate-x-1 border border-transparent'
                }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === 'client-notifications' && unreadCount > 0 && (
                <span className="flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold h-5 min-w-5 rounded-full px-1.5 shadow-sm animate-pulse mr-1">
                  {unreadCount}
                </span>
              )}
              {(item.id === 'leave-approvals' || item.id === 'leave') && pendingLeavesCount > 0 && (
                <span className="flex items-center justify-center bg-amber-500 text-white text-[10px] font-bold h-5 min-w-5 rounded-full px-1.5 shadow-sm animate-pulse mr-1">
                  {pendingLeavesCount}
                </span>
              )}
              {isActive && <ChevronRight className="w-4 h-4 text-indigo-400 ml-auto" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/30 flex-shrink-0">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-100 dark:border-rose-900/50 hover:border-rose-200 dark:hover:border-rose-800 transition-all shadow-sm active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>

        <div className="mt-4 text-center text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
          Developed By{' '}
          <div className="relative inline-block group cursor-pointer text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
            AppZ Makers
            {/* Hover Tooltip Box */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900/80 backdrop-blur-3xl text-white rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] border border-slate-700/50 p-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:-translate-y-1 z-50 pointer-events-auto">
              <div className="flex flex-col items-center text-center gap-3 normal-case tracking-normal">
                <img src={appzMakersLogo} alt="AppZ Makers" className="h-16 w-auto object-contain drop-shadow-sm mb-1" />
                <div className="text-[13px] font-extrabold text-white leading-snug">Developed by the<br/>AppZCuberorior Team</div>
                <a href="https://appzmake.com" target="_blank" rel="noreferrer" className="text-[#40d6a2] font-bold hover:underline text-sm transition-colors hover:text-emerald-400">https://appzmake.com</a>
                <div className="text-[11px] text-slate-300 font-bold mt-1">Click here to visit our official website.</div>
              </div>
              {/* Tooltip Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[6px] w-3 h-3 bg-slate-900/80 backdrop-blur-3xl rotate-45 transform border-b border-r border-slate-700/50"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex fixed inset-0 h-[100dvh] overflow-hidden bg-slate-50 dark:bg-slate-950" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* VIBRANT Dynamic Background Blobs for Liquid Effect */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-white/50 dark:bg-slate-950/50">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/40 dark:bg-blue-600/40 blur-[100px] animate-pulse mix-blend-multiply dark:mix-blend-screen" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-[20%] -right-[5%] w-[35%] h-[35%] rounded-full bg-purple-500/40 dark:bg-purple-600/40 blur-[100px] animate-pulse mix-blend-multiply dark:mix-blend-screen" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
        <div className="absolute -bottom-[10%] left-[15%] w-[50%] h-[50%] rounded-full bg-indigo-500/40 dark:bg-indigo-600/40 blur-[100px] animate-pulse mix-blend-multiply dark:mix-blend-screen" style={{ animationDuration: '10s', animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 flex w-full h-full">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-64 flex-col flex-shrink-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border-r border-white/50 dark:border-slate-800/50 shadow-sm z-20 min-h-0">
          {Sidebar()}
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
            <aside className="relative w-64 bg-blue-100/90 dark:bg-slate-900/95 h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left-full duration-300 min-h-0">
              <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/80 text-slate-500 hover:text-slate-800 rounded-full transition-colors z-50">
                <X className="w-5 h-5" />
              </button>
              {Sidebar()}
            </aside>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <div className="absolute inset-0 bg-white/30 dark:bg-slate-900/30 backdrop-blur-2xl pointer-events-none -z-10"></div>
          {/* Header */}
          <header className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border-b border-white/50 dark:border-slate-800/50 h-16 flex items-center px-4 lg:px-6 gap-4 flex-shrink-0 z-20 shadow-sm">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex-1">
              <div className="text-slate-800 font-semibold capitalize text-sm lg:text-base">
                {navItems.find(n => n.id === currentPage)?.label || 'Dashboard'}
              </div>
              <div className="text-slate-400 text-xs hidden sm:block">{formatDate(currentTime)}</div>
            </div>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-lg border border-white/50 dark:border-slate-700/50 shadow-inner">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-600 text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{formatTime(currentTime)}</span>
            </div>

            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 dark:border-slate-700"
              title={theme === 'light' ? 'Switch to Night Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Notification Bell Icon */}
            {(role === 'employee' || role === 'hr') && (
              <button
                onClick={() => navigate(`/${pathPrefix}/client-notifications`)}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer relative dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 dark:border-slate-700"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center bg-rose-500 text-white text-[9px] font-bold h-4 min-w-4 rounded-full px-1 shadow-sm animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                title="Profile Menu"
                className={`w-8 h-8 ${badgeColor} rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {auth?.avatar && auth.avatar.startsWith('data:image/') ? (
                  <img src={auth.avatar} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  displayInitials
                )}
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{displayName}</p>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{roleLabel}</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all cursor-pointer group"
                    >
                      <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 pb-12 lg:p-6 lg:pb-12 relative">
            {children}
          </main>
        </div>
      </div>
      <WelcomeAnimation
        isOpen={showWelcome}
        userName={auth?.name}
        robotImage={getDynamicRobImg()}
        onComplete={() => setShowWelcome(false)}
      />
    </div>
  );
}
