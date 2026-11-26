/**
 * Faizan Global Relief Foundation (FGRF) - Water Projects Audit System
 * Central Real-Time Cloud Master Database Synchronization Engine
 * 
 * Seamlessly synchronizes operational records across multiple computers worldwide
 * using Google Firebase Cloud Firestore (live WebSocket listeners) with automatic
 * offline caching, conflict resolution, and local backend fallback.
 * 
 * Form Reference: FGRF-WTS-AUD-002.00-26
 * Author: Syed Waqas, Manager MIS (Data Management & ERP Department - FGRF)
 */

import { AuditRecord, WaterProject, RepairItem, MasterHeadsConfig, UserProfile } from '../types/index.ts';
import { createDefaultCheckpoints, PRECONFIGURED_USERS } from './auditLogic.ts';
import { CountryInfo, mergeGeoHierarchy } from './pakistanGeo.ts';
import { 
  getAudits, 
  getProjects, 
  getRepairs, 
  saveAudits, 
  saveProjects, 
  saveRepairs, 
  getDeletedAuditIds, 
  getDeletedProjectIds,
  getDeletedUserIds,
  getDeletedRepairIds,
  markAuditAsDeleted,
  markProjectAsDeleted,
  markUserAsDeleted,
  markRepairAsDeleted,
  getGeoHierarchy,
  saveGeoHierarchy,
  getMasterHeads,
  saveMasterHeads,
  getUsers,
  saveUsers
} from './storage.ts';
import { isFirebaseConfigured, getFirebaseServices } from '../firebase/config.ts';
import { 
  subscribeToRealtimeFirestore, 
  submitAuditToFirestore, 
  saveProjectToFirestore, 
  deleteProjectFromFirestore,
  deleteAuditFromFirestore,
  updateRepairInFirestore,
  saveMasterHeadsToFirestore,
  saveGeoHierarchyToFirestore,
  saveUserToFirestore,
  deleteUserFromFirestore,
  fetchAllCollectionsFromFirestore
} from '../firebase/firestore.ts';

// Authoritative official Master Database URLs for static fallback
const GITHUB_RAW_MASTER_DB = 'https://raw.githubusercontent.com/waqas226-arch/Water-project-Audit/main/data/master_cloud_database.json';
const GITHUB_PAGES_MASTER_DB = 'https://waqas226-arch.github.io/Water-project-Audit/data/master_cloud_database.json';

const STORAGE_LAST_SYNC_KEY = 'fgrf_cloud_last_sync_timestamp';

// BroadcastChannel for instant cross-tab live synchronization
const syncBus = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('fgrf_master_sync_bus') 
  : null;

export type CloudEngineType = 'firebase' | 'local_server' | 'offline';

export function getActiveCloudEngine(): CloudEngineType {
  if (isFirebaseConfigured()) return 'firebase';
  if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('github.io')) {
    return 'local_server';
  }
  return 'offline';
}

export interface CloudDatabasePayload {
  audits: AuditRecord[];
  projects: WaterProject[];
  repairs: RepairItem[];
  geoHierarchy?: CountryInfo[];
  masterHeads?: MasterHeadsConfig;
  users?: UserProfile[];
  deletedAuditIds?: string[];
  deletedProjectIds?: string[];
  deletedUserIds?: string[];
  deletedRepairIds?: string[];
  lastUpdated: string;
  updatedBy?: string;
}

export interface SyncResult {
  success: boolean;
  engine: CloudEngineType;
  newAuditsCount: number;
  newProjectsCount: number;
  newUsersCount?: number;
  geoUpdated?: boolean;
  usersUpdated?: boolean;
  message: string;
  timestamp: string;
}

