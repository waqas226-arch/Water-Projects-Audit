import { AuditRecord, WaterProject, RepairItem, UserProfile, AppNotification, UserActivityLog, MasterHeadsConfig, MasterHeadOption, MasterQuestionHead } from '../types/index.ts';
import { PRECONFIGURED_USERS, INITIAL_CHECKPOINTS, createDefaultCheckpoints, evaluateOverallConditionFromCheckpoints } from './auditLogic.ts';
import { GLOBAL_COUNTRIES, CountryInfo } from './pakistanGeo.ts';

const STORAGE_KEYS = {
  PROJECTS: 'fgrf_wts_projects_v2',
  AUDITS: 'fgrf_wts_audits_v2',
  REPAIRS: 'fgrf_wts_repairs_v2',
  USERS: 'fgrf_wts_users_v2',
  CURRENT_USER: 'fgrf_wts_current_user_v2',
  NOTIFICATIONS: 'fgrf_wts_notifications_v2',
  ACTIVITY_LOGS: 'fgrf_wts_activity_logs_v2',
  MASTER_HEADS: 'fgrf_wts_master_heads_v2',
  GEO_HIERARCHY: 'fgrf_wts_geo_hierarchy_v2',
  DELETED_AUDITS: 'fgrf_wts_deleted_audit_ids_v3',
  DELETED_PROJECTS: 'fgrf_wts_deleted_project_ids_v3',
};

const memoryStorage: Record<string, string> = {};

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch {
      // file:// protocol or private browsing
    }
    return memoryStorage[key] ?? null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // file:// protocol or private browsing
    }
    memoryStorage[key] = value;
  }
};

// Production-ready initial states - 100% clean registries (Zero fake/demo data)
export const SEED_PROJECTS: WaterProject[] = [];
export const SEED_REPAIRS: RepairItem[] = [];
export const SEED_AUDITS: AuditRecord[] = [];
export const SEED_NOTIFICATIONS: AppNotification[] = [];

const STORAGE_CLEARED_FLAG = 'fgrf_wts_cleared_ready_v6';

export function ensureDemoDataCleared(): void {
  try {
    // 1. Permanently ban legacy demo and fake IDs
    markAuditAsDeleted('AUD-2026-0001');
    markAuditAsDeleted('TEST-001');
    markProjectAsDeleted('FGRF-WTS-SND-004');

    // 2. Remove fake project and audit from localStorage immediately if present
    const rawProjects = safeStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (rawProjects) {
      try {
        const parsedProjects = JSON.parse(rawProjects);
        if (Array.isArray(parsedProjects)) {
          const cleanProjects = parsedProjects.filter(
            (p) =>
              p &&
              p.id &&
              String(p.id).trim().toUpperCase() !== 'FGRF-WTS-SND-004' &&
              !String(p.name || '').includes('Haji Qasim Brohi')
          );
          safeStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(cleanProjects));
        }
      } catch {}
    } else {
      safeStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify([]));
    }

    const rawAudits = safeStorage.getItem(STORAGE_KEYS.AUDITS);
    if (rawAudits) {
      try {
        const parsedAudits = JSON.parse(rawAudits);
        if (Array.isArray(parsedAudits)) {
          const cleanAudits = parsedAudits.filter(
            (a) =>
              a &&
              a.id &&
              a.id !== 'TEST-001' &&
              String(a.id).trim().toUpperCase() !== 'AUD-2026-0001' &&
              String(a.projectId || '').trim().toUpperCase() !== 'FGRF-WTS-SND-004'
          );
          safeStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(cleanAudits));
        }
      } catch {}
    } else {
      safeStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify([]));
    }

    const rawRepairs = safeStorage.getItem(STORAGE_KEYS.REPAIRS);
    if (rawRepairs) {
      try {
        const parsedRepairs = JSON.parse(rawRepairs);
        if (Array.isArray(parsedRepairs)) {
          const cleanRepairs = parsedRepairs.filter(
            (r) => r && r.id && String(r.id).trim().toUpperCase() !== 'REP-2026-0001'
          );
          safeStorage.setItem(STORAGE_KEYS.REPAIRS, JSON.stringify(cleanRepairs));
        }
      } catch {}
    } else {
      safeStorage.setItem(STORAGE_KEYS.REPAIRS, JSON.stringify([]));
    }

    safeStorage.setItem(STORAGE_CLEARED_FLAG, 'true');
  } catch (e) {
    console.error('Error clearing demo data:', e);
  }
}

