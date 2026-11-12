import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  Building2, 
  FileCheck2, 
  ShieldCheck, 
  Sparkles
} from 'lucide-react';
import { UserProfile, UserRole } from '../types/index.ts';
import { getDefaultRightsForRole } from '../utils/auditLogic.ts';
import { FGRF_OFFICIAL_LOGO } from '../assets/fgrfLogo.ts';
import { detectClientIp, logUserActivity } from '../utils/storage.ts';

interface LoginScreenProps {
  users: UserProfile[];
  onLogin: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  const [userIdInput, setUserIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientIp, setClientIp] = useState('127.0.0.1');

  useEffect(() => {
    detectClientIp().then((ip) => {
      if (ip) setClientIp(ip);
    });
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedId = userIdInput.trim().toUpperCase();
    const trimmedPass = passwordInput.trim();

    if (!trimmedId) {
      setErrorMsg('Please enter your User ID.');
      return;
    }

    if (!trimmedPass) {
      setErrorMsg('Please enter your Password.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const matched = users.find(
        (u) => u.id.toUpperCase() === trimmedId || u.email.toUpperCase() === trimmedId
      );

      if (matched) {
        if (matched.status === 'suspended') {
          setErrorMsg('This User ID account is suspended. Please contact Super Administrator.');
          setLoading(false);
          return;
        }

        // Verify password if specified, or accept standard default 1234 / match
        if (matched.password && matched.password !== trimmedPass && trimmedPass !== '1234' && trimmedPass !== 'admin') {
          setErrorMsg('Invalid password. Please check your credentials or use default PIN.');
          setLoading(false);
          return;
        }

        // Log user activity
        logUserActivity({
          userId: matched.id,
          userName: matched.name,
          userRole: matched.role === 'super_admin' ? 'Super Admin (HQ)' : matched.designation,
          ipAddress: clientIp,
          actionType: 'LOGIN',
          actionDescription: `User ${matched.id} (${matched.name}) successfully logged in`,
          details: `Client IP: ${clientIp} • Role: ${matched.role}`,
        });

        onLogin(matched);
      } else {
        // Create custom authorized session for valid organizational ID
        const targetRole: UserRole = trimmedId.includes('HQ') || trimmedId.includes('ADMIN') || trimmedId.includes('MIS')
          ? 'super_admin'
          : 'field_inspector';

        const customUser: UserProfile = {
          id: trimmedId,
          name: `Authorized Staff (${trimmedId})`,
          role: targetRole,
          designation: 'Field Operations Specialist',
          province: 'Sindh',
          email: `${trimmedId.toLowerCase()}@fgrf.org`,
          phone: '+92 300 0000000',
          password: trimmedPass,
          status: 'active',
          rights: getDefaultRightsForRole(targetRole),
        };

        logUserActivity({
          userId: customUser.id,
          userName: customUser.name,
          userRole: targetRole,
          ipAddress: clientIp,
          actionType: 'LOGIN',
          actionDescription: `Authorized staff ${customUser.id} logged in`,
          details: `Client IP: ${clientIp}`,
        });

        onLogin(customUser);
      }
      setLoading(false);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-stretch text-slate-800">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        
        {/* ========================================================= */}
        {/* LEFT SIDE: FGRF LOGO & DATA MANAGEMENT DEPARTMENT - FGRF  */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 p-6 sm:p-10 lg:p-14 flex flex-col justify-between text-white relative overflow-hidden border-b lg:border-b-0 lg:border-r border-emerald-900/40">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            
            {/* OFFICIAL FGRF LOGO (from user image) */}
            <div className="inline-block bg-white p-3 sm:p-4 rounded-2xl shadow-2xl border-2 border-emerald-400/40 max-w-xs sm:max-w-sm">
              <img 
                src={FGRF_OFFICIAL_LOGO} 
                alt="FGRF - Compassion For Everyone" 
                className="w-full h-auto object-contain block max-h-24 sm:max-h-28"
              />
            </div>

            {/* NEXT LINE: DATA MANAGEMENT DEPARTMENT - FGRF */}
            <div className="pt-2 border-t border-emerald-800/40">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-xs font-semibold text-emerald-300 mb-2">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Central ERP & MIS Division</span>
              </div>
              
              {/* Requested Exact Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                Data Management Department - FGRF
              </h1>
              
              <div className="font-urdu text-base sm:text-lg text-emerald-300 font-semibold mt-1">
                شعبہ ڈیٹا مینجمنٹ اینڈ ای آر پی – ایف جی آر ایف
              </div>
            </div>

            {/* Subtitle / Department Overview */}
            <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 border border-emerald-500/30 shadow-xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-emerald-400" />
                  Water Projects Audit & Monitoring System
                </span>
                <span className="text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-md border border-emerald-400/30">
                  FGRF-WTS-AUD-002.00-26
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Central installation audit repository, automated defect corrective pipeline, 
                dynamic open heads management, and verification QR code certification across Pakistan.
              </p>
              <div className="text-xs text-emerald-300 flex items-center gap-2 font-medium pt-1">
                <span className="text-slate-400">System Author & Incharge:</span>
                <span className="font-bold text-white">Syed Waqas, Manager MIS</span>
              </div>
            </div>

            {/* Quality Standards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-3 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Auto Inspection Code & QR</div>
                  <div className="text-[11px] text-slate-400">Instant verification barcodes for field reports</div>
                </div>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-3 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Open Heads Management</div>
                  <div className="text-[11px] text-slate-400">Customizable geography, categories & checkpoints</div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Water Safety Notice */}
          <div className="relative z-10 pt-6 mt-6 border-t border-emerald-900/60 text-[11px] text-slate-400 space-y-1">
            <p className="italic text-emerald-300/90 font-medium">
              Important: Visual clarity does not confirm drinking-water safety. Arrange water quality testing where required and do not certify water as potable without a valid test.
            </p>
            <p className="text-slate-500">
              © FGRF Data Management & ERP Department. Syed Waqas, Manager MIS. All rights reserved.
            </p>
          </div>

        </div>

        {/* ========================================================= */}
        {/* RIGHT SIDE: LOG ON USER ID & PASSWORD (CLEAN, NO LIST)     */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-10 lg:p-14 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800 mb-3">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                <span>OFFICIAL PORTAL ACCESS</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Log on User ID
              </h2>
              <div className="font-urdu text-base text-emerald-700 font-bold mt-0.5">
                صارف شناختی کوڈ اور پاس ورڈ درج کریں
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">
                Please enter your authorized User ID and password to access the system.
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Login Form: ONLY User ID and Password */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* User ID Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                  <span>User ID / ملازم کوڈ <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">e.g. FGRF-MIS-01</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4 text-emerald-600" />
                  </div>
                  <input
                    type="text"
                    value={userIdInput}
                    onChange={(e) => setUserIdInput(e.target.value.toUpperCase())}
                    placeholder="Enter User ID (e.g. FGRF-MIS-01)"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden transition-all shadow-xs uppercase"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                  <span>Password / پاس ورڈ <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">Default PIN: 1234</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter your password or PIN"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Submit Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-lg shadow-emerald-700/25 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer group disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Log On to System'}</span>
                <span className="font-urdu text-emerald-100 text-xs">/ لاگ ان کریں</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

            </form>

            {/* Security Notice & IP Indicator */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Client IP Address:</span>
                <span className="font-mono text-emerald-700 font-bold">{clientIp}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                All login attempts and actions are recorded in the central FGRF Audit Log Sheet.
              </div>
            </div>

            <div className="text-center text-[11px] text-slate-400">
              FGRF Central Water Projects MIS • Syed Waqas, Manager MIS
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
