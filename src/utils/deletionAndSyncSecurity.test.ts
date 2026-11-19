import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  mergeUsers, 
  mergeAudits, 
  mergeProjects, 
  mergeRepairs 
} from './cloudSync.ts';
import { 
  PRECONFIGURED_USERS,
  getDefaultRightsForRole 
} from './auditLogic.ts';
import {
  getDeletedUserIds,
  markUserAsDeleted,
  getDeletedAuditIds,
  markAuditAsDeleted,
  getDeletedProjectIds,
  markProjectAsDeleted,
  getDeletedRepairIds,
  markRepairAsDeleted,
  deleteUser,
  deleteProject,
  deleteAudit,
  getUsers,
  DEFAULT_BANNED_USER_IDS
} from './storage.ts';
import { UserProfile, AuditRecord, WaterProject, RepairItem } from '../types/index.ts';

test('PRECONFIGURED_USERS only contains official Super Admin accounts (Syed Waqas)', () => {
  assert.equal(PRECONFIGURED_USERS.length, 2);
  const ids = PRECONFIGURED_USERS.map((u) => u.id);
  assert.ok(ids.includes('FGRF-MIS-01'));
  assert.ok(ids.includes('42101-1234567-1'));
  assert.equal(PRECONFIGURED_USERS.some((u) => u.id === 'FGRF-HQ-01'), false);
  assert.equal(PRECONFIGURED_USERS.some((u) => u.id === 'FGRF-INS-101'), false);
});

test('DEFAULT_BANNED_USER_IDS contains all legacy demo user accounts', () => {
  const banned = getDeletedUserIds();
  for (const demoId of DEFAULT_BANNED_USER_IDS) {
    assert.ok(banned.includes(demoId.toUpperCase()), `Expected ${demoId} to be banned`);
  }
});

test('deleteUser blocks non-super_admin actors', () => {
  const res = deleteUser('CUSTOM-USER-01', 'field_inspector');
  assert.equal(res.success, false);
  assert.match(res.error || '', /Access Denied/i);
});

test('deleteUser protects official Super Admin accounts from deletion', () => {
  const res1 = deleteUser('FGRF-MIS-01', 'super_admin');
  assert.equal(res1.success, false);
  assert.match(res1.error || '', /Cannot delete the primary Super Administrator/i);

  const res2 = deleteUser('42101-1234567-1', 'super_admin');
  assert.equal(res2.success, false);
  assert.match(res2.error || '', /Cannot delete the primary Super Administrator/i);
});

test('deleteUser marks user in tombstone registry and removes locally', () => {
  const testUserId = 'FGRF-TEST-STAFF-99';
  const res = deleteUser(testUserId, 'super_admin');
  assert.equal(res.success, true);
  assert.ok(getDeletedUserIds().includes(testUserId));
  assert.equal(getUsers().some((u) => u.id === testUserId), false);
});

test('mergeUsers strictly rejects deleted user IDs and never resurrects them', () => {
  const deletedId = 'FGRF-RESURRECT-TEST';
  markUserAsDeleted(deletedId);

  const local: UserProfile[] = [];
  const remote: UserProfile[] = [
    {
      id: deletedId,
      name: 'Resurrection Ghost User',
      role: 'field_inspector',
      designation: 'Ghost Inspector',
      email: 'ghost@fgrf.org',
      phone: '+92 300 0000000',
      status: 'active',
      rights: getDefaultRightsForRole('field_inspector'),
    },
    {
      id: 'FGRF-LEGIT-USER-01',
      name: 'Legit Inspector',
      role: 'field_inspector',
      designation: 'Legit Inspector',
      email: 'legit@fgrf.org',
      phone: '+92 300 1111111',
      status: 'active',
      rights: getDefaultRightsForRole('field_inspector'),
    }
  ];

  const { merged } = mergeUsers(local, remote);
  assert.equal(merged.some((u) => u.id === deletedId), false, 'Deleted user must NOT be recovered');
  assert.ok(merged.some((u) => u.id === 'FGRF-LEGIT-USER-01'), 'Valid remote user should be merged');
});

test('mergeAudits and mergeProjects strictly reject deleted IDs', () => {
  const deletedAuditId = 'AUD-TEST-DELETE-99';
  const deletedProjId = 'PRJ-TEST-DELETE-99';
  markAuditAsDeleted(deletedAuditId);
  markProjectAsDeleted(deletedProjId);

  const remoteAudits: any[] = [{ id: deletedAuditId, projectId: 'P1' }];
  const { merged: mergedAudits } = mergeAudits([], remoteAudits);
  assert.equal(mergedAudits.some((a) => a.id === deletedAuditId), false);

  const remoteProjects: any[] = [{ id: deletedProjId, name: 'Deleted Project' }];
  const { merged: mergedProjects } = mergeProjects([], remoteProjects);
  assert.equal(mergedProjects.some((p) => p.id === deletedProjId), false);
});

test('deleteAudit and deleteProject block non-super_admin users', () => {
  assert.throws(() => {
    deleteAudit('AUD-TEST', 'field_inspector');
  }, /Access Denied/i);

  assert.throws(() => {
    deleteProject('PRJ-TEST', 'provincial_coord');
  }, /Access Denied/i);
});