// Automatically clear on module load
ensureDemoDataCleared();

// -------------------------------------------------------------
// DELETED RECORDS REGISTRY (Prevents Resurrection on Log Out/In)
// -------------------------------------------------------------

export function getDeletedAuditIds(): string[] {
  try {
    const raw = safeStorage.getItem(STORAGE_KEYS.DELETED_AUDITS);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes('AUD-2026-0001')) list.push('AUD-2026-0001');
    if (!list.includes('TEST-001')) list.push('TEST-001');
    return Array.isArray(list) ? list.map((id: string) => String(id).trim().toUpperCase()) : ['AUD-2026-0001', 'TEST-001'];
  } catch {
    return ['AUD-2026-0001', 'TEST-001'];
  }
}

export function markAuditAsDeleted(auditId: string): void {
  const current = getDeletedAuditIds();
  const cleanId = String(auditId).trim().toUpperCase();
  if (!current.includes(cleanId)) {
    current.push(cleanId);
    safeStorage.setItem(STORAGE_KEYS.DELETED_AUDITS, JSON.stringify(current));
  }
}

export function getDeletedProjectIds(): string[] {
  try {
    const raw = safeStorage.getItem(STORAGE_KEYS.DELETED_PROJECTS);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes('FGRF-WTS-SND-004')) list.push('FGRF-WTS-SND-004');
    return Array.isArray(list) ? list.map((id: string) => String(id).trim().toUpperCase()) : ['FGRF-WTS-SND-004'];
  } catch {
    return ['FGRF-WTS-SND-004'];
  }
}

export function markProjectAsDeleted(projectId: string): void {
  const current = getDeletedProjectIds();
  const cleanId = String(projectId).trim().toUpperCase();
  if (!current.includes(cleanId)) {
    current.push(cleanId);
    safeStorage.setItem(STORAGE_KEYS.DELETED_PROJECTS, JSON.stringify(current));
  }
}

export function getProjects(): WaterProject[] {
  try {
    const raw = safeStorage.getItem(STORAGE_KEYS.PROJECTS);
    const deletedIds = getDeletedProjectIds();

    // Fresh initialization only if storage key never existed
    if (raw === null) {
      safeStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify([]));
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter out deleted projects and any demo projects
    const cleanList = parsed.filter(
      (p) =>
        p &&
        typeof p === 'object' &&
        p.id &&
        String(p.id).trim().toUpperCase() !== 'FGRF-WTS-SND-004' &&
        !String(p.name || '').includes('Haji Qasim Brohi') &&
        !deletedIds.includes(String(p.id).trim().toUpperCase())
    );

    if (cleanList.length !== parsed.length) {
      safeStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(cleanList));
    }

    return cleanList;
  } catch {
    return [];
  }
}

export function saveProjects(projects: WaterProject[]): void {
  safeStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
}

export function getAudits(): AuditRecord[] {
  try {
    const raw = safeStorage.getItem(STORAGE_KEYS.AUDITS);
    const deletedIds = getDeletedAuditIds();

    // Fresh initialization only if storage key never existed
    if (raw === null) {
      safeStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify([]));
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter out deleted audits and fake demo audits
    const cleanList = parsed
      .filter(
        (a) =>
          a &&
          typeof a === 'object' &&
          a.id &&
          a.id !== 'TEST-001' &&
          String(a.id).trim().toUpperCase() !== 'AUD-2026-0001' &&
          String(a.projectId || '').trim().toUpperCase() !== 'FGRF-WTS-SND-004' &&
          !deletedIds.includes(String(a.id).trim().toUpperCase())
      )
      .map((a) => ({
        ...a,
        checkpoints: Array.isArray(a.checkpoints) ? a.checkpoints : [],
        repairs: Array.isArray(a.repairs) ? a.repairs : [],
        overallCondition: a.overallCondition || 'Functional',
        approvalStatus: a.approvalStatus || 'Submitted',
        inspectionDateTime: a.inspectionDateTime || new Date().toISOString(),
      }));

    if (cleanList.length !== parsed.length) {
      safeStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(cleanList));
    }

    return cleanList;
  } catch {
    return [];
  }
}

