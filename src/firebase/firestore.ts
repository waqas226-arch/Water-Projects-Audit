/**
 * Faizan Global Relief Foundation (FGRF) - Water Projects Audit System
 * Cloud Firestore Real-Time Database Service
 * 
 * Manages live WebSocket subscriptions (onSnapshot), atomic CRUD operations,
 * conflict resolution, and tombstone tracking across all organizational records.
 * 
 * Form Reference: FGRF-WTS-AUD-002.00-26
 * Author: Syed Waqas, Manager MIS (Data Management & ERP Department - FGRF)
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  query,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { 
  AuditRecord, 
  MasterHeadsConfig, 
  RepairItem, 
  UserProfile, 
  WaterProject,
  UserActivityLog
} from '../types/index.ts';
import { CountryInfo } from '../utils/pakistanGeo.ts';
import { getFirebaseServices } from './config.ts';

// -------------------------------------------------------------
// COLLECTION REFERENCES
// -------------------------------------------------------------
export const COLLECTIONS = {
  CONFIG: 'config',
  GEO: 'geo_hierarchy',
  PROJECTS: 'water_projects',
  AUDITS: 'audits',
  REPAIRS: 'repairs',
  USERS: 'users',
  USER_ROLES: 'user_roles',
  TOMBSTONES: 'tombstones',
  LOGS: 'activity_logs',
  NOTIFICATIONS: 'notifications',
};

// -------------------------------------------------------------
// REAL-TIME FIRESTORE LISTENERS (WebSocket Push)
// -------------------------------------------------------------

export interface RealtimeSubscriptionHandlers {
  onProjects?: (projects: WaterProject[]) => void;
  onAudits?: (audits: AuditRecord[]) => void;
  onRepairs?: (repairs: RepairItem[]) => void;
  onMasterHeads?: (heads: MasterHeadsConfig) => void;
  onGeoHierarchy?: (geo: CountryInfo[]) => void;
  onUsers?: (users: UserProfile[]) => void;
  onTombstones?: (tombstones: {
    deletedAuditIds: string[];
    deletedProjectIds: string[];
    deletedUserIds: string[];
    deletedRepairIds: string[];
  }) => void;
  onError?: (err: any) => void;
}

/**
 * Subscribes to real-time Cloud Firestore updates for all entities.
 * Automatically synchronizes changes from any computer in the world within milliseconds.
 */
