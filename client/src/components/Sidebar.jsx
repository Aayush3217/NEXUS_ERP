import React, { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import { useToast } from '../store/toastContext';
import { useTheme } from '../store/themeContext';
import { 
  LayoutDashboard, 
  UsersRound, 
  Package, 
  Warehouse, 
  ReceiptText, 
  UserCog, 
  LogOut, 
  User as UserIcon,
  ChevronUp,
  Settings,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';

export const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { success } = useToast();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogoutClick = () => {
    setProfileDropdownOpen(false);
    const confirmLogout = window.confirm('Are you sure you want to log out of Nexus ERP?');
    if (confirmLogout) {
      logout();
      success('Logged out successfully.');
      navigate('/login');
    }
  };

  if (!user) return null;

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
    { name: 'Customers', path: '/customers', icon: UsersRound, roles: ['ADMIN', 'SALES', 'ACCOUNTS'] },
    { name: 'Products', path: '/products', icon: Package, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
    { name: 'Inventory', path: '/inventory', icon: Warehouse, roles: ['ADMIN', 'WAREHOUSE'] },
    { name: 'Sales Challans', path: '/challans', icon: ReceiptText, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
    { name: 'Users', path: '/users', icon: UserCog, roles: ['ADMIN'] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0D111A] text-gray-300 border-r border-white/5 relative">
      
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/5 shrink-0">
        <div className="p-2 bg-gradient-primary rounded text-white shrink-0 shadow-md shadow-primary-500/10">
          <Warehouse className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-extrabold text-white text-sm tracking-tight leading-none">NEXUS ERP</h2>
          <p className="text-[9px] text-textSecondary font-bold uppercase tracking-widest mt-1">Distribution Portal</p>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <span className="block px-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">Workspace</span>
        
        {filteredMenuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => toggleSidebar && toggleSidebar(false)}
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all duration-150 relative ${
                isActive 
                  ? 'bg-gradient-primary text-white font-bold shadow-md shadow-primary-950/20' 
                  : 'hover:bg-white/5 hover:text-white text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-white" />
                )}
                <item.icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                <span>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Session profile menu dropdown */}
      <div className="p-3 border-t border-white/5 bg-black/10 relative">
        {/* Toggle Dropdown container */}
        {profileDropdownOpen && (
          <div className="absolute bottom-16 left-3 right-3 bg-[#111827] border border-white/10 rounded-lg shadow-xl py-1 z-30 text-xs font-bold text-gray-400 animate-slide-up">
            <Link 
              to="/profile" 
              onClick={() => setProfileDropdownOpen(false)}
              className="w-full text-left px-3 py-2 hover:bg-white/5 hover:text-white flex items-center gap-2"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Profile Settings</span>
            </Link>
            <div className="border-t border-white/5 my-1" />
            
            {/* Quick appearance settings options */}
            <div className="px-3 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Theme</div>
            <button 
              onClick={() => { setTheme('light'); setProfileDropdownOpen(false); }}
              className={`w-full text-left px-3 py-1.5 hover:bg-white/5 hover:text-white flex items-center gap-2 ${theme === 'light' ? 'text-primary-400' : ''}`}
            >
              <Sun className="w-3.5 h-3.5" /> Light Theme
            </button>
            <button 
              onClick={() => { setTheme('dark'); setProfileDropdownOpen(false); }}
              className={`w-full text-left px-3 py-1.5 hover:bg-white/5 hover:text-white flex items-center gap-2 ${theme === 'dark' ? 'text-primary-400' : ''}`}
            >
              <Moon className="w-3.5 h-3.5" /> Dark Theme
            </button>
            <button 
              onClick={() => { setTheme('system'); setProfileDropdownOpen(false); }}
              className={`w-full text-left px-3 py-1.5 hover:bg-white/5 hover:text-white flex items-center gap-2 ${theme === 'system' ? 'text-primary-400' : ''}`}
            >
              <Monitor className="w-3.5 h-3.5" /> System Preference
            </button>
            
            <div className="border-t border-white/5 my-1" />
            <button 
              onClick={handleLogoutClick}
              className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        )}

        {/* Profile Card Button */}
        <button
          onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          className="flex items-center gap-2.5 w-full p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-all duration-150 text-left focus:outline-none"
        >
          <div className="flex items-center justify-center w-7 h-7 bg-gradient-primary rounded font-bold text-xs text-white uppercase shrink-0">
            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white truncate leading-none mb-1">{user.name}</h4>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-widest truncate">{user.role}</span>
            </div>
          </div>
          <ChevronUp className={`w-3.5 h-3.5 text-gray-500 transition-transform ${profileDropdownOpen ? 'transform rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          {/* Backdrop */}
          <div 
            onClick={() => toggleSidebar(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
          />
          
          {/* Sidebar Drawer Panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0D111A] shadow-xl animate-slide-left" style={{ animationDirection: 'reverse' }}>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
export default Sidebar;
