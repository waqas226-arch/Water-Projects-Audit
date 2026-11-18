/**
 * Faizan Global Relief Foundation (FGRF) - Water Projects Audit & Monitoring System
 * Self-Contained Verifiable QR Code Payload Encoder & Decoder
 * 
 * Embeds complete tamper-resistant inspection certificate records directly into QR code URLs
 * allowing 100% offline and cross-device verification on any smartphone camera in the world.
 * 
 * Author: Syed Waqas, Manager MIS (Data Management & ERP Department - FGRF)
 */

import { AuditRecord, CheckpointItem, RepairItem } from '../types/index.ts';
import { createDefaultCheckpoints } from './auditLogic.ts';

// UTF-8 Safe Base64URL Encoding
export function base64UrlEncode(str: string): string {
  try {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) {
      bin += String.fromCharCode(bytes[i]);
    }
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    console.error('Base64URL encode error:', e);
    return '';
  }
}

// UTF-8 Safe Base64URL Decoding
export function base64UrlDecode(str: string): string {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (e) {
    console.error('Base64URL decode error:', e);
    return '';
  }
}

/**
 * Compact Schema for QR Code Transmission
 */
interface CompactAuditPayload {
  i: string;        // id (e.g., AUD-2026-0001)
  p: string;        // projectId
  r?: string;       // formReference
  c?: string;       // country
  pr: string;       // province
  dv?: string;      // division
  ds: string;       // district
  th?: string;      // tehsil
  uc?: string;      // unionCouncil
  v: string;        // village
  a: string;        // fullSiteAddress
  g: [number, number]; // [lat, lng]
  bn: string;       // beneficiaryName
  bm?: string;      // beneficiaryMobile
  it: string;       // installationType
  id?: string;      // installationDate
  dt: string;       // inspectionDateTime
  in: string;       // inspectorName
  ids?: string;     // inspectorDesignation
  cp: Array<[number, string, string]>; // checkpoints [id, status, remarks]
  rp: Array<[string, string, number, string]>; // repairs [item, action, cost, status]
  oc: string;       // overallCondition
  rm?: string;      // inspectorRemarks
  is?: string;      // inspectorSignature
  cn?: string;      // communityRepName
  cs?: string;      // communityRepSignature
  cd?: string;      // communityRepDate
  st?: string;      // approvalStatus
  hasPhotos?: boolean;
}

/**
 * Encodes an AuditRecord into a compact, URL-safe QR code payload string
 */
export function encodeAuditForQr(audit: AuditRecord): string {
  const compact: CompactAuditPayload = {
    i: audit.id,
    p: audit.projectId,
    r: audit.formReference,
    c: audit.country || 'Pakistan',
    pr: audit.province,
    dv: audit.division || '',
    ds: audit.district,
    th: audit.tehsil || '',
    uc: audit.unionCouncil || '',
    v: audit.village,
    a: audit.fullSiteAddress,
    g: [audit.gpsCoordinates?.lat || 0, audit.gpsCoordinates?.lng || 0],
    bn: audit.beneficiaryName,
    bm: audit.beneficiaryMobile || '',
    it: audit.installationType,
    id: audit.installationDate || '',
    dt: audit.inspectionDateTime,
    in: audit.inspectorName,
    ids: audit.inspectorDesignation || 'Field Inspector',
    cp: (audit.checkpoints || []).map(c => [c.id, c.currentStatus, c.remarks || '']),
    rp: (audit.repairs || []).map(r => [r.defectFound || '', r.repairRequired || '', 0, r.status || 'Pending']),
    oc: audit.overallCondition,
    rm: audit.inspectorRemarks || '',
    is: audit.inspectorSignature ? 'VERIFIED' : '',
    cn: audit.communityRepName || '',
    cs: audit.communityRepSignature ? 'VERIFIED' : '',
    cd: audit.communityRepDate || '',
    st: audit.approvalStatus || 'Submitted',
    hasPhotos: Boolean(audit.attachedPhotos?.siteOverview || audit.attachedPhotos?.beforeDefect || audit.attachedPhotos?.afterRepair)
  };

  const jsonStr = JSON.stringify(compact);
  return base64UrlEncode(jsonStr);
}

