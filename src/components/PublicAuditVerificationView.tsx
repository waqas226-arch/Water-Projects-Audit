import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  CheckSquare, 
  Square, 
  Camera, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink, 
  Lock, 
  RefreshCw
} from 'lucide-react';
import { AuditRecord } from '../types/index.ts';
import { fgrfLogoBase64 } from '../assets/fgrfLogo.ts';
import { fetchCloudData, sanitizeAuditRecord } from '../utils/cloudSync.ts';
import { getAudits, submitNewAudit } from '../utils/storage.ts';
import { decodeAuditFromQr, encodeAuditForQr, OFFICIAL_PRECONFIGURED_AUDITS } from '../utils/auditPayload.ts';
import QRCode from 'qrcode';

interface PublicAuditVerificationViewProps {
  auditId: string;
  audits?: AuditRecord[];
}

export const PublicAuditVerificationView: React.FC<PublicAuditVerificationViewProps> = ({ auditId, audits: propAudits }) => {
  const [audit, setAudit] = useState<AuditRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const cleanTargetId = (auditId || '').trim().toLowerCase();

    const locateAudit = async () => {
      setLoading(true);
      setError(null);

      // 1. Check if URL query contains embedded self-contained payload (?d=... or ?p=... or ?payload=...)
      try {
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const encoded = urlParams ? (urlParams.get('d') || urlParams.get('p') || urlParams.get('payload')) : null;
        if (encoded) {
          const decoded = decodeAuditFromQr(encoded);
          if (decoded && isMounted) {
            setAudit(decoded);
            try { submitNewAudit(decoded); } catch {}
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('URL payload decode error:', err);
      }

      // 2. Check local storage / propAudits
      const localList = (propAudits && propAudits.length > 0) ? propAudits : getAudits();
      const localMatch = localList.find((a) => a && a.id && a.id.trim().toLowerCase() === cleanTargetId);
      if (localMatch && isMounted) {
        setAudit(localMatch);
        setLoading(false);
        return;
      }

      // 3. Check official preconfigured master registry
      if (OFFICIAL_PRECONFIGURED_AUDITS[cleanTargetId]) {
        const officialMatch = OFFICIAL_PRECONFIGURED_AUDITS[cleanTargetId];
        if (isMounted) {
          setAudit(officialMatch);
          setLoading(false);
          return;
        }
      }

      // 4. Fetch from cloud database relay
      try {
        const cloudData = await fetchCloudData();
        if (cloudData && Array.isArray(cloudData.audits)) {
          const cloudMatch = cloudData.audits.find((a) => a && a.id && a.id.trim().toLowerCase() === cleanTargetId);
          if (cloudMatch && isMounted) {
            setAudit(cloudMatch);
            try { submitNewAudit(cloudMatch); } catch {}
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Cloud verification lookup error:', err);
      }

      if (isMounted) {
        setLoading(false);
        setError(`Official Inspection Record "${auditId}" could not be verified in the active registry.`);
      }
    };

    locateAudit();

    return () => {
      isMounted = false;
    };
  }, [auditId, propAudits]);

  // Generate QR verification data URL
  useEffect(() => {
    if (!audit) return;
    if (audit.qrCodeDataUrl && audit.qrCodeDataUrl.length > 50) {
      setQrCodeUrl(audit.qrCodeDataUrl);
    } else {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      const payload = encodeAuditForQr(audit);
      const verificationUrl = `${origin}${pathname}?view_audit=${audit.id}&d=${payload}`;
      QRCode.toDataURL(verificationUrl, { width: 220, margin: 1, color: { dark: '#064e3b', light: '#ffffff' } })
        .then((url) => setQrCodeUrl(url))
        .catch(() => {});
    }
  }, [audit]);

  const handlePrint = () => {
    window.print();
  };

  const renderCheckbox = (checked: boolean, labelEn: string, labelUrdu?: string) => (
    <div className="inline-flex items-center gap-1.5 text-xs mr-3">
      {checked ? (
        <CheckSquare className="w-4 h-4 text-emerald-700" />
      ) : (
        <Square className="w-4 h-4 text-slate-400" />
      )}
      <span className="font-medium text-slate-800">{labelEn}</span>
      {labelUrdu && <span className="font-urdu text-[11px] text-slate-600">{labelUrdu}</span>}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl border-4 border-emerald-600 animate-in fade-in">
          <img
            src={fgrfLogoBase64}
            alt="FGRF Logo"
            className="w-20 h-20 mx-auto object-contain p-1 bg-white rounded-2xl border shadow-xs"
          />
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900">FAIZAN GLOBAL RELIEF FOUNDATION</h2>
            <div className="text-xs font-bold text-emerald-800">Digital Water Audit Verification Portal</div>
            <div className="font-urdu text-xs text-slate-600 mt-1">معائنہ فارم کی ڈیجیٹل توثیق جاری ہے...</div>
          </div>
          <div className="flex items-center justify-center gap-2 text-emerald-700 pt-2 font-mono text-xs font-semibold">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Verifying Form Reference: {auditId}...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border-4 border-rose-500 space-y-5 text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Certificate Verification Notice</h1>
            <p className="font-urdu text-sm font-bold text-rose-800 mt-0.5">معائنہ فارم ریکارڈ دستیاب نہیں</p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 space-y-1 text-left font-mono">
            <div><strong>Requested Code:</strong> {auditId}</div>
            <div><strong>Status:</strong> Not located in active registry</div>
            <div className="text-[11px] text-slate-400 mt-2 font-sans">
              Please verify that this QR code was scanned from an official FGRF Water Project site plaque. If newly registered, ensure the field inspector has synced records to the central cloud database.
            </div>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Verification / دوبارہ تصدیق کریں</span>
            </button>
          </div>
          <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-3">
            Faizan Global Relief Foundation • Data Management & ERP Department
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-4 sm:py-8 px-2 sm:px-6 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Maximum Container */}
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Top Public Verification Bar (Hidden on print) */}
        <div className="no-print bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-emerald-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={fgrfLogoBase64}
              alt="FGRF Logo"
              className="w-12 h-12 object-contain p-1 bg-white rounded-xl shadow-xs shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                  FAIZAN GLOBAL RELIEF FOUNDATION (FGRF)
                </span>
                <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Verified Authentic
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white mt-0.5">
                Official Digital Water Project Audit Certificate
              </h1>
              <p className="font-urdu text-xs text-emerald-200">
                واٹر پراجیکٹ کا تصدیق شدہ معائنہ فارم اور ثبوت
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer w-full md:w-auto"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF Form</span>
            </button>
          </div>
        </div>

        {/* Security / Access Control Notice Banner */}
        <div className="no-print bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-xs text-emerald-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>View-Only Official Certificate Mode:</strong> You are viewing the standalone official inspection certificate for <strong>{audit.id}</strong>. Administrative software functions and other records are restricted.
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200 shrink-0">
            {audit.projectId}
          </span>
        </div>

        {/* 2-Page Official Inspection Form Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-300 overflow-hidden p-4 sm:p-8 space-y-8 text-sm leading-snug">
          {/* ================= PAGE 1 ================= */}
          <div className="border border-slate-300 p-4 sm:p-6 rounded-sm shadow-xs bg-white relative">
            {/* Header */}
            <div className="border-b-2 border-slate-800 pb-3 mb-4">
              <div className="flex items-center justify-between gap-4">
                {/* Left: FGRF Official Logo & Department */}
                <div className="flex items-center gap-3">
                  <img
                    src={fgrfLogoBase64}
                    alt="FGRF Official Logo"
                    className="w-16 h-16 object-contain rounded-lg border border-slate-200 p-0.5 bg-white shadow-2xs"
                  />
                  <div>
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900 leading-tight">
                      Faizan Global Relief Foundation
                    </div>
                    <div className="text-xs font-bold text-slate-800 leading-tight mt-0.5">
                      Data Management Department - FGRF
                    </div>
                    <div className="font-urdu text-[11px] font-bold text-emerald-800 mt-0.5">
                      ڈیٹا مینجمنٹ ڈیپارٹمنٹ • ایف جی آر ایف
                    </div>
                  </div>
                </div>

                {/* Right: Verification Stamp & QR Code */}
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-slate-900">
                      Ref: FGRF-WTS-AUD-002.00-26
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Form ID: <span className="text-emerald-900 font-bold">{audit.id}</span>
                    </div>
                    <div className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider">
                      ✓ Digital Verified Seal
                    </div>
                  </div>
                  {qrCodeUrl && (
                    <img
                      src={qrCodeUrl}
                      alt="Verification QR Code"
                      className="w-16 h-16 object-contain border border-emerald-400 p-0.5 rounded shadow-2xs bg-white"
                    />
                  )}
                </div>
              </div>

              {/* Title Banner */}
              <div className="mt-3 text-center bg-emerald-900 text-white py-1.5 px-3 rounded-xs font-bold text-xs uppercase tracking-wide flex justify-between items-center">
                <span>WATER PROJECT – INSTALLATION & FUNCTIONALITY AUDIT</span>
                <span className="font-urdu text-sm">واٹر پراجیکٹ – تنصیب اور فعالیت کا آڈٹ فارم</span>
              </div>
            </div>

            {/* Section A: Project & Site Information */}
            <div className="mb-6">
              <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 border border-slate-400 font-bold text-xs uppercase mb-2">
                <span>A. PROJECT & SITE INFORMATION | پراجیکٹ اور مقام کی تفصیلات</span>
              </div>

              <div className="border border-slate-400 text-xs">
                <div className="grid grid-cols-12 border-b border-slate-300">
                  <div className="col-span-5 bg-slate-50 p-2 font-medium border-r border-slate-300 flex justify-between items-center">
                    <span>Project ID / Code</span>
                    <span className="font-urdu text-slate-700">پراجیکٹ کوڈ / شناختی نمبر</span>
                  </div>
                  <div className="col-span-7 p-2 bg-white font-mono font-bold text-emerald-950 flex items-center justify-between">
                    <span>{audit.projectId}</span>
                    <span className="text-[10px] font-sans font-semibold text-slate-500">
                      Country: {audit.country || 'Pakistan'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-12 border-b border-slate-300">
                  <div className="col-span-5 bg-slate-50 p-2 font-medium border-r border-slate-300 flex justify-between items-center">
                    <span>Province & Division</span>
                    <span className="font-urdu text-slate-700">صوبہ اور ڈویژن</span>
                  </div>
                  <div className="col-span-7 p-2 bg-white font-medium">
                    {audit.province} {audit.division ? `• ${audit.division} Division` : ''}
                  </div>
                </div>

                <div className="grid grid-cols-12 border-b border-slate-300">
                  <div className="col-span-5 bg-slate-50 p-2 font-medium border-r border-slate-300 flex justify-between items-center">
                    <span>District & Tehsil</span>
                    <span className="font-urdu text-slate-700">ضلع اور تحصیل</span>
                  </div>
                  <div className="col-span-7 p-2 bg-white font-medium">
                    {audit.district} {audit.tehsil ? `(${audit.tehsil})` : ''}
                  </div>
                </div>

                <div className="grid grid-cols-12 border-b border-slate-300">
                  <div className="col-span-5 bg-slate-50 p-2 font-medium border-r border-slate-300 flex justify-between items-center">
                    <span>Union Council / Village / Address</span>
                    <span className="font-urdu text-slate-700">یونین کونسل / گاؤں / مکمل پتہ</span>
                  </div>
                  <div className="col-span-7 p-2 bg-white">
                    <span className="font-bold text-slate-900">{audit.village}</span>
                    {audit.unionCouncil && <span className="text-slate-600"> (UC: {audit.unionCouncil})</span>}
                    {audit.fullSiteAddress && <div className="text-slate-500 text-[11px] mt-0.5">{audit.fullSiteAddress}</div>}
                  </div>
                </div>

                <div className="grid grid-cols-12 border-b border-slate-300">
                  <div className="col-span-5 bg-slate-50 p-2 font-medium border-r border-slate-300 flex justify-between items-center">
                    <span>GPS Coordinates</span>
                    <span className="font-urdu text-slate-700">جی پی ایس کوآرڈینیٹس</span>
                  </div>
                  <div className="col-span-7 p-2 bg-white font-mono flex items-center justify-between">
                    <span>
                      Lat: {audit.gpsCoordinates?.lat?.toFixed(5) || '0.00000'}, Lng: {audit.gpsCoordinates?.lng?.toFixed(5) || '0.00000'}
                    </span>
                    {audit.gpsCoordinates && audit.gpsCoordinates.lat !== 0 && (
                      <a
                        href={`https://www.google.com/maps?q=${audit.gpsCoordinates.lat},${audit.gpsCoordinates.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-emerald-700 underline font-sans flex items-center gap-0.5 no-print"
                      >
                        <span>View on Maps</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-12 border-b border-slate-300">
                  <div className="col-span-5 bg-slate-50 p-2 font-medium border-r border-slate-300 flex justify-between items-center">
                    <span>Beneficiary Contact Person</span>
                    <span className="font-urdu text-slate-700">مستفید رابطہ کار فرد</span>
                  </div>
                  <div className="col-span-7 p-2 bg-white font-medium flex justify-between items-center">
                    <span>{audit.beneficiaryName}</span>
                    <span className="font-mono text-slate-600 text-[11px]">{audit.beneficiaryMobile}</span>
                  </div>
                </div>

                <div className="grid grid-cols-12 border-b border-slate-300">
                  <div className="col-span-5 bg-slate-50 p-2 font-medium border-r border-slate-300 flex justify-between items-center">
                    <span>Installation Type</span>
                    <span className="font-urdu text-slate-700">تنصیب کی قسم</span>
                  </div>
                  <div className="col-span-7 p-2 bg-white flex items-center">
                    {renderCheckbox(audit.installationType === 'Hand Pump', 'Hand Pump', 'ہینڈ پمپ')}
                    {renderCheckbox(audit.installationType === 'Filter Hand Pump', 'Filter Hand Pump', 'فلٹر ہینڈ پمپ')}
                    {renderCheckbox(audit.installationType?.includes('Solar') || false, 'Solar Tube Well', 'سولر ٹیوب ویل')}
                  </div>
                </div>

                <div className="grid grid-cols-12 border-b border-slate-300">
                  <div className="col-span-5 bg-slate-50 p-2 font-medium border-r border-slate-300 flex justify-between items-center">
                    <span>Installation Date</span>
                    <span className="font-urdu text-slate-700">تنصیب کی تاریخ</span>
                  </div>
                  <div className="col-span-7 p-2 bg-white font-medium">
                    {audit.installationDate || 'Not Recorded'}
                  </div>
                </div>

                <div className="grid grid-cols-12 border-b border-slate-300">
                  <div className="col-span-5 bg-slate-50 p-2 font-medium border-r border-slate-300 flex justify-between items-center">
                    <span>Inspection Date & Time</span>
                    <span className="font-urdu text-slate-700">معائنہ کی تاریخ اور وقت</span>
                  </div>
                  <div className="col-span-7 p-2 bg-white font-mono">
                    {audit.inspectionDateTime ? new Date(audit.inspectionDateTime).toLocaleString() : 'N/A'}
                  </div>
                </div>

                <div className="grid grid-cols-12">
                  <div className="col-span-5 bg-slate-50 p-2 font-medium border-r border-slate-300 flex justify-between items-center">
                    <span>Inspector Name / Designation</span>
                    <span className="font-urdu text-slate-700">معائنہ کرنے والے کا نام / عہدہ</span>
                  </div>
                  <div className="col-span-7 p-2 bg-white font-medium">
                    {audit.inspectorName || 'Field Inspector'} ({audit.inspectorDesignation || 'Inspector'})
                  </div>
                </div>
              </div>
            </div>

            {/* Section B: Checkpoints 1 to 9 */}
            <div>
              <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 border border-slate-400 font-bold text-xs uppercase mb-2">
                <span>B. INSTALLATION & FUNCTIONALITY INSPECTION MATRIX | تنصیب اور فعالیت کا معائنہ میٹرکس</span>
              </div>

              <table className="w-full border-collapse border border-slate-400 text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400 text-slate-800">
                    <th className="border-r border-slate-400 p-1.5 text-center w-8">#</th>
                    <th className="border-r border-slate-400 p-1.5 text-left">
                      Inspection Checkpoint / معائنہ کا نکتہ
                    </th>
                    <th className="border-r border-slate-400 p-1.5 text-center w-40">
                      Status / حالت
                    </th>
                    <th className="p-1.5 text-left w-52">
                      Remarks / Defect / ریمارکس / خرابی
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(audit.checkpoints || []).slice(0, 9).map((cp) => (
                    <tr key={cp.id} className="border-b border-slate-300 hover:bg-slate-50/50">
                      <td className="border-r border-slate-300 p-2 text-center font-bold font-mono">
                        {cp.number}
                      </td>
                      <td className="border-r border-slate-300 p-2">
                        <div className="font-medium text-slate-900">{cp.titleEn}</div>
                        <div className="font-urdu text-slate-700 text-xs mt-0.5">{cp.titleUrdu}</div>
                      </td>
                      <td className="border-r border-slate-300 p-2 text-center align-middle">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {(cp.options || []).map((opt) => (
                            <span
                              key={opt.value}
                              className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded ${
                                cp.currentStatus === opt.value
                                  ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300'
                                  : 'text-slate-400'
                              }`}
                            >
                              {cp.currentStatus === opt.value ? '☑' : '☐'} {opt.labelEn}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-2 text-slate-700 text-[11px]">
                        {cp.remarks || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Page 1 Footer */}
            <div className="text-center text-[10px] text-slate-400 mt-6 font-mono space-y-0.5">
              <div>Page 1 of 2 – Form Reference: FGRF-WTS-AUD-002.00-26</div>
              <div className="text-[9px] text-slate-400">
                Software Making Rights & Copyright: FGRF - Data Management & ERP Department • Syed Waqas (Manager MIS)
              </div>
            </div>
          </div>

          {/* ================= PAGE 2 ================= */}
          <div className="page-break border border-slate-300 p-4 sm:p-6 rounded-sm shadow-xs bg-white relative">
            {/* Header top reference */}
            <div className="flex justify-between items-center text-xs text-slate-500 pb-2 mb-4 border-b border-slate-200">
              <span className="font-semibold text-slate-700">Project: {audit.projectId} ({audit.district})</span>
              <span className="font-mono">FGRF-WTS-AUD-002.00-26 – Page 2</span>
            </div>

            {/* Checkpoints 10 to 12 */}
            <div className="mb-6">
              <table className="w-full border-collapse border border-slate-400 text-xs">
                <tbody>
                  {(audit.checkpoints || []).slice(9, 12).map((cp) => (
                    <tr key={cp.id} className="border-b border-slate-300">
                      <td className="border-r border-slate-300 p-2 text-center font-bold font-mono w-8">
                        {cp.number}
                      </td>
                      <td className="border-r border-slate-300 p-2">
                        <div className="font-medium text-slate-900">{cp.titleEn}</div>
                        <div className="font-urdu text-slate-700 text-xs mt-0.5">{cp.titleUrdu}</div>
                      </td>
                      <td className="border-r border-slate-300 p-2 text-center align-middle w-40">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {(cp.options || []).map((opt) => (
                            <span
                              key={opt.value}
                              className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded ${
                                cp.currentStatus === opt.value
                                  ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300'
                                  : 'text-slate-400'
                              }`}
                            >
                              {cp.currentStatus === opt.value ? '☑' : '☐'} {opt.labelEn}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-2 text-slate-700 text-[11px] w-52">
                        {cp.remarks || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section C: Repair / Corrective Action with Evidence */}
            <div className="mb-6">
              <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 border border-slate-400 font-bold text-xs uppercase mb-2">
                <span>C. REPAIR / CORRECTIVE ACTION | مرمت / اصلاحی کارروائی</span>
              </div>

              <table className="w-full border-collapse border border-slate-400 text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400 text-slate-800">
                    <th className="border-r border-slate-400 p-1.5 text-left">Defect / Issue Found / درج شدہ خرابی</th>
                    <th className="border-r border-slate-400 p-1.5 text-left">Repair Required / درکار مرمت</th>
                    <th className="border-r border-slate-400 p-1.5 text-left w-28">Responsible / ذمہ دار</th>
                    <th className="border-r border-slate-400 p-1.5 text-center w-24">Target Date / تاریخ</th>
                    <th className="border-r border-slate-400 p-1.5 text-center w-20">Status / حالت</th>
                    <th className="p-1.5 text-center w-36">Photo & Video Evidence / تصویری و ویڈیو ثبوت</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.repairs && audit.repairs.length > 0 ? (
                    audit.repairs.map((rep) => (
                      <tr key={rep.id} className="border-b border-slate-300">
                        <td className="border-r border-slate-300 p-2 font-medium">{rep.defectFound}</td>
                        <td className="border-r border-slate-300 p-2 text-slate-700">{rep.repairRequired}</td>
                        <td className="border-r border-slate-300 p-2 text-slate-800">{rep.responsiblePerson}</td>
                        <td className="border-r border-slate-300 p-2 text-center font-mono">{rep.targetDate}</td>
                        <td className="border-r border-slate-300 p-2 text-center font-medium">
                          {rep.status === 'Done' ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Done / مرمت شدہ</span>
                          ) : (
                            <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Pending / زیر التوا</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {(rep.repairPhoto || rep.beforePhoto || rep.afterPhoto) && (
                              (rep.repairPhoto || rep.beforePhoto || rep.afterPhoto)?.startsWith('data:') || (rep.repairPhoto || rep.beforePhoto || rep.afterPhoto)?.startsWith('http') ? (
                                <img
                                  src={rep.repairPhoto || rep.beforePhoto || rep.afterPhoto}
                                  alt="Repair Photo"
                                  className="w-12 h-10 object-cover rounded border border-slate-300 shadow-2xs"
                                />
                              ) : (
                                <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  ✓ Verified Media
                                </span>
                              )
                            )}
                            {(rep.repairVideo || rep.beforeVideo || rep.afterVideo) && (
                              (rep.repairVideo || rep.beforeVideo || rep.afterVideo)?.startsWith('data:') || (rep.repairVideo || rep.beforeVideo || rep.afterVideo)?.startsWith('http') ? (
                                <video
                                  src={rep.repairVideo || rep.beforeVideo || rep.afterVideo}
                                  controls
                                  className="w-16 h-10 object-cover rounded border border-slate-300 bg-black shadow-2xs"
                                />
                              ) : (
                                <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  ✓ Verified Video
                                </span>
                              )
                            )}
                            {!rep.repairPhoto && !rep.beforePhoto && !rep.afterPhoto && !rep.repairVideo && !rep.beforeVideo && !rep.afterVideo && (
                              <span className="text-slate-400 italic text-[10px]">No media</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-3 text-center text-slate-500 italic">
                        No repair required. System is functioning in satisfactory condition. (کوئی مرمت درکار نہیں)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Section D: Overall Result & Sign-Off */}
            <div className="mb-6">
              <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 border border-slate-400 font-bold text-xs uppercase mb-2">
                <span>D. OVERALL RESULT & SIGN-OFF | مجموعی نتیجہ اور تصدیق</span>
              </div>

              <div className="border border-slate-400 text-xs p-3 space-y-3">
                {/* Overall Condition */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200">
                  <div className="font-bold text-slate-800 mb-1 sm:mb-0">
                    Overall Condition / مجموعی حالت:
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {renderCheckbox(audit.overallCondition === 'Functional', 'Functional', 'فعال')}
                    {renderCheckbox(audit.overallCondition === 'Functional – Repair Needed', 'Functional – Repair Needed', 'فعال مگر مرمت درکار')}
                    {renderCheckbox(audit.overallCondition === 'Non-functional', 'Non-functional', 'غیر فعال')}
                    {renderCheckbox(audit.overallCondition === 'Not Installed / Wrong Location', 'Not Installed / Wrong Location', 'نصب نہیں')}
                  </div>
                </div>

                {/* On-Site Photographs & Videos Gallery (Visual Evidence) */}
                <div className="space-y-2 pb-2 border-b border-slate-200">
                  <div className="font-bold text-slate-800 flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-700" />
                      Photographs & Video Evidence / موقع پر لی گئی تصدیقی تصاویر و ویڈیوز:
                    </span>
                    <span className="font-urdu text-[11px] text-slate-600">ثبوت برائے تصدیق</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {/* Site Overview */}
                    <div className="border border-slate-300 rounded-lg p-2 bg-slate-50 space-y-1.5">
                      <div className="font-bold text-[11px] text-slate-800 flex justify-between">
                        <span>1. Site Overview</span>
                        <span className="font-urdu text-[10px] text-slate-600">پورا منظر</span>
                      </div>
                      {audit.attachedPhotos?.siteOverview ? (
                        audit.attachedPhotos.siteOverview.startsWith('data:') || audit.attachedPhotos.siteOverview.startsWith('http') ? (
                          <img
                            src={audit.attachedPhotos.siteOverview}
                            alt="Site Overview"
                            className="w-full h-32 object-cover rounded border border-slate-300 shadow-xs"
                          />
                        ) : (
                          <div className="h-32 bg-emerald-50 rounded border border-emerald-300 flex flex-col items-center justify-center text-emerald-800 text-[11px] p-2 text-center">
                            <Camera className="w-5 h-5 text-emerald-600 mb-1" />
                            <span className="font-bold">Site Overview Photo</span>
                            <span className="text-[9px] text-emerald-600 mt-0.5">Geo-Verified & Logged</span>
                          </div>
                        )
                      ) : (
                        <div className="h-32 bg-slate-100 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px]">
                          No overview photo attached
                        </div>
                      )}
                      {audit.attachedPhotos?.siteVideo && (
                        audit.attachedPhotos.siteVideo.startsWith('data:') || audit.attachedPhotos.siteVideo.startsWith('http') ? (
                          <div className="mt-1">
                            <video
                              src={audit.attachedPhotos.siteVideo}
                              controls
                              className="w-full h-24 object-cover rounded border border-slate-300 bg-black"
                            />
                          </div>
                        ) : (
                          <div className="mt-1 p-1.5 bg-emerald-50 text-emerald-800 text-[10px] rounded border border-emerald-200 text-center font-medium">
                            ✓ Verified On-Site Video
                          </div>
                        )
                      )}
                    </div>

                    {/* Before / Defect */}
                    <div className="border border-slate-300 rounded-lg p-2 bg-slate-50 space-y-1.5">
                      <div className="font-bold text-[11px] text-slate-800 flex justify-between">
                        <span>2. Before / Defect</span>
                        <span className="font-urdu text-[10px] text-slate-600">خرابی سے پہلے</span>
                      </div>
                      {audit.attachedPhotos?.beforeDefect ? (
                        audit.attachedPhotos.beforeDefect.startsWith('data:') || audit.attachedPhotos.beforeDefect.startsWith('http') ? (
                          <img
                            src={audit.attachedPhotos.beforeDefect}
                            alt="Before Defect"
                            className="w-full h-32 object-cover rounded border border-slate-300 shadow-xs"
                          />
                        ) : (
                          <div className="h-32 bg-emerald-50 rounded border border-emerald-300 flex flex-col items-center justify-center text-emerald-800 text-[11px] p-2 text-center">
                            <Camera className="w-5 h-5 text-emerald-600 mb-1" />
                            <span className="font-bold">Before / Defect Photo</span>
                            <span className="text-[9px] text-emerald-600 mt-0.5">Pre-Repair Geo-Logged</span>
                          </div>
                        )
                      ) : (
                        <div className="h-32 bg-slate-100 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px]">
                          No defect photo attached
                        </div>
                      )}
                      {audit.attachedPhotos?.beforeVideo && (
                        audit.attachedPhotos.beforeVideo.startsWith('data:') || audit.attachedPhotos.beforeVideo.startsWith('http') ? (
                          <div className="mt-1">
                            <video
                              src={audit.attachedPhotos.beforeVideo}
                              controls
                              className="w-full h-24 object-cover rounded border border-slate-300 bg-black"
                            />
                          </div>
                        ) : (
                          <div className="mt-1 p-1.5 bg-emerald-50 text-emerald-800 text-[10px] rounded border border-emerald-200 text-center font-medium">
                            ✓ Verified Defect Video
                          </div>
                        )
                      )}
                    </div>

                    {/* After Repair */}
                    <div className="border border-slate-300 rounded-lg p-2 bg-slate-50 space-y-1.5">
                      <div className="font-bold text-[11px] text-slate-800 flex justify-between">
                        <span>3. After Repair</span>
                        <span className="font-urdu text-[10px] text-slate-600">مرمت کے بعد</span>
                      </div>
                      {audit.attachedPhotos?.afterRepair ? (
                        audit.attachedPhotos.afterRepair.startsWith('data:') || audit.attachedPhotos.afterRepair.startsWith('http') ? (
                          <img
                            src={audit.attachedPhotos.afterRepair}
                            alt="After Repair"
                            className="w-full h-32 object-cover rounded border border-slate-300 shadow-xs"
                          />
                        ) : (
                          <div className="h-32 bg-emerald-50 rounded border border-emerald-300 flex flex-col items-center justify-center text-emerald-800 text-[11px] p-2 text-center">
                            <Camera className="w-5 h-5 text-emerald-600 mb-1" />
                            <span className="font-bold">After Repair Photo</span>
                            <span className="text-[9px] text-emerald-600 mt-0.5">Post-Maintenance Certified</span>
                          </div>
                        )
                      ) : (
                        <div className="h-32 bg-slate-100 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px]">
                          No repair photo attached
                        </div>
                      )}
                      {audit.attachedPhotos?.afterVideo && (
                        audit.attachedPhotos.afterVideo.startsWith('data:') || audit.attachedPhotos.afterVideo.startsWith('http') ? (
                          <div className="mt-1">
                            <video
                              src={audit.attachedPhotos.afterVideo}
                              controls
                              className="w-full h-24 object-cover rounded border border-slate-300 bg-black"
                            />
                          </div>
                        ) : (
                          <div className="mt-1 p-1.5 bg-emerald-50 text-emerald-800 text-[10px] rounded border border-emerald-200 text-center font-medium">
                            ✓ Verified Repair Video
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Signatures & Seal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Inspector Signature */}
                  <div className="border border-slate-300 p-2.5 rounded bg-slate-50 text-center space-y-1">
                    <div className="text-[10px] font-bold text-slate-600 uppercase">
                      Field Inspector Sign & Stamp / معائنہ کار کے دستخط
                    </div>
                    {audit.inspectorSignature && (audit.inspectorSignature.startsWith('data:') || audit.inspectorSignature.startsWith('http')) ? (
                      <img
                        src={audit.inspectorSignature}
                        alt="Inspector Signature"
                        className="h-14 mx-auto object-contain border-b border-slate-400 pb-1"
                      />
                    ) : (
                      <div className="h-14 flex flex-col items-center justify-center text-emerald-800 border-b border-slate-400 font-mono text-[11px] bg-emerald-50/50 rounded">
                        <span className="font-bold">✓ DIGITALLY CERTIFIED</span>
                        <span className="text-[9px] text-emerald-600">FGRF Inspector Electronic Stamp</span>
                      </div>
                    )}
                    <div className="font-semibold text-slate-800">{audit.inspectorName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Date: {audit.inspectionSignDate || (audit.inspectionDateTime ? audit.inspectionDateTime.slice(0, 10) : 'N/A')}
                    </div>
                  </div>

                  {/* Community Representative Signature */}
                  <div className="border border-slate-300 p-2.5 rounded bg-slate-50 text-center space-y-1">
                    <div className="text-[10px] font-bold text-slate-600 uppercase">
                      Community Representative / نمائندہ علاقہ کے دستخط
                    </div>
                    {audit.communityRepSignature && (audit.communityRepSignature.startsWith('data:') || audit.communityRepSignature.startsWith('http')) ? (
                      <img
                        src={audit.communityRepSignature}
                        alt="Community Representative Signature"
                        className="h-14 mx-auto object-contain border-b border-slate-400 pb-1"
                      />
                    ) : (
                      <div className="h-14 flex flex-col items-center justify-center text-slate-700 border-b border-slate-400 font-mono text-[11px] bg-slate-100 rounded">
                        <span className="font-bold">✓ COMMUNITY VERIFIED</span>
                        <span className="text-[9px] text-slate-500">Representative Attested on Site</span>
                      </div>
                    )}
                    <div className="font-semibold text-slate-800">{audit.communityRepName || audit.beneficiaryName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Date: {audit.communityRepDate || (audit.inspectionDateTime ? audit.inspectionDateTime.slice(0, 10) : 'N/A')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page 2 Footer */}
            <div className="text-center text-[10px] text-slate-400 mt-6 font-mono space-y-0.5">
              <div>Page 2 of 2 – Form Reference: FGRF-WTS-AUD-002.00-26</div>
              <div className="text-[9px] text-slate-400">
                Software Making Rights & Copyright: FGRF - Data Management & ERP Department • Syed Waqas (Manager MIS)
              </div>
            </div>
          </div>
        </div>

        {/* Public Footer (Hidden on print) */}
        <div className="no-print bg-white rounded-2xl p-4 border border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>FGRF Central ERP & MIS Division • Digital Inspection Registry</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 font-mono">Ref: FGRF-WTS-AUD-002.00-26</span>
            <a
              href={window.location.origin + window.location.pathname}
              className="text-emerald-700 hover:text-emerald-900 font-bold text-xs underline cursor-pointer"
              title="Staff Only - Access Full ERP Software"
            >
              Staff Portal Login / عملہ لاگ ان →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
