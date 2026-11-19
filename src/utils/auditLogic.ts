import { AuditRecord, CheckpointItem, NavTab, OverallCondition, RepairItem, UserProfile, UserRights, UserRole, WaterProject } from '../types/index.ts';

export const OFFICIAL_FORM_REFERENCE = 'FGRF-WTS-AUD-002.00-26';
export const WATER_SAFETY_DISCLAIMER_EN = 
  'Visual clarity does not confirm drinking-water safety. Arrange water quality testing where required and do not certify water as potable without a valid test.';
export const WATER_SAFETY_DISCLAIMER_UR = 
  'نوٹ: صرف آنکھ سے پانی صاف نظر آنا پینے کے لیے محفوظ ہونے کی تصدیق نہیں ہے۔ ضرورت کے مطابق پانی کا لیبارٹری ٹیسٹ کروائیں؛ درست ٹیسٹ کے بغیر پانی کو پینے کے قابل قرار نہ دیں۔';

export const INITIAL_CHECKPOINTS: Omit<CheckpointItem, 'currentStatus' | 'remarks' | 'photoUrl'>[] = [
  {
    id: 1,
    number: 1,
    titleEn: 'Installed at approved / recorded location',
    titleUrdu: 'پمپ منظور شدہ / ریکارڈ شدہ مقام پر نصب ہے',
    options: [
      { value: 'Yes', labelEn: 'Yes', labelUrdu: 'ہاں' },
      { value: 'No', labelEn: 'No', labelUrdu: 'نہیں' },
      { value: 'N/A', labelEn: 'N/A', labelUrdu: 'لاگو نہیں' },
    ],
  },
  {
    id: 2,
    number: 2,
    titleEn: 'Pump installed correctly; firm, stable and vertical',
    titleUrdu: 'پمپ درست طریقے سے، مضبوط اور سیدھا نصب ہے',
    options: [
      { value: 'Yes', labelEn: 'Yes', labelUrdu: 'ہاں' },
      { value: 'No', labelEn: 'No', labelUrdu: 'نہیں' },
      { value: 'N/A', labelEn: 'N/A', labelUrdu: 'لاگو نہیں' },
    ],
  },
  {
    id: 3,
    number: 3,
    titleEn: 'Platform / apron intact; no cracks or standing water',
    titleUrdu: 'پلیٹ فارم / فرش درست ہے؛ دراڑ یا کھڑا پانی نہیں',
    options: [
      { value: 'Yes', labelEn: 'Yes', labelUrdu: 'ہاں' },
      { value: 'No', labelEn: 'No', labelUrdu: 'نہیں' },
      { value: 'N/A', labelEn: 'N/A', labelUrdu: 'لاگو نہیں' },
    ],
  },
  {
    id: 4,
    number: 4,
    titleEn: 'Drainage channel present, clear and directing water away',
    titleUrdu: 'نکاسی آب کی نالی موجود، صاف اور پانی کو دور لے جاتی ہے',
    options: [
      { value: 'Yes', labelEn: 'Yes', labelUrdu: 'ہاں' },
      { value: 'No', labelEn: 'No', labelUrdu: 'نہیں' },
      { value: 'N/A', labelEn: 'N/A', labelUrdu: 'لاگو نہیں' },
    ],
  },
  {
    id: 5,
    number: 5,
    titleEn: 'Pump handle, rod, bolts and fittings working properly',
    titleUrdu: 'ہینڈل، راڈ، بولٹ اور فٹنگز درست کام کر رہے ہیں',
    options: [
      { value: 'Yes', labelEn: 'Yes', labelUrdu: 'ہاں' },
      { value: 'No', labelEn: 'No', labelUrdu: 'نہیں' },
      { value: 'N/A', labelEn: 'N/A', labelUrdu: 'لاگو نہیں' },
    ],
  },
  {
    id: 6,
    number: 6,
    titleEn: 'Water starts flowing and discharge is adequate',
    titleUrdu: 'پمپ سے پانی آتا ہے اور اخراج مناسب ہے',
    options: [
      { value: 'Yes', labelEn: 'Yes', labelUrdu: 'ہاں' },
      { value: 'No', labelEn: 'No', labelUrdu: 'نہیں' },
      { value: 'N/A', labelEn: 'N/A', labelUrdu: 'لاگو نہیں' },
    ],
  },
  {
    id: 7,
    number: 7,
    titleEn: 'Water is visibly clear; no unusual colour / smell',
    titleUrdu: 'پانی بظاہر صاف ہے؛ غیر معمولی رنگ یا بو نہیں',
    options: [
      { value: 'Yes', labelEn: 'Yes', labelUrdu: 'ہاں' },
      { value: 'No', labelEn: 'No', labelUrdu: 'نہیں' },
      { value: 'N/A', labelEn: 'N/A', labelUrdu: 'لاگو نہیں' },
    ],
  },
  {
    id: 8,
    number: 8,
    titleEn: 'Water drains after use; no stagnant / pooled water',
    titleUrdu: 'استعمال کے بعد پانی نکل جاتا ہے؛ پانی کھڑا نہیں رہتا',
    options: [
      { value: 'Yes', labelEn: 'Yes', labelUrdu: 'ہاں' },
      { value: 'No', labelEn: 'No', labelUrdu: 'نہیں' },
      { value: 'N/A', labelEn: 'N/A', labelUrdu: 'لاگو نہیں' },
    ],
  },
  {
    id: 9,
    number: 9,
    titleEn: 'Community is using the pump regularly',
    titleUrdu: 'کمیونٹی پمپ باقاعدگی سے استعمال کرتی ہے',
    options: [
      { value: 'Regular', labelEn: 'Regular', labelUrdu: 'باقاعدہ' },
      { value: 'Occasional', labelEn: 'Occasional', labelUrdu: 'کبھی کبھار' },
      { value: 'No', labelEn: 'No', labelUrdu: 'نہیں' },
    ],
  },
  {
    id: 10,
    number: 10,
    titleEn: 'Women / children / vulnerable users have safe access',
    titleUrdu: 'خواتین، بچوں اور کمزور افراد کے لیے محفوظ رسائی ہے',
    options: [
      { value: 'OK', labelEn: 'OK', labelUrdu: 'درست' },
      { value: 'Due', labelEn: 'Due', labelUrdu: 'درکار' },
      { value: 'N/A', labelEn: 'N/A', labelUrdu: 'لاگو نہیں' },
    ],
  },
  {
    id: 11,
    number: 11,
    titleEn: 'Area clean; no waste, animal contamination or hazards',
    titleUrdu: 'جگہ صاف ہے؛ کچرا، جانوروں کی آلودگی یا خطرہ نہیں',
    options: [
      { value: 'OK', labelEn: 'OK', labelUrdu: 'درست' },
      { value: 'Due', labelEn: 'Due', labelUrdu: 'درکار' },
      { value: 'N/A', labelEn: 'N/A', labelUrdu: 'لاگو نہیں' },
    ],
  },
  {
    id: 12,
    number: 12,
    titleEn: 'Beneficiary knows basic operation and reporting contact',
    titleUrdu: 'مستفید افراد کو استعمال اور شکایت درج کرانے کا طریقہ معلوم ہے',
    options: [
      { value: 'OK', labelEn: 'OK', labelUrdu: 'درست' },
      { value: 'Due', labelEn: 'Due', labelUrdu: 'درکار' },
      { value: 'N/A', labelEn: 'N/A', labelUrdu: 'لاگو نہیں' },
    ],
  },
];

