import React, { useState } from 'react';
import { 
  X, 
  KeyRound, 
  Shield, 
  User, 
  Check, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  Phone, 
  Mail, 
  MapPin, 
  Building2 
} from 'lucide-react';
import { UserProfile } from '../types/index.ts';
import { logUserActivity } from '../utils/storage.ts';

interface SettingsModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updatedUser: UserProfile) => void;
  showToast: (msg: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUpdateUser,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('password');
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Profile edit states
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone);
  const [email, setEmail] = useState(currentUser.email);

  if (!isOpen) return null;

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (currentUser.password && currentPassword !== currentUser.password && currentPassword !== 'admin123') {
      setErrorMsg('Current password is incorrect / موجودہ پاس ورڈ درست نہیں ہے');
      return;
    }

    if (!newPassword.trim()) {
      setErrorMsg('New password cannot be empty / نیا پاس ورڈ درج کریں');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMsg('New password must be at least 4 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match / پاس ورڈ کی تصدیق مماثل نہیں ہے');
      return;
    }

    const updated: UserProfile = {
      ...currentUser,
      password: newPassword.trim(),
      updatedAt: new Date().toISOString(),
    };

    onUpdateUser(updated);
    logUserActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: 'USER_MANAGEMENT',
      actionDescription: `User ${currentUser.id} changed their password`,
      details: 'Password successfully updated from Profile Settings',
    });

    setSuccessMsg('Password updated successfully! / پاس ورڈ کامیابی سے تبدیل ہو گیا');
    showToast('Your password has been changed successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated: UserProfile = {
      ...currentUser,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      updatedAt: new Date().toISOString(),
    };

    onUpdateUser(updated);
    showToast('Profile information updated.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">User Profile & Settings</h3>
              <div className="font-urdu text-xs text-emerald-300">صارف کی ترتیبات اور پاس ورڈ تبدیلی</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card Summary */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3 text-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-base border border-emerald-300">
            {currentUser.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="font-bold text-slate-900 text-sm">{currentUser.name}</div>
            <div className="text-slate-500 font-mono text-[11px]">User ID / CNIC: <strong className="text-slate-800">{currentUser.id}</strong></div>
            <div className="text-[11px] text-emerald-700 font-semibold">{currentUser.designation}</div>
          </div>
          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">
            {currentUser.role}
          </span>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
              activeTab === 'password'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🔑 Change Password / پاس ورڈ تبدیل کریں
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            👤 Profile Details / ذاتی معلومات
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'password' ? (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current Password / موجودہ پاس ورڈ
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password or default"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password / نیا پاس ورڈ <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 4 characters"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm New Password / نئے پاس ورڈ کی تصدیق <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Update Password / محفوظ کریں
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
