/**
 * Faizan Global Relief Foundation (FGRF) - Water Projects Audit System
 * Central Real-Time Cloud Master Database Synchronization Engine
 * 
 * Enables multi-user real-time synchronization between Field Inspectors across Pakistan
 * and Super Admin / HQ Management via cloud persistence.
 * 
 * Author: Syed Waqas, Manager MIS (Data Management & ERP Department - FGRF)
 */

import { AuditRecord, WaterProject, RepairItem } from '../types/index.ts';
import { getAudits, getProjects, getRepairs, saveAudits, saveProjects, saveRepairs } from './storage.ts';

// Default global cloud relay endpoint for FGRF Water Projects Master Database
const DEFAULT_CLOUD_CONTAINER_ID = 'ff808181a09d98f701a1d9c2b0322914';
const DEFAULT_CLOUD_API = `https://api.restful-api.dev/objects/${DEFAULT_CLOUD_CONTAINER_ID}`;
const STORAGE_ENDPOINT_KEY = 'fgrf_cloud_sync_custom_endpoint';
const STORAGE_LAST_SYNC_KEY = 'fgrf_cloud_last_sync_timestamp';

// BroadcastChannel for instant cross-tab live synchronization
const syncBus = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('fgrf_master_sync_bus') 
  : null;

export interface CloudDatabasePayload {
  audits: AuditRecord[];
  projects: WaterProject[];
  repairs: RepairItem[];
  lastUpdated: string;
  updatedBy?: string;
}

export interface SyncResult {
  success: boolean;
  newAuditsCount: number;
  newProjectsCount: number;
  message: string;
  timestamp: string;
}

export function getCloudSyncEndpoint(): string {
  try {
    const custom = localStorage.getItem(STORAGE_ENDPOINT_KEY);
    if (custom && custom.trim().length > 0) return custom.trim();
  } catch {}
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
  const endpoint = getCloudSyncEndpoint();
  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      console.warn(`[FGRF Cloud Sync] Failed to fetch: status ${res.status}`);
      return null;
    }

    const json = await res.json();
    // Support restful-api.dev payload structure
    const data: CloudDatabasePayload = json.data || json;
    
    return {
      audits: Array.isArray(data.audits) ? data.audits : [],
      projects: Array.isArray(data.projects) ? data.projects : [],
      repairs: Array.isArray(data.repairs) ? data.repairs : [],
      lastUpdated: data.lastUpdated || new Date().toISOString(),
      updatedBy: data.updatedBy
    };
  } catch (err) {
    console.warn('[FGRF Cloud Sync] Network fetch error:', err);
    return null;
  }
}

/**
 * Push local master database records to Cloud
 */
export async function pushLocalToCloud(
  audits: AuditRecord[],
  projects: WaterProject[],
  repairs: RepairItem[],
  userId: string = 'FGRF-HQ-01'
): Promise<boolean> {
  const endpoint = getCloudSyncEndpoint();
  const payload: CloudDatabasePayload = {
    audits,
    projects,
    repairs,
    lastUpdated: new Date().toISOString(),
    updatedBy: userId
  };

  try {
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: 'FGRF_WATER_PROJECTS_MASTER_CLOUD_DB',
        data: payload
      })
    });

    if (res.ok) {
      try {
        localStorage.setItem(STORAGE_LAST_SYNC_KEY, new Date().toISOString());
      } catch {}

      // Notify other local tabs
      syncBus?.postMessage({ type: 'DATA_SYNCED', timestamp: new Date().toISOString() });
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[FGRF Cloud Sync] Error pushing to cloud:', err);
    return false;
  }
}

/**
 * Merge local and cloud audits & projects intelligently by ID & timestamp
 */
export function mergeAudits(local: AuditRecord[], remote: AuditRecord[]): { merged: AuditRecord[]; newCount: number } {
  const map = new Map<string, AuditRecord>();
  local.forEach((a) => map.set(a.id, a));

  let newCount = 0;
  remote.forEach((remoteAudit) => {
    if (!map.has(remoteAudit.id)) {
      map.set(remoteAudit.id, remoteAudit);
      newCount++;
    } else {
      // If remote has newer update, keep remote
      const localAudit = map.get(remoteAudit.id)!;
      const remoteTime = new Date(remoteAudit.updatedAt || remoteAudit.inspectionDateTime || 0).getTime();
      const localTime = new Date(localAudit.updatedAt || localAudit.inspectionDateTime || 0).getTime();
      if (remoteTime > localTime) {
        map.set(remoteAudit.id, remoteAudit);
      }
    }
  });

  return {
    merged: Array.from(map.values()),
    newCount
  };
}

