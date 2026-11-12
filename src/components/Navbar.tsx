import React, { useState } from 'react';
import { 
  Droplet, 
  LayoutDashboard, 
  Database, 
  PlusCircle, 
  ClipboardList, 
  Wrench, 
  Map, 
  BarChart3, 
  KeyRound, 
  Bell, 
  RotateCcw, 
  Menu, 
  X,
  User,
  Shield,
  Check,
  Users,
  LogOut,
  SlidersHorizontal,
  Activity
} from 'lucide-react';
import { AppNotification, UserProfile, UserRole } from '../types/index.ts';

export type NavTab = 
  | 'dashboard'
  | 'projects'
  | 'new_inspection'
  | 'records'
  | 'repairs'
  | 'map'
  | 'reports'
  | 'open_heads'
  | 'activity_logs'
  | 'users';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: UserProfile;
  onOpenUserIdModal: () => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onResetData: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onOpenUserIdModal,
  notifications,
  onMarkNotificationRead,
  onResetData,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems: { id: NavTab; label: string; labelUrdu: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', labelUrdu: 'ڈیش بورڈ', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'projects', label: 'Water Projects', labelUrdu: 'واٹر پراجیکٹس', icon: <Database className="w-4 h-4" /> },
    { id: 'new_inspection', label: 'New Inspection', labelUrdu: 'نیا معائنہ', icon: <PlusCircle className="w-4 h-4" /> },
    { id: 'records', label: 'Audit Records', labelUrdu: 'معائنہ ریکارڈز', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'repairs', label: 'Repair Management', labelUrdu: 'مرمت و بحالی', icon: <Wrench className="w-4 h-4" /> },
    { id: 'map', label: 'Pakistan Map', labelUrdu: 'نقشہ پاکستان', icon: <Map className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports & Export', labelUrdu: 'رپورٹس', icon: <BarChart3 className="w-4 h-4" /> },
    { 
      id: 'open_heads', 
      label: 'Open Heads', 
      labelUrdu: 'اوپن ہیڈز', 
      icon: <SlidersHorizontal className="w-4 h-4" />,
      badge: 'Master'
    },
    { 
      id: 'activity_logs', 
      label: 'Activity Logs', 
      labelUrdu: 'لاگ شیٹ', 
      icon: <Activity className="w-4 h-4" />
    },
    { 
      id: 'users', 
      label: 'Users & Rights', 
      labelUrdu: 'صارف اختیارات', 
      icon: <Users className="w-4 h-4" />,
      badge: currentUser.role === 'super_admin' ? 'Admin' : undefined
    },
  ];

  const getRoleShortBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return <span className="bg-purple-700/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">HQ Super Admin</span>;
      case 'national_mgmt':
        return <span className="bg-blue-700/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">National Mgmt</span>;
      case 'provincial_coord':
        return <span className="bg-emerald-700/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Coordinator</span>;
      case 'field_inspector':
        return <span className="bg-amber-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Field Inspector</span>;
      case 'repair_team':
        return <span className="bg-rose-700/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Repair Team</span>;
      default:
        return <span className="bg-slate-700/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Viewer</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Top Branding & Access Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 border-b border-slate-800/80">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md border border-emerald-400/40">
            <Droplet className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white text-base sm:text-lg">FGRF</span>
              <span className="text-emerald-400 font-bold text-xs hidden sm:inline">Water Projects Audit System</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-400/30">
                AUD-002.00-26
              </span>
            </div>
            <div className="font-urdu text-[11px] text-emerald-300 leading-tight">
              فیضان گلوبل ریلیف فاؤنڈیشن – واٹر پراجیکٹس آڈٹ و مانیٹرنگ سسٹم
            </div>
          </div>
        </div>

        {/* Right side: User ID Access & Notifications */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User ID Quick Access Button (Prominent feature) */}
          <button
            onClick={onOpenUserIdModal}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-500/50 rounded-xl text-xs font-semibold text-emerald-200 transition-all shadow-xs cursor-pointer"
            title="Switch User ID or Role Profile"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
            <div className="text-left hidden md:block">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-mono text-emerald-300 font-bold">{currentUser.id}</span>
                {getRoleShortBadge(currentUser.role)}
              </div>
              <div className="text-[10px] text-slate-300 truncate max-w-[120px] mt-0.5">
                {currentUser.name} {currentUser.province ? `(${currentUser.province})` : ''}
              </div>
            </div>
            <span className="md:hidden font-mono font-bold">{currentUser.id}</span>
          </button>

          {/* Log Out Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-500/50 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              title="Log Out / Lock Screen"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          )}

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 text-slate-900 z-50 animate-in fade-in duration-150">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    Notifications / انتباہات
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold">{unreadCount} unread</span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs transition-colors hover:bg-slate-50 flex items-start justify-between gap-2 ${
                          !n.read ? 'bg-emerald-50/50' : ''
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900">{n.title}</div>
                          <div className="text-slate-600 text-[11px] leading-snug">{n.message}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        {!n.read && (
                          <button
                            onClick={() => onMarkNotificationRead(n.id)}
                            className="text-emerald-700 hover:text-emerald-900 p-1 text-[10px] font-bold"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-right">
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Reset Demo Data button */}
          <button
            onClick={onResetData}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Reset to fresh realistic seed records"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-[11px]">Reset Data</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 hidden md:block">
        <div className="flex items-center space-x-1 py-1.5 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                <span className="font-urdu text-[11px] font-normal text-emerald-200 opacity-80">
                  {item.labelUrdu}
                </span>
                {item.badge && (
                  <span className="ml-1 bg-purple-500/30 text-purple-200 text-[10px] font-bold px-1.5 py-0.2 rounded-md border border-purple-400/40">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 px-4 py-3 border-t border-slate-800 space-y-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                  isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="bg-purple-500/30 text-purple-200 text-[10px] font-bold px-1.5 py-0.2 rounded-md border border-purple-400/40">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="font-urdu text-xs text-emerald-300">{item.labelUrdu}</span>
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
            <button
              onClick={() => {
                onResetData();
                setMobileMenuOpen(false);
              }}
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1.5 py-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Seed Records</span>
            </button>

            {onLogout && (
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1.5 py-1.5 font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