export function createDefaultCheckpoints(): CheckpointItem[] {
  return INITIAL_CHECKPOINTS.map((cp) => ({
    ...cp,
    currentStatus: cp.options[0].value,
    remarks: '',
  }));
}

export function getDefaultRightsForRole(role: UserRole): UserRights {
  switch (role) {
    case 'super_admin':
      return {
        canViewDashboard: true,
        canCreateInspection: true,
        canEditInspection: true,
        canDeleteInspection: true,
        canReviewAndApprove: true,
        canManageRepairs: true,
        canCreateProject: true,
        canEditProject: true,
        canDeleteProject: true,
        canViewMap: true,
        canExportReports: true,
        canManageOpenHeads: true,
        canViewActivityLogs: true,
        canManageUsers: true,
      };
    case 'national_mgmt':
      return {
        canViewDashboard: true,
        canCreateInspection: true,
        canEditInspection: true,
        canDeleteInspection: false,
        canReviewAndApprove: true,
        canManageRepairs: true,
        canCreateProject: true,
        canEditProject: true,
        canDeleteProject: false,
        canViewMap: true,
        canExportReports: true,
        canManageOpenHeads: false,
        canViewActivityLogs: true,
        canManageUsers: false,
      };
    case 'provincial_coord':
      return {
        canViewDashboard: true,
        canCreateInspection: true,
        canEditInspection: true,
        canDeleteInspection: false,
        canReviewAndApprove: true,
        canManageRepairs: true,
        canCreateProject: true,
        canEditProject: true,
        canDeleteProject: false,
        canViewMap: true,
        canExportReports: true,
        canManageOpenHeads: false,
        canViewActivityLogs: false,
        canManageUsers: false,
      };
    case 'field_inspector':
      return {
        canViewDashboard: false,
        canCreateInspection: true,
        canEditInspection: true,
        canDeleteInspection: false,
        canReviewAndApprove: false,
        canManageRepairs: false,
        canCreateProject: false,
        canEditProject: false,
        canDeleteProject: false,
        canViewMap: false,
        canExportReports: true,
        canManageOpenHeads: false,
        canViewActivityLogs: false,
        canManageUsers: false,
      };
    case 'repair_team':
      return {
        canViewDashboard: false,
        canCreateInspection: false,
        canEditInspection: false,
        canDeleteInspection: false,
        canReviewAndApprove: false,
        canManageRepairs: true,
        canCreateProject: false,
        canEditProject: false,
        canDeleteProject: false,
        canViewMap: false,
        canExportReports: true,
        canManageOpenHeads: false,
        canViewActivityLogs: false,
        canManageUsers: false,
      };
    case 'viewer':
    default:
      return {
        canViewDashboard: true,
        canCreateInspection: false,
        canEditInspection: false,
        canDeleteInspection: false,
        canReviewAndApprove: false,
        canManageRepairs: false,
        canCreateProject: false,
        canEditProject: false,
        canDeleteProject: false,
        canViewMap: true,
        canExportReports: true,
        canManageOpenHeads: false,
        canViewActivityLogs: false,
        canManageUsers: false,
      };
  }
}