export function sanitizeAuditRecord(raw: any): AuditRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.id ? String(raw.id).trim() : '';
  const idUpper = id.toUpperCase();
  if (!id || idUpper === 'TEST-001' || idUpper === 'AUD-2026-0001') return null;
  const projUpper = String(raw.projectId || raw.project || '').trim().toUpperCase();
  if (projUpper === 'FGRF-WTS-SND-004') return null;

  return {
    id,
    formReference: raw.formReference || 'FGRF-WTS-AUD-002.00-26',
    projectId: raw.projectId || raw.project || 'Unknown Project',
    country: raw.country || 'Pakistan',
    province: raw.province || 'Punjab',
    division: raw.division || '',
    district: raw.district || '',
    tehsil: raw.tehsil || '',
    unionCouncil: raw.unionCouncil || '',
    village: raw.village || '',
    fullSiteAddress: raw.fullSiteAddress || '',
    gpsCoordinates: raw.gpsCoordinates || { lat: 30.3753, lng: 69.3451 },
    beneficiaryName: raw.beneficiaryName || '',
    beneficiaryMobile: raw.beneficiaryMobile || '',
    installationType: raw.installationType || 'Hand Pump',
    installationDate: raw.installationDate || '',
    inspectionDateTime: raw.inspectionDateTime || new Date().toISOString(),
    inspectorId: raw.inspectorId || 'FGRF-MIS-01',
    inspectorName: raw.inspectorName || 'Field Inspector',
    inspectorDesignation: raw.inspectorDesignation || 'Inspector',
    checkpoints: Array.isArray(raw.checkpoints) && raw.checkpoints.length > 0 ? raw.checkpoints : createDefaultCheckpoints(),
    repairs: Array.isArray(raw.repairs) ? raw.repairs : [],
    overallCondition: raw.overallCondition || 'Functional',
    attachedPhotos: raw.attachedPhotos || {},
    inspectorRemarks: raw.inspectorRemarks || '',
    inspectorSignature: raw.inspectorSignature || '',
    inspectionSignDate: raw.inspectionSignDate || '',
    communityRepName: raw.communityRepName || '',
    communityRepSignature: raw.communityRepSignature || '',
    communityRepDate: raw.communityRepDate || '',
    approvalStatus: raw.approvalStatus || 'Submitted',
    reviewedBy: raw.reviewedBy,
    reviewedDate: raw.reviewedDate,
    reviewRemarks: raw.reviewRemarks,
    qrCodeDataUrl: raw.qrCodeDataUrl,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
  };
}

export function getCloudSyncEndpoint(): string {
  if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('github.io')) {
    return `${window.location.origin}/api/cloud-sync`;
  }
  return '';
}

export function getLastSyncTime(): string | null {
  try {
    return localStorage.getItem(STORAGE_LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

/**
 * Fetch remote master database records (Firebase Firestore first, then fallback candidate endpoints).
 */
export async function fetchCloudData(): Promise<CloudDatabasePayload | null> {
  // 1. If Firebase Cloud Firestore is configured, fetch live collections
  if (isFirebaseConfigured()) {
    try {
      const fsData = await fetchAllCollectionsFromFirestore();
      if (fsData) {
        return {
          audits: fsData.audits,
          projects: fsData.projects,
          repairs: fsData.repairs,
          geoHierarchy: fsData.geo,
          masterHeads: fsData.heads,
          users: fsData.users,
          deletedAuditIds: fsData.tombstones?.deletedAuditIds,
          deletedProjectIds: fsData.tombstones?.deletedProjectIds,
          deletedUserIds: fsData.tombstones?.deletedUserIds,
          deletedRepairIds: fsData.tombstones?.deletedRepairIds,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'Cloud Firestore',
        };
      }
    } catch (e) {
      console.warn('[CloudSync] Firestore fetch error, falling back:', e);
    }
  }

  // 2. Fallback to Local Node.js Express server or GitHub CDN
  const candidateEndpoints: string[] = [];
  if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('github.io')) {
    candidateEndpoints.push(`${window.location.origin}/api/cloud-sync`);
  }
  candidateEndpoints.push(`${GITHUB_RAW_MASTER_DB}?t=${Date.now()}`);
  candidateEndpoints.push(`${GITHUB_PAGES_MASTER_DB}?t=${Date.now()}`);

  for (const url of candidateEndpoints) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3000),
      });

      if (!res.ok) continue;

      const json = await res.json();
      const data: CloudDatabasePayload = json.data || json;

      if (!data || typeof data !== 'object') continue;

      const rawAudits = Array.isArray(data.audits) ? data.audits : [];
      const cleanAudits: AuditRecord[] = [];
      for (const a of rawAudits) {
        const sanitized = sanitizeAuditRecord(a);
        if (sanitized) cleanAudits.push(sanitized);
      }

      return {
        audits: cleanAudits,
        projects: Array.isArray(data.projects)
          ? data.projects.filter(
              (p) =>
                p &&
                p.id &&
                String(p.id).trim().toUpperCase() !== 'FGRF-WTS-SND-004' &&
                !String(p.name || '').includes('Haji Qasim Brohi')
            )
          : [],
        repairs: Array.isArray(data.repairs)
          ? data.repairs.filter((r) => r && r.id && String(r.id).trim().toUpperCase() !== 'REP-2026-0001')
          : [],
        geoHierarchy: Array.isArray(data.geoHierarchy) ? data.geoHierarchy : undefined,
        masterHeads: (data.masterHeads && typeof data.masterHeads === 'object') ? data.masterHeads : undefined,
        users: Array.isArray(data.users) && data.users.length > 0 ? data.users : undefined,
        deletedAuditIds: data.deletedAuditIds,
        deletedProjectIds: data.deletedProjectIds,
        deletedUserIds: data.deletedUserIds,
        deletedRepairIds: data.deletedRepairIds,
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        updatedBy: data.updatedBy
      };
    } catch {
      // Try next
    }
  }

  // Safe fallback to local cache
  return {
    audits: getAudits(),
    projects: getProjects(),
    repairs: getRepairs(),
    geoHierarchy: getGeoHierarchy(),
    masterHeads: getMasterHeads(),
    users: getUsers(),
    lastUpdated: getLastSyncTime() || new Date().toISOString(),
    updatedBy: 'Local Cache'
  };
}