export function subscribeToRealtimeFirestore(
  handlers: RealtimeSubscriptionHandlers
): () => void {
  const { db, isConfigured } = getFirebaseServices();
  if (!isConfigured || !db) {
    return () => {};
  }

  const unsubscribes: Array<() => void> = [];

  try {
    // 1. Water Projects Real-time Listener
    if (handlers.onProjects) {
      const projRef = collection(db, COLLECTIONS.PROJECTS);
      const unsubProj = onSnapshot(projRef, (snapshot) => {
        const list: WaterProject[] = [];
        snapshot.forEach((d) => {
          if (d.exists()) {
            const data = d.data() as WaterProject;
            if (data && data.id && String(data.id).toUpperCase() !== 'FGRF-WTS-SND-004') {
              list.push(data);
            }
          }
        });
        handlers.onProjects!(list);
      }, (err) => handlers.onError?.(err));
      unsubscribes.push(unsubProj);
    }

    // 2. Audits (Field Inspections) Real-time Listener
    if (handlers.onAudits) {
      const auditsRef = collection(db, COLLECTIONS.AUDITS);
      const unsubAudits = onSnapshot(auditsRef, (snapshot) => {
        const list: AuditRecord[] = [];
        snapshot.forEach((d) => {
          if (d.exists()) {
            const data = d.data() as AuditRecord;
            if (data && data.id && data.id !== 'TEST-001' && data.id !== 'AUD-2026-0001') {
              list.push(data);
            }
          }
        });
        handlers.onAudits!(list);
      }, (err) => handlers.onError?.(err));
      unsubscribes.push(unsubAudits);
    }

    // 3. Repairs Real-time Listener
    if (handlers.onRepairs) {
      const repairsRef = collection(db, COLLECTIONS.REPAIRS);
      const unsubRepairs = onSnapshot(repairsRef, (snapshot) => {
        const list: RepairItem[] = [];
        snapshot.forEach((d) => {
          if (d.exists()) {
            const data = d.data() as RepairItem;
            if (data && data.id && data.id !== 'REP-2026-0001') {
              list.push(data);
            }
          }
        });
        handlers.onRepairs!(list);
      }, (err) => handlers.onError?.(err));
      unsubscribes.push(unsubRepairs);
    }

    // 4. Master Heads Configuration Real-time Listener
    if (handlers.onMasterHeads) {
      const headsDocRef = doc(db, COLLECTIONS.CONFIG, 'master_heads');
      const unsubHeads = onSnapshot(headsDocRef, (docSnap) => {
        if (docSnap.exists()) {
          handlers.onMasterHeads!(docSnap.data() as MasterHeadsConfig);
        }
      }, (err) => handlers.onError?.(err));
      unsubscribes.push(unsubHeads);
    }

    // 5. Geographical Hierarchy Real-time Listener
    if (handlers.onGeoHierarchy) {
      const geoDocRef = doc(db, COLLECTIONS.GEO, 'pakistan_and_global');
      const unsubGeo = onSnapshot(geoDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data?.countries)) {
            handlers.onGeoHierarchy!(data.countries as CountryInfo[]);
          }
        }
      }, (err) => handlers.onError?.(err));
      unsubscribes.push(unsubGeo);
    }

    // 6. Users & Access Rights Real-time Listener
    if (handlers.onUsers) {
      const usersRef = collection(db, COLLECTIONS.USERS);
      const unsubUsers = onSnapshot(usersRef, (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((d) => {
          if (d.exists()) {
            list.push(d.data() as UserProfile);
          }
        });
        handlers.onUsers!(list);
      }, (err) => handlers.onError?.(err));
      unsubscribes.push(unsubUsers);
    }

    // 7. Tombstones (Deleted Records Registry) Real-time Listener
    if (handlers.onTombstones) {
      const tombDocRef = doc(db, COLLECTIONS.TOMBSTONES, 'global');
      const unsubTomb = onSnapshot(tombDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          handlers.onTombstones!({
            deletedAuditIds: data?.deletedAuditIds || [],
            deletedProjectIds: data?.deletedProjectIds || [],
            deletedUserIds: data?.deletedUserIds || [],
            deletedRepairIds: data?.deletedRepairIds || [],
          });
        }
      }, (err) => handlers.onError?.(err));
      unsubscribes.push(unsubTomb);
    }

  } catch (err) {
    handlers.onError?.(err);
  }

  // Cleanup unsubscriber function
  return () => {
    unsubscribes.forEach((unsub) => {
      try {
        unsub();
      } catch {}
    });
  };
}

// -------------------------------------------------------------
// FIRESTORE CRUD OPERATIONS
// -------------------------------------------------------------

/**
 * Saves a Water Project to Cloud Firestore.
 */
