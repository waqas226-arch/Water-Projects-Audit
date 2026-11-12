import React, { useState, useMemo } from 'react';
import { 
  Droplet, 
  CheckCircle, 
  Wrench, 
  XCircle, 
  Clock, 
  Calendar, 
  MapPin, 
  TrendingUp, 
  Users, 
  Filter, 
  RotateCcw,
  Sparkles,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { AuditRecord, OverallCondition, RepairItem, WaterProject } from '../types/index.ts';
import { calculateKPIs, isRepairOverdue } from '../utils/auditLogic.ts';
import { PAKISTAN_PROVINCES } from '../utils/pakistanGeo.ts';

interface DashboardViewProps {
  projects: WaterProject[];
  audits: AuditRecord[];
  repairs: RepairItem[];
  onNavigateToNewInspection: () => void;
  onNavigateToRepairs: () => void;
  onNavigateToMap: () => void;
  onOpenAiAdvisor: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  audits,
  repairs,
  onNavigateToNewInspection,
  onNavigateToRepairs,
  onNavigateToMap,
  onOpenAiAdvisor,
}) => {
  // Interactive filters
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');

  // Filter projects based on selections
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (selectedProvince !== 'all' && p.province !== selectedProvince) return false;
      if (selectedDistrict !== 'all' && p.district !== selectedDistrict) return false;
      if (selectedType !== 'all' && p.installationType !== selectedType) return false;
      if (selectedCondition !== 'all' && p.currentCondition !== selectedCondition) return false;
      return true;
    });
  }, [projects, selectedProvince, selectedDistrict, selectedType, selectedCondition]);

  const filteredAudits = useMemo(() => {
    return audits.filter((a) => {
      if (selectedProvince !== 'all' && a.province !== selectedProvince) return false;
      if (selectedDistrict !== 'all' && a.district !== selectedDistrict) return false;
      if (selectedType !== 'all' && a.installationType !== selectedType) return false;
      if (selectedCondition !== 'all' && a.overallCondition !== selectedCondition) return false;
      return true;
    });
  }, [audits, selectedProvince, selectedDistrict, selectedType, selectedCondition]);

  const kpis = useMemo(() => {
    return calculateKPIs(filteredProjects, filteredAudits, repairs, new Date());
  }, [filteredProjects, filteredAudits, repairs]);

  // Available districts for filter
  const availableDistricts = useMemo(() => {
    const subset = selectedProvince === 'all' 
      ? projects 
      : projects.filter((p) => p.province === selectedProvince);
    return Array.from(new Set(subset.map((p) => p.district)));
  }, [projects, selectedProvince]);

  // Province-wise breakdown
  const provinceStats = useMemo(() => {
    const stats: Record<string, { total: number; functional: number; repairsNeeded: number }> = {};
    PAKISTAN_PROVINCES.forEach((p) => {
      stats[p.name] = { total: 0, functional: 0, repairsNeeded: 0 };
    });
    projects.forEach((p) => {
      if (!stats[p.province]) {
        stats[p.province] = { total: 0, functional: 0, repairsNeeded: 0 };
      }
      stats[p.province].total++;
      if (p.currentCondition === 'Functional') stats[p.province].functional++;
      if (p.currentCondition === 'Functional – Repair Needed') stats[p.province].repairsNeeded++;
    });
    return Object.entries(stats).filter(([_, s]) => s.total > 0);
  }, [projects]);

  // Pump Type Breakdown
  const typeStats = useMemo(() => {
    let handPump = 0;
    let filterHandPump = 0;
    filteredProjects.forEach((p) => {
      if (p.installationType === 'Hand Pump') handPump++;
      else filterHandPump++;
    });
    return { handPump, filterHandPump };
  }, [filteredProjects]);

  // Overdue repairs list
  const overdueRepairsList = useMemo(() => {
    return repairs.filter((r) => isRepairOverdue(r));
  }, [repairs]);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
                Head Office & Regional Surveillance
              </span>
              <span className="text-xs text-slate-300">Live Database Synchronization</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              FGRF Water Projects Audit & Monitoring System
            </h1>
            <h2 className="font-urdu text-lg sm:text-xl font-bold text-emerald-300">
              واٹر پراجیکٹس آڈٹ، مانیٹرنگ اور بحالی کا مرکزی ڈیش بورڈ
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Standardized oversight across all provinces and districts of Pakistan. Tracking installation compliance, water discharge functionality, and corrective actions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onNavigateToNewInspection}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Droplet className="w-4 h-4" />
              New Inspection / نیا معائنہ
            </button>

            <button
              onClick={onOpenAiAdvisor}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              AI Quality Advisor
            </button>

            <button
              onClick={onNavigateToMap}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              Interactive Map
            </button>
          </div>
        </div>
      </div>

      {/* Overdue Alert Bar if any */}
      {overdueRepairsList.length > 0 && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg text-rose-700">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-950 uppercase">
                {overdueRepairsList.length} Overdue Corrective Action{overdueRepairsList.length > 1 ? 's' : ''} Require Immediate Attention!
              </div>
              <div className="text-xs text-rose-800">
                Corrective action targets have lapsed. Regional maintenance teams must upload after-repair proofs.
              </div>
            </div>
          </div>
          <button
            onClick={onNavigateToRepairs}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 self-start sm:self-auto transition-colors cursor-pointer"
          >
            Resolve Overdue Repairs
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Interactive Global Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-emerald-600" />
            Interactive Filters / فلٹرز
          </span>
          {(selectedProvince !== 'all' || selectedDistrict !== 'all' || selectedType !== 'all' || selectedCondition !== 'all') && (
            <button
              onClick={() => {
                setSelectedProvince('all');
                setSelectedDistrict('all');
                setSelectedType('all');
                setSelectedCondition('all');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Province */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Province / صوبہ</label>
            <select
              value={selectedProvince}
              onChange={(e) => {
                setSelectedProvince(e.target.value);
                setSelectedDistrict('all');
              }}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Pakistan / تمام پاکستان</option>
              {PAKISTAN_PROVINCES.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.nameUrdu})
                </option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">District / ضلع</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Districts / تمام اضلاع</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Installation Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Installation Type / قسم</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Types (Hand & Filter)</option>
              <option value="Hand Pump">Hand Pump (ہینڈ پمپ)</option>
              <option value="Filter Hand Pump">Filter Hand Pump (فلٹر پمپ)</option>
            </select>
          </div>

          {/* Overall Condition */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Overall Condition / حالت</label>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Conditions / تمام حالتیں</option>
              <option value="Functional">Functional / فعال</option>
              <option value="Functional – Repair Needed">Repair Needed / مرمت درکار</option>
              <option value="Non-functional">Non-functional / غیر فعال</option>
              <option value="Not Installed / Wrong Location">Not Installed / غلط مقام</option>
            </select>
          </div>
        </div>
      </div>

      {/* 10 Key Performance Indicators (KPIs) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Live Key Performance Indicators (KPIs)
          </h3>
          <span className="text-xs text-slate-400">Calculated from verified records</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* 1. Total Registered */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Registered Water Projects</span>
              <Droplet className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900">{kpis.totalProjects}</div>
              <div className="font-urdu text-[11px] text-slate-500">کل رجسٹرڈ واٹر پراجیکٹس</div>
            </div>
          </div>

          {/* 2. Total Inspections */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Inspections Conducted</span>
              <ShieldCheck className="w-4 h-4 text-teal-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900">{kpis.totalInspections}</div>
              <div className="font-urdu text-[11px] text-slate-500">کل معائنہ جات</div>
            </div>
          </div>

          {/* 3. Functional */}
          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800">Functional</span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-emerald-800">{kpis.functionalCount}</div>
              <div className="font-urdu text-[11px] text-emerald-700">فعال پمپ</div>
            </div>
          </div>

          {/* 4. Repair Needed */}
          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800">Functional – Repair Needed</span>
              <Wrench className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-amber-800">{kpis.functionalRepairNeededCount}</div>
              <div className="font-urdu text-[11px] text-amber-700">فعال مگر مرمت درکار</div>
            </div>
          </div>

          {/* 5. Non-functional */}
          <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/20 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-800">Non-functional</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-rose-800">{kpis.nonFunctionalCount}</div>
              <div className="font-urdu text-[11px] text-rose-700">غیر فعال پمپ</div>
            </div>
          </div>

          {/* 6. Not Installed / Wrong Location */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Not Installed / Wrong</span>
              <MapPin className="w-4 h-4 text-slate-500" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-700">{kpis.notInstalledCount}</div>
              <div className="font-urdu text-[11px] text-slate-500">نصب نہیں / غلط مقام</div>
            </div>
          </div>

          {/* 7. Pending Repairs */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Pending Repairs</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-amber-800">{kpis.pendingRepairsCount}</div>
              <div className="font-urdu text-[11px] text-slate-500">زیر التوا مرمتیں</div>
            </div>
          </div>

          {/* 8. Repairs Completed */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Repairs Completed</span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-emerald-700">{kpis.completedRepairsCount}</div>
              <div className="font-urdu text-[11px] text-slate-500">مکمل شدہ مرمتیں</div>
            </div>
          </div>

          {/* 9. Overdue Repairs */}
          <div className={`p-4 rounded-2xl border shadow-xs flex flex-col justify-between ${
            kpis.overdueRepairsCount > 0 ? 'bg-rose-100/60 border-rose-300' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${kpis.overdueRepairsCount > 0 ? 'text-rose-900 font-bold' : 'text-slate-500'}`}>
                Overdue Repairs
              </span>
              <AlertOctagon className={`w-4 h-4 ${kpis.overdueRepairsCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
            </div>
            <div className="mt-3">
              <div className={`text-2xl font-black ${kpis.overdueRepairsCount > 0 ? 'text-rose-700' : 'text-slate-800'}`}>
                {kpis.overdueRepairsCount}
              </div>
              <div className="font-urdu text-[11px] text-rose-700">تاخیر شدہ مرمتیں</div>
            </div>
          </div>

          {/* 10. Inspections This Month */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Inspections This Month</span>
              <Calendar className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-cyan-800">{kpis.inspectionsThisMonthCount}</div>
              <div className="font-urdu text-[11px] text-slate-500">رواں ماہ کے معائنہ جات</div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytical Charts & Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Province-Wise Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Province-Wise Water Projects Distribution</h3>
              <div className="font-urdu text-xs text-slate-500">صوبہ وار واٹر پراجیکٹس اور فعالیت کی شرح</div>
            </div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {kpis.functionalPercentage}% Overall Operational
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {provinceStats.map(([provName, stat]) => {
              const pct = stat.total > 0 ? Math.round(((stat.functional + stat.repairsNeeded) / stat.total) * 100) : 0;
              return (
                <div key={provName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{provName}</span>
                    <span className="text-slate-500">
                      <strong>{stat.total}</strong> projects ({stat.functional} functional, {stat.repairsNeeded} repairs) – {pct}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${(stat.functional / stat.total) * 100}%` }}
                      className="bg-emerald-500 h-full"
                      title="Functional"
                    />
                    <div
                      style={{ width: `${(stat.repairsNeeded / stat.total) * 100}%` }}
                      className="bg-amber-400 h-full"
                      title="Repair Needed"
                    />
                    <div
                      style={{ width: `${((stat.total - stat.functional - stat.repairsNeeded) / stat.total) * 100}%` }}
                      className="bg-rose-400 h-full"
                      title="Non-functional"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hand Pump vs Filter Hand Pump */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Installation Technology Ratio</h3>
            <div className="font-urdu text-xs text-slate-500">ہینڈ پمپ بنام فلٹر ہینڈ پمپ</div>
          </div>

          <div className="flex items-center justify-center py-6">
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* Circular gauge representation */}
              <div className="text-center">
                <div className="text-3xl font-black text-slate-900">{kpis.totalProjects}</div>
                <div className="text-xs text-slate-500 font-semibold uppercase">Total Units</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-center">
              <span className="text-xs text-emerald-800 font-bold block">Filter Hand Pump</span>
              <span className="text-xl font-black text-emerald-900">{typeStats.filterHandPump}</span>
              <span className="font-urdu text-[11px] text-emerald-700 block">فلٹر پمپ</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-xs text-slate-700 font-bold block">Standard Hand Pump</span>
              <span className="text-xl font-black text-slate-900">{typeStats.handPump}</span>
              <span className="font-urdu text-[11px] text-slate-600 block">سادہ ہینڈ پمپ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
