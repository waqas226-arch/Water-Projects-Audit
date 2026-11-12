import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Printer, 
  CheckCircle2, 
  RotateCcw, 
  Eye, 
  Sparkles, 
  Camera, 
  MapPin, 
  User, 
  Calendar,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  X,
  QrCode,
  Download
} from 'lucide-react';
import { AuditRecord, InspectionApprovalStatus, UserProfile } from '../types/index.ts';
import { filterRecordsByJurisdiction } from '../utils/auditLogic.ts';

interface InspectionRecordsViewProps {
  audits: AuditRecord[];
  currentUser: UserProfile;
  onViewPrintableForm: (audit: AuditRecord) => void;
  onUpdateAuditApproval: (auditId: string, status: InspectionApprovalStatus, remarks?: string) => void;
  onOpenAiAdvisor: (audit: AuditRecord) => void;
}

export const InspectionRecordsView: React.FC<InspectionRecordsViewProps> = ({
  audits,
  currentUser,
  onViewPrintableForm,
  onUpdateAuditApproval,
  onOpenAiAdvisor,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvince, setFilterProvince] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [selectedQrAudit, setSelectedQrAudit] = useState<AuditRecord | null>(null);

  // Review modal state
  const [reviewingAudit, setReviewingAudit] = useState<AuditRecord | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');

  // Apply jurisdiction filters
  const permittedAudits = useMemo(() => {
    return filterRecordsByJurisdiction(audits, currentUser);
  }, [audits, currentUser]);

  const filteredAudits = useMemo(() => {
    return permittedAudits.filter((a) => {
      if (filterProvince !== 'all' && a.province !== filterProvince) return false;
      if (filterStatus !== 'all' && a.approvalStatus !== filterStatus) return false;
      if (filterCondition !== 'all' && a.overallCondition !== filterCondition) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          a.id.toLowerCase().includes(q) ||
          a.projectId.toLowerCase().includes(q) ||
          a.district.toLowerCase().includes(q) ||
          a.village.toLowerCase().includes(q) ||
          a.inspectorName.toLowerCase().includes(q) ||
          a.beneficiaryName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [permittedAudits, filterProvince, filterStatus, filterCondition, searchQuery]);

  const canReview = currentUser.role === 'super_admin' || currentUser.role === 'national_mgmt' || currentUser.role === 'provincial_coord';

  const handleApprove = (audit: AuditRecord) => {
    onUpdateAuditApproval(audit.id, 'Approved', reviewRemarks || 'Inspection verified and approved by Head Office.');
    setReviewingAudit(null);
    setReviewRemarks('');
  };

  const handleReturn = (audit: AuditRecord) => {
    if (!reviewRemarks.trim()) {
      alert('Please provide return remarks explaining what needs correction.');
      return;
    }
    onUpdateAuditApproval(audit.id, 'Returned for Correction', reviewRemarks);
    setReviewingAudit(null);
    setReviewRemarks('');
  };

  const getConditionBadge = (cond: string) => {
    switch (cond) {
      case 'Functional':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">Functional / فعال</span>;
      case 'Functional – Repair Needed':
        return <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-300">Repair Needed / مرمت درکار</span>;
      case 'Non-functional':
        return <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-rose-300">Non-functional / غیر فعال</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-slate-300">Wrong Location / غلط مقام</span>;
    }
  };

  const getApprovalBadge = (status: InspectionApprovalStatus) => {
    switch (status) {
      case 'Approved':
        return <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-emerald-200">✓ Approved</span>;
      case 'Under Review':
        return <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-blue-200">⟳ Under Review</span>;
      case 'Returned for Correction':
        return <span className="bg-rose-50 text-rose-700 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-rose-200">⚠ Returned</span>;
      default:
        return <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-amber-200">Submitted</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Water Projects Audit Records</h2>
            <span className="font-urdu text-emerald-800 text-base">معائنہ فارم ریکارڈز</span>
          </div>
          <p className="text-xs text-slate-500">
            Official digitized audit reports under reference FGRF-WTS-AUD-002.00-26.
          </p>
        </div>

        <div className="text-xs text-slate-500">
          Showing <strong>{filteredAudits.length}</strong> of {permittedAudits.length} records in jurisdiction
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Audit ID, Project ID, Village, District, Inspector..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <select
              value={filterProvince}
              onChange={(e) => setFilterProvince(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Provinces / تمام صوبے</option>
              <option value="Sindh">Sindh</option>
              <option value="Punjab">Punjab</option>
              <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
              <option value="Balochistan">Balochistan</option>
              <option value="Islamabad Capital Territory">Islamabad</option>
              <option value="Azad Jammu & Kashmir">AJK</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Approval Status</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Returned for Correction">Returned for Correction</option>
            </select>

            <select
              value={filterCondition}
              onChange={(e) => setFilterCondition(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Conditions</option>
              <option value="Functional">Functional</option>
              <option value="Functional – Repair Needed">Repair Needed</option>
              <option value="Non-functional">Non-functional</option>
              <option value="Not Installed / Wrong Location">Wrong Location</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Audit Form Ref</th>
                <th className="p-3.5">Project ID & Village</th>
                <th className="p-3.5">District / Province</th>
                <th className="p-3.5">Inspection Date</th>
                <th className="p-3.5">Condition Evaluated</th>
                <th className="p-3.5">Repairs</th>
                <th className="p-3.5">Approval Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No inspection audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredAudits.map((audit) => (
                  <tr key={audit.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Form Ref & QR Thumbnail */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        {audit.qrCodeDataUrl ? (
                          <button
                            type="button"
                            onClick={() => setSelectedQrAudit(audit)}
                            className="shrink-0 p-0.5 bg-white border border-emerald-300 rounded hover:ring-2 hover:ring-emerald-500 transition-all cursor-pointer shadow-2xs"
                            title="Click to view & download verification QR Code"
                          >
                            <img src={audit.qrCodeDataUrl} alt="QR Code" className="w-8 h-8 object-contain" />
                          </button>
                        ) : (
                          <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                            <QrCode className="w-4 h-4 text-emerald-600" />
                          </div>
                        )}
                        <div>
                          <div className="font-mono font-bold text-emerald-950 flex items-center gap-1">
                            <span>{audit.id}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{audit.formReference}</div>
                        </div>
                      </div>
                    </td>

                    {/* Project & Village */}
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{audit.projectId}</div>
                      <div className="text-slate-500 truncate max-w-xs">{audit.village}</div>
                    </td>

                    {/* District */}
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{audit.district}</div>
                      <div className="text-slate-400 text-[10px]">{audit.province}</div>
                    </td>

                    {/* Inspection Date & Inspector */}
                    <td className="p-3.5">
                      <div className="font-medium text-slate-800">{audit.inspectionDateTime.slice(0, 10)}</div>
                      <div className="text-slate-500 text-[10px] truncate max-w-[120px]">{audit.inspectorName}</div>
                    </td>

                    {/* Condition */}
                    <td className="p-3.5">
                      {getConditionBadge(audit.overallCondition)}
                    </td>

                    {/* Repairs */}
                    <td className="p-3.5 font-medium">
                      {audit.repairs && audit.repairs.length > 0 ? (
                        <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {audit.repairs.length} action{audit.repairs.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400">None required</span>
                      )}
                    </td>

                    {/* Approval Status */}
                    <td className="p-3.5">
                      {getApprovalBadge(audit.approvalStatus)}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Printable Form */}
                        <button
                          type="button"
                          onClick={() => onViewPrintableForm(audit)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                          title="View & Print Official 2-Page Audit Form"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          <span>Official Form</span>
                        </button>

                        {/* AI Advisor Scrutiny */}
                        <button
                          type="button"
                          onClick={() => onOpenAiAdvisor(audit)}
                          className="px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold rounded-lg transition-colors flex items-center gap-1 border border-cyan-200"
                          title="Run Gemini 4 Carbon High-Thinking Audit Scrutiny"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                          <span>AI Scrutiny</span>
                        </button>

                        {/* Review / Approve Button (if permitted) */}
                        {canReview && (
                          <button
                            type="button"
                            onClick={() => {
                              setReviewingAudit(audit);
                              setReviewRemarks(audit.reviewRemarks || '');
                            }}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-2xs"
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Approval Modal */}
      {reviewingAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Head Office Inspection Review</h3>
                <span className="font-urdu text-emerald-800 text-xs">معائنہ رپورٹ کی توثیق یا واپسی</span>
              </div>
              <button onClick={() => setReviewingAudit(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-1.5 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Audit Form:</span>
                <span className="font-mono font-bold text-emerald-900">{reviewingAudit.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Project ID:</span>
                <span className="font-bold text-slate-800">{reviewingAudit.projectId} ({reviewingAudit.district})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Evaluated Condition:</span>
                <span className="font-bold text-emerald-800">{reviewingAudit.overallCondition}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Field Inspector:</span>
                <span className="font-semibold text-slate-700">{reviewingAudit.inspectorName}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Review Remarks / Feedback Note
              </label>
              <textarea
                rows={3}
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                placeholder="Enter feedback for the inspector or regional repair team..."
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleReturn(reviewingAudit)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-300 transition-colors flex items-center gap-1.5"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                Return for Correction
              </button>
              <button
                type="button"
                onClick={() => handleApprove(reviewingAudit)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Approve Audit Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Verification Modal */}
      {selectedQrAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 border-2 border-emerald-500">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-xs uppercase text-slate-800 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>Verification QR Code</span>
              </span>
              <button onClick={() => setSelectedQrAudit(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="font-mono font-black text-lg text-emerald-950">{selectedQrAudit.id}</div>
              <div className="text-xs text-slate-600 mt-0.5">
                {selectedQrAudit.projectId} • {selectedQrAudit.district}
              </div>
              <div className="text-[11px] font-semibold text-emerald-800">
                Condition: {selectedQrAudit.overallCondition}
              </div>
            </div>

            {selectedQrAudit.qrCodeDataUrl ? (
              <div className="p-2 bg-white rounded-xl border-2 border-dashed border-emerald-400 inline-block shadow-sm">
                <img
                  src={selectedQrAudit.qrCodeDataUrl}
                  alt="Audit QR"
                  className="w-48 h-48 mx-auto object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-xl text-xs text-slate-400">
                No stored QR Code image for this audit.
              </div>
            )}

            <div className="pt-2">
              {selectedQrAudit.qrCodeDataUrl && (
                <a
                  href={selectedQrAudit.qrCodeDataUrl}
                  download={`FGRF_Water_Audit_QR_${selectedQrAudit.id}.png`}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download QR Code (.png)</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
