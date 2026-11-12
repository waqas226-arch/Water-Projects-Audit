import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  FileText, 
  Filter, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Layers
} from 'lucide-react';
import { AuditRecord, RepairItem, WaterProject } from '../types/index.ts';
import { exportToCSV, exportToExcel, generateReportData } from '../utils/exportUtils.ts';

interface ReportsViewProps {
  projects: WaterProject[];
  audits: AuditRecord[];
  repairs: RepairItem[];
}

interface ReportOption {
  id: string;
  title: string;
  titleUrdu: string;
  description: string;
  category: 'national' | 'provincial' | 'repairs' | 'performance';
}

const REPORT_OPTIONS: ReportOption[] = [
  {
    id: 'national_audit',
    title: '1. National Water Projects Audit Report',
    titleUrdu: 'قومی واٹر پراجیکٹس آڈٹ رپورٹ',
    description: 'Master record of all field inspections across Pakistan with project code, condition, and inspector details.',
    category: 'national',
  },
  {
    id: 'province_wise',
    title: '2. Province-wise Inspection Report',
    titleUrdu: 'صوبہ وار معائنہ اور فعالیت رپورٹ',
    description: 'Summary of project installations and functional rates segregated by province and territory.',
    category: 'provincial',
  },
  {
    id: 'district_wise',
    title: '3. District-wise Inspection Report',
    titleUrdu: 'ضلع وار کارکردگی اور مانیٹرنگ رپورٹ',
    description: 'District level metrics tracking total hand pumps, filter units, and inspection coverage.',
    category: 'provincial',
  },
  {
    id: 'project_history',
    title: '4. Project-wise Inspection History',
    titleUrdu: 'پراجیکٹ وار معائنہ جات کی تاریخ',
    description: 'Audit history per individual installation showing defect trends over time.',
    category: 'national',
  },
  {
    id: 'functional_analysis',
    title: '5. Functional vs Non-functional Projects',
    titleUrdu: 'فعال اور غیر فعال پراجیکٹس کا تقابلی جائزہ',
    description: 'Breakdown of fully working vs defective, maintenance-required or wrongly installed units.',
    category: 'national',
  },
  {
    id: 'pending_repairs',
    title: '6. Pending Repair Report',
    titleUrdu: 'زیر التوا مرمتوں کی تفصیلی رپورٹ',
    description: 'Active corrective action cases assigned to regional maintenance teams.',
    category: 'repairs',
  },
  {
    id: 'overdue_repairs',
    title: '7. Overdue Repair Report',
    titleUrdu: 'تاخیر شدہ مرمتوں کی ہنگامی رپورٹ',
    description: 'Urgent list of unresolved repairs whose target completion dates have passed.',
    category: 'repairs',
  },
  {
    id: 'completed_repairs',
    title: '8. Completed Repair Report',
    titleUrdu: 'مکمل شدہ تلافی اور بحالی کی رپورٹ',
    description: 'Historical archive of successful repairs with technician sign-off and completion dates.',
    category: 'repairs',
  },
  {
    id: 'inspector_performance',
    title: '9. Inspector Performance Report',
    titleUrdu: 'فیلڈ انسپکٹرز کی کارکردگی رپورٹ',
    description: 'Audit submission volume, approval rates, and returns per field inspector.',
    category: 'performance',
  },
  {
    id: 'monthly_summary',
    title: '10. Monthly Audit Summary',
    titleUrdu: 'ماہانہ آڈٹ اور معائنہ کا خلاصہ',
    description: 'Month-by-month trajectory of water audits conducted, functional ratios, and new repairs.',
    category: 'performance',
  },
];

export const ReportsView: React.FC<ReportsViewProps> = ({
  projects,
  audits,
  repairs,
}) => {
  const [selectedReportId, setSelectedReportId] = useState<string>('national_audit');
  const [searchTerm, setSearchTerm] = useState('');

  const currentReportOption = REPORT_OPTIONS.find((r) => r.id === selectedReportId) || REPORT_OPTIONS[0];

  const reportData = useMemo(() => {
    return generateReportData(selectedReportId, projects, audits, repairs);
  }, [selectedReportId, projects, audits, repairs]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return reportData;
    const q = searchTerm.toLowerCase();
    return reportData.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(q))
    );
  }, [reportData, searchTerm]);

  const handleExportExcel = () => {
    exportToExcel(reportData, 'FGRF Audit Report', `FGRF_${selectedReportId}_${new Date().toISOString().slice(0, 10)}`);
  };

  const handleExportCSV = () => {
    exportToCSV(reportData, `FGRF_${selectedReportId}_${new Date().toISOString().slice(0, 10)}`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Get table column headers
  const columns = reportData.length > 0 ? Object.keys(reportData[0]) : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Reports & Analytics Center</h2>
            <span className="font-urdu text-emerald-800 text-base">رپورٹس اور ڈیٹا ایکسپورٹ</span>
          </div>
          <p className="text-xs text-slate-500">
            Generate and export official FGRF audit reports in Excel (.xlsx), CSV, and PDF print formats.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel (.xlsx)
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 border border-slate-300 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Export CSV
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 border border-slate-300 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            Print Report
          </button>
        </div>
      </div>

      {/* 10 Reports Tabs / Grid */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Select From All 10 Required Official Reports / دس اہم رپورٹس
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {REPORT_OPTIONS.map((rep) => {
            const isSelected = selectedReportId === rep.id;
            return (
              <button
                key={rep.id}
                type="button"
                onClick={() => setSelectedReportId(rep.id)}
                className={`p-3 text-left rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className={`text-xs font-bold ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                    {rep.title}
                  </div>
                  <div className="font-urdu text-[11px] text-slate-500 mt-0.5 truncate">
                    {rep.titleUrdu}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-2 line-clamp-1">
                  {rep.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Report Preview & Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Banner */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{currentReportOption.title}</h3>
            <p className="text-xs text-slate-500">{currentReportOption.description}</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in table..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                {columns.map((col) => (
                  <th key={col} className="p-3 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length || 1} className="p-8 text-center text-slate-400">
                    No data records currently available for this report criteria.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    {columns.map((col) => (
                      <td key={col} className="p-3 whitespace-nowrap text-slate-800">
                        {row[col] !== undefined && row[col] !== null ? String(row[col]) : '—'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>Showing {filteredData.length} records</span>
          <span className="text-[11px] text-slate-500 text-center sm:text-right">
            Software Making Rights & Copyright: <span className="font-semibold text-slate-700">FGRF - Data Management & ERP Department</span> • Syed Waqas (Manager MIS)
          </span>
        </div>
      </div>
    </div>
  );
};
