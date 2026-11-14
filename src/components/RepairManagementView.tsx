import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Search, 
  Filter, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  Camera, 
  Calendar, 
  User, 
  Edit3, 
  Check, 
  X,
  FileText
} from 'lucide-react';
import { RepairItem, RepairStatus, UserProfile } from '../types/index.ts';
import { isRepairOverdue } from '../utils/auditLogic.ts';

interface RepairManagementViewProps {
  repairs: RepairItem[];
  currentUser: UserProfile;
  onUpdateRepair: (updatedRepair: RepairItem) => void;
}

export const RepairManagementView: React.FC<RepairManagementViewProps> = ({
  repairs,
  currentUser,
  onUpdateRepair,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterOverdueOnly, setFilterOverdueOnly] = useState(false);

  // Edit / update modal
  const [editingRepair, setEditingRepair] = useState<RepairItem | null>(null);
  const [newStatus, setNewStatus] = useState<RepairStatus>('Pending');
  const [completionRemarks, setCompletionRemarks] = useState('');
  const [afterPhotoUrl, setAfterPhotoUrl] = useState('');

  const filteredRepairs = useMemo(() => {
    return repairs.filter((r) => {
      const isOverdue = isRepairOverdue(r);

      if (filterOverdueOnly && !isOverdue) return false;
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (r.id || '').toLowerCase().includes(q) ||
          (r.defectFound || '').toLowerCase().includes(q) ||
          (r.repairRequired || '').toLowerCase().includes(q) ||
          (r.responsiblePerson || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [repairs, filterStatus, filterOverdueOnly, searchQuery]);

  const handleOpenEdit = (repair: RepairItem) => {
    setEditingRepair(repair);
    setNewStatus(repair.status);
    setCompletionRemarks(repair.completionRemarks || '');
    setAfterPhotoUrl(repair.afterPhoto || '');
  };

  const handleSaveRepair = () => {
    if (!editingRepair) return;

    const updated: RepairItem = {
      ...editingRepair,
      status: newStatus,
      completionRemarks,
      afterPhoto: afterPhotoUrl || editingRepair.afterPhoto,
      completedDate: newStatus === 'Done' ? (editingRepair.completedDate || new Date().toISOString().slice(0, 10)) : undefined,
    };

    onUpdateRepair(updated);
    setEditingRepair(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAfterPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Repair & Corrective Action Tracking</h2>
            <span className="font-urdu text-emerald-800 text-base">مرمت اور تلافی کی کارروائی</span>
          </div>
          <p className="text-xs text-slate-500">
            Monitor mechanical, hydraulic, and civil repairs until complete resolution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterOverdueOnly(!filterOverdueOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              filterOverdueOnly
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Overdue Only / تاخیر شدہ</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Repair ID, Defect, Technician..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex gap-2 text-xs">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Statuses / تمام حالتیں</option>
            <option value="Pending">Pending / زیر التوا</option>
            <option value="In Progress">In Progress / جاری</option>
            <option value="Done">Done / مکمل</option>
          </select>
        </div>
      </div>

      {/* Repairs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Repair ID</th>
                <th className="p-3.5">Defect / Issue Found</th>
                <th className="p-3.5">Corrective Action Required</th>
                <th className="p-3.5">Responsible Tech</th>
                <th className="p-3.5">Target Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRepairs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No repair items found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredRepairs.map((rep) => {
                  const overdue = isRepairOverdue(rep);
                  return (
                    <tr
                      key={rep.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        overdue ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        {rep.id}
                      </td>

                      <td className="p-3.5 font-medium text-slate-800 max-w-xs">
                        {rep.defectFound}
                      </td>

                      <td className="p-3.5 text-slate-600 max-w-xs">
                        {rep.repairRequired}
                      </td>

                      <td className="p-3.5 text-slate-700">
                        {rep.responsiblePerson}
                      </td>

                      <td className="p-3.5">
                        <div className="font-mono">{rep.targetDate}</div>
                        {overdue && (
                          <span className="text-[10px] text-rose-700 font-bold bg-rose-100 px-1.5 py-0.2 rounded border border-rose-300 inline-block mt-0.5">
                            OVERDUE
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        {rep.status === 'Done' ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                            ✓ Done
                          </span>
                        ) : rep.status === 'In Progress' ? (
                          <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-blue-300">
                            ⟳ In Progress
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                            ⏱ Pending
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(rep)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Update</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Repair Modal */}
      {editingRepair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Update Corrective Action</h3>
                <span className="font-urdu text-emerald-800 text-xs">مرمت کی پیش رفت درج کریں</span>
              </div>
              <button onClick={() => setEditingRepair(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1.5 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Repair ID:</span>
                <span className="font-mono font-bold text-slate-800">{editingRepair.id}</span>
              </div>
              <div>
                <span className="text-slate-500">Defect: </span>
                <span className="font-semibold text-slate-800">{editingRepair.defectFound}</span>
              </div>
              <div>
                <span className="text-slate-500">Target Date: </span>
                <span className="font-mono text-slate-800">{editingRepair.targetDate}</span>
              </div>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Progress Status / پیش رفت کی حالت
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Pending', 'In Progress', 'Done'] as RepairStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setNewStatus(st)}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all ${
                      newStatus === st
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {st === 'Done' ? 'Done / مکمل' : st === 'In Progress' ? 'In Progress' : 'Pending'}
                  </button>
                ))}
              </div>
            </div>

            {/* Completion Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Completion Remarks & Parts Replaced / رپورٹ
              </label>
              <textarea
                rows={3}
                value={completionRemarks}
                onChange={(e) => setCompletionRemarks(e.target.value)}
                placeholder="Details of repair done (e.g. replaced rod, tightened flange, tested water yield)..."
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* After Repair Photo Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                Upload After-Repair Photo Proof / مرمت کے بعد کی تصویر
              </label>
              {afterPhotoUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-slate-300 h-28">
                  <img src={afterPhotoUrl} alt="After repair proof" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setAfterPhotoUrl('')}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full text-xs"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="w-full h-24 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 bg-slate-50 transition-colors">
                  <Camera className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-xs text-slate-500">Click to upload photo proof</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>

            {/* Modal actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingRepair(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRepair}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
              >
                Save Updates / محفوظ کریں
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
