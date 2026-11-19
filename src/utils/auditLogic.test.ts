import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateKPIs,
  isRepairOverdue,
  validateProjectId,
  validateUserId,
  getDefaultRightsForRole,
  evaluateOverallConditionFromCheckpoints,
  createDefaultCheckpoints,
  filterRecordsByJurisdiction,
  PRECONFIGURED_USERS,
} from './auditLogic';
import { WaterProject, AuditRecord, RepairItem, CheckpointItem, UserProfile } from '../types/index';

test('validateProjectId catches empty, invalid format and duplicate IDs', () => {
  const existing: WaterProject[] = [
    {
      id: 'FGRF-WTS-001',
      name: 'Mithi Hand Pump',
      province: 'Sindh',
      division: 'Mirpur Khas',
      district: 'Tharparkar',
      tehsil: 'Mithi',
      unionCouncil: 'Chelhar',
      village: 'Janhan',
      installationType: 'Hand Pump',
      installationDate: '2025-01-15',
      beneficiaryName: 'Murad Ali',
      beneficiaryMobile: '03001234567',
      gpsCoordinates: { lat: 24.7, lng: 69.8 },
      currentCondition: 'Functional',
      totalInspections: 1,
      status: 'Active',
    },
  ];

  assert.equal(validateProjectId('', existing).isValid, false);
  assert.equal(validateProjectId('INVALID-123', existing).isValid, false);
  assert.equal(validateProjectId('FGRF-WTS-001', existing).isValid, false);
  assert.equal(validateProjectId('FGRF-WTS-002', existing).isValid, true);
});

test('isRepairOverdue checks target date vs reference date', () => {
  const repairPendingPast: RepairItem = {
    id: 'REP-01',
    defectFound: 'Leaking flange',
    repairRequired: 'Replace gasket',
    responsiblePerson: 'Akram',
    targetDate: '2026-10-01',
    status: 'Pending',
  };

  const repairPendingFuture: RepairItem = {
    id: 'REP-02',
    defectFound: 'Broken handle',
    repairRequired: 'Weld handle',
    responsiblePerson: 'Akram',
    targetDate: '2026-11-20',
    status: 'Pending',
  };

  const repairDone: RepairItem = {
    id: 'REP-03',
    defectFound: 'Platform crack',
    repairRequired: 'Masonry fix',
    responsiblePerson: 'Akram',
    targetDate: '2026-10-01',
    status: 'Done',
  };

  const checkDate = '2026-11-11T00:00:00.000Z';
  assert.equal(isRepairOverdue(repairPendingPast, checkDate), true);
  assert.equal(isRepairOverdue(repairPendingFuture, checkDate), false);
  assert.equal(isRepairOverdue(repairDone, checkDate), false);
});

test('evaluateOverallConditionFromCheckpoints determines correct project status', () => {
  const checkpoints = createDefaultCheckpoints();
  // Default is all Yes / Regular / OK -> Functional
  assert.equal(evaluateOverallConditionFromCheckpoints(checkpoints), 'Functional');

  // If wrong location
  const wrongLocation = createDefaultCheckpoints();
  wrongLocation[0].currentStatus = 'No';
  assert.equal(evaluateOverallConditionFromCheckpoints(wrongLocation), 'Not Installed / Wrong Location');

  // If no water discharge
  const noDischarge = createDefaultCheckpoints();
  noDischarge[5].currentStatus = 'No';
  assert.equal(evaluateOverallConditionFromCheckpoints(noDischarge), 'Non-functional');

  // If cracked platform
  const crackedPlatform = createDefaultCheckpoints();
  crackedPlatform[2].currentStatus = 'No';
  assert.equal(evaluateOverallConditionFromCheckpoints(crackedPlatform), 'Functional – Repair Needed');
});

