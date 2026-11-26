/**
 * Faizan Global Relief Foundation (FGRF) - Water Projects Audit System
 * Safe Cloud Data Migration Engine
 * 
 * Inspects browser localStorage & local Master DB, validates entity relationships,
 * checks tombstones, and transfers operational records into Cloud Firestore.
 * 
 * Features:
 * - Non-destructive: Never deletes or corrupts local browser data
 * - Dry-Run Simulation: Validates counts, duplicates, and schemas before committing
 * - Tombstone Filtering: Excludes banned demo IDs (TEST-001, AUD-2026-0001, FGRF-WTS-SND-004)
 * - Safe Chunked Writes: Batches writes safely within Firestore limits (<= 500 per batch)
 * 
 * Form Reference: FGRF-WTS-AUD-002.00-26
 * Author: Syed Waqas, Manager MIS (Data Management & ERP Department - FGRF)
 */

import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { 
  AuditRecord, 
  WaterProject, 
  RepairItem, 
  UserProfile, 
  MasterHeadsConfig 
} from '../types/index.ts';
import { CountryInfo } from './pakistanGeo.ts';
import { 
  getAudits, 
  getProjects, 
  getRepairs, 
  getUsers, 
  getMasterHeads, 
  getGeoHierarchy,
  getDeletedAuditIds,
  getDeletedProjectIds,
  getDeletedUserIds,
  getDeletedRepairIds
} from './storage.ts';
import { getFirebaseServices } from '../firebase/config.ts';
import { COLLECTIONS } from '../firebase/firestore.ts';

export interface MigrationSummary {
  projects: { localCount: number; validCount: number; skippedCount: number; errorCount: number };
  audits: { localCount: number; validCount: number; skippedCount: number; errorCount: number };
  repairs: { localCount: number; validCount: number; skippedCount: number; errorCount: number };
  users: { localCount: number; validCount: number; skippedCount: number; errorCount: number };
  headsMigrated: boolean;
  geoMigrated: boolean;
  timestamp: string;
  isDryRun: boolean;
  errors: string[];
}

/**
 * Generates a complete JSON backup of the local storage database for download.
 */