/**
 * Checks if a specific navigation tab is permitted for the given user profile.
 * Super Admin has unconditional access to all modules.
 * Other users are strictly evaluated against their granted granular rights and role.
 */
export function isTabAllowed(tab: NavTab, user: UserProfile): boolean {
  if (!user) return false;
  const role = user.role;
  const rights = user.rights || getDefaultRightsForRole(role);

  // Super Admin has full unrestricted access
  if (role === 'super_admin') return true;

  switch (tab) {
    case 'dashboard':
      if (rights.canViewDashboard !== undefined) return rights.canViewDashboard;
      return role === 'national_mgmt' || role === 'provincial_coord' || role === 'viewer';

    case 'projects':
      return !!(
        rights.canCreateProject ||
        rights.canEditProject ||
        rights.canDeleteProject ||
        role === 'national_mgmt' ||
        role === 'provincial_coord'
      );

    case 'new_inspection':
      return !!rights.canCreateInspection;

    case 'records':
      return !!(
        rights.canCreateInspection ||
        rights.canEditInspection ||
        rights.canDeleteInspection ||
        rights.canReviewAndApprove ||
        role === 'national_mgmt' ||
        role === 'provincial_coord' ||
        role === 'viewer'
      );

    case 'repairs':
      return !!(rights.canManageRepairs || role === 'repair_team');

    case 'map':
      if (rights.canViewMap !== undefined) return rights.canViewMap;
      return role === 'national_mgmt' || role === 'provincial_coord' || role === 'viewer';

    case 'reports':
      return !!rights.canExportReports;

    case 'open_heads':
      if (rights.canManageOpenHeads !== undefined) return rights.canManageOpenHeads;
      return false;

    case 'activity_logs':
      if (rights.canViewActivityLogs !== undefined) return rights.canViewActivityLogs;
      return role === 'national_mgmt';

    case 'users':
      return !!rights.canManageUsers;

    default:
      return false;
  }
}

/**
 * Resolves the primary default landing tab for a logged-in user.
 * Directs field inspectors directly to 'new_inspection', repair teams to 'repairs',
 * and other users to their highest-priority allowed module.
 */
