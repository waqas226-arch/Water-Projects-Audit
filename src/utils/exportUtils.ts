import * as XLSX from 'xlsx';
import { AuditRecord, RepairItem, WaterProject } from '../types/index.ts';
import { isRepairOverdue } from './auditLogic.ts';

export function exportToExcel(data: Record<string, any>[], sheetName: string, fileName: string): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function exportToCSV(data: Record<string, any>[], fileName: string): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateReportData(
  reportId: string,
  projects: WaterProject[],
  audits: AuditRecord[],
  repairs: RepairItem[]
): Record<string, any>[] {
  switch (reportId) {
    case 'national_audit':
      return audits.map((a) => ({
        'Audit ID': a.id,
        'Form Ref': a.formReference,
        'Project ID': a.projectId,
        'Province': a.province,
        'District': a.district,
        'Tehsil': a.tehsil,
        'Village': a.village,
        'Type': a.installationType,
        'Inspection Date': a.inspectionDateTime.slice(0, 10),
        'Inspector': a.inspectorName,
        'Overall Condition': a.overallCondition,
        'Approval Status': a.approvalStatus,
        'Repairs Count': a.repairs?.length || 0,
      }));

    case 'province_wise': {
      const provMap: Record<string, { total: number; functional: number; repairNeeded: number; nonFunctional: number }> = {};
      projects.forEach((p) => {
        if (!provMap[p.province]) {
          provMap[p.province] = { total: 0, functional: 0, repairNeeded: 0, nonFunctional: 0 };
        }
        provMap[p.province].total++;
        if (p.currentCondition === 'Functional') provMap[p.province].functional++;
        else if (p.currentCondition === 'Functional – Repair Needed') provMap[p.province].repairNeeded++;
        else provMap[p.province].nonFunctional++;
      });
      return Object.entries(provMap).map(([prov, stats]) => ({
        'Province / Territory': prov,
        'Total Projects': stats.total,
        'Fully Functional': stats.functional,
        'Repair Needed': stats.repairNeeded,
        'Non-functional / Relocated': stats.nonFunctional,
        'Operational Rate %': stats.total > 0 ? `${Math.round(((stats.functional + stats.repairNeeded) / stats.total) * 100)}%` : '0%',
      }));
    }

    case 'district_wise': {
      const distMap: Record<string, { province: string; totalProjects: number; inspections: number; functional: number }> = {};
      projects.forEach((p) => {
        const key = `${p.province} - ${p.district}`;
        if (!distMap[key]) {
          distMap[key] = { province: p.province, totalProjects: 0, inspections: 0, functional: 0 };
        }
        distMap[key].totalProjects++;
        if (p.currentCondition === 'Functional' || p.currentCondition === 'Functional – Repair Needed') {
          distMap[key].functional++;
        }
      });
      audits.forEach((a) => {
        const key = `${a.province} - ${a.district}`;
        if (distMap[key]) {
          distMap[key].inspections++;
        }
      });
      return Object.entries(distMap).map(([distKey, d]) => {
        const [prov, dist] = distKey.split(' - ');
        return {
          'Province': prov,
          'District': dist,
          'Total Projects': d.totalProjects,
          'Total Inspections': d.inspections,
          'Functional Count': d.functional,
          'Functional %': d.totalProjects > 0 ? `${Math.round((d.functional / d.totalProjects) * 100)}%` : '0%',
        };
      });
    }

    case 'project_history':
      return audits.map((a) => ({
        'Project ID': a.projectId,
        'Audit Form ID': a.id,
        'Inspection Date': a.inspectionDateTime.slice(0, 10),
        'Inspector': a.inspectorName,
        'Condition Evaluated': a.overallCondition,
        'Defects Found': a.checkpoints.filter((c) => c.currentStatus === 'No' || c.currentStatus === 'Due').length,
        'Remarks': a.inspectorRemarks || 'None',
        'Status': a.approvalStatus,
      }));

    case 'functional_analysis':
      return projects.map((p) => ({
        'Project ID': p.id,
        'Name': p.name,
        'Province': p.province,
        'District': p.district,
        'Type': p.installationType,
        'Condition': p.currentCondition,
        'Status': p.status,
        'Beneficiary': p.beneficiaryName,
        'Contact': p.beneficiaryMobile,
        'Last Inspected': p.lastInspectionDate || 'Never',
      }));

    case 'pending_repairs':
      return repairs
        .filter((r) => r.status !== 'Done')
        .map((r) => ({
          'Repair ID': r.id,
          'Defect / Issue': r.defectFound,
          'Required Action': r.repairRequired,
          'Responsible Person': r.responsiblePerson,
          'Target Date': r.targetDate,
          'Status': r.status,
          'Is Overdue': isRepairOverdue(r) ? 'YES - OVERDUE' : 'On Track',
        }));

    case 'overdue_repairs':
      return repairs
        .filter((r) => isRepairOverdue(r))
        .map((r) => ({
          'Repair ID': r.id,
          'Defect / Issue': r.defectFound,
          'Required Action': r.repairRequired,
          'Responsible Person': r.responsiblePerson,
          'Target Date': r.targetDate,
          'Days Overdue': Math.max(1, Math.floor((Date.now() - new Date(r.targetDate).getTime()) / (1000 * 60 * 60 * 24))),
          'Status': r.status,
        }));

    case 'completed_repairs':
      return repairs
        .filter((r) => r.status === 'Done')
        .map((r) => ({
          'Repair ID': r.id,
          'Defect': r.defectFound,
          'Action Completed': r.repairRequired,
          'Technician': r.responsiblePerson,
          'Target Date': r.targetDate,
          'Completion Date': r.completedDate || 'Recorded',
          'Remarks': r.completionRemarks || 'Work verified',
        }));

    case 'inspector_performance': {
      const inspMap: Record<string, { name: string; totalAudits: number; approved: number; returned: number }> = {};
      audits.forEach((a) => {
        if (!inspMap[a.inspectorId]) {
          inspMap[a.inspectorId] = { name: a.inspectorName, totalAudits: 0, approved: 0, returned: 0 };
        }
        inspMap[a.inspectorId].totalAudits++;
        if (a.approvalStatus === 'Approved') inspMap[a.inspectorId].approved++;
        if (a.approvalStatus === 'Returned for Correction') inspMap[a.inspectorId].returned++;
      });
      return Object.entries(inspMap).map(([id, stat]) => ({
        'Inspector ID': id,
        'Inspector Name': stat.name,
        'Total Submissions': stat.totalAudits,
        'Approved': stat.approved,
        'Returned for Correction': stat.returned,
        'Approval Rate %': stat.totalAudits > 0 ? `${Math.round((stat.approved / stat.totalAudits) * 100)}%` : '0%',
      }));
    }

    case 'monthly_summary': {
      const monthMap: Record<string, { total: number; functional: number; repairs: number }> = {};
      audits.forEach((a) => {
        const ym = a.inspectionDateTime.slice(0, 7); // YYYY-MM
        if (!monthMap[ym]) {
          monthMap[ym] = { total: 0, functional: 0, repairs: 0 };
        }
        monthMap[ym].total++;
        if (a.overallCondition === 'Functional') monthMap[ym].functional++;
        monthMap[ym].repairs += a.repairs?.length || 0;
      });
      return Object.entries(monthMap)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([ym, stats]) => ({
          'Month': ym,
          'Total Inspections': stats.total,
          'Functional Audits': stats.functional,
          'Repairs Logged': stats.repairs,
        }));
    }

    default:
      return [];
  }
}