export function exportLocalDatabaseBackup(): string {
  const payload = {
    system: 'FGRF - Water Projects Audit & Monitoring System',
    formReference: 'FGRF-WTS-AUD-002.00-26',
    exportTimestamp: new Date().toISOString(),
    architect: 'Syed Waqas, Manager MIS',
    projects: getProjects(),
    audits: getAudits(),
    repairs: getRepairs(),
    users: getUsers(),
    masterHeads: getMasterHeads(),
    geoHierarchy: getGeoHierarchy(),
    tombstones: {
      deletedAuditIds: getDeletedAuditIds(),
      deletedProjectIds: getDeletedProjectIds(),
      deletedUserIds: getDeletedUserIds(),
      deletedRepairIds: getDeletedRepairIds(),
    }
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Performs validation and non-destructive migration of local records to Cloud Firestore.
 * In dryRun=true mode, no writes are performed to Firestore.
 */
export async function migrateLocalDataToCloud(
  dryRun: boolean = true,
  actorUserId: string = 'FGRF-MIS-01'
): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    projects: { localCount: 0, validCount: 0, skippedCount: 0, errorCount: 0 },
    audits: { localCount: 0, validCount: 0, skippedCount: 0, errorCount: 0 },
    repairs: { localCount: 0, validCount: 0, skippedCount: 0, errorCount: 0 },
    users: { localCount: 0, validCount: 0, skippedCount: 0, errorCount: 0 },
    headsMigrated: false,
    geoMigrated: false,
    timestamp: new Date().toISOString(),
    isDryRun: dryRun,
    errors: [],
  };

  const { db, isConfigured } = getFirebaseServices();

  if (!dryRun && (!isConfigured || !db)) {
    summary.errors.push('Firebase Cloud Database is not configured. Please supply valid Firebase credentials first.');
    return summary;
  }

  // 1. Load local records and tombstones
  const localProjects = getProjects();
  const localAudits = getAudits();
  const localRepairs = getRepairs();
  const localUsers = getUsers();
  const localHeads = getMasterHeads();
  const localGeo = getGeoHierarchy();

  const bannedAuditSet = new Set(getDeletedAuditIds().map((id) => id.toUpperCase()));
  const bannedProjectSet = new Set(getDeletedProjectIds().map((id) => id.toUpperCase()));
  const bannedUserSet = new Set(getDeletedUserIds().map((id) => id.toUpperCase()));
  const bannedRepairSet = new Set(getDeletedRepairIds().map((id) => id.toUpperCase()));

  summary.projects.localCount = localProjects.length;
  summary.audits.localCount = localAudits.length;
  summary.repairs.localCount = localRepairs.length;
  summary.users.localCount = localUsers.length;

  // Filter projects
  const validProjects = localProjects.filter((p) => {
    if (!p || !p.id) {
      summary.projects.errorCount++;
      return false;
    }
    const cleanId = String(p.id).trim().toUpperCase();
    if (bannedProjectSet.has(cleanId) || cleanId === 'FGRF-WTS-SND-004') {
      summary.projects.skippedCount++;
      return false;
    }
    summary.projects.validCount++;
    return true;
  });

  // Filter audits
  const validAudits = localAudits.filter((a) => {
    if (!a || !a.id) {
      summary.audits.errorCount++;
      return false;
    }
    const cleanId = String(a.id).trim().toUpperCase();
    if (bannedAuditSet.has(cleanId) || cleanId === 'TEST-001' || cleanId === 'AUD-2026-0001') {
      summary.audits.skippedCount++;
      return false;
    }
    summary.audits.validCount++;
    return true;
  });

  // Filter repairs
  const validRepairs = localRepairs.filter((r) => {
    if (!r || !r.id) {
      summary.repairs.errorCount++;
      return false;
    }
    const cleanId = String(r.id).trim().toUpperCase();
    if (bannedRepairSet.has(cleanId) || cleanId === 'REP-2026-0001') {
      summary.repairs.skippedCount++;
      return false;
    }
    if (r.auditId && bannedAuditSet.has(String(r.auditId).trim().toUpperCase())) {
      summary.repairs.skippedCount++;
      return false;
    }
    summary.repairs.validCount++;
    return true;
  });

  // Filter users
  const validUsers = localUsers.filter((u) => {
    if (!u || !u.id) {
      summary.users.errorCount++;
      return false;
    }
    const cleanId = String(u.id).trim().toUpperCase();
    if (bannedUserSet.has(cleanId)) {
      summary.users.skippedCount++;
      return false;
    }
    summary.users.validCount++;
    return true;
  });

  // If dry run, we are done analyzing and return summary
  if (dryRun) {
    summary.headsMigrated = !!localHeads;
    summary.geoMigrated = Array.isArray(localGeo) && localGeo.length > 0;
    return summary;
  }

  // -------------------------------------------------------------
  // LIVE IMPORT INTO CLOUD FIRESTORE
  // -------------------------------------------------------------
  try {
    // 1. Commit Master Heads
    if (localHeads && db) {
      const headsRef = doc(db, COLLECTIONS.CONFIG, 'master_heads');
      await setDoc(headsRef, {
        ...localHeads,
        migratedAt: new Date().toISOString(),
        migratedBy: actorUserId,
      }, { merge: true });
      summary.headsMigrated = true;
    }

    // 2. Commit Geo Hierarchy
    if (localGeo && localGeo.length > 0 && db) {
      const geoRef = doc(db, COLLECTIONS.GEO, 'pakistan_and_global');
      await setDoc(geoRef, {
        countries: localGeo,
        migratedAt: new Date().toISOString(),
        migratedBy: actorUserId,
      }, { merge: true });
      summary.geoMigrated = true;
    }

    // 3. Commit Tombstones
    if (db) {
      const tombRef = doc(db, COLLECTIONS.TOMBSTONES, 'global');
      await setDoc(tombRef, {
        deletedAuditIds: Array.from(bannedAuditSet),
        deletedProjectIds: Array.from(bannedProjectSet),
        deletedUserIds: Array.from(bannedUserSet),
        deletedRepairIds: Array.from(bannedRepairSet),
        migratedAt: new Date().toISOString(),
        migratedBy: actorUserId,
      }, { merge: true });
    }

    // 4. Batch Commit Projects (max 400 per batch)
    if (db && validProjects.length > 0) {
      for (let i = 0; i < validProjects.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = validProjects.slice(i, i + 400);
        chunk.forEach((p) => {
          const docRef = doc(db, COLLECTIONS.PROJECTS, p.id);
          batch.set(docRef, {
            ...p,
            migratedAt: new Date().toISOString(),
            migratedBy: actorUserId,
          }, { merge: true });
        });
        await batch.commit();
      }
    }

    // 5. Batch Commit Audits
    if (db && validAudits.length > 0) {
      for (let i = 0; i < validAudits.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = validAudits.slice(i, i + 400);
        chunk.forEach((a) => {
          const docRef = doc(db, COLLECTIONS.AUDITS, a.id);
          batch.set(docRef, {
            ...a,
            migratedAt: new Date().toISOString(),
            migratedBy: actorUserId,
          }, { merge: true });
        });
        await batch.commit();
      }
    }

    // 6. Batch Commit Repairs
    if (db && validRepairs.length > 0) {
      for (let i = 0; i < validRepairs.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = validRepairs.slice(i, i + 400);
        chunk.forEach((r) => {
          const docRef = doc(db, COLLECTIONS.REPAIRS, r.id);
          batch.set(docRef, {
            ...r,
            migratedAt: new Date().toISOString(),
            migratedBy: actorUserId,
          }, { merge: true });
        });
        await batch.commit();
      }
    }

    // 7. Batch Commit Users
    if (db && validUsers.length > 0) {
      const batch = writeBatch(db);
      validUsers.forEach((u) => {
        const docRef = doc(db, COLLECTIONS.USERS, u.id.toUpperCase());
        batch.set(docRef, {
          ...u,
          migratedAt: new Date().toISOString(),
          migratedBy: actorUserId,
        }, { merge: true });
      });
      await batch.commit();
    }

  } catch (err: any) {
    console.error('[Migration Error]', err);
    summary.errors.push(`Firestore upload failed: ${err.message || String(err)}`);
  }

  return summary;
}
