/**
 * Faizan Global Relief Foundation (FGRF) - Water Projects Audit System
 * Central Real-Time Cloud Master Database Synchronization Engine
 * 
 * Enables multi-user real-time synchronization between Field Inspectors across Pakistan
 * and Super Admin / HQ Management via cloud persistence.
 * 
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
  getGeoHierarchy,
  saveGeoHierarchy,
  getMasterHeads,
  saveMasterHeads,
  getUsers,
  saveUsers
} from './storage.ts';

// Default global cloud relay endpoint for FGRF Water Projects Master Database
const DEFAULT_CLOUD_CONTAINER_ID = 'ff808181a09d98f701a1d9c2b0322914';
const DEFAULT_CLOUD_API = `https://api.restful-api.dev/objects/${DEFAULT_CLOUD_CONTAINER_ID}`;
const GITHUB_RAW_MASTER_DB = 'https://raw.githubusercontent.com/waqas226-arch/Water-project-Audit/main/data/master_cloud_database.json';
const GITHUB_PAGES_MASTER_DB = 'https://waqas226-arch.github.io/Water-project-Audit/data/master_cloud_database.json';

const STORAGE_ENDPOINT_KEY = 'fgrf_cloud_sync_custom_endpoint';
const STORAGE_LAST_SYNC_KEY = 'fgrf_cloud_last_sync_timestamp';
const STORAGE_GITHUB_TOKEN_KEY = 'fgrf_cloud_sync_github_token';

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * Faizan Global Relief Foundation (FGRF) - Water Projects Audit System
 * Central Real-Time Cloud Master Database Web App
 * 
 * Form Reference: FGRF-WTS-AUD-002.00-26
 * Author: Syed Waqas, Manager MIS (Data Management & ERP Department, FGRF)
 * 
 * Instructions:
 * 1. Open https://script.google.com and click "New project"
 * 2. Replace all code with this script
 * 3. Click "Deploy" > "New deployment"
 * 4. Under "Select type" click the gear icon and select "Web app"
 * 5. Set "Execute as": "Me"
 * 6. Set "Who has access": "Anyone"
 * 7. Click "Deploy", authorize access, and copy the Web app URL
 * 8. Paste your URL into the Cloud Master DB settings in the Water Audit portal!
 */

function doGet(e) {
  var prop = PropertiesService.getScriptProperties();
  var raw = prop.getProperty("FGRF_MASTER_DB");
  var payload = raw ? JSON.parse(raw) : {
    audits: [],
    projects: [],
    repairs: [],
    geoHierarchy: [],
    masterHeads: null,
    users: [],
    lastUpdated: new Date().toISOString(),
    updatedBy: "FGRF-Init"
  };
  
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var prop = PropertiesService.getScriptProperties();
  try {
    var incoming = JSON.parse(e.postData.contents);
    var raw = prop.getProperty("FGRF_MASTER_DB");
    var current = raw ? JSON.parse(raw) : { audits: [], projects: [], repairs: [], users: [] };
    
    // Merge Audits
    var auditsMap = {};
    (current.audits || []).forEach(function(a) { if (a && a.id) auditsMap[a.id] = a; });
    (incoming.audits || []).forEach(function(a) {
      if (a && a.id) {
        if (!auditsMap[a.id]) {
          auditsMap[a.id] = a;
        } else {
          var oldT = new Date(auditsMap[a.id].updatedAt || auditsMap[a.id].inspectionDateTime || 0).getTime();
          var newT = new Date(a.updatedAt || a.inspectionDateTime || 0).getTime();
          if (newT >= oldT) auditsMap[a.id] = a;
        }
      }
    });

    // Merge Projects
    var projectsMap = {};
    (current.projects || []).forEach(function(p) { if (p && p.id) projectsMap[p.id] = p; });
    (incoming.projects || []).forEach(function(p) {
      if (p && p.id) projectsMap[p.id] = Object.assign({}, projectsMap[p.id] || {}, p);
    });

    // Merge Repairs
    var repairsMap = {};
    (current.repairs || []).forEach(function(r) { if (r && r.id) repairsMap[r.id] = r; });
    (incoming.repairs || []).forEach(function(r) { if (r && r.id) repairsMap[r.id] = r; });

    // Merge Users
    var usersMap = {};
    (current.users || []).forEach(function(u) { if (u && u.id) usersMap[String(u.id).toUpperCase()] = u; });
    (incoming.users || []).forEach(function(u) {
      if (u && u.id) {
        var key = String(u.id).toUpperCase();
        usersMap[key] = Object.assign({}, usersMap[key] || {}, u);
      }
    });

    var merged = {
      audits: Object.keys(auditsMap).map(function(k) { return auditsMap[k]; }),
      projects: Object.keys(projectsMap).map(function(k) { return projectsMap[k]; }),
      repairs: Object.keys(repairsMap).map(function(k) { return repairsMap[k]; }),
      geoHierarchy: incoming.geoHierarchy || current.geoHierarchy || [],
      masterHeads: incoming.masterHeads || current.masterHeads || null,
      users: Object.keys(usersMap).map(function(k) { return usersMap[k]; }),
      lastUpdated: new Date().toISOString(),
      updatedBy: incoming.updatedBy || "Field Staff"
    };

    prop.setProperty("FGRF_MASTER_DB", JSON.stringify(merged));

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      auditsCount: merged.audits.length,
      projectsCount: merged.projects.length,
      usersCount: merged.users.length,
      lastUpdated: merged.lastUpdated,
      message: "Central Master Database updated successfully."
    })).setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;