test('filterRecordsByJurisdiction restricts provincial coordinators', () => {
  const sindhCoord: UserProfile = {
    id: 'FGRF-SND-TEST',
    name: 'Sindh Test Coordinator',
    role: 'provincial_coord',
    designation: 'Sindh Provincial Coordinator',
    province: 'Sindh',
    email: 'coord.sindh@fgrf.org',
    phone: '+92 333 4567890',
    status: 'active',
    rights: getDefaultRightsForRole('provincial_coord'),
  };
  const superAdmin = PRECONFIGURED_USERS.find((u) => u.id === 'FGRF-MIS-01')!;

  const sampleItems = [
    { id: '1', province: 'Sindh' },
    { id: '2', province: 'Punjab' },
    { id: '3', province: 'Balochistan' },
  ];

  const sindhVisible = filterRecordsByJurisdiction(sampleItems, sindhCoord);
  assert.equal(sindhVisible.length, 1);
  assert.equal(sindhVisible[0].province, 'Sindh');

  const adminVisible = filterRecordsByJurisdiction(sampleItems, superAdmin);
  assert.equal(adminVisible.length, 3);
});

test('calculateKPIs tallies condition counts and overdue repairs accurately', () => {
  const projects: WaterProject[] = [
    {
      id: 'P1',
      name: 'Pump 1',
      province: 'Sindh',
      division: 'Thatta',
      district: 'Thatta',
      tehsil: 'Thatta',
      unionCouncil: 'UC1',
      village: 'V1',
      installationType: 'Hand Pump',
      installationDate: '2025-01-01',
      beneficiaryName: 'Ali',
      beneficiaryMobile: '0300',
      gpsCoordinates: { lat: 24.7, lng: 67.9 },
      currentCondition: 'Functional',
      totalInspections: 1,
      status: 'Active',
    },
    {
      id: 'P2',
      name: 'Pump 2',
      province: 'Punjab',
      division: 'Lahore',
      district: 'Lahore',
      tehsil: 'Model Town',
      unionCouncil: 'UC2',
      village: 'V2',
      installationType: 'Filter Hand Pump',
      installationDate: '2025-02-01',
      beneficiaryName: 'Usman',
      beneficiaryMobile: '0301',
      gpsCoordinates: { lat: 31.5, lng: 74.3 },
      currentCondition: 'Functional – Repair Needed',
      totalInspections: 1,
      status: 'Active',
    },
    {
      id: 'P3',
      name: 'Pump 3',
      province: 'Balochistan',
      division: 'Quetta',
      district: 'Quetta',
      tehsil: 'Quetta City',
      unionCouncil: 'UC3',
      village: 'V3',
      installationType: 'Hand Pump',
      installationDate: '2024-05-01',
      beneficiaryName: 'Jan',
      beneficiaryMobile: '0302',
      gpsCoordinates: { lat: 30.1, lng: 66.9 },
      currentCondition: 'Non-functional',
      totalInspections: 1,
      status: 'Under Maintenance',
    },
  ];

  const repairs: RepairItem[] = [
    {
      id: 'R1',
      defectFound: 'Valve',
      repairRequired: 'Replace',
      responsiblePerson: 'Tech',
      targetDate: '2026-10-10', // past
      status: 'Pending',
    },
    {
      id: 'R2',
      defectFound: 'Apron',
      repairRequired: 'Cement',
      responsiblePerson: 'Tech',
      targetDate: '2026-12-31', // future
      status: 'In Progress',
    },
    {
      id: 'R3',
      defectFound: 'Chain',
      repairRequired: 'Tighten',
      responsiblePerson: 'Tech',
      targetDate: '2026-09-01',
      status: 'Done',
    },
  ];

  const kpis = calculateKPIs(projects, [], repairs, new Date('2026-11-11T00:00:00Z'));
  assert.equal(kpis.totalProjects, 3);
  assert.equal(kpis.functionalCount, 1);
  assert.equal(kpis.functionalRepairNeededCount, 1);
  assert.equal(kpis.nonFunctionalCount, 1);
  assert.equal(kpis.pendingRepairsCount, 2);
  assert.equal(kpis.overdueRepairsCount, 1);
  assert.equal(kpis.completedRepairsCount, 1);
  assert.equal(kpis.functionalPercentage, 67); // (1+1)/3 = 66.6% -> 67%
});