export function mergeProjects(local: WaterProject[], remote: WaterProject[]): { merged: WaterProject[]; newCount: number } {
  const map = new Map<string, WaterProject>();
  local.forEach((p) => map.set(p.id, p));

  let newCount = 0;
  remote.forEach((remoteProj) => {
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
 * Full two-way synchronization:
 * 1. Downloads remote cloud data
 * 2. Merges with local data
 * 3. Uploads merged superset back to cloud so both sides are unified
 */
export async function syncAllWithCloud(userId: string = 'FGRF-HQ-01'): Promise<SyncResult> {
  const localAudits = getAudits();
  const localProjects = getProjects();
  const localRepairs = getRepairs();

  const cloud = await fetchCloudData();
  if (!cloud) {
    return {
      success: false,
      newAuditsCount: 0,
      newProjectsCount: 0,
      message: 'Cloud database unreachable. Local data preserved in offline mode.',
      timestamp: new Date().toISOString()
    };
  }

  // Merge records
  const { merged: mergedAudits, newCount: newAuditsCount } = mergeAudits(localAudits, cloud.audits);
  const { merged: mergedProjects, newCount: newProjectsCount } = mergeProjects(localProjects, cloud.projects);
  const mergedRepairs = mergeRepairs(localRepairs, cloud.repairs);

  // Save merged locally
  saveAudits(mergedAudits);
  saveProjects(mergedProjects);
  saveRepairs(mergedRepairs);

  // If local had records not in cloud, push merged back to cloud
  if (mergedAudits.length > cloud.audits.length || mergedProjects.length > cloud.projects.length || mergedRepairs.length > cloud.repairs.length) {
    await pushLocalToCloud(mergedAudits, mergedProjects, mergedRepairs, userId);
  } else {
    try {
      localStorage.setItem(STORAGE_LAST_SYNC_KEY, new Date().toISOString());
    } catch {}
  }

  return {
    success: true,
    newAuditsCount,
    newProjectsCount,
    message: `Synchronized successfully. ${newAuditsCount} new audit(s) and ${newProjectsCount} new project(s) updated.`,
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

    return await pushLocalToCloud(mergedAudits, mergedProjects, mergedRepairs, userId);
  } catch (e) {
    console.warn('[FGRF Cloud Sync] Failed to publish audit to cloud:', e);
    return false;
  }
}

/**
 * Real-time background sync hook:
 * Automatically polls for updates every 25 seconds and listens to BroadcastChannel
 */
export function startRealtimeCloudSync(
  onUpdate: (data: { audits: AuditRecord[]; projects: WaterProject[]; repairs: RepairItem[]; newCount: number }) => void,
  userId: string = 'FGRF-HQ-01'
): () => void {
  let isSyncing = false;

  const triggerSync = async () => {
    if (isSyncing) return;
    isSyncing = true;
    try {
      const res = await syncAllWithCloud(userId);
      if (res.success && (res.newAuditsCount > 0 || res.newProjectsCount > 0)) {
        onUpdate({
          audits: getAudits(),
          projects: getProjects(),
          repairs: getRepairs(),
          newCount: res.newAuditsCount
        });
      }
    } catch (err) {
      console.warn('[FGRF Realtime Sync Error]', err);
    } finally {
      isSyncing = false;
    }
  };

  // Run initial sync after 2 seconds
  const initialTimer = setTimeout(triggerSync, 2000);

  // Poll cloud every 25 seconds
  const interval = setInterval(triggerSync, 25000);

  // Listen to cross-tab updates
  const handleBusMessage = (e: MessageEvent) => {
    if (e.data?.type === 'DATA_SYNCED') {
      onUpdate({
        audits: getAudits(),
        projects: getProjects(),
        repairs: getRepairs(),
        newCount: 0
      });
    }
  };

  syncBus?.addEventListener('message', handleBusMessage);

  // Cleanup function
  return () => {
    clearTimeout(initialTimer);
    clearInterval(interval);
    syncBus?.removeEventListener('message', handleBusMessage);
  };
}
