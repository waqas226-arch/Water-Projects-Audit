import React, { useState } from 'react';
import { X, UserCheck, Shield, MapPin, KeyRound, CheckCircle2, ChevronRight, Award } from 'lucide-react';
import { UserProfile, UserRole } from '../types/index.ts';
import { getDefaultRightsForRole, PRECONFIGURED_USERS } from '../utils/auditLogic.ts';

interface UserIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  users?: UserProfile[];
}

export const UserIdModal: React.FC<UserIdModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  users = PRECONFIGURED_USERS,
}) => {
  const [manualId, setManualId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const trimmed = manualId.trim().toUpperCase();
    if (!trimmed) {
      setErrorMsg('Please enter a User ID');
      return;
    }

    const matched = users.find(
      (u) => u.id.toUpperCase() === trimmed || u.email.toUpperCase() === trimmed
    );

    if (matched) {
      if (matched.status === 'suspended') {
        setErrorMsg('This User ID account is suspended. Please contact Super Admin.');
        return;
      }
      onSelectUser(matched);
      onClose();
    } else {
      // Create ad-hoc inspector or staff session
      const targetRole: UserRole = trimmed.includes('HQ') || trimmed.includes('ADMIN') ? 'super_admin' : 'field_inspector';
      const newUser: UserProfile = {
        id: trimmed,
        name: `Authorized User (${trimmed})`,
        role: targetRole,
        designation: 'Field Operations Specialist',
        province: 'Sindh',
        email: `${trimmed.toLowerCase()}@fgrf.org`,
        phone: '+92 300 0000000',
        status: 'active',
        rights: getDefaultRightsForRole(targetRole),
      };
      onSelectUser(newUser);
      onClose();
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return <span className="bg-purple-100 text-purple-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-purple-200">Super Admin (HQ)</span>;
      case 'national_mgmt':
        return <span className="bg-blue-100 text-blue-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-blue-200">National Management</span>;
      case 'provincial_coord':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">Provincial Coordinator</span>;
      case 'field_inspector':
        return <span className="bg-amber-100 text-amber-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-amber-200">Field Inspector</span>;
      case 'repair_team':
        return <span className="bg-rose-100 text-rose-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-rose-200">Repair Team</span>;
      case 'viewer':
        return <span className="bg-slate-100 text-slate-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-slate-200">Viewer (Read-Only)</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/30 rounded-xl border border-emerald-400/30">
              <KeyRound className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">User ID Access & Role Switching</h2>
                <span className="font-urdu text-emerald-200 text-sm">صارف شناختی رسائی</span>
              </div>
              <p className="text-emerald-100 text-xs mt-0.5">
                Switch profiles to simulate field inspectors, regional coordinators, and Head Office roles.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick User ID Input */}
          <form onSubmit={handleManualLogin} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Enter User ID / Staff Code
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="e.g. FGRF-HQ-01, FGRF-INS-101, FGRF-REP-01"
                  className="w-full pl-3 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 uppercase font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                Access
              </button>
            </div>
            {errorMsg && <p className="text-rose-600 text-xs mt-1.5">{errorMsg}</p>}
          </form>

          {/* Quick Select Pre-configured Profiles */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pre-configured Role Profiles
              </h3>
              <span className="text-xs text-slate-400">Click to switch instantly</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {users.map((user) => {
                const isActive = currentUser.id === user.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      onSelectUser(user);
                      onClose();
                    }}
                    type="button"
                    className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-700 border border-slate-200">
                          {user.id}
                        </span>
                        {isActive ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          getRoleBadge(user.role)
                        )}
                      </div>
                      <div className="font-semibold text-slate-800 text-sm">{user.name}</div>
                      <div className="text-xs text-slate-500 truncate">{user.designation}</div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {user.province ? `${user.province}${user.division && user.division !== 'All Divisions' ? ` • ${user.division}` : (user.district ? ` (${user.district})` : '')}` : 'National (All Pakistan)'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Session Summary */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                {currentUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <div className="text-xs text-slate-500">Currently Logged In As:</div>
                <div className="text-sm font-bold text-slate-800">{currentUser.name} ({currentUser.id})</div>
                <div className="text-xs text-emerald-700 font-medium">{currentUser.designation}</div>
              </div>
            </div>
            <div className="text-right">
              {getRoleBadge(currentUser.role)}
              <div className="text-[11px] text-slate-500 mt-1">
                Jurisdiction: {currentUser.province || 'Nationwide'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close / بند کریں
          </button>
        </div>
      </div>
    </div>
  );
};
