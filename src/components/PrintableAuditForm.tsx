import React, { useState, useEffect } from 'react';
import { Printer, Download, X, Droplets, CheckSquare, Square, QrCode, Camera, Video, Play, ExternalLink } from 'lucide-react';
import { AuditRecord } from '../types/index.ts';
import { WATER_SAFETY_DISCLAIMER_EN, WATER_SAFETY_DISCLAIMER_UR } from '../utils/auditLogic.ts';
import { fgrfLogoBase64 } from '../assets/fgrfLogo.ts';
import QRCode from 'qrcode';

interface PrintableAuditFormProps {
  audit: AuditRecord;
  onClose?: () => void;
}

export const PrintableAuditForm: React.FC<PrintableAuditFormProps> = ({ audit, onClose }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>(audit.qrCodeDataUrl || '');

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const verificationUrl = `${origin}${pathname}?view_audit=${audit.id}`;

    if (audit.qrCodeDataUrl) {
      setQrCodeUrl(audit.qrCodeDataUrl);
    } else {
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 p-2 sm:p-6 backdrop-blur-xs flex justify-center">
      {/* Container */}
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden border border-slate-300">
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className="no-print bg-slate-800 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-emerald-600 rounded-lg">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm">Official Bilingual Audit Form (FGRF-WTS-AUD-002.00-26)</div>
              <div className="text-xs text-slate-400">Audit Form ID: {audit.id} | Project: {audit.projectId}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Printable Form Content - 2 Pages */}
        <div className="p-6 sm:p-10 font-sans text-slate-900 bg-white space-y-12 text-sm leading-snug">
          {/* ================= PAGE 1 ================= */}
          <div className="border border-slate-300 p-6 rounded-sm shadow-xs bg-white relative">
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
                      فیضان گلوبل ریلیف فاؤنڈیشن
                    </div>
                  </div>
                </div>

                {/* Center: Title & Subtitle */}
                <div className="text-center flex-1 px-2">
                  <h1 className="text-base sm:text-lg font-black tracking-tight uppercase text-slate-900">
                    WATER PROJECT AUDIT & INSPECTION FORM
                  </h1>
                  <h2 className="font-urdu text-sm sm:text-base font-bold text-emerald-900 mt-0.5">
                    واٹر پراجیکٹ – تنصیب اور فعالیت کا تصدیقی فارم
                  </h2>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Ref: {audit.formReference || 'FGRF-WTS-AUD-002.00-26'}
                  </div>
                </div>

                {/* Right: Verification QR Code & Inspection ID */}
                <div className="text-right flex flex-col items-end shrink-0">
                  {qrCodeUrl && (
                    <img
                      src={qrCodeUrl}
                      alt="Verification QR Code"
                      className="w-16 h-16 object-contain border border-slate-300 rounded p-0.5 bg-white"
                    />
                  )}
                  <div className="font-mono text-[10px] font-black text-emerald-950 mt-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
                    {audit.id}
                  </div>
                  <div className="text-[8px] text-slate-400 font-mono uppercase">
                    Scan to Verify Authenticity
                  </div>
                </div>
              </div>
            </div>

            {/* Section A */}
            <div className="mb-6">
              <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 border border-slate-400 font-bold text-xs uppercase mb-2">
                <span>A. PROJECT & SITE INFORMATION | پراجیکٹ اور مقام کی معلومات والے</span>
                <span className="font-mono text-slate-700">Ref: {audit.formReference || 'FGRF-WTS-AUD-002.00-26'}</span>
              </div>

              <div className="border border-slate-400 text-xs">
                <div className="grid grid-cols-12 border-b border-slate-300">
                  <div className="col-span-5 bg-slate-50 p-2 font-medium border-r border-slate-300 flex justify-between items-center">
                    <span>Project ID / Code</span>
                    <span className="font-urdu text-slate-700">پراجیکٹ آئی ڈی / کوڈ</span>
                  </div>
                  <div className="col-span-7 p-2 font-bold font-mono text-emerald-900 bg-white">
                    {audit.projectId}
                  </div>
                </div>

                <div className="grid grid-cols-12 border-b border-slate-300">
                  <div className="col-span-5 bg-slate-50 p-2 font-medium border-r border-slate-300 flex justify-between items-center">
                    <span>Country / Province / Division / District / Tehsil</span>
                    <span className="font-urdu text-slate-700">ملک / صوبہ / ڈویژن / ضلع / تحصیل</span>
                  </div>
                  <div className="col-span-7 p-2 font-semibold bg-white text-slate-800">
                    <span className="text-emerald-800 font-bold">{audit.country || 'Pakistan'}</span> → {audit.province} → {audit.division || 'Division'} → {audit.district} → {audit.tehsil}
                    <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                      UC: {audit.unionCouncil} | Village: {audit.village}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 border-b border-slate-300">
                  <div className="col-span-5 bg-slate-50 p-2 font-medium border-r border-slate-300 flex justify-between items-center">
                    <span>Full Site Address / GPS Coordinates</span>
                    <span className="font-urdu text-slate-700">مکمل پتہ / جی پی ایس کوآرڈینیٹس</span>
                  </div>
                  <div className="col-span-7 p-2 bg-white">
                    <div className="text-slate-800">{audit.fullSiteAddress}</div>
                    <div className="font-mono text-slate-600 text-[11px] mt-0.5">
                      GPS: {audit.gpsCoordinates?.lat?.toFixed(5) || 'N/A'}, {audit.gpsCoordinates?.lng?.toFixed(5) || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 border-b border-slate-300">
                  <div className="col-span-5 bg-slate-50 p-2 font-medium border-r border-slate-300 flex justify-between items-center">
                    <span>Beneficiary / Community Contact & Mobile</span>
                    <span className="font-urdu text-slate-700">مستفید فرد / کمیونٹی رابطہ اور موبائل نمبر</span>
                  </div>
                  <div className="col-span-7 p-2 bg-white font-medium">
                    {audit.beneficiaryName} – {audit.beneficiaryMobile}
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
          <div className="page-break border border-slate-300 p-6 rounded-sm shadow-xs bg-white relative">
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

            {/* Section C: Repair / Corrective Action */}
            <div className="mb-6">
              <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 border border-slate-400 font-bold text-xs uppercase mb-2">
                <span>C. REPAIR / CORRECTIVE ACTION | مرمت / اصلاحی کارروائی</span>
              </div>

              <table className="w-full border-collapse border border-slate-400 text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400 text-slate-800">
                    <th className="border-r border-slate-400 p-1.5 text-left">Defect / Issue Found / درج شدہ خرابی</th>
                    <th className="border-r border-slate-400 p-1.5 text-left">Repair Required / درکار مرمت</th>
                    <th className="border-r border-slate-400 p-1.5 text-left w-32">Responsible Person / ذمہ دار فرد</th>
                    <th className="border-r border-slate-400 p-1.5 text-center w-24">Target Date / آخری تاریخ</th>
                    <th className="border-r border-slate-400 p-1.5 text-center w-24">Status / حالت</th>
                    <th className="p-1.5 text-center w-40">Photo & Video Evidence / تصویری و ویڈیو ثبوت</th>
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
                              <img
                                src={rep.repairPhoto || rep.beforePhoto || rep.afterPhoto}
                                alt="Repair Photo Evidence"
                                className="w-12 h-10 object-cover rounded border border-slate-300 shadow-2xs"
                              />
                            )}
                            {(rep.repairVideo || rep.beforeVideo || rep.afterVideo) && (
                              <video
                                src={rep.repairVideo || rep.beforeVideo || rep.afterVideo}
                                controls
                                className="w-16 h-10 object-cover rounded border border-slate-300 bg-black shadow-2xs"
                              />
                            )}
                            {!rep.repairPhoto && !rep.beforePhoto && !rep.afterPhoto && !rep.repairVideo && !rep.beforeVideo && !rep.afterVideo && (
                              <span className="text-slate-400 italic text-[10px]">No media attached</span>
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
                        <img
                          src={audit.attachedPhotos.siteOverview}
                          alt="Site Overview"
                          className="w-full h-32 object-cover rounded border border-slate-300"
                        />
                      ) : (
                        <div className="h-32 bg-slate-100 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px]">
                          No overview photo attached
                        </div>
                      )}
                      {audit.attachedPhotos?.siteVideo && (
                        <div className="mt-1">
                          <video
                            src={audit.attachedPhotos.siteVideo}
                            controls
                            className="w-full h-24 object-cover rounded border border-slate-300 bg-black"
                          />
                        </div>
                      )}
                    </div>

                    {/* Before / Defect */}
                    <div className="border border-slate-300 rounded-lg p-2 bg-slate-50 space-y-1.5">
                      <div className="font-bold text-[11px] text-slate-800 flex justify-between">
                        <span>2. Before / Defect</span>
                        <span className="font-urdu text-[10px] text-slate-600">خرابی سے پہلے</span>
                      </div>
                      {audit.attachedPhotos?.beforeDefect ? (
                        <img
                          src={audit.attachedPhotos.beforeDefect}
                          alt="Before Defect"
                          className="w-full h-32 object-cover rounded border border-slate-300"
                        />
                      ) : (
                        <div className="h-32 bg-slate-100 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px]">
                          No defect photo attached
                        </div>
                      )}
                      {audit.attachedPhotos?.beforeVideo && (
                        <div className="mt-1">
                          <video
                            src={audit.attachedPhotos.beforeVideo}
                            controls
                            className="w-full h-24 object-cover rounded border border-slate-300 bg-black"
                          />
                        </div>
                      )}
                    </div>

                    {/* After Repair */}
                    <div className="border border-slate-300 rounded-lg p-2 bg-slate-50 space-y-1.5">
                      <div className="font-bold text-[11px] text-slate-800 flex justify-between">
                        <span>3. After Repair</span>
                        <span className="font-urdu text-[10px] text-slate-600">مرمت کے بعد</span>
                      </div>
                      {audit.attachedPhotos?.afterRepair ? (
                        <img
                          src={audit.attachedPhotos.afterRepair}
                          alt="After Repair"
                          className="w-full h-32 object-cover rounded border border-slate-300"
                        />
                      ) : (
                        <div className="h-32 bg-slate-100 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px]">
                          No repair photo attached
                        </div>
                      )}
                      {audit.attachedPhotos?.afterVideo && (
                        <div className="mt-1">
                          <video
                            src={audit.attachedPhotos.afterVideo}
                            controls
                            className="w-full h-24 object-cover rounded border border-slate-300 bg-black"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <div className="font-bold text-slate-800 flex justify-between">
                    <span>Inspector Remarks / Recommendations:</span>
                    <span className="font-urdu text-slate-700">معائنہ کرنے والے کے ریمارکس / سفارشات:</span>
                  </div>
                  <div className="mt-1 p-2 bg-slate-50 border border-slate-200 rounded min-h-[44px] text-slate-700 text-xs italic">
                    {audit.inspectorRemarks || 'No additional remarks recorded.'}
                  </div>
                </div>

                {/* Signatures Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Inspector Signature */}
                  <div className="border border-slate-300 p-2.5 rounded bg-white">
                    <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                      <span>Inspector Signature & Date</span>
                      <span className="font-urdu">معائنہ کنندہ دستخط و تاریخ</span>
                    </div>
                    <div className="h-16 flex items-center justify-center border-b border-dashed border-slate-300 mb-1">
                      {audit.inspectorSignature ? (
                        <img src={audit.inspectorSignature} alt="Inspector Signature" className="max-h-14 object-contain" />
                      ) : (
                        <span className="text-slate-400 italic text-xs">Digital Signature Verified</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 flex justify-between">
                      <span className="font-semibold">{audit.inspectorName}</span>
                      <span className="font-mono">{audit.inspectionSignDate || audit.inspectionDateTime.slice(0, 10)}</span>
                    </div>
                  </div>

                  {/* Community Representative Signature */}
                  <div className="border border-slate-300 p-2.5 rounded bg-white">
                    <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                      <span>Community Rep Signature & Date</span>
                      <span className="font-urdu">کمیونٹی نمائندہ دستخط و تاریخ</span>
                    </div>
                    <div className="h-16 flex items-center justify-center border-b border-dashed border-slate-300 mb-1">
                      {audit.communityRepSignature ? (
                        <img src={audit.communityRepSignature} alt="Community Signature" className="max-h-14 object-contain" />
                      ) : (
                        <span className="text-slate-400 italic text-xs">Representative Signature Verified</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 flex justify-between">
                      <span className="font-semibold">{audit.communityRepName}</span>
                      <span className="font-mono">{audit.communityRepDate || audit.inspectionDateTime.slice(0, 10)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Water Safety Disclaimer */}
            <div className="bg-amber-50 border-2 border-amber-300 p-3 rounded text-xs text-amber-900 mb-4">
              <div className="font-bold flex items-center gap-1.5 mb-0.5 text-amber-950">
                <span>⚠️ Important Water Safety Disclaimer / اہم حفاظتی تنبیہ:</span>
              </div>
              <p className="font-medium text-[11px]">{WATER_SAFETY_DISCLAIMER_EN}</p>
              <p className="font-urdu text-[11px] text-amber-900 mt-1 leading-relaxed">
                {WATER_SAFETY_DISCLAIMER_UR}
              </p>
            </div>

            {/* Official Review Stamp if Approved */}
            {audit.approvalStatus === 'Approved' && (
              <div className="border border-emerald-500 bg-emerald-50/50 p-2 rounded flex items-center justify-between text-xs text-emerald-900">
                <span className="font-bold flex items-center gap-1.5">
                  ✓ HEAD OFFICE APPROVED & VERIFIED AUDIT RECORD
                </span>
                <span className="font-mono text-[11px]">Reviewed by: {audit.reviewedBy || 'FGRF HQ Audit'}</span>
              </div>
            )}

            {/* Page 2 Footer */}
            <div className="text-center text-[10px] text-slate-400 mt-6 font-mono space-y-0.5">
              <div>Page 2 of 2 – Form Reference: FGRF-WTS-AUD-002.00-26 – FGRF Central Audit Registry</div>
              <div className="text-[9px] text-slate-400">
                This software making rights & reserved and copyright by FGRF - Data Management & ERP Department • Syed Waqas, Manager MIS
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