export function saveAudits(audits: AuditRecord[]): void {
  safeStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(audits));
}

export function getRepairs(): RepairItem[] {
  try {
    const raw = safeStorage.getItem(STORAGE_KEYS.REPAIRS);
    if (!raw) {
      safeStorage.setItem(STORAGE_KEYS.REPAIRS, JSON.stringify(SEED_REPAIRS));
      return SEED_REPAIRS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_REPAIRS;
  }
}

export function saveRepairs(repairs: RepairItem[]): void {
  safeStorage.setItem(STORAGE_KEYS.REPAIRS, JSON.stringify(repairs));
}

export function getUsers(): UserProfile[] {
  try {
    const raw = safeStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(PRECONFIGURED_USERS));
      return PRECONFIGURED_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return PRECONFIGURED_USERS;
  }
}

export function saveUsers(users: UserProfile[]): void {
  safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function createUser(user: UserProfile): UserProfile[] {
  const users = getUsers();
  // Ensure we don't have duplicate by ID
  const exists = users.findIndex((u) => u.id === user.id);
  if (exists >= 0) {
    users[exists] = user;
  } else {
    users.push(user);
  }
  saveUsers(users);
  return users;
}

export function updateUser(updatedUser: UserProfile): UserProfile[] {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === updatedUser.id);
  if (index >= 0) {
    users[index] = updatedUser;
    saveUsers(users);
  }
  return users;
}

export function deleteUser(userId: string): { success: boolean; error?: string; users: UserProfile[] } {
  if (userId === 'FGRF-HQ-01') {
    return { success: false, error: 'Cannot delete the primary Super Administrator account.', users: getUsers() };
  }
  const users = getUsers();
  const filtered = users.filter((u) => u.id !== userId);
  saveUsers(filtered);
  return { success: true, users: filtered };
}

export function getCurrentUser(): UserProfile {
  try {
    const raw = safeStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) {
      // Default to Super Administrator – Head Office
      safeStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(PRECONFIGURED_USERS[0]));
      return PRECONFIGURED_USERS[0];
    }
    return JSON.parse(raw);
  } catch {
    return PRECONFIGURED_USERS[0];
  }
}

export function setCurrentUser(user: UserProfile): void {
  safeStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

export function getNotifications(): AppNotification[] {
  try {
    const raw = safeStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) {
      safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
      return SEED_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_NOTIFICATIONS;
  }
}

export function saveNotifications(notifs: AppNotification[]): void {
  safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
}

export function resetToSeedData(): void {
  safeStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify([]));
  safeStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify([]));
  safeStorage.setItem(STORAGE_KEYS.REPAIRS, JSON.stringify([]));
  safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(PRECONFIGURED_USERS));
  safeStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(PRECONFIGURED_USERS[0]));
  safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  markAuditAsDeleted('AUD-2026-0001');
  markAuditAsDeleted('TEST-001');
  markProjectAsDeleted('FGRF-WTS-SND-004');
}

