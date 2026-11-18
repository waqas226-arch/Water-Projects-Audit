import React, { useState, useMemo } from 'react';
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
  Menu, 
  X,
  User,
  Shield,
  Check,
  Users,
  LogOut,
  SlidersHorizontal,
  Activity,
  ChevronLeft,
  ChevronRight,
  Settings,
  Sparkles,
  Video
} from 'lucide-react';
import { AppNotification, NavTab, UserProfile, UserRole } from '../types/index.ts';
import { isTabAllowed } from '../utils/auditLogic.ts';

export type { NavTab };

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: UserProfile;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onOpenSettings: () => void;
  onOpenVideoTutorial?: () => void;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  notifications,
  onMarkNotificationRead,
  onOpenSettings,
  onOpenVideoTutorial,
  onLogout,
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems: { id: NavTab; label: string; labelUrdu: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', labelUrdu: 'ڈیش بورڈ', icon: <LayoutDashboard className="w-5 h-5 shrink-0" /> },
    { id: 'projects', label: 'Water Projects', labelUrdu: 'واٹر پراجیکٹس', icon: <Database className="w-5 h-5 shrink-0" /> },
    { id: 'new_inspection', label: 'New Inspection', labelUrdu: 'نیا معائنہ', icon: <PlusCircle className="w-5 h-5 shrink-0" /> },
    { id: 'records', label: 'Audit Records', labelUrdu: 'معائنہ ریکارڈز', icon: <ClipboardList className="w-5 h-5 shrink-0" /> },
    { id: 'repairs', label: 'Repair Management', labelUrdu: 'مرمت و بحالی', icon: <Wrench className="w-5 h-5 shrink-0" /> },
    { id: 'map', label: 'Pakistan Map', labelUrdu: 'نقشہ پاکستان', icon: <Map className="w-5 h-5 shrink-0" /> },
    { id: 'reports', label: 'Reports & Export', labelUrdu: 'رپورٹس', icon: <BarChart3 className="w-5 h-5 shrink-0" /> },
    { 
      id: 'open_heads', 
      label: 'Open Heads', 
      labelUrdu: 'اوپن ہیڈز', 
      icon: <SlidersHorizontal className="w-5 h-5 shrink-0" />,
      badge: 'Master'
    },
    { 
      id: 'activity_logs', 
      label: 'Activity Logs', 
      labelUrdu: 'لاگ شیٹ', 
      icon: <Activity className="w-5 h-5 shrink-0" />
    },
    { 
      id: 'users', 
      label: 'Users & Rights', 
      labelUrdu: 'صارف اختیارات', 
      icon: <Users className="w-5 h-5 shrink-0" />,
      badge: currentUser.role === 'super_admin' ? 'Admin' : undefined
    },
  ];

  // Dynamically filter menu tabs based strictly on the current user's granted rights and role
  const allowedNavItems = useMemo(() => {
    return navItems.filter((item) => isTabAllowed(item.id, currentUser));
  }, [currentUser]);

  const getRoleShortBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return <span className="bg-purple-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">HQ Super Admin</span>;
      case 'national_mgmt':
        return <span className="bg-blue-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">National Mgmt</span>;
      case 'provincial_coord':
        return <span className="bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Coordinator</span>;
      case 'field_inspector':
        return <span className="bg-amber-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Field Inspector</span>;
      case 'repair_team':
        return <span className="bg-rose-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Repair Team</span>;
      default:
        return <span className="bg-slate-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Viewer</span>;
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile} 
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs md:hidden transition-opacity" 
        />
      )}

      {/* Left Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-slate-950 text-white border-r border-slate-800 flex flex-col transition-all duration-300 shadow-2xl ${
          mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* ====================================================================== */}
        {/* TOP OF SIDEBAR: BRANDING & COLLAPSE TOGGLE                            */}
        {/* ====================================================================== */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg border border-emerald-400/30 shrink-0">
              <Droplet className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div className="leading-tight truncate animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold tracking-tight text-white text-base">FGRF</span>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono px-1.5 py-0.2 rounded border border-emerald-400/30">
                    AUD-002.00-26
                  </span>
                </div>
                <div className="text-[11px] text-emerald-300 font-bold truncate">Water Audit System</div>
                <div className="font-urdu text-[10px] text-slate-400 truncate leading-none mt-0.5">فیضان گلوبل ریلیف فاؤنڈیشن</div>
              </div>
            )}
          </div>

          {/* Toggle Collapse Button (Desktop) */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800"
            title={isCollapsed ? 'Expand Menu / مینو کھولیں' : 'Collapse Menu / مینو چھوٹا کریں'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Close Button (Mobile) */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ====================================================================== */}
        {/* TOP PROFILE CARD, SETTINGS OPTION & LOG OFF                            */}
        {/* ====================================================================== */}
        <div className={`border-b border-slate-800/80 p-3 bg-slate-900/40 transition-all ${isCollapsed ? 'text-center' : ''}`}>
          {!isCollapsed ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold flex items-center justify-center text-xs shadow-md border border-emerald-400/30 shrink-0">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-xs truncate leading-snug">{currentUser.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-[10px] text-emerald-300 font-bold truncate">{currentUser.id}</span>
                  </div>
                  <div className="mt-0.5">{getRoleShortBadge(currentUser.role)}</div>
                </div>
              </div>

              {/* Quick Action Buttons: Profile/Settings, Notifications, Log Off */}
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/60 text-xs">
                {/* Settings / Change Password button */}
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-emerald-900/60 hover:text-emerald-200 text-slate-300 rounded-lg text-[11px] font-semibold transition-all border border-slate-700/80 cursor-pointer flex-1 justify-center"
                  title="Profile Settings & Change Password / ترتیبات اور پاس ورڈ تبدیلی"
                >
                  <Settings className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Settings</span>
                </button>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700/80 relative cursor-pointer"
                    title="Notifications"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 text-slate-900 z-50 animate-in fade-in duration-150">
                      <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
                        <div className="font-bold text-[11px] text-slate-800 uppercase tracking-wider">
                          Notifications / انتباہات
                        </div>
                        <span className="text-[10px] text-emerald-700 font-semibold">{unreadCount} unread</span>
                      </div>

                      <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400">No notifications</div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`p-2.5 text-xs transition-colors hover:bg-slate-50 flex items-start justify-between gap-2 ${
                                !n.read ? 'bg-emerald-50/50' : ''
                              }`}
                            >
                              <div className="space-y-0.5 text-[11px]">
                                <div className="font-bold text-slate-900">{n.title}</div>
                                <div className="text-slate-600 leading-snug">{n.message}</div>
                                <div className="text-[10px] text-slate-400">
                                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                              {!n.read && (
                                <button
                                  type="button"
                                  onClick={() => onMarkNotificationRead(n.id)}
                                  className="text-emerald-700 hover:text-emerald-900 p-1 text-[10px] font-bold"
                                  title="Mark as read"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50 text-right">
                        <button
                          type="button"
                          onClick={() => setShowNotifications(false)}
                          className="text-[11px] font-semibold text-slate-600 hover:text-slate-900"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Log Off Button */}
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900 text-rose-300 hover:text-white rounded-lg text-[11px] font-semibold transition-all border border-rose-800/60 cursor-pointer"
                  title="Log Off System / لاگ آؤٹ"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Off</span>
                </button>
              </div>
            </div>
          ) : (
            /* Collapsed Profile Icon & Buttons */
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onOpenSettings}
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold flex items-center justify-center text-xs shadow-md border border-emerald-400/30 hover:scale-105 transition-transform cursor-pointer"
                title={`${currentUser.name} (${currentUser.id}) - Click for Settings`}
              >
                {currentUser.name.slice(0, 2).toUpperCase()}
              </button>

              <div className="flex flex-col gap-1 w-full items-center pt-1 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="p-2 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 cursor-pointer"
                  title="Settings & Change Password"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                  title="Log Off / لاگ آؤٹ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ====================================================================== */}
        {/* NAVIGATION MENU ITEMS LIST                                             */}
        {/* ====================================================================== */}
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {allowedNavItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-left group cursor-pointer relative ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-md shadow-emerald-950/50 font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
                title={isCollapsed ? `${item.label} (${item.labelUrdu})` : undefined}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-emerald-400 rounded-r-full shadow-xs" />
                )}

                <div className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'} transition-colors`}>
                  {item.icon}
                </div>

                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <div>
                      <div className="text-xs font-bold leading-none">{item.label}</div>
                      <div className="font-urdu text-[11px] text-slate-300/80 group-hover:text-slate-200 mt-0.5 leading-none">
                        {item.labelUrdu}
                      </div>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                        item.badge === 'Admin' ? 'bg-purple-900/80 text-purple-200 border border-purple-700/60' : 'bg-emerald-900/80 text-emerald-200 border border-emerald-700/60'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* ====================================================================== */}
        {/* VIDEO TUTORIAL & TRAINING GUIDE BUTTON                                 */}
        {/* ====================================================================== */}
        <div className="p-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              if (onOpenVideoTutorial) onOpenVideoTutorial();
              onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-left group cursor-pointer bg-gradient-to-r from-emerald-950/70 to-teal-950/60 hover:from-emerald-900/90 hover:to-teal-900/80 border border-emerald-500/40 text-emerald-200 hover:text-white shadow-xs ${
              isCollapsed ? 'justify-center px-2' : ''
            }`}
            title="Video Tutorial / ویڈیو گائیڈ"
          >
            <Video className="w-5 h-5 text-emerald-400 shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold leading-none flex items-center gap-1.5">
                  <span>Video Tutorial</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-1.5 py-0.5 rounded font-mono">HD</span>
                </div>
                <div className="font-urdu text-[11px] text-emerald-300/80 mt-0.5 leading-none">
                  ویڈیو ٹیوٹوریل و گائیڈ
                </div>
              </div>
            )}
          </button>
        </div>

        {/* ====================================================================== */}
        {/* BOTTOM FOOTER INSIDE SIDEBAR                                          */}
        {/* ====================================================================== */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 text-[10px] text-slate-400">
          {!isCollapsed ? (
            <div className="text-center space-y-0.5">
              <div className="font-bold text-slate-300">Data Management & ERP Dept</div>
              <div className="text-slate-500">Syed Waqas, Manager MIS</div>
            </div>
          ) : (
            <div className="text-center font-bold text-emerald-500">FGRF</div>
          )}
        </div>
      </aside>
    </>
  );
};