/**
 * Push local database state to Cloud (Cloud Firestore and/or Local Server)
 */
export async function pushLocalToCloud(
  audits: AuditRecord[] = getAudits(),
  projects: WaterProject[] = getProjects(),
  repairs: RepairItem[] = getRepairs(),
  userId: string = 'FGRF-MIS-01',
  geoHierarchy: CountryInfo[] = getGeoHierarchy(),
  masterHeads: MasterHeadsConfig = getMasterHeads(),
  users: UserProfile[] = getUsers(),
  deletedAuditIds: string[] = getDeletedAuditIds(),
  deletedProjectIds: string[] = getDeletedProjectIds(),
  deletedUserIds: string[] = getDeletedUserIds(),
  deletedRepairIds: string[] = getDeletedRepairIds()
): Promise<boolean> {
  let firestoreSuccess = false;

  // 1. If Firebase Cloud Firestore is configured, save entities
  if (isFirebaseConfigured()) {
    try {
      if (masterHeads) await saveMasterHeadsToFirestore(masterHeads, userId);
      if (geoHierarchy) await saveGeoHierarchyToFirestore(geoHierarchy, userId);
      firestoreSuccess = true;
    } catch (e) {
      console.warn('[CloudSync] Firestore push error:', e);
    }
  }

  // 2. If running with a local Express backend
  const endpoint = getCloudSyncEndpoint();
  if (endpoint && endpoint.includes('/api/cloud-sync')) {
    try {
      const payload: CloudDatabasePayload = {
        audits,
        projects,
        repairs,
        geoHierarchy,
        masterHeads,
        users,
        deletedAuditIds,
        deletedProjectIds,
        deletedUserIds,
        deletedRepairIds,
        lastUpdated: new Date().toISOString(),
        updatedBy: userId
      };

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {}
  }

  try {
    localStorage.setItem(STORAGE_LAST_SYNC_KEY, new Date().toISOString());
  } catch {}

  // Broadcast to other tabs
  syncBus?.postMessage({ type: 'DATA_SYNCED', timestamp: new Date().toISOString() });
  return firestoreSuccess || true;
}

export function mergeAudits(
  local: AuditRecord[], 
  remote: AuditRecord[], 
  deletedIds: string[] = getDeletedAuditIds()
): { merged: AuditRecord[]; newCount: number } {
  const map = new Map<string, AuditRecord>();
  local.forEach((a) => {
    const s = sanitizeAuditRecord(a);
    if (s && !deletedIds.includes(s.id.trim().toUpperCase())) {
      map.set(s.id, s);
    }
  });

  let newCount = 0;
  remote.forEach((remoteAudit) => {
    const cleanRemote = sanitizeAuditRecord(remoteAudit);
    if (!cleanRemote) return;
    if (deletedIds.includes(cleanRemote.id.trim().toUpperCase())) return;

    if (!map.has(cleanRemote.id)) {
      map.set(cleanRemote.id, cleanRemote);
      newCount++;
    } else {
      const localAudit = map.get(cleanRemote.id)!;
      const remoteTime = new Date(cleanRemote.updatedAt || cleanRemote.createdAt || cleanRemote.inspectionDateTime || 0).getTime();
      const localTime = new Date(localAudit.updatedAt || localAudit.createdAt || localAudit.inspectionDateTime || 0).getTime();
      if (remoteTime > localTime) {
        map.set(cleanRemote.id, cleanRemote);
      }
    }
  });

  return { merged: Array.from(map.values()), newCount };
}

export function mergeProjects(
  local: WaterProject[], 
  remote: WaterProject[], 
  deletedIds: string[] = getDeletedProjectIds()
): { merged: WaterProject[]; newCount: number } {
  const map = new Map<string, WaterProject>();
  local.forEach((p) => {
    if (p && p.id && !deletedIds.includes(p.id.trim().toUpperCase())) {
      map.set(p.id, p);
    }
  });

  let newCount = 0;
  remote.forEach((remoteProj) => {
    if (!remoteProj || !remoteProj.id) return;
    const cleanId = String(remoteProj.id).trim().toUpperCase();
    if (cleanId === 'FGRF-WTS-SND-004' || String(remoteProj.name || '').includes('Haji Qasim Brohi')) return;
    if (deletedIds.includes(remoteProj.id.trim().toUpperCase())) return;

    if (!map.has(remoteProj.id)) {
      map.set(remoteProj.id, remoteProj);
      newCount++;
    } else {
      const localProj = map.get(remoteProj.id)!;
      map.set(remoteProj.id, {
        ...localProj,
        ...remoteProj,
        totalInspections: Math.max(localProj.totalInspections || 0, remoteProj.totalInspections || 0)
      });
    }
  });

  return { merged: Array.from(map.values()), newCount };
}

export function mergeRepairs(
  local: RepairItem[], 
  remote: RepairItem[],
  deletedRepairIds: string[] = getDeletedRepairIds(),
  deletedAuditIds: string[] = getDeletedAuditIds()
): RepairItem[] {
  const map = new Map<string, RepairItem>();
  const bannedRepairSet = new Set(deletedRepairIds.map((id) => id.trim().toUpperCase()));
  const bannedAuditSet = new Set(deletedAuditIds.map((id) => id.trim().toUpperCase()));

  local.forEach((r) => {
    if (!r || !r.id) return;
    const cleanId = String(r.id).trim().toUpperCase();
    if (bannedRepairSet.has(cleanId)) return;
    if (r.auditId && bannedAuditSet.has(String(r.auditId).trim().toUpperCase())) return;
    map.set(r.id, r);
  });

  remote.forEach((r) => {
    if (!r || !r.id) return;
    const cleanId = String(r.id).trim().toUpperCase();
    if (bannedRepairSet.has(cleanId)) return;
    if (r.auditId && bannedAuditSet.has(String(r.auditId).trim().toUpperCase())) return;

    if (!map.has(r.id)) {
      map.set(r.id, r);
    } else {
      const localRepair = map.get(r.id)!;
      map.set(r.id, { ...localRepair, ...r });
    }
  });

  return Array.from(map.values());
}

export function mergeUsers(
  local: UserProfile[], 
  remote: UserProfile[],
  deletedUserIds: string[] = getDeletedUserIds()
): { merged: UserProfile[]; newCount: number } {
  const map = new Map<string, UserProfile>();
  const bannedSet = new Set(deletedUserIds.map((id) => id.trim().toUpperCase()));

  PRECONFIGURED_USERS.forEach((u) => {
    if (u && u.id && !bannedSet.has(u.id.toUpperCase())) {
      map.set(u.id.toUpperCase(), u);
    }
  });

  (local || []).forEach((u) => {
    if (u && u.id && !bannedSet.has(u.id.toUpperCase())) {
      map.set(u.id.toUpperCase(), u);
    }
  });

  let newCount = 0;
  (remote || []).forEach((r) => {
    if (!r || !r.id) return;
    const key = r.id.toUpperCase();
    if (bannedSet.has(key)) return;

    if (!map.has(key)) {
      map.set(key, r);
      newCount++;
    } else {
      const existing = map.get(key)!;
      map.set(key, {
        ...existing,
        ...r,
        division: r.division !== undefined ? r.division : existing.division,
        province: r.province || existing.province,
        rights: r.rights || existing.rights,
        status: r.status || existing.status,
      });
    }
  });

  return { merged: Array.from(map.values()), newCount };
}

export async function publishUsersToCloud(users: UserProfile[] = getUsers(), userId: string = 'FGRF-MIS-01'): Promise<boolean> {
  saveUsers(users);

  if (isFirebaseConfigured()) {
    for (const u of users) {
      await saveUserToFirestore(u, userId);
    }
  }

  const success = await pushLocalToCloud(
    getAudits(),
    getProjects(),
    getRepairs(),
    userId,
    getGeoHierarchy(),
    getMasterHeads(),
    users
  );

  syncBus?.postMessage({ type: 'USERS_SYNCED', timestamp: new Date().toISOString() });
  return success;
}

export async function publishGeoHierarchyToCloud(geo: CountryInfo[], userId: string = 'FGRF-MIS-01'): Promise<boolean> {
  saveGeoHierarchy(geo);

  if (isFirebaseConfigured()) {
    await saveGeoHierarchyToFirestore(geo, userId);
  }

  const users = getUsers();
  const success = await pushLocalToCloud(getAudits(), getProjects(), getRepairs(), userId, geo, getMasterHeads(), users);
  syncBus?.postMessage({ type: 'GEO_SYNCED', timestamp: new Date().toISOString() });
  return success;
}

export async function publishMasterHeadsToCloud(heads: MasterHeadsConfig, userId: string = 'FGRF-MIS-01'): Promise<boolean> {
  saveMasterHeads(heads);

  if (isFirebaseConfigured()) {
    await saveMasterHeadsToFirestore(heads, userId);
  }

  const users = getUsers();
  const success = await pushLocalToCloud(getAudits(), getProjects(), getRepairs(), userId, getGeoHierarchy(), heads, users);
  syncBus?.postMessage({ type: 'HEADS_SYNCED', timestamp: new Date().toISOString() });
  return success;
}

export async function publishAuditToCloud(
  audit: AuditRecord, 
  project: WaterProject, 
  repairs: RepairItem[], 
  userId: string = 'FGRF-MIS-01'
): Promise<boolean> {
  if (isFirebaseConfigured()) {
    await submitAuditToFirestore(audit, project, repairs, userId);
  }

  const cloud = await fetchCloudData();
  const currentAudits = cloud?.audits || getAudits();
  const currentProjects = cloud?.projects || getProjects();
  const currentRepairs = cloud?.repairs || getRepairs();

  const allDeletedAuditIds = getDeletedAuditIds();
  const allDeletedProjectIds = getDeletedProjectIds();
  const allDeletedRepairIds = getDeletedRepairIds();

  const { merged: mergedAudits } = mergeAudits(currentAudits, [audit], allDeletedAuditIds);
  const { merged: mergedProjects } = mergeProjects(currentProjects, [project], allDeletedProjectIds);
  const mergedRepairs = mergeRepairs(currentRepairs, repairs, allDeletedRepairIds, allDeletedAuditIds);

  return await pushLocalToCloud(mergedAudits, mergedProjects, mergedRepairs, userId, getGeoHierarchy(), getMasterHeads(), getUsers());
}

/**
 * Full two-way synchronization:
 * 1. Downloads remote cloud data
 * 2. Merges with local data & absorbs tombstones
 * 3. Uploads merged superset with tombstones back to cloud
 */
export async function syncAllWithCloud(userId: string = 'FGRF-MIS-01'): Promise<SyncResult> {
  const engine = getActiveCloudEngine();
  const localAudits = getAudits();
  const localProjects = getProjects();
  const localRepairs = getRepairs();
  const localGeo = getGeoHierarchy();
  const localHeads = getMasterHeads();
  const localUsers = getUsers();

  const cloud = await fetchCloudData();
  const remoteAudits = cloud?.audits || [];
  const remoteProjects = cloud?.projects || [];
  const remoteRepairs = cloud?.repairs || [];
  const remoteUsers = cloud?.users || [];

  // Absorb tombstones
  if (Array.isArray(cloud?.deletedAuditIds)) {
    cloud.deletedAuditIds.forEach((id) => markAuditAsDeleted(id));
  }
  if (Array.isArray(cloud?.deletedProjectIds)) {
    cloud.deletedProjectIds.forEach((id) => markProjectAsDeleted(id));
  }
  if (Array.isArray(cloud?.deletedUserIds)) {
    cloud.deletedUserIds.forEach((id) => markUserAsDeleted(id));
  }
  if (Array.isArray(cloud?.deletedRepairIds)) {
    cloud.deletedRepairIds.forEach((id) => markRepairAsDeleted(id));
  }

  const allDeletedAuditIds = getDeletedAuditIds();
  const allDeletedProjectIds = getDeletedProjectIds();
  const allDeletedUserIds = getDeletedUserIds();
  const allDeletedRepairIds = getDeletedRepairIds();

  const { merged: mergedAudits, newCount: newAuditsCount } = mergeAudits(localAudits, remoteAudits, allDeletedAuditIds);
  const { merged: mergedProjects, newCount: newProjectsCount } = mergeProjects(localProjects, remoteProjects, allDeletedProjectIds);
  const mergedRepairs = mergeRepairs(localRepairs, remoteRepairs, allDeletedRepairIds, allDeletedAuditIds);
  const { merged: mergedUsers, newCount: newUsersCount } = mergeUsers(localUsers, remoteUsers, allDeletedUserIds);

  let geoUpdated = false;
  if (cloud?.geoHierarchy && Array.isArray(cloud.geoHierarchy) && cloud.geoHierarchy.length > 0) {
    const mergedGeo = mergeGeoHierarchy(localGeo, cloud.geoHierarchy);
    saveGeoHierarchy(mergedGeo);
    geoUpdated = true;
  }

  let usersUpdated = false;
  if (newUsersCount > 0 || (remoteUsers.length > 0 && JSON.stringify(localUsers) !== JSON.stringify(mergedUsers))) {
    saveUsers(mergedUsers);
    usersUpdated = true;
  }

  let mergedHeads = localHeads;
  if (cloud?.masterHeads && typeof cloud.masterHeads === 'object') {
    mergedHeads = {
      ...localHeads,
      ...cloud.masterHeads,
      categories: Array.from(new Set([...(localHeads.categories || []), ...(cloud.masterHeads.categories || [])])),
      conditions: [
        ...(localHeads.conditions || []),
        ...((cloud.masterHeads.conditions || []).filter(
          (c) => !(localHeads.conditions || []).some((lc) => lc.id === c.id)
        ))
      ],
      questions: [
        ...(localHeads.questions || []),
        ...((cloud.masterHeads.questions || []).filter(
          (q) => !(localHeads.questions || []).some((lq) => lq.id === q.id)
        ))
      ]
    };
    saveMasterHeads(mergedHeads);
  }

  saveAudits(mergedAudits);
  saveProjects(mergedProjects);
  saveRepairs(mergedRepairs);
  saveUsers(mergedUsers);

  // If Firebase is configured, sync individual entities
  if (isFirebaseConfigured()) {
    for (const p of mergedProjects) {
      await saveProjectToFirestore(p, userId);
    }
  }

  await pushLocalToCloud(
    mergedAudits, 
    mergedProjects, 
    mergedRepairs, 
    userId, 
    getGeoHierarchy(), 
    mergedHeads, 
    mergedUsers,
    allDeletedAuditIds,
    allDeletedProjectIds,
    allDeletedUserIds,
    allDeletedRepairIds
  );

  try {
    localStorage.setItem(STORAGE_LAST_SYNC_KEY, new Date().toISOString());
  } catch {}

  const parts: string[] = [];
  if (newAuditsCount > 0) parts.push(`${newAuditsCount} new audit(s)`);
  if (newProjectsCount > 0) parts.push(`${newProjectsCount} new project(s)`);
  if (geoUpdated) parts.push(`locations updated`);
  if (usersUpdated || newUsersCount > 0) parts.push(`users updated`);

  const countMsg = parts.length > 0 
    ? `Received ${parts.join(', ')}.`
    : `All records & locations synchronized (${mergedAudits.length} audits, ${mergedProjects.length} projects, ${mergedUsers.length} users).`;

  const engineLabel = engine === 'firebase' ? 'Firebase Cloud Firestore' : engine === 'local_server' ? 'Local Central DB' : 'Offline Cache';

  return {
    success: true,
    engine,
    newAuditsCount,
    newProjectsCount,
    newUsersCount,
    geoUpdated,
    usersUpdated,
    message: `${engineLabel}: ${countMsg}`,
    timestamp: new Date().toISOString()
  };
}

/**
 * Real-time background sync engine:
 * 1. If Firebase is configured, listens to live WebSocket streams (sub-second sync)
 * 2. If Firebase is not configured, polls every 15 seconds against local server
 * 3. Listens to window focus / visibility change and BroadcastChannel
 */
export function startRealtimeCloudSync(
  onUpdate: (data: { 
    audits: AuditRecord[]; 
    projects: WaterProject[]; 
    repairs: RepairItem[]; 
    geoHierarchy: CountryInfo[];
    masterHeads: MasterHeadsConfig;
    users?: UserProfile[];
    newCount: number;
    geoUpdated?: boolean;
    usersUpdated?: boolean;
    engine?: CloudEngineType;
  }) => void,
  userId: string = 'FGRF-MIS-01'
): () => void {
  // 1. If Firebase Cloud Firestore is configured, use live WebSocket listeners
  if (isFirebaseConfigured()) {
    console.log('[FGRF Cloud Sync] Initializing Firebase Cloud Firestore live real-time listeners...');

    const unsubFirestore = subscribeToRealtimeFirestore({
      onProjects: (remoteProjects) => {
        const deletedIds = getDeletedProjectIds();
        const { merged, newCount } = mergeProjects(getProjects(), remoteProjects, deletedIds);
        saveProjects(merged);
        onUpdate({
          audits: getAudits(),
          projects: merged,
          repairs: getRepairs(),
          geoHierarchy: getGeoHierarchy(),
          masterHeads: getMasterHeads(),
          users: getUsers(),
          newCount,
          engine: 'firebase',
        });
      },
      onAudits: (remoteAudits) => {
        const deletedIds = getDeletedAuditIds();
        const { merged, newCount } = mergeAudits(getAudits(), remoteAudits, deletedIds);
        saveAudits(merged);
        onUpdate({
          audits: merged,
          projects: getProjects(),
          repairs: getRepairs(),
          geoHierarchy: getGeoHierarchy(),
          masterHeads: getMasterHeads(),
          users: getUsers(),
          newCount,
          engine: 'firebase',
        });
      },
      onRepairs: (remoteRepairs) => {
        const merged = mergeRepairs(getRepairs(), remoteRepairs);
        saveRepairs(merged);
        onUpdate({
          audits: getAudits(),
          projects: getProjects(),
          repairs: merged,
          geoHierarchy: getGeoHierarchy(),
          masterHeads: getMasterHeads(),
          users: getUsers(),
          newCount: 0,
          engine: 'firebase',
        });
      },
      onMasterHeads: (remoteHeads) => {
        saveMasterHeads(remoteHeads);
        onUpdate({
          audits: getAudits(),
          projects: getProjects(),
          repairs: getRepairs(),
          geoHierarchy: getGeoHierarchy(),
          masterHeads: remoteHeads,
          users: getUsers(),
          newCount: 0,
          engine: 'firebase',
        });
      },
      onGeoHierarchy: (remoteGeo) => {
        const mergedGeo = mergeGeoHierarchy(getGeoHierarchy(), remoteGeo);
        saveGeoHierarchy(mergedGeo);
        onUpdate({
          audits: getAudits(),
          projects: getProjects(),
          repairs: getRepairs(),
          geoHierarchy: mergedGeo,
          masterHeads: getMasterHeads(),
          users: getUsers(),
          newCount: 0,
          geoUpdated: true,
          engine: 'firebase',
        });
      },
      onUsers: (remoteUsers) => {
        const { merged, newCount } = mergeUsers(getUsers(), remoteUsers);
        saveUsers(merged);
        onUpdate({
          audits: getAudits(),
          projects: getProjects(),
          repairs: getRepairs(),
          geoHierarchy: getGeoHierarchy(),
          masterHeads: getMasterHeads(),
          users: merged,
          newCount,
          usersUpdated: true,
          engine: 'firebase',
        });
      },
      onTombstones: (tombstones) => {
        tombstones.deletedAuditIds?.forEach((id) => markAuditAsDeleted(id));
        tombstones.deletedProjectIds?.forEach((id) => markProjectAsDeleted(id));
        tombstones.deletedUserIds?.forEach((id) => markUserAsDeleted(id));
        tombstones.deletedRepairIds?.forEach((id) => markRepairAsDeleted(id));
      },
      onError: (err) => {
        console.warn('[FGRF Firestore Realtime Notice]', err);
      }
    });

    return () => {
      unsubFirestore();
    };
  }

  // 2. Fallback polling mode for local development or when Firebase is unconfigured
  let isSyncing = false;
  let lastSyncTimestamp = Date.now();

  const triggerSync = async () => {
    if (isSyncing) return;
    isSyncing = true;
    try {
      const res = await syncAllWithCloud(userId);
      lastSyncTimestamp = Date.now();
      if (res.success && (res.newAuditsCount > 0 || res.newProjectsCount > 0 || res.geoUpdated || res.usersUpdated)) {
        onUpdate({
          audits: getAudits(),
          projects: getProjects(),
          repairs: getRepairs(),
          geoHierarchy: getGeoHierarchy(),
          masterHeads: getMasterHeads(),
          users: getUsers(),
          newCount: res.newAuditsCount,
          geoUpdated: res.geoUpdated,
          usersUpdated: res.usersUpdated,
          engine: res.engine
        });
      }
    } catch (err) {
      console.warn('[FGRF Realtime Sync Notice]', err);
    } finally {
      isSyncing = false;
    }
  };

  const initialTimer = setTimeout(triggerSync, 800);
  const interval = setInterval(triggerSync, 15000);

  const handleVisibilityOrFocus = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible' && Date.now() - lastSyncTimestamp > 5000) {
      triggerSync();
    }
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', handleVisibilityOrFocus);
  }

  const handleBroadcast = (event: MessageEvent) => {
    if (
      event.data?.type === 'DATA_SYNCED' || 
      event.data?.type === 'GEO_SYNCED' || 
      event.data?.type === 'HEADS_SYNCED' ||
      event.data?.type === 'USERS_SYNCED'
    ) {
      onUpdate({
        audits: getAudits(),
        projects: getProjects(),
        repairs: getRepairs(),
        geoHierarchy: getGeoHierarchy(),
        masterHeads: getMasterHeads(),
        users: getUsers(),
        newCount: 0,
        geoUpdated: event.data?.type === 'GEO_SYNCED',
        usersUpdated: event.data?.type === 'USERS_SYNCED',
        engine: getActiveCloudEngine()
      });
    }
  };

  syncBus?.addEventListener('message', handleBroadcast);

  return () => {
    clearTimeout(initialTimer);
    clearInterval(interval);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', handleVisibilityOrFocus);
    }
    syncBus?.removeEventListener('message', handleBroadcast);
  };
}
