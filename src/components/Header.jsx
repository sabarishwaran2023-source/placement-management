import React, { useState } from 'react';
import { 
  GraduationCap, 
  Building2, 
  UserCheck, 
  Briefcase, 
  Activity, 
  Bell, 
  Search, 
  ChevronDown,
  Sparkles,
  CheckCircle2,
  LogIn,
  LogOut,
  User
} from 'lucide-react';

export default function Header({ currentRole, setCurrentRole, notifications = [], markNotificationsAsRead, currentUser, onOpenAuth, onLogout }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = (notifications || []).filter(n => n.unread).length;

  const roleNavItems = [
    { id: 'home', label: 'Home Page', icon: Building2 },
    { id: 'student', label: 'Student Portal', icon: GraduationCap },
    { id: 'company', label: 'Company Portal', icon: Briefcase },
    { id: 'officer', label: 'Placement Officer', icon: UserCheck },
    { id: 'metrics', label: 'Software Metrics', icon: Activity, isSpecial: true }
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800 backdrop-blur-xl bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => setCurrentRole('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-blue-400 transition-colors">
                  APEX INSTITUTE
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                  PLACEMENT PORTAL
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Training & Placement Cell</p>
            </div>
          </div>

          {/* Navigation Role Switcher */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
            {roleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRole === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentRole(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? item.isSpecial 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-500/25 ring-1 ring-purple-400/30'
                        : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : item.isSpecial
                        ? 'text-purple-300 hover:text-white hover:bg-purple-950/40 border border-purple-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.isSpecial && !isActive ? 'text-purple-400' : ''}`} />
                  <span>{item.label}</span>
                  {item.isSpecial && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Auth, Notifications & Role Badge */}
          <div className="flex items-center gap-3">
            
            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-slate-950 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Menu */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-panel rounded-2xl p-4 shadow-2xl border border-slate-800 z-50 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold text-white">Notifications</span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markNotificationsAsRead}
                        className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-slate-500 text-center py-6">No notifications yet.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl border transition-all ${
                            n.unread
                              ? 'bg-blue-950/30 border-blue-500/30 text-slate-200'
                              : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
                          }`}
                        >
                          <p className="text-xs leading-relaxed">{n.text || n.title || n.message}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">{n.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Auth Buttons / Logged In User Pill */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
                <div className="flex items-center gap-2 px-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-white leading-tight">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{currentUser.role}</div>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onOpenAuth('student')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/25 transition-all"
              >
                <LogIn className="w-4 h-4" /> Login / Register
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
