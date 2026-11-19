import React, { useState, useEffect, useMemo } from 'react';
import { 
  AuditRecord, 
  InspectionApprovalStatus, 
  RepairItem, 
  UserProfile, 
  WaterProject,
  AppNotification 
} from './types/index.ts';
import { 
  getAudits, 
  getCurrentUser, 
  getNotifications, 
  getProjects, 
  getRepairs, 
  getUsers,
  getGeoHierarchy,
  createUser,
  updateUser,
  deleteUser,
  updateProject,
  deleteProject,
  updateAudit,
  deleteAudit,
  saveAudits, 
  saveNotifications, 
  saveProjects, 
  saveRepairs, 
  setCurrentUser, 
  submitNewAudit 
} from './utils/storage.ts';
import { CountryInfo } from './utils/pakistanGeo.ts';
import { Sidebar, NavTab } from './components/Sidebar.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { AuditFormView } from './components/AuditFormView.tsx';
import { ProjectDirectoryView } from './components/ProjectDirectoryView.tsx';
import { InspectionRecordsView } from './components/InspectionRecordsView.tsx';
import { RepairManagementView } from './components/RepairManagementView.tsx';
import { PakistanMapView } from './components/PakistanMapView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { PrintableAuditForm } from './components/PrintableAuditForm.tsx';
import { AiAdvisorModal } from './components/AiAdvisorModal.tsx';
import { UserManagementView } from './components/UserManagementView.tsx';
import { SoftwareRightsModal } from './components/SoftwareRightsModal.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { OpenHeadsView } from './components/OpenHeadsView.tsx';
import { ActivityLogView } from './components/ActivityLogView.tsx';
import { PublicAuditVerificationView } from './components/PublicAuditVerificationView.tsx';
import { VideoTutorialModal } from './components/VideoTutorialModal.tsx';
import { CloudMasterDbModal } from './components/CloudMasterDbModal.tsx';
import { getDefaultTabForUser, isTabAllowed } from './utils/auditLogic.ts';
import { 
  startRealtimeCloudSync, 
  syncAllWithCloud, 
  fetchCloudData 
} from './utils/cloudSync.ts';
import { Menu, Cloud, RefreshCw, CheckCircle2, Video, Bell, Check } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUserState] = useState<UserProfile>(getCurrentUser());
  const [currentTab, setCurrentTab] = useState<NavTab>(() => getDefaultTabForUser(getCurrentUser()));
  const [users, setUsers] = useState<UserProfile[]>(() => getUsers());
  const [projects, setProjects] = useState<WaterProject[]>(getProjects());
  const [audits, setAudits] = useState<AuditRecord[]>(getAudits());
  const [repairs, setRepairs] = useState<RepairItem[]>(getRepairs());
  const [geoHierarchy, setGeoHierarchy] = useState<CountryInfo[]>(() => getGeoHierarchy());
  const [notifications, setNotifications] = useState<AppNotification[]>(getNotifications());
  const [showHeaderNotifications, setShowHeaderNotifications] = useState<boolean>(false);
  const unreadNotificationsCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const [isVideoTutorialModalOpen, setIsVideoTutorialModalOpen] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('fgrf_auth_session') === 'true';
    } catch {
      return false;
    }
  });

  // Sidebar & Settings states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Guard active tab against unauthorized access based on user rights
  useEffect(() => {
    if (isAuthenticated && !isTabAllowed(currentTab, currentUser)) {
      setCurrentTab(getDefaultTabForUser(currentUser));
    }
  }, [isAuthenticated, currentTab, currentUser]);

  // Modals
  const [isRightsModalOpen, setIsRightsModalOpen] = useState(false);
  const [activePrintAudit, setActivePrintAudit] = useState<AuditRecord | null>(null);
  const [activeAiAudit, setActiveAiAudit] = useState<AuditRecord | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [preselectedAuditProjectId, setPreselectedAuditProjectId] = useState<string | undefined>(undefined);

  // Cloud Sync state
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);
  const [lastSyncDisplay, setLastSyncDisplay] = useState<string>('Live Connected');

  // Real-Time Cloud Master Database Live Sync (Multi-location field staff <-> HQ Super Admin)
  useEffect(() => {
    const cleanup = startRealtimeCloudSync((payload) => {
      setAudits(payload.audits);
      setProjects(payload.projects);
      setRepairs(payload.repairs);
      if (payload.geoHierarchy) {
        setGeoHierarchy(payload.geoHierarchy);
      }
      setLastSyncDisplay(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      if (payload.newCount > 0) {
        showToast(`🔄 Real-time Cloud Sync: Received ${payload.newCount} new inspection record(s) from field staff!`);
      } else if (payload.geoUpdated) {
        showToast(`📍 Geographical locations updated from Cloud Master DB!`);
      }
    }, currentUser.id);

    return cleanup;
  }, [currentUser.id]);



  // Manual Trigger for Instant Cloud Sync
  const handleManualCloudSync = async () => {
    setIsCloudSyncing(true);
    try {
      const res = await syncAllWithCloud(currentUser.id);
      setAudits(getAudits());
      setProjects(getProjects());
      setRepairs(getRepairs());
      setGeoHierarchy(getGeoHierarchy());
      setLastSyncDisplay(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      showToast(res.message);
    } catch {
      showToast('Cloud sync completed with local cache.');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Success toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Switch user profile
  const handleSelectUser = (user: UserProfile) => {
    setCurrentUserState(user);
    setCurrentUser(user);
    showToast(`Switched active profile to ${user.name} (${user.id})`);
  };

  // Tab header helpers
  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard': return 'Central Audit Dashboard';
      case 'projects': return 'Pakistan Water Projects Master Database';
      case 'new_inspection': return 'Water Project Inspection & Functionality Audit Form';
      case 'records': return 'Inspection Reports & Approvals Repository';
      case 'repairs': return 'Corrective Actions & Maintenance Work Orders';
      case 'map': return 'Geographical GIS Mapping & Interactive Site Heatmap';
      case 'reports': return 'Central MIS Reports & Data Export Center';
      case 'open_heads': return 'Open Heads Configuration & Dynamic Checkpoints';
      case 'activity_logs': return 'User Activity Log Sheet & Audit Trail';
      case 'users': return 'User Access Rights & Staff Roles Administration';
      default: return 'FGRF Water Projects System';
    }
  };

  const getTabUrduTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard': return 'مرکزی مانیٹرنگ ڈیش بورڈ';
      case 'projects': return 'ماسٹر ڈیٹا بیس برائے واٹر پراجیکٹس';
      case 'new_inspection': return 'نیا معائنہ فارم (FGRF-WTS-AUD-002)';
      case 'records': return 'محفوظ شدہ معائنہ رپورٹس و توثیق';
      case 'repairs': return 'مرمت، بحالی و ورک آرڈرز';
      case 'map': return 'جغرافیائی نقشہ پاکستان';
      case 'reports': return 'رپورٹس و ڈیٹا ایکسپورٹ';
      case 'open_heads': return 'ہیڈ اوپن کنٹرول و سوالنامہ ترامیم';
      case 'activity_logs': return 'لاگ شیٹ اور صارف کی سرگرمیاں';
      case 'users': return 'صارفین، شناختی کارڈ کوڈز اور اختیارات';
      default: return 'واٹر پراجیکٹس آڈٹ سسٹم';
    }
  };

  // User Management Handlers (Admin Rights)
  const handleCreateUser = (newUser: UserProfile) => {
    const updated = createUser(newUser);
    setUsers(updated || getUsers());
    showToast(`User ID ${newUser.id} (${newUser.name}) registered successfully.`);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    const updated = updateUser(updatedUser);
    setUsers(updated || getUsers());
    if (currentUser.id === updatedUser.id) {
      setCurrentUserState(updatedUser);
      setCurrentUser(updatedUser);
    }
    showToast(`User ID ${updatedUser.id} and access rights updated.`);
  };

  const handleDeleteUser = (userId: string) => {
    const res = deleteUser(userId);
    if (!res.success && res.error) {
      showToast(res.error);
      return;
    }
    setUsers(res.users || getUsers());
    showToast(`User ID ${userId} deleted.`);
  };

  // Submit Audit Form
  const handleSubmitAudit = (newAudit: AuditRecord) => {
    const { audit, updatedProject } = submitNewAudit(newAudit);
    // Reload state from storage
    setAudits(getAudits());
    setProjects(getProjects());
    setRepairs(getRepairs());
    setNotifications(getNotifications());
    setPreselectedAuditProjectId(undefined);

    showToast(`Audit Form ${audit.id} successfully registered in central database!`);
    setCurrentTab('records');
  };

  // Review & Approval
  const handleUpdateAuditApproval = (auditId: string, status: InspectionApprovalStatus, remarks?: string) => {
    const updatedAudits = audits.map((a) => {
      if (a.id === auditId) {
        return {
          ...a,
          approvalStatus: status,
          reviewedBy: currentUser.name,
          reviewedDate: new Date().toISOString(),
          reviewRemarks: remarks || a.reviewRemarks,
          updatedAt: new Date().toISOString(),
        };
      }
      return a;
    });

    setAudits(updatedAudits);
    saveAudits(updatedAudits);

    // Notification
    const notifs = getNotifications();
    notifs.unshift({
      id: `NOTIF-${Date.now()}`,
      title: `Audit Form ${status}`,
      message: `Inspection report ${auditId} was marked as ${status} by ${currentUser.name}.`,
      timestamp: new Date().toISOString(),
      type: 'approval',
      read: false,
      linkId: auditId,
    });
    setNotifications(notifs);
    saveNotifications(notifs);

    showToast(`Audit ${auditId} updated to ${status}.`);
  };

  // Update repair item
  const handleUpdateRepair = (updatedRepair: RepairItem) => {
    const newRepairs = repairs.map((r) => (r.id === updatedRepair.id ? updatedRepair : r));
    setRepairs(newRepairs);
    saveRepairs(newRepairs);

    // Also update in any audit records referencing this repair
    const updatedAudits = audits.map((a) => {
      const idx = a.repairs?.findIndex((r) => r.id === updatedRepair.id);
      if (idx !== undefined && idx >= 0 && a.repairs) {
        const copy = [...a.repairs];
        copy[idx] = updatedRepair;
        return { ...a, repairs: copy };
      }
      return a;
    });
    setAudits(updatedAudits);
    saveAudits(updatedAudits);

    showToast(`Corrective action ${updatedRepair.id} updated (${updatedRepair.status}).`);
  };

  // Add single project
  const handleAddProject = (newProject: WaterProject) => {
    const newProjects = [newProject, ...projects];
    setProjects(newProjects);
    saveProjects(newProjects);
    showToast(`Project ${newProject.id} registered successfully.`);
  };

  // Bulk import
  const handleBulkImport = (importedProjects: WaterProject[]) => {
    const newProjects = [...importedProjects, ...projects];
    setProjects(newProjects);
    saveProjects(newProjects);
    showToast(`Successfully imported ${importedProjects.length} water projects!`);
  };

  // Edit & Delete Project Rights (Master Database)
  const handleUpdateProject = (updated: WaterProject) => {
    const updatedList = updateProject(updated);
    setProjects(updatedList);
    showToast(`Project ${updated.id} updated in Master Database.`);
  };

  const handleDeleteProject = (projectId: string) => {
    const updatedList = deleteProject(projectId);
    setProjects(updatedList);
    showToast(`Project ${projectId} removed from Master Database.`);
  };

  // Edit & Delete Audit Records (Master Database)
  const handleUpdateAudit = (updated: AuditRecord) => {
    const updatedList = updateAudit(updated);
    setAudits(updatedList);
    setProjects(getProjects());
    showToast(`Audit Record ${updated.id} updated in Master Database.`);
  };

  const handleDeleteAudit = (auditId: string) => {
    const updatedList = deleteAudit(auditId);
    setAudits(updatedList);
    setRepairs(getRepairs());
    showToast(`Audit Record ${auditId} permanently deleted.`);
  };

  // Start audit for a specific project
  const handleAuditForProject = (projectId: string) => {
    setPreselectedAuditProjectId(projectId);
    setCurrentTab('new_inspection');
  };

  // Mark notification read
  const handleMarkNotificationRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    saveNotifications(updated);
  };

  const handleMarkAllNotificationsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
    showToast('All notifications marked as read / تمام انتباہات پڑھ لیے گئے');
  };

  // Check if URL is in Public QR Verification Mode (e.g. ?view_audit=AUD-2026-0001)
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const publicAuditId = urlParams ? (urlParams.get('view_audit') || urlParams.get('verify')) : null;

  // Standalone Public Verification: Show ONLY official inspection form & pictures/videos. Never access whole software.
  if (publicAuditId) {
    return (
      <PublicAuditVerificationView
        auditId={publicAuditId}
        audits={audits}
      />
    );
  }

  // Before displaying software, first display Log On User ID on right and FGRF Logo on left
  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen
          users={users}
          onLogin={(user) => {
            handleSelectUser(user);
            try {
              sessionStorage.setItem('fgrf_auth_session', 'true');
            } catch {}
            setIsAuthenticated(true);
            const defaultTab = getDefaultTabForUser(user);
            setCurrentTab(defaultTab);
          }}
          onOpenVideoTutorial={() => setIsVideoTutorialModalOpen(true)}
        />
        <VideoTutorialModal
          isOpen={isVideoTutorialModalOpen}
          onClose={() => setIsVideoTutorialModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Left Navigation Sidebar (Collapsible & Mobile Drawer) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setMobileSidebarOpen(false);
        }}
        currentUser={currentUser}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenVideoTutorial={() => setIsVideoTutorialModalOpen(true)}
        onLogout={() => {
          try {
            sessionStorage.removeItem('fgrf_auth_session');
          } catch {}
          setIsAuthenticated(false);
          showToast('Logged out to User ID screen.');
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Wrapper - Offset by left sidebar width */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight">
                  {getTabTitle(currentTab)}
                </h1>
                <span className="font-urdu text-emerald-800 font-bold text-xs">
                  {getTabUrduTitle(currentTab)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Data Management & ERP Department - FGRF • Water Projects Audit & Monitoring System
              </p>
            </div>
          </div>

          {/* Top Right Quick Profile & Settings & Live Cloud Master DB */}
          <div className="flex items-center gap-2">
            {/* Live Cloud Master DB Real-time Sync Status & Manual Trigger */}
            <div className="flex items-center rounded-xl bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300 text-emerald-950 transition-colors text-xs font-bold shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => setIsCloudModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-emerald-200/50 transition-colors cursor-pointer"
                title="Central Cloud Master Database - Multi-Device Live Sync / مرکزی کلاؤڈ ڈیٹا بیس سنک (Click to Open Control Center)"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Cloud className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">Cloud Master DB:</span>
                <span className="font-mono text-[11px] text-emerald-800 font-semibold">{lastSyncDisplay}</span>
              </button>
              <button
                type="button"
                onClick={handleManualCloudSync}
                disabled={isCloudSyncing}
                title="Quick Sync Now / فوری سنک کریں"
                className="px-2 py-1.5 border-l border-emerald-300/80 hover:bg-emerald-200/60 transition-colors text-emerald-700 hover:text-emerald-900 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isCloudSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Video Tutorial Guide Action */}
            <button
              type="button"
              onClick={() => setIsVideoTutorialModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Watch Video Tutorial / ویڈیو گائیڈ دیکھیں"
            >
              <Video className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Video Guide</span>
              <span className="font-urdu text-[11px] hidden lg:inline">/ ویڈیو گائیڈ</span>
            </button>

            {/* Notifications Bell in Sticky Top Header (Always visible as per screen movement) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowHeaderNotifications((prev) => !prev)}
                className="relative flex items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                title="Notifications & System Alerts / انتباہات"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 text-slate-700" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse shadow-xs">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Header Notifications Dropdown */}
              {showHeaderNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-black/10" 
                    onClick={() => setShowHeaderNotifications(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 text-slate-900 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                          Notifications / انتباہات
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {unreadNotificationsCount} unread
                        </span>
                        {unreadNotificationsCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllNotificationsRead}
                            className="text-[10px] font-bold text-slate-500 hover:text-emerald-700 cursor-pointer underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                          No active notifications / کوئی نیا انتباہ نہیں
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 text-xs transition-colors hover:bg-slate-50 flex items-start justify-between gap-2.5 ${
                              !n.read ? 'bg-emerald-50/40 border-l-2 border-emerald-500' : ''
                            }`}
                          >
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                                <span>{n.title}</span>
                              </div>
                              <div className="text-slate-600 text-[11px] leading-snug">{n.message}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-1">
                                {new Date(n.timestamp).toLocaleString([], { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                            {!n.read && (
                              <button
                                type="button"
                                onClick={() => handleMarkNotificationRead(n.id)}
                                className="text-emerald-700 hover:text-emerald-900 p-1 text-[11px] font-bold cursor-pointer hover:bg-emerald-100 rounded-lg transition-colors shrink-0"
                                title="Mark as read / پڑھ لیا"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">FGRF Water Audit System</span>
                      <button
                        type="button"
                        onClick={() => setShowHeaderNotifications(false)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer px-2.5 py-1 rounded-lg hover:bg-slate-200/60 transition-colors"
                      >
                        Close / بند کریں
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors text-xs font-semibold cursor-pointer"
              title="Profile Settings & Change Password / سیٹنگز"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="hidden sm:inline font-mono text-[11px] font-bold text-emerald-800">{currentUser.id}</span>
              <span className="text-slate-500 text-xs">⚙️</span>
            </button>
          </div>
        </header>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{toastMessage}</span>
          </div>
        )}

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            projects={projects}
            audits={audits}
            repairs={repairs}
            onNavigateToNewInspection={() => {
              setPreselectedAuditProjectId(undefined);
              setCurrentTab('new_inspection');
            }}
            onNavigateToRepairs={() => setCurrentTab('repairs')}
            onNavigateToMap={() => setCurrentTab('map')}
            onOpenAiAdvisor={() => {
              setActiveAiAudit(audits[0] || null);
              setIsAiModalOpen(true);
            }}
          />
        )}

        {currentTab === 'projects' && (
          <ProjectDirectoryView
            projects={projects}
            currentUser={currentUser}
            geoHierarchy={geoHierarchy}
            onAddProject={handleAddProject}
            onBulkImportProjects={handleBulkImport}
            onSelectProjectForAudit={handleAuditForProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
          />
        )}

        {currentTab === 'new_inspection' && (
          <AuditFormView
            currentUser={currentUser}
            projects={projects}
            geoHierarchy={geoHierarchy}
            onSubmitAudit={handleSubmitAudit}
            preselectedProjectId={preselectedAuditProjectId}
            onCancel={() => {
              setPreselectedAuditProjectId(undefined);
              setCurrentTab('dashboard');
            }}
            onViewAuditCertificate={(audit) => setActivePrintAudit(audit)}
          />
        )}

        {currentTab === 'records' && (
          <InspectionRecordsView
            audits={audits}
            currentUser={currentUser}
            onViewPrintableForm={(audit) => setActivePrintAudit(audit)}
            onUpdateAuditApproval={handleUpdateAuditApproval}
            onOpenAiAdvisor={(audit) => {
              setActiveAiAudit(audit);
              setIsAiModalOpen(true);
            }}
            onEditAudit={handleUpdateAudit}
            onDeleteAudit={handleDeleteAudit}
          />
        )}

        {currentTab === 'repairs' && (
          <RepairManagementView
            repairs={repairs}
            currentUser={currentUser}
            onUpdateRepair={handleUpdateRepair}
          />
        )}

        {currentTab === 'map' && (
          <PakistanMapView
            projects={projects}
            audits={audits}
            onSelectProject={(projId) => handleAuditForProject(projId)}
            onOpenAuditForm={(audit) => setActivePrintAudit(audit)}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView
            projects={projects}
            audits={audits}
            repairs={repairs}
          />
        )}

        {currentTab === 'open_heads' && (
          <OpenHeadsView 
            currentUser={currentUser} 
            showToast={showToast} 
            onRefreshGeo={() => setGeoHierarchy(getGeoHierarchy())}
          />
        )}

        {currentTab === 'activity_logs' && (
          <ActivityLogView currentUser={currentUser} />
        )}

        {currentTab === 'users' && (
          <UserManagementView
            users={users}
            currentUser={currentUser}
            geoHierarchy={geoHierarchy}
            onCreateUser={handleCreateUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="text-left">
              <div className="font-extrabold text-slate-200 text-sm flex items-center gap-2">
                <span>Faizan Global Relief Foundation (FGRF)</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                  Water Projects Audit System
                </span>
              </div>
              <div className="font-urdu text-emerald-400 text-xs mt-0.5">
                فیضان گلوبل ریلیف فاؤنڈیشن – شعبہ واٹر پراجیکٹس
              </div>
            </div>

            <div className="text-left md:text-right text-[11px] text-slate-400 flex flex-col md:items-end gap-1">
              <div>
                Form Reference: <span className="font-mono text-emerald-400 font-bold">FGRF-WTS-AUD-002.00-26</span>
              </div>
              <div className="text-slate-500 text-[10px]">
                Centralized Installation & Functionality Audit Management System
              </div>
            </div>
          </div>

          {/* Software Making Rights & Copyright Bar */}
          <div className="bg-slate-950/70 rounded-2xl p-3.5 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="text-slate-300 font-bold flex flex-wrap items-center gap-1.5">
                <span>This software making rights & reserved and copyright by</span>
                <span className="text-emerald-400 font-extrabold">FGRF - Data Management & ERP Department</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                <span className="text-white font-semibold">Syed Waqas</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-300">Manager MIS</span>
                <span className="text-slate-500">•</span>
                <span className="font-urdu text-slate-400 text-[11px]">سید وقاص (منیجر ایم آئی ایس)</span>
              </div>
            </div>

            <button
              onClick={() => setIsRightsModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap self-stretch sm:self-auto justify-center"
            >
              <span>Copyright Certificate & Rights</span>
              <span className="font-mono text-[10px] bg-emerald-500/20 px-1 rounded">©</span>
            </button>
          </div>
        </div>
      </footer>
      </div>

      {/* Settings & Change Password Modal */}
      <SettingsModal
        currentUser={currentUser}
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onUpdateUser={handleUpdateUser}
        showToast={showToast}
      />

      {/* Official 2-Page Printable Form Modal */}
      {activePrintAudit && (
        <PrintableAuditForm
          audit={activePrintAudit}
          onClose={() => setActivePrintAudit(null)}
        />
      )}

      {/* Gemini 4 Carbon High-Thinking Advisor Modal */}
      <AiAdvisorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        audit={activeAiAudit}
        projects={projects}
      />

      {/* Official Software Rights & Copyright Certificate Modal */}
      <SoftwareRightsModal
        isOpen={isRightsModalOpen}
        onClose={() => setIsRightsModalOpen(false)}
      />

      {/* Official System Video Tutorial Guide Modal */}
      <VideoTutorialModal
        isOpen={isVideoTutorialModalOpen}
        onClose={() => setIsVideoTutorialModalOpen(false)}
      />

      {/* Central Cloud Master DB Control Center Modal */}
      <CloudMasterDbModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        currentUser={currentUser}
        audits={audits}
        projects={projects}
        repairs={repairs}
        onDataUpdated={() => {
          setAudits(getAudits());
          setProjects(getProjects());
          setRepairs(getRepairs());
          setLastSyncDisplay(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }}
        showToast={showToast}
      />
    </div>
  );
}
