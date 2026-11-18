export type UserRole = 
  | 'super_admin'      // Super Administrator – Head Office
  | 'national_mgmt'    // National / Head Office Management
  | 'provincial_coord' // Provincial / Regional Coordinator
  | 'field_inspector'  // Field Inspector
  | 'repair_team'      // Repair / Maintenance Team
  | 'viewer';          // Management Viewer

export type NavTab = 
  | 'dashboard'
  | 'projects'
  | 'new_inspection'
  | 'records'
  | 'repairs'
  | 'map'
  | 'reports'
  | 'open_heads'
  | 'activity_logs'
  | 'users';

export interface UserRights {
  canViewDashboard?: boolean;
  canCreateInspection: boolean;
  canEditInspection: boolean;
  canDeleteInspection: boolean;
  canReviewAndApprove: boolean;
  canManageRepairs: boolean;
  canCreateProject: boolean;
  canEditProject: boolean;
  canDeleteProject: boolean;
  canViewMap?: boolean;
  canExportReports: boolean;
  canManageOpenHeads?: boolean;
  canViewActivityLogs?: boolean;
  canManageUsers: boolean; // Create, edit, delete users and grant rights (Admin only)
}

export interface UserProfile {
  id: string; // e.g., 'FGRF-HQ-01'
  name: string;
  role: UserRole;
  designation: string;
  country?: string; // Global country jurisdiction
  province?: string; // Geographical jurisdiction (e.g. 'Sindh' or undefined for national)
  district?: string;
  email: string;
  phone: string;
  avatar?: string;
  password?: string;
  status: 'active' | 'suspended';
  rights: UserRights;
  createdAt?: string;
  updatedAt?: string;
}

export type InstallationType = string;

export type CheckpointStatus = 'Yes' | 'No' | 'N/A' | 'Regular' | 'Occasional' | 'OK' | 'Due';

export interface CheckpointItem {
  id: number;
  number: number;
  titleEn: string;
  titleUrdu: string;
  options: {
    value: CheckpointStatus;
    labelEn: string;
    labelUrdu: string;
  }[];
  currentStatus: CheckpointStatus;
  remarks: string;
  photoUrl?: string;
}

export type RepairStatus = 'Pending' | 'In Progress' | 'Done';

export interface RepairItem {
  id: string; // e.g., 'REP-WTS-2026-001'
  defectFound: string;
  repairRequired: string;
  responsiblePerson: string;
  targetDate: string; // YYYY-MM-DD
  status: RepairStatus;
  completionRemarks?: string;
  beforePhoto?: string;
  afterPhoto?: string;
  repairPhoto?: string;
  repairVideo?: string;
  beforeVideo?: string;
  afterVideo?: string;
  completedDate?: string;
}

export type OverallCondition = 
  | 'Functional' 
  | 'Functional – Repair Needed' 
  | 'Non-functional' 
  | 'Not Installed / Wrong Location';

export type InspectionApprovalStatus = 'Submitted' | 'Under Review' | 'Approved' | 'Returned for Correction';

export interface AuditRecord {
  id: string; // Form ID e.g., 'AUD-2026-001'
  formReference: string; // 'FGRF-WTS-AUD-002.00-26'
  
  // Section A: Project & Site Information
  projectId: string;
  country?: string; // e.g., 'Pakistan', 'India', 'Bangladesh', 'Kenya'
  province: string;
  division: string;
  district: string;
  tehsil: string; // Tahseel / Town
  unionCouncil: string;
  village: string;
  fullSiteAddress: string;
  gpsCoordinates: {
    lat: number;
    lng: number;
  };
  beneficiaryName: string;
  beneficiaryMobile: string;
  installationType: InstallationType;
  installationDate: string;
  inspectionDateTime: string; // ISO string
  inspectorId: string;
  inspectorName: string;
  inspectorDesignation: string;

  // Section B: 12 Checkpoints
  checkpoints: CheckpointItem[];

  // Section C: Repair / Corrective Actions
  repairs: RepairItem[];

  // Section D: Overall Result & Sign-Off
  overallCondition: OverallCondition;
  attachedPhotos: {
    beforeDefect?: string;
    afterRepair?: string;
    siteOverview?: string;
    beforeVideo?: string;
    afterVideo?: string;
    siteVideo?: string;
    repairPhotos?: string[];
    repairVideos?: string[];
  };
  inspectorRemarks: string;
  inspectorSignature: string; // base64 data URL
  inspectionSignDate: string;
  communityRepName: string;
  communityRepSignature: string; // base64 data URL
  communityRepDate: string;

  // Approval & Workflow
  approvalStatus: InspectionApprovalStatus;
  reviewedBy?: string;
  reviewedDate?: string;
  reviewRemarks?: string;
  qrCodeDataUrl?: string; // Verification QR Code
  createdAt: string;
  updatedAt: string;
}

export interface WaterProject {
  id: string; // e.g. 'FGRF-WTS-SND-001'
  name: string;
  country?: string; // e.g., 'Pakistan', 'India', 'Bangladesh', 'Kenya'
  province: string;
  division: string;
  district: string;
  tehsil: string; // Tahseel / Town
  unionCouncil: string;
  village: string;
  installationType: InstallationType;
  installationDate: string;
  contractorOrDonorRef?: string;
  beneficiaryName: string;
  beneficiaryMobile: string;
  gpsCoordinates: {
    lat: number;
    lng: number;
  };
  currentCondition: OverallCondition;
  lastInspectionDate?: string;
  totalInspections: number;
  status: 'Active' | 'Under Maintenance' | 'Decommissioned';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'inspection' | 'repair' | 'approval' | 'system';
  read: boolean;
  linkId?: string; // audit or repair ID
}

export interface UserActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  ipAddress: string;
  actionType: 
    | 'LOGIN' 
    | 'LOGOUT' 
    | 'AUDIT_CREATE' 
    | 'AUDIT_UPDATE' 
    | 'AUDIT_DELETE'
    | 'AUDIT_APPROVE' 
    | 'AUDIT_RETURN'
    | 'PROJECT_CREATE' 
    | 'PROJECT_UPDATE' 
    | 'PROJECT_DELETE' 
    | 'REPAIR_UPDATE' 
    | 'MASTER_HEAD_UPDATE' 
    | 'HEADS_UPDATE'
    | 'USER_MANAGEMENT';
  actionDescription: string;
  details?: string;
}

export interface MasterHeadOption {
  id: string;
  labelEn: string;
  labelUrdu: string;
  color?: string;
  isSystem?: boolean;
}

export interface MasterQuestionHead {
  id: number;
  number: number;
  titleEn: string;
  titleUrdu: string;
  category?: string; // Mapped category (e.g. 'Hand Pump', 'Filter Hand Pump', or 'all')
  region?: string;   // Mapped region/province (e.g. 'Sindh', 'Punjab', or 'all')
  options: {
    value: CheckpointStatus;
    labelEn: string;
    labelUrdu: string;
  }[];
}

export interface MasterHeadsConfig {
  categories: string[];
  conditions: MasterHeadOption[];
  questions: MasterQuestionHead[];
}