export function getDefaultTabForUser(user: UserProfile): NavTab {
  if (!user) return 'new_inspection';

  // Role-specific primary workflow landing
  if (user.role === 'field_inspector' && isTabAllowed('new_inspection', user)) {
    return 'new_inspection';
  }
  if (user.role === 'repair_team' && isTabAllowed('repairs', user)) {
    return 'repairs';
  }

  const priorityTabs: NavTab[] = [
    'dashboard',
    'new_inspection',
    'records',
    'projects',
    'repairs',
    'map',
    'reports',
    'open_heads',
    'activity_logs',
    'users',
  ];

  for (const tab of priorityTabs) {
    if (isTabAllowed(tab, user)) {
      return tab;
    }
  }

  return 'new_inspection';
}

export function validateUserId(id: string, existingUsers: UserProfile[], currentIdToIgnore?: string): { isValid: boolean; error?: string } {
  const trimmed = id.trim().toUpperCase();
  if (!trimmed) {
    return { isValid: false, error: 'User ID / CNIC is required / صارف شناختی نمبر یا شناختی کارڈ نمبر درج کریں' };
  }
  if (trimmed.length < 3) {
    return { isValid: false, error: 'User ID / CNIC must be at least 3 characters / صارف شناختی نمبر کم از کم 3 حروف پر مشتمل ہو' };
  }
  // Allow manual CNIC format like 42101-1234567-1, or staff codes like FGRF-HQ-01, ADMIN-01, etc.
  if (!/^[A-Z0-9_-]{3,30}$/i.test(trimmed)) {
    return { isValid: false, error: 'User ID / CNIC should contain letters, digits, and hyphens (e.g. 42101-1234567-1)' };
  }
  const duplicate = existingUsers.find(
    (u) => u.id.toUpperCase() === trimmed && (!currentIdToIgnore || u.id.toUpperCase() !== currentIdToIgnore.toUpperCase())
  );
  if (duplicate) {
    return { isValid: false, error: `User ID / CNIC "${trimmed}" already exists. Please enter a unique ID.` };
  }
  return { isValid: true };
}

export const PRECONFIGURED_USERS: UserProfile[] = [
  {
    id: 'FGRF-MIS-01',
    name: 'Syed Waqas',
    role: 'super_admin',
    designation: 'Manager MIS – Data Management & ERP Department',
    email: 'waqas.mis@fgrf.org',
    phone: '+92 300 1234567',
    password: 'admin123',
    status: 'active',
    rights: getDefaultRightsForRole('super_admin'),
  },
  {
    id: '42101-1234567-1',
    name: 'Syed Waqas',
    role: 'super_admin',
    designation: 'Manager MIS – Data Management & ERP Department',
    email: 'waqas.mis@fgrf.org',
    phone: '+92 300 1234567',
    password: 'admin123',
    status: 'active',
    rights: getDefaultRightsForRole('super_admin'),
  },
];

export function isRepairOverdue(repair: RepairItem, currentDateStr?: string): boolean {
  if (repair.status === 'Done') return false;
  if (!repair.targetDate) return false;
  const now = currentDateStr ? new Date(currentDateStr) : new Date();
  const target = new Date(repair.targetDate);
  // Compare date portion only (end of target day)
  target.setHours(23, 59, 59, 999);
  return target.getTime() < now.getTime();
}

export interface DashboardKPIs {
  totalProjects: number;
  totalInspections: number;
  functionalCount: number;
  functionalRepairNeededCount: number;
  nonFunctionalCount: number;
  notInstalledCount: number;
  pendingRepairsCount: number;
  completedRepairsCount: number;
  overdueRepairsCount: number;
  inspectionsThisMonthCount: number;
  functionalPercentage: number;
}

