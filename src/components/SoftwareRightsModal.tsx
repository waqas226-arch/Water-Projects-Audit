import React from 'react';
import { X, ShieldCheck, Award, Building, User, Lock, CheckCircle2, FileText, Database } from 'lucide-react';

interface SoftwareRightsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SoftwareRightsModal: React.FC<SoftwareRightsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header with Green Gradient */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg border border-emerald-400/30">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  OFFICIAL COPYRIGHT & SOFTWARE RIGHTS
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white mt-1">
                Software Rights & Copyright Certificate
              </h2>
              <div className="font-urdu text-emerald-300 text-xs mt-0.5 font-medium">
                جملہ حقوقِ تیاری، ڈیزائن و سافٹ ویئر رائٹس محفوظ برائے شعبہ ڈیٹا مینجمنٹ و ای آر پی
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800">
          {/* Primary Attribution Callout Box */}
          <div className="p-5 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-slate-50 rounded-2xl border-2 border-emerald-200/80 shadow-xs space-y-3">
            <div className="flex items-start gap-3">
              <Award className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Software Making Rights & Reserved Notice
                </div>
                <div className="text-base font-extrabold text-slate-900 mt-1 leading-snug">
                  This software making rights & reserved and copyright by:
                </div>
                <div className="text-lg font-black text-emerald-900 mt-0.5 flex items-center gap-2">
                  <span>FGRF – Data Management & ERP Department</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  SW
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900">Syed Waqas</div>
                  <div className="text-xs font-semibold text-emerald-700">Manager MIS</div>
                  <div className="text-[11px] text-slate-500">Data Management & ERP Department</div>
                </div>
              </div>
              <div className="bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-300 self-start sm:self-auto font-mono">
                © All Rights Reserved
              </div>
            </div>
          </div>

          {/* Bilingual Urdu Legal Certification */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="font-urdu text-sm font-bold text-slate-900 text-right leading-relaxed">
              یہ سافٹ ویئر (واٹر پراجیکٹس آن لائن آڈٹ و مانیٹرنگ سسٹم) کی مکمل تیاری، پروگرامنگ، ڈیٹا بیس اسٹرکچر اور جملہ حقوق و اختیارات قانونی طور پر فیضان گلوبل ریلیف فاؤنڈیشن (FGRF) کے شعبہ ڈیٹا مینجمنٹ و ای آر پی (Data Management & ERP Department) کے نام محفوظ ہیں، جس کی نگرانی سید وقاص (منیجر ایم آئی ایس) فرما رہے ہیں۔
            </div>
          </div>

          {/* System Specification Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">System Title:</span>
                <span className="font-bold text-slate-800">FGRF Water Projects Audit & Monitoring System</span>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
              <Database className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Audit Form Standard:</span>
                <span className="font-mono font-bold text-slate-800">FGRF-WTS-AUD-002.00-26</span>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
              <Building className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Parent Organization:</span>
                <span className="font-bold text-slate-800">Faizan Global Relief Foundation (FGRF)</span>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Security & Authorization:</span>
                <span className="font-bold text-slate-800">Role-Based Granular Rights Control</span>
              </div>
            </div>
          </div>

          {/* Key Architectural Highlights */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Certified System Architecture & Features</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Digitized 2-Page English & Urdu Water Project Installation & Functionality Audit Form.</li>
              <li>GPS coordinate geo-tagging, live Pakistan interactive map with provincial breakdowns.</li>
              <li>12 mandatory installation & water functionality checkpoints with photo uploads.</li>
              <li>Automated defect-to-repair pipeline with before/after repair proof verification.</li>
              <li>Super Admin exclusive User ID creation, editing, rights assignment, and deletion.</li>
              <li>Official printable PDF document generation with digital signatures and water safety disclaimer.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-medium">
            FGRF Data Management & ERP Department • MIS Wing
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            Acknowledge & Close / بند کریں
          </button>
        </div>
      </div>
    </div>
  );
};