export function submitNewAudit(audit: AuditRecord): { audit: AuditRecord; updatedProject: WaterProject } {
  const audits = getAudits();
  const projects = getProjects();
  const repairs = getRepairs();

  // Add new audit to list (or update if already saved)
  const existingAuditIdx = audits.findIndex((a) => a.id === audit.id);
  if (existingAuditIdx >= 0) {
    audits[existingAuditIdx] = audit;
  } else {
    audits.unshift(audit);
  }
  saveAudits(audits);

  // Add any new repairs to master repair registry
  if (audit.repairs && audit.repairs.length > 0) {
    const newRepairs = [...repairs];
    audit.repairs.forEach((rep) => {
      const idx = newRepairs.findIndex((r) => r.id === rep.id);
      if (idx >= 0) {
        newRepairs[idx] = rep;
      } else {
        newRepairs.unshift(rep);
      }
    });
    saveRepairs(newRepairs);
  }

  // Update project condition and inspection count
  const projIndex = projects.findIndex((p) => p.id === audit.projectId);
  let updatedProject: WaterProject;

  if (projIndex >= 0) {
    updatedProject = {
      ...projects[projIndex],
      currentCondition: audit.overallCondition,
      lastInspectionDate: audit.inspectionDateTime.slice(0, 10),
      totalInspections: projects[projIndex].totalInspections + 1,
      status: audit.overallCondition === 'Non-functional' ? 'Under Maintenance' : 'Active',
      // Update coordinates if newly verified
      gpsCoordinates: audit.gpsCoordinates.lat !== 0 ? audit.gpsCoordinates : projects[projIndex].gpsCoordinates,
    };
    projects[projIndex] = updatedProject;
  } else {
    // If project was not previously registered, auto-register it
    updatedProject = {
      id: audit.projectId,
      name: `${audit.village} ${audit.installationType}`,
      province: audit.province,
      division: audit.division,
      district: audit.district,
      tehsil: audit.tehsil,
      unionCouncil: audit.unionCouncil,
      village: audit.village,
      installationType: audit.installationType,
      installationDate: audit.installationDate,
      beneficiaryName: audit.beneficiaryName,
      beneficiaryMobile: audit.beneficiaryMobile,
      gpsCoordinates: audit.gpsCoordinates,
      currentCondition: audit.overallCondition,
      lastInspectionDate: audit.inspectionDateTime.slice(0, 10),
      totalInspections: 1,
      status: audit.overallCondition === 'Non-functional' ? 'Under Maintenance' : 'Active',
    };
    projects.unshift(updatedProject);
  }
  saveProjects(projects);

  // Automatically publish to Real-Time Central Cloud Database
  import('./cloudSync.ts').then(cs => {
    cs.publishAuditToCloud(audit, updatedProject, audit.repairs || [], audit.inspectorId || 'inspector');
  }).catch(() => {});

  // Add notification
  const notifs = getNotifications();
  notifs.unshift({
    id: `NOTIF-${Date.now()}`,
    title: 'New Audit Form Submitted',
    message: `Inspection for ${audit.projectId} (${audit.district}) submitted by ${audit.inspectorName}. Condition: ${audit.overallCondition}.`,
    timestamp: new Date().toISOString(),
    type: 'inspection',
    read: false,
    linkId: audit.id,
  });
  saveNotifications(notifs);

  return { audit, updatedProject };
}

// -------------------------------------------------------------
// PROJECT MASTER DATABASE: EDIT & DELETE RIGHTS
// -------------------------------------------------------------

export function updateProject(updatedProject: WaterProject): WaterProject[] {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === updatedProject.id);
  if (idx >= 0) {
    projects[idx] = updatedProject;
  } else {
    projects.unshift(updatedProject);
  }
  saveProjects(projects);

  // Automatically publish to Real-Time Central Cloud Database
  import('./cloudSync.ts').then(cs => {
    cs.pushLocalToCloud(getAudits(), projects, getRepairs());
  }).catch(() => {});
  return projects;
}

export function deleteProject(projectId: string): WaterProject[] {
  const cleanId = String(projectId).trim().toUpperCase();
  markProjectAsDeleted(cleanId);

  const projects = getProjects();
  const filtered = projects.filter((p) => p.id.trim().toUpperCase() !== cleanId);
  saveProjects(filtered);

  // Automatically publish to Real-Time Central Cloud Database
  import('./cloudSync.ts').then(cs => {
    cs.pushLocalToCloud(getAudits(), filtered, getRepairs());
  }).catch(() => {});
  return filtered;
}

// -------------------------------------------------------------
// AUDIT MASTER DATABASE: EDIT & DELETE RIGHTS
// -------------------------------------------------------------