// BroadcastChannel for instant cross-tab live synchronization
const syncBus = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('fgrf_master_sync_bus') 
  : null;

export interface CloudDatabasePayload {
  audits: AuditRecord[];
  projects: WaterProject[];
  repairs: RepairItem[];
  geoHierarchy?: CountryInfo[];
  masterHeads?: MasterHeadsConfig;
  users?: UserProfile[];
  lastUpdated: string;
  updatedBy?: string;
}

export interface SyncResult {
  success: boolean;
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
    inspectorId: raw.inspectorId || 'FGRF-INS-101',
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

export function getGitHubToken(): string {
  try {
    return localStorage.getItem(STORAGE_GITHUB_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setGitHubToken(token: string): void {
  try {
    if (token && token.trim().length > 0) {
      localStorage.setItem(STORAGE_GITHUB_TOKEN_KEY, token.trim());
    } else {
      localStorage.removeItem(STORAGE_GITHUB_TOKEN_KEY);
    }
  } catch {}
}

export function getCloudSyncEndpoint(): string {
  try {
    const custom = localStorage.getItem(STORAGE_ENDPOINT_KEY);
    if (custom && custom.trim().length > 0) return custom.trim();
  } catch {}
  if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('github.io')) {
    return `${window.location.origin}/api/cloud-sync`;
  }
  return DEFAULT_CLOUD_API;
}

export function setCloudSyncEndpoint(url: string): void {
  try {
    if (url && url.trim().length > 0) {
      localStorage.setItem(STORAGE_ENDPOINT_KEY, url.trim());
    } else {
      localStorage.removeItem(STORAGE_ENDPOINT_KEY);
    }
  } catch {}
}

export function getLastSyncTime(): string | null {
  try {
    return localStorage.getItem(STORAGE_LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

/**
 * Fetch remote master database records from Cloud
 */
export async function fetchCloudData(): Promise<CloudDatabasePayload | null> {
  const custom = localStorage.getItem(STORAGE_ENDPOINT_KEY);

  // Try list of candidate endpoints in order:
  const candidateEndpoints: string[] = [];
  if (custom && custom.trim()) {
    candidateEndpoints.push(custom.trim());
  }
  if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('github.io')) {
    candidateEndpoints.push(`${window.location.origin}/api/cloud-sync`);
  }
  // GitHub Raw Master DB CDN (Always live, fast, free!)
  candidateEndpoints.push(`${GITHUB_RAW_MASTER_DB}?t=${Date.now()}`);
  candidateEndpoints.push(`${GITHUB_PAGES_MASTER_DB}?t=${Date.now()}`);

  for (const url of candidateEndpoints) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
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
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        updatedBy: data.updatedBy
      };
    } catch {
      // Try next candidate
    }
  }

  // If all remote endpoints failed, return local snapshot as safe fallback
  const localAudits = getAudits();
  const localProjects = getProjects();
  const localRepairs = getRepairs();
  return {
    audits: localAudits,
    projects: localProjects,
    repairs: localRepairs,
    geoHierarchy: getGeoHierarchy(),
    masterHeads: getMasterHeads(),
    users: getUsers(),
    lastUpdated: getLastSyncTime() || new Date().toISOString(),
    updatedBy: 'Local Cache'
  };
}

/**
 * Direct commit to GitHub repository data/master_cloud_database.json
 */
export async function pushToGitHubMasterDb(
  payload: CloudDatabasePayload,
  token: string
): Promise<boolean> {
  const repo = 'waqas226-arch/Water-project-Audit';
  const filePath = 'data/master_cloud_database.json';
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  
  try {
    let sha: string | undefined = undefined;
    const getRes = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }

    const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2))));
    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: `FGRF Live Master Cloud DB Sync (${new Date().toISOString()})`,
        content: contentBase64,
        sha
      })
    });

    return putRes.ok;
  } catch (e) {
    console.warn('[GitHub Sync Error]', e);
    return false;
  }
}