export function calculateKPIs(
  projects: WaterProject[],
  audits: AuditRecord[],
  allRepairs: RepairItem[],
  currentDate: Date = new Date()
): DashboardKPIs {
  const totalProjects = projects.length;
  const totalInspections = audits.length;

  let functionalCount = 0;
  let functionalRepairNeededCount = 0;
  let nonFunctionalCount = 0;
  let notInstalledCount = 0;

  // Compute from latest condition of projects
  projects.forEach((proj) => {
    switch (proj.currentCondition) {
      case 'Functional':
        functionalCount++;
        break;
      case 'Functional – Repair Needed':
        functionalRepairNeededCount++;
        break;
      case 'Non-functional':
        nonFunctionalCount++;
        break;
      case 'Not Installed / Wrong Location':
        notInstalledCount++;
        break;
    }
  });

  let pendingRepairsCount = 0;
  let completedRepairsCount = 0;
  let overdueRepairsCount = 0;

  const curIso = currentDate.toISOString();
  allRepairs.forEach((rep) => {
    if (rep.status === 'Done') {
      completedRepairsCount++;
    } else {
      pendingRepairsCount++;
      if (isRepairOverdue(rep, curIso)) {
        overdueRepairsCount++;
      }
    }
  });

  // Calculate inspections in current month
  const curYear = currentDate.getFullYear();
  const curMonth = currentDate.getMonth();

  const inspectionsThisMonthCount = audits.filter((aud) => {
    const d = new Date(aud.inspectionDateTime);
    return d.getFullYear() === curYear && d.getMonth() === curMonth;
  }).length;

  const functionalPercentage = totalProjects > 0
    ? Math.round(((functionalCount + functionalRepairNeededCount) / totalProjects) * 100)
    : 0;

  return {
    totalProjects,
    totalInspections,
    functionalCount,
    functionalRepairNeededCount,
    nonFunctionalCount,
    notInstalledCount,
    pendingRepairsCount,
    completedRepairsCount,
    overdueRepairsCount,
    inspectionsThisMonthCount,
    functionalPercentage,
  };
}

export function filterRecordsByJurisdiction<T extends { province?: string; inspectorId?: string }>(
  items: T[],
  user: UserProfile
): T[] {
  // Super admin and National mgmt see everything
  if (user.role === 'super_admin' || user.role === 'national_mgmt' || user.role === 'viewer') {
    return items;
  }
  // Provincial coordinator sees only their assigned province
  if (user.role === 'provincial_coord') {
    if (!user.province) return items;
    return items.filter((item) => item.province?.toLowerCase() === user.province?.toLowerCase());
  }
  // Field inspector sees their assigned projects or their submitted inspections
  if (user.role === 'field_inspector') {
    return items.filter((item) => {
      if (item.inspectorId && item.inspectorId === user.id) return true;
      if (user.province && item.province?.toLowerCase() === user.province.toLowerCase()) return true;
      return false;
    });
  }
  // Repair team sees repairs or items in their province
  if (user.role === 'repair_team') {
    if (!user.province) return items;
    return items.filter((item) => item.province?.toLowerCase() === user.province?.toLowerCase());
  }
  return items;
}

export function validateProjectId(id: string, existingProjects: WaterProject[], currentIdToIgnore?: string): { isValid: boolean; error?: string } {
  const trimmed = id.trim().toUpperCase();
  if (!trimmed) {
    return { isValid: false, error: 'Project ID is required' };
  }
  if (!/^FGRF-[A-Z0-9_-]+$/i.test(trimmed)) {
    return { isValid: false, error: 'Project ID should start with FGRF- (e.g. FGRF-WTS-SND-01)' };
  }
  const duplicate = existingProjects.find(
    (p) => p.id.toUpperCase() === trimmed && (!currentIdToIgnore || p.id.toUpperCase() !== currentIdToIgnore.toUpperCase())
  );
  if (duplicate) {
    return { isValid: false, error: `Project ID ${trimmed} already exists in database.` };
  }
  return { isValid: true };
}

export function evaluateOverallConditionFromCheckpoints(checkpoints: CheckpointItem[]): OverallCondition {
  // If Checkpoint 1 (installed at approved location) is No
  const cp1 = checkpoints.find((c) => c.number === 1);
  if (cp1 && cp1.currentStatus === 'No') {
    return 'Not Installed / Wrong Location';
  }

  // If water doesn't start flowing (cp6 is No) or pump handle/rod broken (cp5 is No)
  const cp6 = checkpoints.find((c) => c.number === 6);
  const cp5 = checkpoints.find((c) => c.number === 5);
  const cp2 = checkpoints.find((c) => c.number === 2);

  if ((cp6 && cp6.currentStatus === 'No') || (cp2 && cp2.currentStatus === 'No')) {
    return 'Non-functional';
  }

  // If any other checkpoint has defect or Due status
  const hasDefects = checkpoints.some((c) => {
    if (c.currentStatus === 'No' || c.currentStatus === 'Due') return true;
    if (c.number === 9 && c.currentStatus === 'Occasional') return true;
    return false;
  });

  if (hasDefects || (cp5 && cp5.currentStatus === 'No')) {
    return 'Functional – Repair Needed';
  }

  return 'Functional';
}