export async function saveProjectToFirestore(
  project: WaterProject, 
  userId: string = 'FGRF-MIS-01'
): Promise<boolean> {
  const { db, isConfigured } = getFirebaseServices();
  if (!isConfigured || !db) return false;

  try {
    const docRef = doc(db, COLLECTIONS.PROJECTS, project.id);
    await setDoc(docRef, {
      ...project,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firestore] Error saving project:', err);
    return false;
  }
}

/**
 * Permanently deletes a Water Project and records tombstone in Firestore.
 */
export async function deleteProjectFromFirestore(
  projectId: string, 
  userId: string = 'FGRF-MIS-01'
): Promise<boolean> {
  const { db, isConfigured } = getFirebaseServices();
  if (!isConfigured || !db) return false;

  const cleanId = projectId.trim().toUpperCase();

  try {
    const batch = writeBatch(db);

    // 1. Delete project document
    const projRef = doc(db, COLLECTIONS.PROJECTS, cleanId);
    batch.delete(projRef);

    // 2. Add to tombstones
    const tombRef = doc(db, COLLECTIONS.TOMBSTONES, 'global');
    const tombSnap = await getDoc(tombRef);
    const existing = tombSnap.exists() ? (tombSnap.data()?.deletedProjectIds || []) : [];
    const updatedTombstones = Array.from(new Set([...existing, cleanId]));

    batch.set(tombRef, {
      deletedProjectIds: updatedTombstones,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    }, { merge: true });

    await batch.commit();
    return true;
  } catch (err) {
    console.error('[Firestore] Error deleting project:', err);
    return false;
  }
}

/**
 * Submits a Field Inspection Audit Form to Cloud Firestore.
 * Atomically updates audit record, associated project condition, and repair work orders.
 */
export async function submitAuditToFirestore(
  audit: AuditRecord,
  project: WaterProject,
  repairs: RepairItem[] = [],
  userId: string = 'FGRF-MIS-01'
): Promise<boolean> {
  const { db, isConfigured } = getFirebaseServices();
  if (!isConfigured || !db) return false;

  try {
    const batch = writeBatch(db);

    // 1. Audit document
    const auditRef = doc(db, COLLECTIONS.AUDITS, audit.id);
    batch.set(auditRef, {
      ...audit,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    }, { merge: true });

    // 2. Project document (updated condition and inspection count)
    const projRef = doc(db, COLLECTIONS.PROJECTS, project.id);
    batch.set(projRef, {
      ...project,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    }, { merge: true });

    // 3. Repair items
    for (const repair of repairs) {
      if (repair && repair.id) {
        const repairRef = doc(db, COLLECTIONS.REPAIRS, repair.id);
        batch.set(repairRef, {
          ...repair,
          updatedAt: new Date().toISOString(),
          updatedBy: userId,
        }, { merge: true });
      }
    }

    await batch.commit();
    return true;
  } catch (err) {
    console.error('[Firestore] Error submitting audit:', err);
    return false;
  }
}

/**
 * Permanently deletes an Audit Record and records tombstone in Firestore.
 */
export async function deleteAuditFromFirestore(
  auditId: string,
  userId: string = 'FGRF-MIS-01'
): Promise<boolean> {
  const { db, isConfigured } = getFirebaseServices();
  if (!isConfigured || !db) return false;

  const cleanId = auditId.trim().toUpperCase();

  try {
    const batch = writeBatch(db);

    // 1. Delete audit document
    const auditRef = doc(db, COLLECTIONS.AUDITS, cleanId);
    batch.delete(auditRef);

    // 2. Add to tombstones
    const tombRef = doc(db, COLLECTIONS.TOMBSTONES, 'global');
    const tombSnap = await getDoc(tombRef);
    const existing = tombSnap.exists() ? (tombSnap.data()?.deletedAuditIds || []) : [];
    const updatedTombstones = Array.from(new Set([...existing, cleanId]));

    batch.set(tombRef, {
      deletedAuditIds: updatedTombstones,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    }, { merge: true });

    await batch.commit();
    return true;
  } catch (err) {
    console.error('[Firestore] Error deleting audit:', err);
    return false;
  }
}

/**
 * Updates a Repair Item in Cloud Firestore.
 */
export async function updateRepairInFirestore(
  repair: RepairItem,
  userId: string = 'FGRF-MIS-01'
): Promise<boolean> {
  const { db, isConfigured } = getFirebaseServices();
  if (!isConfigured || !db) return false;

  try {
    const repairRef = doc(db, COLLECTIONS.REPAIRS, repair.id);
    await setDoc(repairRef, {
      ...repair,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firestore] Error updating repair:', err);
    return false;
  }
}

/**
 * Saves Master Heads Configuration (Open Heads) to Cloud Firestore.
 */
export async function saveMasterHeadsToFirestore(
  heads: MasterHeadsConfig,
  userId: string = 'FGRF-MIS-01'
): Promise<boolean> {
  const { db, isConfigured } = getFirebaseServices();
  if (!isConfigured || !db) return false;

  try {
    const headsRef = doc(db, COLLECTIONS.CONFIG, 'master_heads');
    await setDoc(headsRef, {
      ...heads,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firestore] Error saving master heads:', err);
    return false;
  }
}

/**
 * Saves Geographical Hierarchy (Divisions, Districts, Tehsils) to Cloud Firestore.
 */
export async function saveGeoHierarchyToFirestore(
  geo: CountryInfo[],
  userId: string = 'FGRF-MIS-01'
): Promise<boolean> {
  const { db, isConfigured } = getFirebaseServices();
  if (!isConfigured || !db) return false;

  try {
    const geoRef = doc(db, COLLECTIONS.GEO, 'pakistan_and_global');
    await setDoc(geoRef, {
      countries: geo,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firestore] Error saving geo hierarchy:', err);
    return false;
  }
}

/**
 * Saves or updates a User Profile in Cloud Firestore.
 */
export async function saveUserToFirestore(
  user: UserProfile,
  userId: string = 'FGRF-MIS-01'
): Promise<boolean> {
  const { db, isConfigured } = getFirebaseServices();
  if (!isConfigured || !db) return false;

  try {
    const userRef = doc(db, COLLECTIONS.USERS, user.id.toUpperCase());
    await setDoc(userRef, {
      ...user,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firestore] Error saving user:', err);
    return false;
  }
}

/**
 * Permanently deletes a User Profile and records tombstone in Firestore.
 */
export async function deleteUserFromFirestore(
  userIdToDelete: string,
  actorUserId: string = 'FGRF-MIS-01'
): Promise<boolean> {
  const { db, isConfigured } = getFirebaseServices();
  if (!isConfigured || !db) return false;

  const cleanId = userIdToDelete.trim().toUpperCase();

  try {
    const batch = writeBatch(db);

    // 1. Delete user document
    const userRef = doc(db, COLLECTIONS.USERS, cleanId);
    batch.delete(userRef);

    // 2. Add to tombstones
    const tombRef = doc(db, COLLECTIONS.TOMBSTONES, 'global');
    const tombSnap = await getDoc(tombRef);
    const existing = tombSnap.exists() ? (tombSnap.data()?.deletedUserIds || []) : [];
    const updatedTombstones = Array.from(new Set([...existing, cleanId]));

    batch.set(tombRef, {
      deletedUserIds: updatedTombstones,
      updatedAt: new Date().toISOString(),
      updatedBy: actorUserId,
    }, { merge: true });

    await batch.commit();
    return true;
  } catch (err) {
    console.error('[Firestore] Error deleting user:', err);
    return false;
  }
}

/**
 * Appends a tamper-proof audit log entry to Cloud Firestore.
 */
export async function logActivityToFirestore(
  log: UserActivityLog
): Promise<boolean> {
  const { db, isConfigured } = getFirebaseServices();
  if (!isConfigured || !db) return false;

  try {
    const logRef = doc(db, COLLECTIONS.LOGS, log.id);
    await setDoc(logRef, log);
    return true;
  } catch {
    return false;
  }
}

/**
 * One-time fetch of all collections from Cloud Firestore.
 */
export async function fetchAllCollectionsFromFirestore(): Promise<{
  projects: WaterProject[];
  audits: AuditRecord[];
  repairs: RepairItem[];
  heads?: MasterHeadsConfig;
  geo?: CountryInfo[];
  users?: UserProfile[];
  tombstones?: {
    deletedAuditIds: string[];
    deletedProjectIds: string[];
    deletedUserIds: string[];
    deletedRepairIds: string[];
  };
} | null> {
  const { db, isConfigured } = getFirebaseServices();
  if (!isConfigured || !db) return null;

  try {
    // 1. Projects
    const projSnap = await getDocs(collection(db, COLLECTIONS.PROJECTS));
    const projects: WaterProject[] = [];
    projSnap.forEach((d) => projects.push(d.data() as WaterProject));

    // 2. Audits
    const auditSnap = await getDocs(collection(db, COLLECTIONS.AUDITS));
    const audits: AuditRecord[] = [];
    auditSnap.forEach((d) => audits.push(d.data() as AuditRecord));

    // 3. Repairs
    const repSnap = await getDocs(collection(db, COLLECTIONS.REPAIRS));
    const repairs: RepairItem[] = [];
    repSnap.forEach((d) => repairs.push(d.data() as RepairItem));

    // 4. Master Heads
    const headsSnap = await getDoc(doc(db, COLLECTIONS.CONFIG, 'master_heads'));
    const heads = headsSnap.exists() ? (headsSnap.data() as MasterHeadsConfig) : undefined;

    // 5. Geo
    const geoSnap = await getDoc(doc(db, COLLECTIONS.GEO, 'pakistan_and_global'));
    const geo = geoSnap.exists() ? (geoSnap.data()?.countries as CountryInfo[]) : undefined;

    // 6. Users
    const usersSnap = await getDocs(collection(db, COLLECTIONS.USERS));
    const users: UserProfile[] = [];
    usersSnap.forEach((d) => users.push(d.data() as UserProfile));

    // 7. Tombstones
    const tombSnap = await getDoc(doc(db, COLLECTIONS.TOMBSTONES, 'global'));
    const tombstones = tombSnap.exists() ? (tombSnap.data() as any) : undefined;

    return { projects, audits, repairs, heads, geo, users, tombstones };
  } catch (err) {
    console.error('[Firestore] Error fetching all collections:', err);
    return null;
  }
}
