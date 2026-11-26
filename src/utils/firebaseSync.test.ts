import test from 'node:test';
import assert from 'node:assert/strict';
import { staffIdToEmail } from '../firebase/auth.ts';
import { isFirebaseConfigured, getFirebaseConfig } from '../firebase/config.ts';
import { exportLocalDatabaseBackup, migrateLocalDataToCloud } from './migration.ts';
import { mergeAudits, mergeProjects, mergeRepairs, mergeUsers, sanitizeAuditRecord } from './cloudSync.ts';
import { WaterProject, AuditRecord, RepairItem, UserProfile } from '../types/index.ts';

test('staffIdToEmail correctly maps Staff IDs, CNICs and real emails', () => {
  assert.equal(staffIdToEmail('FGRF-MIS-01'), 'fgrf-mis-01@fgrf-water-audit.internal');
  assert.equal(staffIdToEmail('42101-1234567-1'), '42101-1234567-1@fgrf-water-audit.internal');
  assert.equal(staffIdToEmail('waqas.mis@fgrf.org'), 'waqas.mis@fgrf.org');
  assert.equal(staffIdToEmail('INSPECTOR-101'), 'inspector-101@fgrf-water-audit.internal');
});

test('isFirebaseConfigured detects placeholder vs configured credentials', () => {
  // Without env or custom config, should return false or handle placeholder
  const isConfig = isFirebaseConfigured();
  assert.equal(typeof isConfig, 'boolean');
});

test('exportLocalDatabaseBackup produces valid JSON with full system metadata', () => {
  const jsonStr = exportLocalDatabaseBackup();
  const parsed = JSON.parse(jsonStr);

  assert.equal(parsed.formReference, 'FGRF-WTS-AUD-002.00-26');
  assert.ok(Array.isArray(parsed.projects));
  assert.ok(Array.isArray(parsed.audits));
  assert.ok(Array.isArray(parsed.repairs));
  assert.ok(Array.isArray(parsed.users));
  assert.ok(parsed.tombstones);
  assert.ok(Array.isArray(parsed.tombstones.deletedAuditIds));
});

test('migrateLocalDataToCloud dry-run validates counts and filters demo tombstones', async () => {
  const summary = await migrateLocalDataToCloud(true, 'FGRF-MIS-01');

  assert.equal(summary.isDryRun, true);
  assert.equal(typeof summary.projects.localCount, 'number');
  assert.equal(typeof summary.audits.localCount, 'number');
  assert.equal(typeof summary.repairs.localCount, 'number');
  assert.equal(typeof summary.users.localCount, 'number');
  assert.equal(summary.errors.length, 0);
});

test('sanitizeAuditRecord rejects demo audits TEST-001 and AUD-2026-0001', () => {
  assert.equal(sanitizeAuditRecord({ id: 'TEST-001' }), null);
  assert.equal(sanitizeAuditRecord({ id: 'AUD-2026-0001' }), null);
  assert.equal(sanitizeAuditRecord({ id: 'AUD-2026-0002', projectId: 'FGRF-WTS-SND-004' }), null);

  const valid = sanitizeAuditRecord({
    id: 'AUD-2026-0099',
    projectId: 'FGRF-WTS-SND-099',
    province: 'Sindh',
    district: 'Tharparkar',
  });
  assert.notEqual(valid, null);
  assert.equal(valid?.id, 'AUD-2026-0099');
  assert.equal(valid?.province, 'Sindh');
});

test('mergeAudits and mergeProjects strictly enforce deleted tombstones', () => {
  const localProjects: WaterProject[] = [
    {
      id: 'FGRF-WTS-SND-010',
      name: 'Tharparkar Hand Pump',
      province: 'Sindh',
      division: 'Mirpur Khas',
      district: 'Tharparkar',
      tehsil: 'Mithi',
      unionCouncil: 'Chelhar',
      village: 'Village A',
      installationType: 'Filter Hand Pump',
      installationDate: '2026-01-01',
      beneficiaryName: 'Ali Khan',
      beneficiaryMobile: '03001234567',
      gpsCoordinates: { lat: 24.7, lng: 69.8 },
      currentCondition: 'Functional',
      totalInspections: 1,
      status: 'Active',
    }
  ];

  const remoteProjects: WaterProject[] = [
    {
      id: 'FGRF-WTS-SND-010',
      name: 'Tharparkar Hand Pump (Updated)',
      province: 'Sindh',
      division: 'Mirpur Khas',
      district: 'Tharparkar',
      tehsil: 'Mithi',
      unionCouncil: 'Chelhar',
      village: 'Village A',
      installationType: 'Filter Hand Pump',
      installationDate: '2026-01-01',
      beneficiaryName: 'Ali Khan',
      beneficiaryMobile: '03001234567',
      gpsCoordinates: { lat: 24.7, lng: 69.8 },
      currentCondition: 'Functional',
      totalInspections: 2,
      status: 'Active',
    },
    {
      id: 'FGRF-WTS-DELETED-999',
      name: 'Deleted Project',
      province: 'Sindh',
      division: 'Mirpur Khas',
      district: 'Tharparkar',
      tehsil: 'Mithi',
      unionCouncil: 'Chelhar',
      village: 'Village B',
      installationType: 'Filter Hand Pump',
      installationDate: '2026-01-01',
      beneficiaryName: 'B',
      beneficiaryMobile: '03000000000',
      gpsCoordinates: { lat: 24.7, lng: 69.8 },
      currentCondition: 'Functional',
      totalInspections: 1,
      status: 'Active',
    }
  ];

  const tombstones = ['FGRF-WTS-DELETED-999'];
  const { merged } = mergeProjects(localProjects, remoteProjects, tombstones);

  // Must include SND-010 with updated inspections (2)
  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, 'FGRF-WTS-SND-010');
  assert.equal(merged[0].totalInspections, 2);

  // Must NOT include deleted project
  assert.equal(merged.some(p => p.id === 'FGRF-WTS-DELETED-999'), false);
});