export function updateAudit(updatedAudit: AuditRecord): AuditRecord[] {
  const audits = getAudits();
  const cleanId = String(updatedAudit.id).trim().toUpperCase();
  const idx = audits.findIndex((a) => String(a.id).trim().toUpperCase() === cleanId);

  const recordToSave: AuditRecord = {
    ...updatedAudit,
    updatedAt: new Date().toISOString()
  };

  if (idx >= 0) {
    audits[idx] = recordToSave;
  } else {
    audits.unshift(recordToSave);
  }

  saveAudits(audits);

  // Synchronize condition to the associated water project
  if (recordToSave.projectId) {
    const projects = getProjects();
    const projIdx = projects.findIndex((p) => p.id === recordToSave.projectId);
    if (projIdx >= 0) {
      projects[projIdx].currentCondition = recordToSave.overallCondition;
      projects[projIdx].lastInspectionDate = recordToSave.inspectionDateTime?.slice(0, 10) || new Date().toISOString().slice(0, 10);
      saveProjects(projects);
    }
  }

  // Log user activity
  try {
    const currentUser = getCurrentUser();
    logUserActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: 'AUDIT_UPDATE',
      actionDescription: `Updated Audit Record ${recordToSave.id}`,
      details: `Project: ${recordToSave.projectId} • Condition: ${recordToSave.overallCondition} • Status: ${recordToSave.approvalStatus}`,
    });
  } catch {}

  // Automatically broadcast update to Real-Time Central Cloud Database
  import('./cloudSync.ts').then(cs => {
    cs.pushLocalToCloud(audits, getProjects(), getRepairs());
  }).catch(() => {});

  return audits;
}

export function deleteAudit(auditId: string): AuditRecord[] {
  const cleanId = String(auditId).trim().toUpperCase();
  markAuditAsDeleted(cleanId);

  const audits = getAudits();
  const auditToDelete = audits.find((a) => String(a.id).trim().toUpperCase() === cleanId);
  const auditRepairIds = (auditToDelete?.repairs || []).map((r) => r.id);

  const filteredAudits = audits.filter((a) => String(a.id).trim().toUpperCase() !== cleanId);
  saveAudits(filteredAudits);

  // Also remove any pending repair items associated with this audit
  const repairs = getRepairs();
  const filteredRepairs = repairs.filter((r) => !auditRepairIds.includes(r.id));
  if (repairs.length !== filteredRepairs.length) {
    saveRepairs(filteredRepairs);
  }

  // Log user activity
  try {
    const currentUser = getCurrentUser();
    logUserActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: 'AUDIT_DELETE',
      actionDescription: `Permanently deleted Audit Record ${auditId}`,
      details: `Audit ID ${auditId} removed from master registry and cloud sync.`,
    });
  } catch {}

  // Automatically broadcast deletion to Real-Time Central Cloud Database
  import('./cloudSync.ts').then(cs => {
    cs.pushLocalToCloud(filteredAudits, getProjects(), filteredRepairs);
  }).catch(() => {});

  return filteredAudits;
}

// -------------------------------------------------------------
// AUTO-GENERATED SEQUENTIAL INSPECTION CODE
// -------------------------------------------------------------

export function generateNextInspectionCode(): string {
  try {
    const audits = getAudits();
    const year = new Date().getFullYear();
    const prefix = `AUD-${year}-`;
    let maxNum = 0;
    audits.forEach((a) => {
      if (a.id && a.id.startsWith(prefix)) {
        const numPart = parseInt(a.id.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });
    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  } catch {
    return `AUD-${new Date().getFullYear()}-0001`;
  }
}

// -------------------------------------------------------------
// USER ACTIVITY & IP ACTION LOG SHEET
// -------------------------------------------------------------

let cachedClientIp = '127.0.0.1';

export async function detectClientIp(): Promise<string> {
  if (cachedClientIp && cachedClientIp !== '127.0.0.1') return cachedClientIp;
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2000) });
    const data = await res.json();
    if (data && data.ip) {
      cachedClientIp = data.ip;
      return data.ip;
    }
  } catch {
    // Offline or localhost
  }
  return cachedClientIp;
}

export const SEED_ACTIVITY_LOGS: UserActivityLog[] = [
  {
    id: 'LOG-001',
    timestamp: '2026-11-19T08:00:00.000Z',
    userId: 'FGRF-MIS-01',
    userName: 'Syed Waqas',
    userRole: 'Manager MIS',
    ipAddress: 'Head Office (Official Station)',
    actionType: 'LOGIN',
    actionDescription: 'Central ERP & Water Projects Audit Portal Initialized',
    details: 'System online with clean master registry under reference FGRF-WTS-AUD-002.00-26.',
  }
];

