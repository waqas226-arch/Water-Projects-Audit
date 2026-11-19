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
  Video,
  MapPin, 
  User, 
  Calendar,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  X,
  QrCode,
  Download,
  ExternalLink,
  Edit,
  Trash2,
  Check,
  AlertTriangle
} from 'lucide-react';
import { AuditRecord, InspectionApprovalStatus, UserProfile } from '../types/index.ts';
import { filterRecordsByJurisdiction } from '../utils/auditLogic.ts';
import QRCode from 'qrcode';
import { encodeAuditForQr } from '../utils/auditPayload.ts';

interface InspectionRecordsViewProps {
  audits: AuditRecord[];
  currentUser: UserProfile;
  onViewPrintableForm: (audit: AuditRecord) => void;
  onUpdateAuditApproval: (auditId: string, status: InspectionApprovalStatus, remarks?: string) => void;
  onOpenAiAdvisor: (audit: AuditRecord) => void;
  onEditAudit?: (audit: AuditRecord) => void;
  onDeleteAudit?: (auditId: string) => void;
}

export const InspectionRecordsView: React.FC<InspectionRecordsViewProps> = ({
  audits,
  currentUser,
  onViewPrintableForm,
  onUpdateAuditApproval,
  onOpenAiAdvisor,
  onEditAudit,
  onDeleteAudit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvince, setFilterProvince] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [selectedQrAudit, setSelectedQrAudit] = useState<AuditRecord | null>(null);
  const [modalQrCodeUrl, setModalQrCodeUrl] = useState<string>('');

  // Edit & Delete states
  const [editingAudit, setEditingAudit] = useState<AuditRecord | null>(null);
  const [deletingAudit, setDeletingAudit] = useState<AuditRecord | null>(null);
  const [editError, setEditError] = useState<string>('');

  React.useEffect(() => {
    if (!selectedQrAudit) {
      setModalQrCodeUrl('');
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const payload = encodeAuditForQr(selectedQrAudit);
    const verificationUrl = `${origin}${pathname}?view_audit=${selectedQrAudit.id}&d=${payload}`;
    QRCode.toDataURL(verificationUrl, {
      width: 320,
      margin: 2,
      color: { dark: '#064e3b', light: '#ffffff' }
    }).then(url => setModalQrCodeUrl(url)).catch(() => {});
  }, [selectedQrAudit]);

  // Review modal state
  const [reviewingAudit, setReviewingAudit] = useState<AuditRecord | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');

  // Apply jurisdiction filters
  const permittedAudits = useMemo(() => {
    return filterRecordsByJurisdiction(audits, currentUser);
  }, [audits, currentUser]);

  const filteredAudits = useMemo(() => {
    return permittedAudits.filter((a) => {
      if (!a) return false;
      if (filterProvince !== 'all' && a.province !== filterProvince) return false;
      if (filterStatus !== 'all' && a.approvalStatus !== filterStatus) return false;
      if (filterCondition !== 'all' && a.overallCondition !== filterCondition) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          (a.id || '').toLowerCase().includes(q) ||
          (a.projectId || '').toLowerCase().includes(q) ||
          (a.district || '').toLowerCase().includes(q) ||
          (a.village || '').toLowerCase().includes(q) ||
          (a.inspectorName || '').toLowerCase().includes(q) ||
          (a.beneficiaryName || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [permittedAudits, filterProvince, filterStatus, filterCondition, searchQuery]);

  const canReview = currentUser.role === 'super_admin' || currentUser.role === 'national_mgmt' || currentUser.role === 'provincial_coord';

  const handleOpenEditModal = (audit: AuditRecord) => {
    setEditingAudit({ ...audit });
    setEditError('');
  };

  const handleSaveEditAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAudit) return;
    if (!editingAudit.projectId.trim() || !editingAudit.village?.trim()) {
      setEditError('Project ID and Village/Location are required.');
      return;
    }
    if (onEditAudit) {
      onEditAudit(editingAudit);
    }
    setEditingAudit(null);
    setEditError('');
  };

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
                            <span>{audit.id || 'N/A'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{audit.formReference || 'FGRF-WTS-AUD-002.00-26'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Project & Village */}
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{audit.projectId || 'N/A'}</div>
                      <div className="text-slate-500 truncate max-w-xs">{audit.village || 'N/A'}</div>
                    </td>

                    {/* District */}
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{audit.district || 'N/A'}</div>
                      <div className="text-slate-400 text-[10px]">{audit.province || ''}</div>
                    </td>

                    {/* Inspection Date & Inspector */}
                    <td className="p-3.5">
                      <div className="font-medium text-slate-800">
                        {audit.inspectionDateTime ? audit.inspectionDateTime.slice(0, 10) : 'N/A'}
                      </div>
                      <div className="text-slate-500 text-[10px] truncate max-w-[120px]">{audit.inspectorName || 'Field Inspector'}</div>
                    </td>

                    {/* Condition */}
                    <td className="p-3.5">
                      {getConditionBadge(audit.overallCondition || 'Functional')}
                    </td>

                    {/* Repairs */}
                    <td className="p-3.5 font-medium">
                      {Array.isArray(audit.repairs) && audit.repairs.length > 0 ? (
                        <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {audit.repairs.length} action{audit.repairs.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400">None required</span>
                      )}
                    </td>

                    {/* Approval Status */}
                    <td className="p-3.5">
                      {getApprovalBadge(audit.approvalStatus || 'Submitted')}
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

                        {/* Edit Audit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(audit)}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 rounded-lg transition-colors cursor-pointer"
                          title="Edit Audit Record / معائنہ فارم ریکارڈ میں ترمیم کریں"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Audit Button - STRICTLY SUPER ADMIN ONLY */}
                        {currentUser.role === 'super_admin' && (
                          <button
                            type="button"
                            onClick={() => setDeletingAudit(audit)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg transition-colors cursor-pointer"
                            title="Permanently Delete Audit Record (Super Admin Only) / معائنہ فارم ریکارڈ حذف کریں"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
                <span className="font-mono font-bold text-emerald-900">{reviewingAudit.id || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Project ID:</span>
                <span className="font-bold text-slate-800">{reviewingAudit.projectId || 'N/A'} ({reviewingAudit.district || 'N/A'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Evaluated Condition:</span>
                <span className="font-bold text-emerald-800">{reviewingAudit.overallCondition || 'Functional'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Field Inspector:</span>
                <span className="font-semibold text-slate-700">{reviewingAudit.inspectorName || 'Field Inspector'}</span>
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

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const target = reviewingAudit;
                  setReviewingAudit(null);
                  setDeletingAudit(target);
                }}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Permanently delete this audit record"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete / حذف</span>
              </button>
              <div className="flex items-center gap-2">
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
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-rose-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete Audit Record / معائنہ فارم حذف کریں
                </h3>
                <p className="text-xs text-rose-600 font-semibold">
                  Permanent Removal from Registry & Cloud
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Audit Code:</span>
                <span className="font-mono font-bold text-slate-900">{deletingAudit.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Project / Site:</span>
                <span className="font-bold text-slate-800">{deletingAudit.projectId} ({deletingAudit.village || 'N/A'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">District:</span>
                <span className="text-slate-700">{deletingAudit.district}, {deletingAudit.province}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Inspection Date:</span>
                <span className="text-slate-700">{deletingAudit.inspectionDateTime?.slice(0, 10)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 space-y-1">
              <p className="font-semibold flex items-center gap-1 text-amber-900">
                <AlertTriangle className="w-3.5 h-3.5" />
                Important Note / اہم تنبیہ:
              </p>
              <p>
                Deleting this audit will permanently remove it from both local device storage and the central cloud database. It will NEVER be restored when you log off, log on, or refresh.
              </p>
              <p className="font-urdu text-[12px] leading-relaxed text-right">
                یہ ریکارڈ مستقل طور پر حذف ہو جائے گا اور دوبارہ لاگ ان کرنے پر بھی واپس نہیں آئے گا۔
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingAudit(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel / منسوخ کریں
              </button>
              <button
                type="button"
                onClick={() => {
                  if (currentUser.role !== 'super_admin') {
                    alert('Access Denied: Only HQ Super Admin has the authority to permanently delete Audit Records.');
                    setDeletingAudit(null);
                    return;
                  }
                  if (onDeleteAudit && deletingAudit) {
                    onDeleteAudit(deletingAudit.id);
                  }
                  setDeletingAudit(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-rose-600/30 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently / مستقل حذف کریں</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Audit Record Modal */}
      {editingAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Audit Record / معائنہ فارم ریکارڈ میں ترمیم
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {editingAudit.id} • Form {editingAudit.formReference || 'FGRF-WTS-AUD-002.00-26'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAudit(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditAudit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Project ID */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Project ID / پراجیکٹ کوڈ</label>
                  <input
                    type="text"
                    value={editingAudit.projectId}
                    onChange={(e) => setEditingAudit({ ...editingAudit, projectId: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Village / Site Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Village / گاؤں کا نام</label>
                  <input
                    type="text"
                    value={editingAudit.village || ''}
                    onChange={(e) => setEditingAudit({ ...editingAudit, village: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* District */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">District / ضلع</label>
                  <input
                    type="text"
                    value={editingAudit.district || ''}
                    onChange={(e) => setEditingAudit({ ...editingAudit, district: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Province */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Province / صوبہ</label>
                  <input
                    type="text"
                    value={editingAudit.province || ''}
                    onChange={(e) => setEditingAudit({ ...editingAudit, province: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Inspection Date */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Inspection Date / تاریخ معائنہ</label>
                  <input
                    type="date"
                    value={editingAudit.inspectionDateTime ? editingAudit.inspectionDateTime.slice(0, 10) : ''}
                    onChange={(e) => setEditingAudit({ ...editingAudit, inspectionDateTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Inspector Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Inspector Name / معائنہ کار کا نام</label>
                  <input
                    type="text"
                    value={editingAudit.inspectorName || ''}
                    onChange={(e) => setEditingAudit({ ...editingAudit, inspectorName: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Overall Condition */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Condition Evaluated / مجموعی حالت</label>
                  <select
                    value={editingAudit.overallCondition || 'Functional'}
                    onChange={(e) => setEditingAudit({ ...editingAudit, overallCondition: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="Functional">Functional / مکمل فعال</option>
                    <option value="Functional – Repair Needed">Functional – Repair Needed / فعال لیکن مرمت درکار</option>
                    <option value="Non-functional">Non-functional / غیر فعال</option>
                    <option value="Decommissioned / Wrong Location">Decommissioned / Wrong Location / ناکارہ</option>
                  </select>
                </div>

                {/* Approval Status */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Approval Status / منظوری کی حیثیت</label>
                  <select
                    value={editingAudit.approvalStatus || 'Submitted'}
                    onChange={(e) => setEditingAudit({ ...editingAudit, approvalStatus: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="Submitted">Submitted / ارسال شدہ</option>
                    <option value="Approved">Approved / منظور شدہ</option>
                    <option value="Returned">Returned / واپس برائے اصلاح</option>
                    <option value="Rejected">Rejected / مسترد</option>
                  </select>
                </div>

                {/* Beneficiary Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Beneficiary Name / مستفید کنندہ</label>
                  <input
                    type="text"
                    value={editingAudit.beneficiaryName || ''}
                    onChange={(e) => setEditingAudit({ ...editingAudit, beneficiaryName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Beneficiary Mobile */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Beneficiary Mobile / موبائل نمبر</label>
                  <input
                    type="text"
                    value={editingAudit.beneficiaryMobile || ''}
                    onChange={(e) => setEditingAudit({ ...editingAudit, beneficiaryMobile: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Inspector Remarks */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Inspector Remarks / معائنہ کار کے ریمارکس</label>
                <textarea
                  rows={3}
                  value={editingAudit.inspectorRemarks || ''}
                  onChange={(e) => setEditingAudit({ ...editingAudit, inspectorRemarks: e.target.value })}
                  placeholder="Enter any technical observations, defects, or field notes..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAudit(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel / منسوخ کریں
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-emerald-700/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes / محفوظ کریں</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Verification & Completed Media Preview Modal */}
      {selectedQrAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 text-center space-y-4 border-2 border-emerald-500 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-xs uppercase text-slate-800 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>Verification QR Code & Field Media</span>
              </span>
              <button onClick={() => setSelectedQrAudit(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="font-mono font-black text-lg text-emerald-950">{selectedQrAudit.id || 'N/A'}</div>
              <div className="text-xs text-slate-600 mt-0.5">
                Project: <strong>{selectedQrAudit.projectId || 'N/A'}</strong> • {selectedQrAudit.district || 'N/A'} ({selectedQrAudit.tehsil || ''})
              </div>
              <div className="text-[11px] font-semibold text-emerald-800 mt-1">
                Condition: <span className="bg-emerald-100 px-2 py-0.5 rounded-full">{selectedQrAudit.overallCondition || 'Functional'}</span>
              </div>
            </div>

            {/* QR Code Image */}
            {(modalQrCodeUrl || selectedQrAudit.qrCodeDataUrl) ? (
              <div className="p-2 bg-white rounded-xl border-2 border-dashed border-emerald-400 inline-block shadow-sm">
                <img
                  src={modalQrCodeUrl || selectedQrAudit.qrCodeDataUrl}
                  alt="Audit QR"
                  className="w-40 h-40 mx-auto object-contain rounded-lg"
                />
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Scan to verify inspection record authenticity
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-xl text-xs text-slate-400">
                Generating verification QR Code...
              </div>
            )}

            {/* Attached Media Previews */}
            <div className="text-left bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="text-[11px] font-bold text-slate-700 uppercase flex items-center justify-between">
                <span>Attached Media Evidence</span>
                <span className="font-urdu text-slate-500 text-[10px]">منسلک تصاویر و ویڈیوز</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block">Overview:</span>
                  {selectedQrAudit.attachedPhotos?.siteOverview ? (
                    <img src={selectedQrAudit.attachedPhotos.siteOverview} alt="Overview" className="w-full h-14 object-cover rounded border" />
                  ) : (
                    <div className="h-14 bg-slate-200 rounded border border-dashed flex items-center justify-center text-[9px] text-slate-400">None</div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Before Defect:</span>
                  {selectedQrAudit.attachedPhotos?.beforeDefect ? (
                    <img src={selectedQrAudit.attachedPhotos.beforeDefect} alt="Before" className="w-full h-14 object-cover rounded border" />
                  ) : (
                    <div className="h-14 bg-slate-200 rounded border border-dashed flex items-center justify-center text-[9px] text-slate-400">None</div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">After Repair:</span>
                  {selectedQrAudit.attachedPhotos?.afterRepair ? (
                    <img src={selectedQrAudit.attachedPhotos.afterRepair} alt="After" className="w-full h-14 object-cover rounded border" />
                  ) : (
                    <div className="h-14 bg-slate-200 rounded border border-dashed flex items-center justify-center text-[9px] text-slate-400">None</div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const audit = selectedQrAudit;
                  setSelectedQrAudit(null);
                  onViewPrintableForm(audit);
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>View Full Official Certificate & All Media</span>
              </button>

              {(modalQrCodeUrl || selectedQrAudit.qrCodeDataUrl) && (
                <a
                  href={modalQrCodeUrl || selectedQrAudit.qrCodeDataUrl}
                  download={`FGRF_Water_Audit_QR_${selectedQrAudit.id}.png`}
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer block"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download QR Code Image (.png)</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
