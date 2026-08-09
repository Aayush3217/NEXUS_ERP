import React, { useState } from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import { useTheme } from '../store/themeContext';
import { Sidebar } from '../components/Sidebar';
import { CommandPalette } from '../components/CommandPalette';
import { 
  Menu, 
  Bell, 
  Sun, 
  Moon, 
  Monitor, 
  Search,
  TriangleAlert,
  CalendarClock,
  CheckCircle2,
  Maximize2
} from 'lucide-react';
import { Skeleton } from '../components/UI';

export const DashboardLayout = () => {
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center p-8 bg-bg">
        <div className="w-full max-w-4xl space-y-4">
          <Skeleton className="h-10 w-48 rounded-md" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-28 rounded-lg" count={3} />
          </div>
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Parse path to build professional breadcrumbs trail
  const getBreadcrumbs = () => {
    const segments = location.pathname.split('/').filter(Boolean);
    const trail = [{ name: 'Nexus ERP', path: '/dashboard' }];
    
    let currentPath = '';
    segments.forEach((seg) => {
      currentPath += `/${seg}`;
      let name = seg.charAt(0).toUpperCase() + seg.slice(1);
      
      if (seg === 'dashboard') name = 'Overview';
      if (seg === 'challans') name = 'Sales Challans';
      if (seg === 'customers') name = 'Customers';
      if (seg === 'products') name = 'Products';
      if (seg === 'inventory') name = 'Inventory';
      if (seg === 'users') name = 'Users';
      if (seg === 'profile') name = 'Profile';
      if (seg === 'new') name = 'Create';
      
      trail.push({ name, path: currentPath });
    });
    
    return trail;
  };

  const breadcrumbs = getBreadcrumbs();

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Predefined SaaS operational notifications list
  const systemNotifications = [
    { id: 1, type: 'warning', text: 'Low stock: A4 Copier Paper is below minimum stock levels.', icon: TriangleAlert, color: 'text-amber-400 bg-amber-500/10' },
    { id: 2, type: 'info', text: 'CRM Follow-up: Deepak Verma follow-up call is due today.', icon: CalendarClock, color: 'text-indigo-400 bg-indigo-500/10' },
    { id: 3, type: 'success', text: 'Challan: CH-20260809-0001 was confirmed successfully.', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10' }
  ];

  return (
    <div className="h-screen flex bg-bg text-textPrimary overflow-hidden">
      {/* Sidebar navigation */}
      <Sidebar isOpen={mobileSidebarOpen} toggleSidebar={setMobileSidebarOpen} />

      {/* Viewport block */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:pl-64">
        {/* Top Navbar */}
        <header className="flex items-center justify-between px-6 h-16 bg-surface border-b border-border shrink-0 z-20 shadow-xs relative">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 rounded-md text-textSecondary hover:bg-bg hover:text-textPrimary lg:hidden focus:outline-none"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Professional Breadcrumbs */}
            <nav className="hidden sm:flex items-center space-x-2 text-xs font-semibold text-textSecondary">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-textSecondary/35">/</span>}
                  {idx === breadcrumbs.length - 1 ? (
                    <span className="text-textPrimary font-bold">{crumb.name}</span>
                  ) : (
                    <Link to={crumb.path} className="hover:text-primary-500 transition-colors">
                      {crumb.name}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Right Header Navigation controls */}
          <div className="flex items-center gap-3">
            {/* Search Launcher Button */}
            <button 
              onClick={() => setIsCommandOpen(true)}
              className="hidden md:flex items-center gap-2.5 px-3 py-1.5 border border-border bg-[#0D111A] text-xs font-semibold text-textSecondary hover:text-white rounded-lg focus:outline-none cursor-pointer focus:ring-1 focus:ring-primary-500/50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search anything...</span>
              <kbd className="bg-[#111827] text-[10px] font-mono leading-none border border-white/10 px-1 py-0.5 rounded">Ctrl + K</kbd>
            </button>
            
            {/* Search Launcher Icon for smaller screens */}
            <button 
              onClick={() => setIsCommandOpen(true)}
              className="md:hidden p-1.5 rounded-md text-textSecondary hover:bg-bg hover:text-textPrimary focus:outline-none"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notification alert bell with dropdown center */}
            <div className="relative">
              <button 
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className={`p-1.5 rounded-md text-textSecondary hover:bg-bg hover:text-textPrimary transition-colors focus:outline-none relative ${notifDropdownOpen ? 'bg-bg text-white' : ''}`}
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary-500" />
              </button>

              {notifDropdownOpen && (
                <>
                  <div onClick={() => setNotifDropdownOpen(false)} className="fixed inset-0 z-30" />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-[#111827] border border-white/10 rounded-lg shadow-xl py-1.5 z-40 animate-slide-up text-xs font-semibold text-gray-300">
                    <div className="flex justify-between items-center px-4 py-2 border-b border-white/5 bg-black/10">
                      <span className="font-extrabold text-white">Notifications</span>
                      <span className="text-[10px] text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded font-bold">3 Unread</span>
                    </div>
                    <div className="divide-y divide-white/5">
                      {systemNotifications.map((notif) => {
                        const Icon = notif.icon;
                        return (
                          <div key={notif.id} className="p-3.5 hover:bg-white/5 transition-colors flex gap-3 items-start">
                            <div className={`p-1.5 rounded shrink-0 ${notif.color}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-textSecondary leading-normal">{notif.text}</p>
                              <span className="block text-[8px] text-gray-500 font-bold uppercase mt-1">Just Now</span>
                            </div>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0 mt-1.5" />
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t border-white/5 text-center py-2 bg-black/10">
                      <button onClick={() => setNotifDropdownOpen(false)} className="text-[10px] text-primary-400 hover:underline font-bold uppercase tracking-wider">
                        Dismiss All Alerts
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Fullscreen button */}
            <button 
              onClick={handleFullscreen}
              className="p-1.5 rounded-md text-textSecondary hover:bg-bg hover:text-textPrimary focus:outline-none"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Quick theme toggles */}
            <div className="relative group">
              <button 
                className="p-1.5 rounded-md text-textSecondary hover:bg-bg hover:text-textPrimary focus:outline-none"
                title="Change theme"
              >
                {theme === 'light' ? <Sun className="w-4 h-4" /> : theme === 'dark' ? <Moon className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-[#111827] border border-white/10 rounded-lg shadow-lg py-1 w-28 text-xs font-bold text-gray-400">
                <button onClick={() => setTheme('light')} className={`w-full text-left px-3 py-1.5 hover:bg-white/5 hover:text-white flex items-center gap-1.5 ${theme === 'light' ? 'text-primary-400' : ''}`}>
                  <Sun className="w-3.5 h-3.5" /> Light
                </button>
                <button onClick={() => setTheme('dark')} className={`w-full text-left px-3 py-1.5 hover:bg-white/5 hover:text-white flex items-center gap-1.5 ${theme === 'dark' ? 'text-primary-400' : ''}`}>
                  <Moon className="w-3.5 h-3.5" /> Dark
                </button>
                <button onClick={() => setTheme('system')} className={`w-full text-left px-3 py-1.5 hover:bg-white/5 hover:text-white flex items-center gap-1.5 ${theme === 'system' ? 'text-primary-400' : ''}`}>
                  <Monitor className="w-3.5 h-3.5" /> System
                </button>
              </div>
            </div>

            <div className="h-5 w-px bg-border hidden sm:block" />
            
            {/* Quick Profile Initials Badge */}
            <Link to="/profile" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity">
              <div className="flex items-center justify-center w-7 h-7 rounded bg-gradient-primary text-white font-bold text-xs shadow-md shadow-primary-500/10">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-textPrimary leading-none">{user.name}</p>
                <p className="text-[9px] text-textSecondary uppercase font-bold tracking-widest mt-0.5">{user.role}</p>
              </div>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8 bg-bg">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette search overlay */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </div>
  );
};
export default DashboardLayout;