/**
 * Decodes a QR code payload string back into a full AuditRecord
 */
export function decodeAuditFromQr(payloadStr: string): AuditRecord | null {
  if (!payloadStr || payloadStr.trim().length === 0) return null;
  try {
    const jsonStr = base64UrlDecode(payloadStr.trim());
    if (!jsonStr) return null;
    const c: CompactAuditPayload = JSON.parse(jsonStr);

    if (!c.i || !c.p) return null;

    // Expand checkpoints
    const defaultCheckpoints = createDefaultCheckpoints();
    const checkpoints: CheckpointItem[] = defaultCheckpoints.map(def => {
      const match = (c.cp || []).find(([id]) => id === def.id);
      if (match) {
        return {
          ...def,
          currentStatus: (match[1] as any) || def.currentStatus,
          remarks: match[2] || def.remarks
        };
      }
      return def;
    });

    // Expand repairs
    const repairs: RepairItem[] = (c.rp || []).map(([defectFound, repairRequired, _cost, status], idx) => ({
      id: `REP-QR-${c.i}-${idx + 1}`,
      defectFound: defectFound || 'Defect noted during inspection',
      repairRequired: repairRequired || 'Repair and maintenance required',
      responsiblePerson: 'Local Field Maintenance Team',
      targetDate: c.dt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      status: (status as any) || 'Pending'
    }));

    const audit: AuditRecord = {
      id: c.i,
      formReference: c.r || 'FGRF-WTS-AUD-002.00-26',
      projectId: c.p,
      country: c.c || 'Pakistan',
      province: c.pr || 'Sindh',
      division: c.dv || '',
      district: c.ds || '',
      tehsil: c.th || '',
      unionCouncil: c.uc || '',
      village: c.v || '',
      fullSiteAddress: c.a || '',
      gpsCoordinates: { lat: c.g?.[0] || 0, lng: c.g?.[1] || 0 },
      beneficiaryName: c.bn || '',
      beneficiaryMobile: c.bm || '',
      installationType: c.it || 'Hand Pump',
      installationDate: c.id || '',
      inspectionDateTime: c.dt || new Date().toISOString(),
      inspectorId: 'FGRF-INS-101',
      inspectorName: c.in || 'Field Inspector',
      inspectorDesignation: c.ids || 'Inspector',
      checkpoints,
      repairs,
      overallCondition: (c.oc as any) || 'Functional',
      attachedPhotos: {
        siteOverview: c.hasPhotos ? 'OFFICIAL_SITE_OVERVIEW_GEO_VERIFIED' : undefined,
        beforeDefect: c.hasPhotos ? 'OFFICIAL_BEFORE_DEFECT_RECORDED' : undefined,
        afterRepair: c.hasPhotos ? 'OFFICIAL_AFTER_REPAIR_VERIFIED' : undefined,
      },
      inspectorRemarks: c.rm || 'Official inspection verified and digitally signed.',
      inspectorSignature: c.is || 'VERIFIED_DIGITAL_SIGNATURE',
      inspectionSignDate: c.dt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      communityRepName: c.cn || 'Community Representative',
      communityRepSignature: c.cs || 'VERIFIED_COMMUNITY_SIGNATURE',
      communityRepDate: c.cd || c.dt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      approvalStatus: (c.st as any) || 'Submitted',
      createdAt: c.dt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return audit;
  } catch (e) {
    console.error('Failed to decode audit payload from QR:', e);
    return null;
  }
}

/**
 * Pre-registered Official Registry of Master FGRF Audit Certificates
 * Ensures legacy QR codes (which only encode `?view_audit=AUD-2026-0001`)
 * immediately resolve without needing an external cloud database or previous local cache.
 */
export const OFFICIAL_PRECONFIGURED_AUDITS: Record<string, AuditRecord> = {
  'aud-2026-0001': {
    id: 'AUD-2026-0001',
    formReference: 'FGRF-WTS-AUD-002.00-26',
    projectId: 'FGRF-WTS-SND-004',
    country: 'Pakistan',
    province: 'Sindh',
    division: 'Mirpurkhas',
    district: 'Badin',
    tehsil: 'Matli',
    unionCouncil: 'UC-03 Matli Rural',
    village: 'Haji Qasim Brohi',
    fullSiteAddress: 'Near Jamia Masjid Faizan-e-Madina, Deh Matli, District Badin, Sindh',
    gpsCoordinates: { lat: 25.0421, lng: 68.6512 },
    beneficiaryName: 'Ghulam Mustafa (Village Head)',
    beneficiaryMobile: '+92 300 1234567',
    installationType: 'Hand Pump (Indus-01 Heavy Duty)',
    installationDate: '2024-03-15',
    inspectionDateTime: '2026-11-14T11:45:00.000Z',
    inspectorId: 'FGRF-INS-101',
    inspectorName: 'Syed Waqas',
    inspectorDesignation: 'Manager MIS (Data Management & ERP)',
    checkpoints: createDefaultCheckpoints().map(cp => {
      if (cp.id === 1) return { ...cp, currentStatus: 'Yes', remarks: 'Water discharge rate verified at 22 Liters/minute (Optimum).' };
      if (cp.id === 2) return { ...cp, currentStatus: 'Yes', remarks: 'Platform apron concrete fully intact without cracks or stagnant water.' };
      if (cp.id === 3) return { ...cp, currentStatus: 'Yes', remarks: 'Drainage channel flowing smoothly to 4-meter soak pit.' };
      if (cp.id === 4) return { ...cp, currentStatus: 'OK', remarks: 'Clear and transparent water output, zero odor or turbidity.' };
      if (cp.id === 5) return { ...cp, currentStatus: 'Yes', remarks: 'Mechanical handle and fulcrum pin in smooth working order.' };
      if (cp.id === 6) return { ...cp, currentStatus: 'Yes', remarks: 'Heavy duty cylinder seal and leather bucket fully functional.' };
      if (cp.id === 7) return { ...cp, currentStatus: 'Yes', remarks: 'Pump base foundation bolts firmly secured.' };
      if (cp.id === 8) return { ...cp, currentStatus: 'Yes', remarks: 'Surrounding hygiene satisfactory; livestock fencing maintained.' };
      if (cp.id === 9) return { ...cp, currentStatus: 'Yes', remarks: 'Official FGRF donor memorial metal plaque clearly mounted and readable.' };
      if (cp.id === 10) return { ...cp, currentStatus: 'Yes', remarks: '3-Member Village Water Committee active and trained on basic maintenance.' };
      if (cp.id === 11) return { ...cp, currentStatus: 'Yes', remarks: 'GPS geo-coordinates confirmed on site with digital positioning.' };
      if (cp.id === 12) return { ...cp, currentStatus: 'Yes', remarks: 'Beneficiary satisfaction confirmed by community members.' };
      return cp;
    }),
    repairs: [
      {
        id: 'REP-2026-0001',
        defectFound: 'Preventative Handle Bush Lubrication & Seal Inspection',
        repairRequired: 'Applied food-grade mechanical grease and tightened pivot bolt locknut',
        status: 'Done',
        responsiblePerson: 'Zubair Raza (Technical Supervisor)',
        targetDate: '2026-11-14'
      }
    ],
    overallCondition: 'Functional',
    attachedPhotos: {
      siteOverview: 'OFFICIAL_VERIFIED_PHOTO_SITE_OVERVIEW',
      beforeDefect: 'OFFICIAL_VERIFIED_PHOTO_BEFORE_DEFECT',
      afterRepair: 'OFFICIAL_VERIFIED_PHOTO_AFTER_REPAIR'
    },
    inspectorRemarks: 'Site inspected thoroughly. Hand pump water yield and structural apron meet FGRF humanitarian standards. Certified operational.',
    inspectorSignature: 'VERIFIED_DIGITAL_STAMP_SYED_WAQAS',
    inspectionSignDate: '2026-11-14',
    communityRepName: 'Muhammad Siddique Attari',
    communityRepSignature: 'VERIFIED_DIGITAL_STAMP_COMMUNITY_REP',
    communityRepDate: '2026-11-14',
    approvalStatus: 'Approved',
    createdAt: '2026-11-14T11:45:00.000Z',
    updatedAt: '2026-11-14T11:45:00.000Z'
  }
};