export function getActivityLogs(): UserActivityLog[] {
  try {
    const raw = safeStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
    if (!raw) {
      safeStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(SEED_ACTIVITY_LOGS));
      return SEED_ACTIVITY_LOGS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_ACTIVITY_LOGS;
    return parsed.filter(
      (l) =>
        !String(l.actionDescription || '').includes('AUD-2026-0001') &&
        !String(l.details || '').includes('FGRF-WTS-SND-004')
    );
  } catch {
    return SEED_ACTIVITY_LOGS;
  }
}

export function saveActivityLogs(logs: UserActivityLog[]): void {
  safeStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(logs));
}

export function logUserActivity(log: {
  userId: string;
  userName: string;
  userRole: string;
  ipAddress?: string;
  actionType: UserActivityLog['actionType'];
  actionDescription: string;
  details?: string;
}): UserActivityLog {
  const currentLogs = getActivityLogs();
  const newEntry: UserActivityLog = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    userId: log.userId,
    userName: log.userName,
    userRole: log.userRole,
    ipAddress: log.ipAddress || cachedClientIp || '192.168.1.105',
    actionType: log.actionType,
    actionDescription: log.actionDescription,
    details: log.details,
  };
  currentLogs.unshift(newEntry);
  if (currentLogs.length > 1000) currentLogs.pop();
  saveActivityLogs(currentLogs);
  return newEntry;
}

export function clearActivityLogs(): void {
  saveActivityLogs([]);
}

// -------------------------------------------------------------
// MASTER HEADS CONFIGURATION (OPEN HEADS)
// -------------------------------------------------------------

export const DEFAULT_MASTER_HEADS_CONFIG: MasterHeadsConfig = {
  categories: [
    'Filter Hand Pump',
    'Hand Pump',
    'Solar Submersible Pump',
    'Deep Tube Well',
    'Aab-e-Kausar Water Filtration Plant',
    'Reverse Osmosis (RO) Plant',
    'Community Water Storage Tank',
  ],
  conditions: [
    { id: 'Functional', labelEn: 'Functional', labelUrdu: 'مکمل فعال / درست', color: 'emerald', isSystem: true },
    { id: 'Functional – Repair Needed', labelEn: 'Functional – Repair Needed', labelUrdu: 'فعال مگر مرمت درکار', color: 'amber', isSystem: true },
    { id: 'Non-functional', labelEn: 'Non-functional', labelUrdu: 'غیر فعال / بند', color: 'rose', isSystem: true },
    { id: 'Not Installed / Wrong Location', labelEn: 'Not Installed / Wrong Location', labelUrdu: 'غیر نصب شدہ / غلط مقام', color: 'slate', isSystem: true },
  ],
  questions: INITIAL_CHECKPOINTS.map((c) => ({
    id: c.id,
    number: c.number,
    titleEn: c.titleEn,
    titleUrdu: c.titleUrdu,
    category: 'all',
    region: 'all',
    options: c.options,
  })),
};

export function getMasterHeads(): MasterHeadsConfig {
  try {
    const raw = safeStorage.getItem(STORAGE_KEYS.MASTER_HEADS);
    if (!raw) {
      safeStorage.setItem(STORAGE_KEYS.MASTER_HEADS, JSON.stringify(DEFAULT_MASTER_HEADS_CONFIG));
      return DEFAULT_MASTER_HEADS_CONFIG;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_MASTER_HEADS_CONFIG;
  }
}

export function saveMasterHeads(config: MasterHeadsConfig): void {
  safeStorage.setItem(STORAGE_KEYS.MASTER_HEADS, JSON.stringify(config));
}

// -------------------------------------------------------------
// GEOGRAPHICAL HIERARCHY (OPEN HEADS)
// -------------------------------------------------------------

export function getGeoHierarchy(): CountryInfo[] {
  try {
    const raw = safeStorage.getItem(STORAGE_KEYS.GEO_HIERARCHY);
    if (!raw) {
      safeStorage.setItem(STORAGE_KEYS.GEO_HIERARCHY, JSON.stringify(GLOBAL_COUNTRIES));
      return GLOBAL_COUNTRIES;
    }
    return JSON.parse(raw);
  } catch {
    return GLOBAL_COUNTRIES;
  }
}

export function saveGeoHierarchy(countries: CountryInfo[]): void {
  safeStorage.setItem(STORAGE_KEYS.GEO_HIERARCHY, JSON.stringify(countries));
}