test('validateUserId enforces format and checks duplicates', () => {
  assert.equal(validateUserId('', PRECONFIGURED_USERS).isValid, false);
  assert.equal(validateUserId('12', PRECONFIGURED_USERS).isValid, false);
  assert.equal(validateUserId('FGRF-MIS-01', PRECONFIGURED_USERS).isValid, false); // duplicate
  assert.equal(validateUserId('FGRF-MIS-01', PRECONFIGURED_USERS, 'FGRF-MIS-01').isValid, true); // editing self
  assert.equal(validateUserId('FGRF-INS-999', PRECONFIGURED_USERS).isValid, true); // new valid ID
});

test('getDefaultRightsForRole grants super_admin all rights including manageUsers', () => {
  const superAdminRights = getDefaultRightsForRole('super_admin');
  assert.equal(superAdminRights.canManageUsers, true);
  assert.equal(superAdminRights.canDeleteProject, true);
  assert.equal(superAdminRights.canDeleteInspection, true);

  const inspectorRights = getDefaultRightsForRole('field_inspector');
  assert.equal(inspectorRights.canManageUsers, false);
  assert.equal(inspectorRights.canReviewAndApprove, false);
  assert.equal(inspectorRights.canCreateInspection, true);

  const viewerRights = getDefaultRightsForRole('viewer');
  assert.equal(viewerRights.canManageUsers, false);
  assert.equal(viewerRights.canCreateInspection, false);
  assert.equal(viewerRights.canExportReports, true);
});

test('global geographical hierarchy supports Pakistan (Korangi/Landhi) and India (Delhi/Karol Bagh)', async () => {
  const { GLOBAL_COUNTRIES, findGlobalDistrictCoordinates } = await import('./pakistanGeo.ts');
  
  // 1. Check Pakistan -> Sindh -> Karachi -> Korangi District -> Landhi
  const pakistan = GLOBAL_COUNTRIES.find((c) => c.name === 'Pakistan');
  assert.ok(pakistan, 'Pakistan should be defined');
  const sindh = pakistan.provinces.find((p) => p.name === 'Sindh');
  assert.ok(sindh, 'Sindh should be defined in Pakistan');
  const karachi = sindh.divisions.find((d) => d.name === 'Karachi');
  assert.ok(karachi, 'Karachi division should be defined');
  const korangiDist = karachi.districts.find((d) => d.name === 'Korangi District');
  assert.ok(korangiDist, 'Korangi District should be defined');
  assert.ok(korangiDist.tehsils.includes('Landhi'), 'Landhi should be a tehsil in Korangi');

  // 2. Check India -> Delhi -> Central Delhi -> Central Delhi District -> Karol Bagh
  const india = GLOBAL_COUNTRIES.find((c) => c.name === 'India');
  assert.ok(india, 'India should be defined');
  const delhi = india.provinces.find((p) => p.name === 'Delhi');
  assert.ok(delhi, 'Delhi should be defined in India');
  const centralDelhi = delhi.divisions.find((d) => d.name === 'Central Delhi');
  assert.ok(centralDelhi, 'Central Delhi division should be defined');
  const centralDelhiDist = centralDelhi.districts.find((d) => d.name === 'Central Delhi District');
  assert.ok(centralDelhiDist, 'Central Delhi District should be defined');
  assert.ok(centralDelhiDist.tehsils.includes('Karol Bagh'), 'Karol Bagh should be a tehsil in Central Delhi');

  // 3. Test coordinate lookups
  const korangiCoords = findGlobalDistrictCoordinates('Pakistan', 'Korangi District');
  assert.equal(korangiCoords.lat, 24.8485);
  assert.equal(korangiCoords.lng, 67.1352);

  const delhiCoords = findGlobalDistrictCoordinates('India', 'Central Delhi District');
  assert.equal(delhiCoords.lat, 28.6448);
  assert.equal(delhiCoords.lng, 77.2167);
});