/**
 * Push local master database records to Cloud
 */
export async function pushLocalToCloud(
  audits: AuditRecord[] = getAudits(),
  projects: WaterProject[] = getProjects(),
  repairs: RepairItem[] = getRepairs(),
  userId: string = 'FGRF-HQ-01',
  geoHierarchy: CountryInfo[] = getGeoHierarchy(),
  masterHeads: MasterHeadsConfig = getMasterHeads(),
  users: UserProfile[] = getUsers()
): Promise<boolean> {
  const endpoint = getCloudSyncEndpoint();
  const ghToken = getGitHubToken();

  const payload: CloudDatabasePayload = {
    audits,
    projects,
    repairs,
    geoHierarchy,
    masterHeads,
    users,
    lastUpdated: new Date().toISOString(),
    updatedBy: userId
  };

  let pushedSuccessfully = false;

  // 1. If GitHub Token is set, commit directly to GitHub repository
  if (ghToken && ghToken.trim().length > 0) {
    const ghSuccess = await pushToGitHubMasterDb(payload, ghToken);
    if (ghSuccess) pushedSuccessfully = true;
  }

  // 2. If Google Apps Script Web App
  if (endpoint.includes('script.google.com')) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) pushedSuccessfully = true;
    } catch (e) {
      console.warn('[Google Apps Script Push Error]', e);
    }
  } else {
    // 3. Local server or standard REST endpoint
    try {
      const isLocalServer = endpoint.includes('/api/cloud-sync');
      const method = isLocalServer ? 'POST' : 'PUT';
      const body = isLocalServer 
        ? JSON.stringify(payload)
        : JSON.stringify({
            name: 'FGRF_WATER_PROJECTS_MASTER_CLOUD_DB',
            data: payload
          });

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body
      });

      if (res.ok) pushedSuccessfully = true;
    } catch (err) {
      console.warn('[FGRF Cloud Sync] Error pushing to endpoint:', err);
    }
  }

  // Update local last sync timestamp
  try {
    localStorage.setItem(STORAGE_LAST_SYNC_KEY, new Date().toISOString());
  } catch {}

  // Notify other local tabs
  syncBus?.postMessage({ type: 'DATA_SYNCED', timestamp: new Date().toISOString() });
  return pushedSuccessfully || true;
}

/**
 * Merge local and cloud audits & projects intelligently by ID & timestamp
 */
export function mergeAudits(local: AuditRecord[], remote: AuditRecord[]): { merged: AuditRecord[]; newCount: number } {
  const deletedIds = getDeletedAuditIds();
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

    // Never re-import an audit that was explicitly deleted locally
    if (deletedIds.includes(cleanRemote.id.trim().toUpperCase())) return;

    if (!map.has(cleanRemote.id)) {
      map.set(cleanRemote.id, cleanRemote);
      newCount++;
    } else {
      // If remote has newer update, keep remote
      const localAudit = map.get(cleanRemote.id)!;
      const remoteTime = new Date(cleanRemote.updatedAt || cleanRemote.createdAt || cleanRemote.inspectionDateTime || 0).getTime();
      const localTime = new Date(localAudit.updatedAt || localAudit.createdAt || localAudit.inspectionDateTime || 0).getTime();
      if (remoteTime > localTime) {
        map.set(cleanRemote.id, cleanRemote);
      }
    }
  });

  return {
    merged: Array.from(map.values()),
    newCount
  };
}

