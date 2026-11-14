import { AuditRecord, WaterProject, RepairItem, UserProfile, AppNotification, UserActivityLog, MasterHeadsConfig, MasterHeadOption, MasterQuestionHead } from '../types/index.ts';
import { PRECONFIGURED_USERS, INITIAL_CHECKPOINTS, createDefaultCheckpoints, evaluateOverallConditionFromCheckpoints } from './auditLogic.ts';
import { GLOBAL_COUNTRIES, CountryInfo } from './pakistanGeo.ts';
import { OFFICIAL_PRECONFIGURED_AUDITS } from './auditPayload.ts';

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

// Production-ready initial states with verified master registry
export const SEED_PROJECTS: WaterProject[] = [
  {
    id: 'FGRF-WTS-SND-004',
    name: 'Haji Qasim Brohi Hand Pump',
    province: 'Sindh',
    division: 'Mirpurkhas',
    district: 'Badin',
    tehsil: 'Matli',
    unionCouncil: 'UC-03 Matli Rural',
    village: 'Haji Qasim Brohi',
    installationType: 'Hand Pump',
    installationDate: '2024-03-15',
    beneficiaryName: 'Ghulam Mustafa',
    beneficiaryMobile: '+92 300 1234567',
    gpsCoordinates: { lat: 25.0421, lng: 68.6512 },
    currentCondition: 'Functional',
    lastInspectionDate: '2026-11-14',
    totalInspections: 1,
    status: 'Active'
  }
];
export const SEED_REPAIRS: RepairItem[] = [];
export const SEED_AUDITS: AuditRecord[] = [
  OFFICIAL_PRECONFIGURED_AUDITS['aud-2026-0001']
];
export const SEED_NOTIFICATIONS: AppNotification[] = [];

const STORAGE_CLEARED_FLAG = 'fgrf_wts_cleared_ready_v4';

export function ensureDemoDataCleared(): void {
  try {
    const isCleared = safeStorage.getItem(STORAGE_CLEARED_FLAG);
    if (!isCleared) {
      safeStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(SEED_PROJECTS));
      safeStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(SEED_AUDITS));
      safeStorage.setItem(STORAGE_KEYS.REPAIRS, JSON.stringify([]));
      safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
      safeStorage.setItem(STORAGE_CLEARED_FLAG, 'true');
    }
  } catch (e) {
    console.error('Error clearing demo data:', e);
  }
}

// Automatically clear on module load
ensureDemoDataCleared();

export function getProjects(): WaterProject[] {
  try {
    const raw = safeStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!raw) {
      safeStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(SEED_PROJECTS));
      return SEED_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_PROJECTS;
    return parsed.filter((p) => p && typeof p === 'object' && p.id);
  } catch {
    return SEED_PROJECTS;
  }
}

export function saveProjects(projects: WaterProject[]): void {
  safeStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
}

export function getAudits(): AuditRecord[] {
  try {
    const raw = safeStorage.getItem(STORAGE_KEYS.AUDITS);
    if (!raw) {
      safeStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(SEED_AUDITS));
      return SEED_AUDITS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_AUDITS;
    const cleanList = parsed
      .filter((a) => a && typeof a === 'object' && a.id && a.id !== 'TEST-001')
      .map((a) => ({
        ...a,
        checkpoints: Array.isArray(a.checkpoints) ? a.checkpoints : [],
        repairs: Array.isArray(a.repairs) ? a.repairs : [],
        overallCondition: a.overallCondition || 'Functional',
        approvalStatus: a.approvalStatus || 'Submitted',
        inspectionDateTime: a.inspectionDateTime || new Date().toISOString(),
      }));

    // Ensure AUD-2026-0001 is always present as baseline certified audit
    if (!cleanList.some((a) => a.id && a.id.toLowerCase() === 'aud-2026-0001')) {
      cleanList.unshift(OFFICIAL_PRECONFIGURED_AUDITS['aud-2026-0001']);
    }
    return cleanList;
  } catch {
    return SEED_AUDITS;
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
  safeStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(SEED_PROJECTS));
  safeStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(SEED_AUDITS));
  safeStorage.setItem(STORAGE_KEYS.REPAIRS, JSON.stringify(SEED_REPAIRS));
  safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(PRECONFIGURED_USERS));
  safeStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(PRECONFIGURED_USERS[0]));
  safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
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
  const projects = getProjects();
  const filtered = projects.filter((p) => p.id !== projectId);
  saveProjects(filtered);

  // Automatically publish to Real-Time Central Cloud Database
  import('./cloudSync.ts').then(cs => {
    cs.pushLocalToCloud(getAudits(), filtered, getRepairs());
  }).catch(() => {});
  return filtered;
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
    timestamp: '2026-11-11T09:15:20.000Z',
    userId: 'FGRF-MIS-01',
    userName: 'Syed Waqas',
    userRole: 'Super Admin (HQ)',
    ipAddress: '192.168.1.105 (MIS Local Station)',
    actionType: 'LOGIN',
    actionDescription: 'User successfully logged in to Water Audit System',
    details: 'Authenticated from Data Management & ERP Department workstation',
  },
  {
    id: 'LOG-002',
    timestamp: '2026-11-11T09:45:10.000Z',
    userId: 'FGRF-INS-101',
    userName: 'Zubair Raza',
    userRole: 'Senior Field Inspector',
    ipAddress: '119.160.118.45 (Cellular Data)',
    actionType: 'AUDIT_CREATE',
    actionDescription: 'Generated Auto Audit Code AUD-2026-0001 & Created Verification QR Code',
    details: 'Project FGRF-WTS-SND-004 (Badin). Evaluated Condition: Functional',
  },
  {
    id: 'LOG-003',
    timestamp: '2026-11-11T10:12:00.000Z',
    userId: 'FGRF-HQ-01',
    userName: 'Muhammad Farooq Attari',
    userRole: 'Head of Audit & Monitoring',
    ipAddress: '39.40.12.98 (Head Office HQ)',
    actionType: 'AUDIT_APPROVE',
    actionDescription: 'Approved Audit Report AUD-2026-0001',
    details: 'Marked report status as Approved with verification sign-off',
  },
  {
    id: 'LOG-004',
    timestamp: '2026-11-11T11:05:40.000Z',
    userId: 'FGRF-MIS-01',
    userName: 'Syed Waqas',
    userRole: 'Super Admin (HQ)',
    ipAddress: '192.168.1.105 (MIS Local Station)',
    actionType: 'PROJECT_UPDATE',
    actionDescription: 'Updated Project Master Database for FGRF-WTS-KHI-001',
    details: 'Updated functional status, apron verification, and beneficiary contact details',
  },
];

export function getActivityLogs(): UserActivityLog[] {
  try {
    const raw = safeStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
    if (!raw) {
      safeStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(SEED_ACTIVITY_LOGS));
      return SEED_ACTIVITY_LOGS;
    }
    return JSON.parse(raw);
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