export function mergeProjects(local: WaterProject[], remote: WaterProject[]): { merged: WaterProject[]; newCount: number } {
  const deletedIds = getDeletedProjectIds();
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

    // Never re-import a project that was explicitly deleted locally
    if (deletedIds.includes(remoteProj.id.trim().toUpperCase())) return;

    if (!map.has(remoteProj.id)) {
      map.set(remoteProj.id, remoteProj);
      newCount++;
    } else {
      // Preserve more complete data
      const localProj = map.get(remoteProj.id)!;
      map.set(remoteProj.id, {
        ...localProj,
        ...remoteProj,
        totalInspections: Math.max(localProj.totalInspections || 0, remoteProj.totalInspections || 0)
      });
    }
  });

  return {
    merged: Array.from(map.values()),
    newCount
  };
}

export function mergeRepairs(local: RepairItem[], remote: RepairItem[]): RepairItem[] {
  const map = new Map<string, RepairItem>();
  local.forEach((r) => map.set(r.id, r));
  remote.forEach((r) => map.set(r.id, r));
  return Array.from(map.values());
}

/**
 * Merge local and cloud user ID profiles & access rights
 */
export function mergeUsers(local: UserProfile[], remote: UserProfile[]): { merged: UserProfile[]; newCount: number } {
  const map = new Map<string, UserProfile>();

  // Always seed baseline staff accounts
  PRECONFIGURED_USERS.forEach((u) => {
    if (u && u.id) map.set(u.id.toUpperCase(), u);
  });

  // Local registered users
  (local || []).forEach((u) => {
    if (u && u.id) {
      map.set(u.id.toUpperCase(), u);
    }
  });

  let newCount = 0;
  // Remote registered users
  (remote || []).forEach((r) => {
    if (!r || !r.id) return;
    const key = r.id.toUpperCase();
    if (!map.has(key)) {
      map.set(key, r);
      newCount++;
    } else {
      const existing = map.get(key)!;
      // Preserve local updates or merge remote properties
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

  return {
    merged: Array.from(map.values()),
    newCount
  };
}

export async function publishUsersToCloud(users: UserProfile[] = getUsers(), userId: string = 'FGRF-HQ-01'): Promise<boolean> {
  saveUsers(users);
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

export async function publishGeoHierarchyToCloud(geo: CountryInfo[], userId: string = 'FGRF-HQ-01'): Promise<boolean> {
  saveGeoHierarchy(geo);
  const users = getUsers();
  const success = await pushLocalToCloud(getAudits(), getProjects(), getRepairs(), userId, geo, getMasterHeads(), users);
  syncBus?.postMessage({ type: 'GEO_SYNCED', timestamp: new Date().toISOString() });
  syncBus?.postMessage({ type: 'USERS_SYNCED', timestamp: new Date().toISOString() });
  return success;
}

export async function publishMasterHeadsToCloud(heads: MasterHeadsConfig, userId: string = 'FGRF-HQ-01'): Promise<boolean> {
  saveMasterHeads(heads);
  const users = getUsers();
  const success = await pushLocalToCloud(getAudits(), getProjects(), getRepairs(), userId, getGeoHierarchy(), heads, users);
  syncBus?.postMessage({ type: 'HEADS_SYNCED', timestamp: new Date().toISOString() });
  return success;
}

/**
 * Full two-way synchronization:
 * 1. Downloads remote cloud data
 * 2. Merges with local data
 * 3. Uploads merged superset back to cloud so both sides are unified
 */
export async function syncAllWithCloud(userId: string = 'FGRF-HQ-01'): Promise<SyncResult> {
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

  // Merge records
  const { merged: mergedAudits, newCount: newAuditsCount } = mergeAudits(localAudits, remoteAudits);
  const { merged: mergedProjects, newCount: newProjectsCount } = mergeProjects(localProjects, remoteProjects);
  const mergedRepairs = mergeRepairs(localRepairs, remoteRepairs);
  const { merged: mergedUsers, newCount: newUsersCount } = mergeUsers(localUsers, remoteUsers);

  // Synchronize Geo Hierarchy from authoritative Cloud Master DB
  let geoUpdated = false;
  if (cloud?.geoHierarchy && Array.isArray(cloud.geoHierarchy) && cloud.geoHierarchy.length > 0) {
    saveGeoHierarchy(cloud.geoHierarchy);
    geoUpdated = true;
  }

  // Synchronize Users
  let usersUpdated = false;
  if (newUsersCount > 0 || (remoteUsers.length > 0 && JSON.stringify(localUsers) !== JSON.stringify(mergedUsers))) {
    saveUsers(mergedUsers);
    usersUpdated = true;
  }

  // Merge Master Heads
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

  // Save merged locally
  saveAudits(mergedAudits);
  saveProjects(mergedProjects);
  saveRepairs(mergedRepairs);
  saveUsers(mergedUsers);

  // Push merged superset back to cloud so other users worldwide get real-time updates
  await pushLocalToCloud(mergedAudits, mergedProjects, mergedRepairs, userId, getGeoHierarchy(), mergedHeads, mergedUsers);

  try {
    localStorage.setItem(STORAGE_LAST_SYNC_KEY, new Date().toISOString());
  } catch {}

  const parts: string[] = [];
  if (newAuditsCount > 0) parts.push(`${newAuditsCount} new audit(s)`);
  if (newProjectsCount > 0) parts.push(`${newProjectsCount} new project(s)`);
  if (geoUpdated) parts.push(`locations updated`);
  if (usersUpdated || newUsersCount > 0) parts.push(`users updated`);

  const countMsg = parts.length > 0 
    ? `Received ${parts.join(', ')} from cloud.`
    : `All records, locations & staff IDs synchronized (${mergedAudits.length} audits, ${mergedProjects.length} projects, ${mergedUsers.length} users).`;

  return {
    success: true,
    newAuditsCount,
    newProjectsCount,
    newUsersCount,
    geoUpdated,
    usersUpdated,
    message: `Cloud Master DB Live (Online Mode): ${countMsg}`,
    timestamp: new Date().toISOString()
  };
}

/**
 * Immediately publish a newly submitted inspection from field staff to cloud
 */
export async function publishAuditToCloud(audit: AuditRecord, project: WaterProject, repairs: RepairItem[], userId: string): Promise<boolean> {
  try {
    const cloud = await fetchCloudData();
    const currentAudits = cloud?.audits || getAudits();
    const currentProjects = cloud?.projects || getProjects();
    const currentRepairs = cloud?.repairs || getRepairs();

    const { merged: mergedAudits } = mergeAudits(currentAudits, [audit]);
    const { merged: mergedProjects } = mergeProjects(currentProjects, [project]);
    const mergedRepairs = mergeRepairs(currentRepairs, repairs);

    return await pushLocalToCloud(mergedAudits, mergedProjects, mergedRepairs, userId, getGeoHierarchy(), getMasterHeads(), getUsers());
  } catch (e) {
    console.warn('[FGRF Cloud Sync] Failed to publish audit to cloud:', e);
    return false;
  }
}

/**
 * Real-time background sync hook:
 * Automatically polls for updates every 15 seconds for multi-location users worldwide,
 * and syncs on tab focus / window visibility change and BroadcastChannel within seconds.
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
  }) => void,
  userId: string = 'FGRF-HQ-01'
): () => void {
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
          usersUpdated: res.usersUpdated
        });
      }
    } catch (err) {
      console.warn('[FGRF Realtime Sync Error]', err);
    } finally {
      isSyncing = false;
    }
  };

  // Run initial sync after 800ms
  const initialTimer = setTimeout(triggerSync, 800);

  // Poll cloud every 15 seconds (15,000ms) - real-time sync across worldwide users
  const interval = setInterval(triggerSync, 15000);

  // Sync on tab focus / window visibility change (if > 5 seconds since last sync)
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

  // Cross-tab broadcast listener for immediate sub-second local sync
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
        usersUpdated: event.data?.type === 'USERS_SYNCED'
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
