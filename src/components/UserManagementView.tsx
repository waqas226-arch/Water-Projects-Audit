import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Edit3, 
  Trash2, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  X, 
  Save, 
  KeyRound, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail,
  UserCheck
} from 'lucide-react';
import { UserProfile, UserRights, UserRole } from '../types/index.ts';
import { getDefaultRightsForRole, validateUserId } from '../utils/auditLogic.ts';
import { PAKISTAN_PROVINCES, CountryInfo } from '../utils/pakistanGeo.ts';
import { getGeoHierarchy } from '../utils/storage.ts';

interface UserManagementViewProps {
  users: UserProfile[];
  currentUser: UserProfile;
  geoHierarchy?: CountryInfo[];
  onCreateUser: (newUser: UserProfile) => void;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users = [],
  currentUser,
  geoHierarchy,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterProvince, setFilterProvince] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);

  // Form states for Create/Edit
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formPassword, setFormPassword] = useState('admin123');
  const [formNewPassword, setFormNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formRole, setFormRole] = useState<UserRole>('field_inspector');
  const [formDesignation, setFormDesignation] = useState('');
  const [formProvince, setFormProvince] = useState('Sindh');
  const [formDivision, setFormDivision] = useState('All Divisions');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'suspended'>('active');
  const [formRights, setFormRights] = useState<UserRights>(getDefaultRightsForRole('field_inspector'));
  const [formError, setFormError] = useState('');

  // Access check: only admin/super_admin with canManageUsers
  const hasAdminAccess = currentUser.role === 'super_admin' && (currentUser.rights?.canManageUsers ?? true);

  // Filtered users
  const safeUsers = Array.isArray(users) ? users : [];
  const filteredUsers = useMemo(() => {
    return safeUsers.filter((u) => {
      if (filterRole !== 'all' && u.role !== filterRole) return false;
      if (filterProvince !== 'all' && u.province !== filterProvince) return false;
      if (filterStatus !== 'all' && u.status !== filterStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (u.id || '').toLowerCase().includes(q) ||
          (u.name || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.designation || '').toLowerCase().includes(q) ||
          (u.province && u.province.toLowerCase().includes(q)) ||
          (u.division && u.division.toLowerCase().includes(q)) ||
          (u.district && u.district.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [safeUsers, filterRole, filterProvince, filterStatus, searchQuery]);

  // Dynamic Geographic Hierarchy for Provinces and Divisions
  const resolvedGeo = geoHierarchy || getGeoHierarchy();
  const pakistanCountry = resolvedGeo.find((c) => c.name === 'Pakistan') || resolvedGeo[0];
  const availableProvinces = pakistanCountry?.provinces || PAKISTAN_PROVINCES;

  const selectedProvObj = availableProvinces.find((p) => p.name === formProvince) || availableProvinces[0];
  const divisionsInFormProv = selectedProvObj?.divisions || [];

  // Handle open create modal
  const handleOpenCreate = () => {
    setFormId('');
    setFormName('');
    setFormPassword('admin123');
    setShowPassword(false);
    setFormRole('field_inspector');
    setFormDesignation('Field Water Inspector');
    setFormProvince('Sindh');
    setFormDivision('All Divisions');
    setFormEmail('');
    setFormPhone('');
    setFormStatus('active');
    setFormRights(getDefaultRightsForRole('field_inspector'));
    setFormError('');
    setShowCreateModal(true);
  };

  // Handle role change in form -> auto update default rights
  const handleRoleChange = (newRole: UserRole) => {
    setFormRole(newRole);
    setFormRights(getDefaultRightsForRole(newRole));
    if (newRole === 'super_admin') {
      setFormDesignation('Head Office System Administrator');
    } else if (newRole === 'national_mgmt') {
      setFormDesignation('National Quality & Monitoring Director');
    } else if (newRole === 'provincial_coord') {
      setFormDesignation(`${formProvince} Provincial Coordinator`);
    } else if (newRole === 'field_inspector') {
      setFormDesignation('Senior Field Inspector');
    } else if (newRole === 'repair_team') {
      setFormDesignation('Technical Maintenance Lead');
    } else {
      setFormDesignation('Independent Quality Auditor');
    }
  };

  // Toggle single right
  const handleToggleRight = (rightKey: keyof UserRights) => {
    setFormRights((prev) => ({
      ...prev,
      [rightKey]: !prev[rightKey],
    }));
  };

  // Submit Create User
  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const validation = validateUserId(formId, users);
    if (!validation.isValid) {
      setFormError(validation.error || 'Invalid User ID');
      return;
    }
    if (!formName.trim()) {
      setFormError('Staff full name is required');
      return;
    }
    if (formPassword.trim().length < 4) {
      setFormError('Password must be at least 4 characters long');
      return;
    }

    const newUser: UserProfile = {
      id: formId.trim().toUpperCase(),
      name: formName.trim(),
      password: formPassword.trim() || 'admin123',
      role: formRole,
      designation: formDesignation.trim() || 'FGRF Staff Member',
      province: formRole === 'super_admin' || formRole === 'national_mgmt' || formRole === 'viewer' ? undefined : formProvince,
      division: formRole === 'super_admin' || formRole === 'national_mgmt' || formRole === 'viewer' ? undefined : formDivision,
      email: formEmail.trim() || `${formId.toLowerCase()}@fgrf.org`,
      phone: formPhone.trim() || '+92 300 0000000',
      status: formStatus,
      rights: formRights,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onCreateUser(newUser);
    setShowCreateModal(false);
  };

  // Handle open edit modal
  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormId(user.id);
    setFormName(user.name);
    setFormNewPassword('');
    setShowPassword(false);
    setFormRole(user.role);
    setFormDesignation(user.designation);
    setFormProvince(user.province || 'Sindh');
    setFormDivision(user.division || 'All Divisions');
    setFormEmail(user.email);
    setFormPhone(user.phone);
    setFormStatus(user.status || 'active');
    setFormRights(user.rights || getDefaultRightsForRole(user.role));
    setFormError('');
  };

  // Submit Edit User
  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError('');

    if (!formName.trim()) {
      setFormError('Staff name is required');
      return;
    }

    if (formNewPassword.trim() && formNewPassword.trim().length < 4) {
      setFormError('New password must be at least 4 characters long');
      return;
    }

    const updated: UserProfile = {
      ...editingUser,
      name: formName.trim(),
      password: formNewPassword.trim() ? formNewPassword.trim() : (editingUser.password || 'admin123'),
      role: formRole,
      designation: formDesignation.trim(),
      province: formRole === 'super_admin' || formRole === 'national_mgmt' || formRole === 'viewer' ? undefined : formProvince,
      division: formRole === 'super_admin' || formRole === 'national_mgmt' || formRole === 'viewer' ? undefined : formDivision,
      email: formEmail.trim(),
      phone: formPhone.trim(),
      status: formStatus,
      rights: formRights,
      updatedAt: new Date().toISOString(),
    };

    onUpdateUser(updated);
    setEditingUser(null);
  };

  // Confirm delete user
  const handleConfirmDelete = () => {
    if (!deletingUser) return;
    if (currentUser.role !== 'super_admin') {
      alert('Access Denied: Only HQ Super Admin has the authority to permanently delete User IDs.');
      setDeletingUser(null);
      return;
    }
    onDeleteUser(deletingUser.id);
    setDeletingUser(null);
  };

  // Role Badges
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[11px] font-bold px-2 py-0.5 rounded-full">Super Admin</span>;
      case 'national_mgmt':
        return <span className="bg-blue-100 text-blue-900 border border-blue-300 text-[11px] font-bold px-2 py-0.5 rounded-full">National Mgmt</span>;
      case 'provincial_coord':
        return <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-full">Coordinator</span>;
      case 'field_inspector':
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-full">Field Inspector</span>;
      case 'repair_team':
        return <span className="bg-rose-100 text-rose-900 border border-rose-300 text-[11px] font-bold px-2 py-0.5 rounded-full">Repair Team</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 border border-slate-300 text-[11px] font-bold px-2 py-0.5 rounded-full">Viewer</span>;
    }
  };

  // If user does NOT have Super Admin permissions
  if (!hasAdminAccess) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">User Management Module – Restricted Access</h2>
          <div className="font-urdu text-emerald-800 text-sm mt-0.5 font-bold">صرف سپرمین ایڈمن کے لیے مجاز اختیارات</div>
          <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
            Only Super Administrators (Head Office) have authority to create new User IDs, grant access permissions, edit user profiles, and delete user accounts.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 border border-slate-200 text-left space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Current Logged-in User:</span>
            <span className="font-bold text-slate-800">{currentUser.name} ({currentUser.id})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Assigned Role:</span>
            <span className="font-semibold text-slate-700">{currentUser.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">User Management Rights:</span>
            <span className="font-bold text-rose-600">Disabled (Admin Only)</span>
          </div>
        </div>

        <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200 text-xs text-rose-800 font-semibold flex items-center justify-center gap-2">
          <Shield className="w-4 h-4 text-rose-600" />
          <span>Access strictly restricted to Head Office Super Administrators.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 bg-purple-500/30 text-purple-200 border border-purple-400/30 text-xs rounded-full font-semibold">
                Super Admin Security & Access Control
              </span>
              <span className="text-xs text-slate-300">Centralized User IDs Registry</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              User ID Management & Access Rights Administration
            </h1>
            <h2 className="font-urdu text-base sm:text-lg font-bold text-emerald-300 mt-0.5">
              صارف شناختی کوڈز، اختیارات کی تخصیص اور انتظامی کنٹرول
            </h2>
            <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
              Create and manage User IDs for field inspectors, coordinators, and repair leads. Configure granular system permissions and regional jurisdictions.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New User ID / نیا صارف بنائیں</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Total Registered Users</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{safeUsers.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Field Inspectors</div>
          <div className="text-2xl font-black text-amber-800 mt-1">
            {safeUsers.filter((u) => u.role === 'field_inspector').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Provincial Coordinators</div>
          <div className="text-2xl font-black text-emerald-800 mt-1">
            {safeUsers.filter((u) => u.role === 'provincial_coord').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Super Administrators</div>
          <div className="text-2xl font-black text-purple-900 mt-1">
            {safeUsers.filter((u) => u.role === 'super_admin').length}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by User ID (e.g. FGRF-INS-101), Name, Email, District..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Roles / تمام عہدے</option>
            <option value="super_admin">Super Administrator</option>
            <option value="national_mgmt">National Management</option>
            <option value="provincial_coord">Provincial Coordinator</option>
            <option value="field_inspector">Field Inspector</option>
            <option value="repair_team">Repair Team</option>
            <option value="viewer">Viewer</option>
          </select>

          <select
            value={filterProvince}
            onChange={(e) => setFilterProvince(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Jurisdictions / تمام صوبے</option>
            {availableProvinces.map((p) => (
              <option key={p.name} value={p.name}>{p.name} {p.nameUrdu ? `(${p.nameUrdu})` : ''}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">User ID</th>
                <th className="p-3.5">Staff Name & Designation</th>
                <th className="p-3.5">System Role</th>
                <th className="p-3.5">Jurisdiction</th>
                <th className="p-3.5">Granular Rights Summary</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = currentUser.id === user.id;
                  const isPrimaryAdmin = user.id === 'FGRF-MIS-01' || user.id === '42101-1234567-1';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* User ID */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {user.id}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{user.email}</div>
                      </td>

                      {/* Staff Name & Designation */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{user.name}</div>
                        <div className="text-slate-500 text-[11px]">{user.designation}</div>
                      </td>

                      {/* Role */}
                      <td className="p-3.5">
                        {getRoleBadge(user.role)}
                      </td>

                      {/* Jurisdiction */}
                      <td className="p-3.5 text-slate-700">
                        <div className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{user.province || 'National (All Pakistan)'}</span>
                        </div>
                        {user.division && user.division !== 'All Divisions' && (
                          <div className="text-[10px] text-slate-500 pl-4.5 font-urdu">
                            {user.division} ڈویژن / Division
                          </div>
                        )}
                      </td>

                      {/* Rights Summary */}
                      <td className="p-3.5 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {user.rights?.canManageUsers && (
                            <span className="bg-purple-50 text-purple-700 text-[10px] font-semibold px-1.5 py-0.2 rounded border border-purple-200">
                              Users Admin
                            </span>
                          )}
                          {user.rights?.canReviewAndApprove && (
                            <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-1.5 py-0.2 rounded border border-blue-200">
                              Approve
                            </span>
                          )}
                          {user.rights?.canCreateInspection && (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-1.5 py-0.2 rounded border border-emerald-200">
                              Audit Form
                            </span>
                          )}
                          {user.rights?.canManageRepairs && (
                            <span className="bg-rose-50 text-rose-700 text-[10px] font-semibold px-1.5 py-0.2 rounded border border-rose-200">
                              Repairs
                            </span>
                          )}
                          {user.rights?.canCreateProject && (
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-1.5 py-0.2 rounded">
                              Projects
                            </span>
                          )}
                          {user.rights?.canExportReports && (
                            <span className="bg-teal-50 text-teal-700 text-[10px] font-semibold px-1.5 py-0.2 rounded border border-teal-200">
                              Export
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        {user.status === 'suspended' ? (
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            Suspended
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Rights & User */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                            title="Edit User ID & Rights"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Rights</span>
                          </button>

                          {/* Delete User */}
                          {!isPrimaryAdmin && (
                            <button
                              type="button"
                              onClick={() => setDeletingUser(user)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-200"
                              title="Delete User ID"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create New Staff User ID & Rights</h3>
                <span className="font-urdu text-emerald-800 text-xs">نیا صارف اور اختیارات رجسٹر کریں</span>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    User ID / CNIC (Manual) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formId}
                    onChange={(e) => setFormId(e.target.value.toUpperCase())}
                    placeholder="e.g. 42101-1234567-1 or FGRF-001"
                    className="w-full text-xs font-mono font-bold uppercase p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">Manual CNIC or custom Staff ID</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Staff Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Ghulam Mustafa Attari"
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">Full official name of staff member</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Login Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="e.g. admin123"
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Min 4 chars (Default: admin123)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role Profile</label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-semibold"
                  >
                    <option value="field_inspector">Field Inspector (فیلڈ انسپکٹر)</option>
                    <option value="provincial_coord">Provincial Coordinator (صوبائی کوآرڈینیٹر)</option>
                    <option value="national_mgmt">National / Head Office Management (قومی انتظامیہ)</option>
                    <option value="repair_team">Repair / Maintenance Team (مرمت ٹیم)</option>
                    <option value="super_admin">Super Administrator – Head Office (سپرمین ایڈمن)</option>
                    <option value="viewer">Management Viewer (ناظر)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Designation</label>
                  <input
                    type="text"
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    placeholder="e.g. Senior Water Quality Inspector"
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Province Jurisdiction / صوبائی دائرہ اختیار
                  </label>
                  <select
                    value={formProvince}
                    onChange={(e) => {
                      const p = e.target.value;
                      setFormProvince(p);
                      setFormDivision('All Divisions');
                    }}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                  >
                    {availableProvinces.map((p) => (
                      <option key={p.name} value={p.name}>{p.name} ({p.nameUrdu})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Division Jurisdiction / متعلقہ ڈویژن
                  </label>
                  <select
                    value={formDivision}
                    onChange={(e) => setFormDivision(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                  >
                    <option value="All Divisions">All Divisions (تمام ڈویژنز / Entire Province)</option>
                    {divisionsInFormProv.map((d) => (
                      <option key={d.name} value={d.name}>{d.name} ({d.nameUrdu})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="staff@fgrf.org"
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="active">Active (فعال)</option>
                    <option value="suspended">Suspended (معطل)</option>
                  </select>
                </div>
              </div>

              {/* Granular Rights Matrix */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    Configure Granular Access Rights / اختیارات کی تخصیص
                  </span>
                  <span className="text-[11px] text-slate-500">Toggle rights for this User ID</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formRights.canCreateInspection}
                      onChange={() => handleToggleRight('canCreateInspection')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Create & Submit Audits (نیا معائنہ)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formRights.canEditInspection}
                      onChange={() => handleToggleRight('canEditInspection')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Edit Inspections (ترمیم معائنہ)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formRights.canDeleteInspection}
                      onChange={() => handleToggleRight('canDeleteInspection')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Delete Inspections (حذف معائنہ)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formRights.canReviewAndApprove}
                      onChange={() => handleToggleRight('canReviewAndApprove')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Approve / Return Audits (توثیق و منظوری)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formRights.canManageRepairs}
                      onChange={() => handleToggleRight('canManageRepairs')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Manage & Complete Repairs (مرمت کاری)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formRights.canCreateProject}
                      onChange={() => handleToggleRight('canCreateProject')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Create Water Projects (نیا پراجیکٹ)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formRights.canDeleteProject}
                      onChange={() => handleToggleRight('canDeleteProject')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Delete Projects (حذف پراجیکٹ)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formRights.canExportReports}
                      onChange={() => handleToggleRight('canExportReports')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Export Excel & PDF Reports (ایکسپورٹ)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={!!formRights.canViewDashboard}
                      onChange={() => handleToggleRight('canViewDashboard')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Central Audit Dashboard (ڈیش بورڈ)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={!!formRights.canViewMap}
                      onChange={() => handleToggleRight('canViewMap')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>GIS Pakistan Map (نقشہ پاکستان)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={!!formRights.canManageOpenHeads}
                      onChange={() => handleToggleRight('canManageOpenHeads')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Open Heads Configuration (اوپن ہیڈز)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={!!formRights.canViewActivityLogs}
                      onChange={() => handleToggleRight('canViewActivityLogs')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Activity Log Sheet (لاگ شیٹ)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={formRights.canManageUsers}
                      onChange={() => handleToggleRight('canManageUsers')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span className="font-bold text-purple-900">
                      User Management & Rights Admin (صارفین کی تشکیل و اختیارات – Admin Only)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-lg shadow-xs"
                >
                  Save & Register User ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit User ID & Rights: {editingUser.id}</h3>
                <span className="font-urdu text-emerald-800 text-xs">صارف کی تفصیلات اور اختیارات میں ترمیم</span>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">User ID (Permanent Code)</label>
                  <input
                    type="text"
                    disabled
                    value={formId}
                    className="w-full text-xs font-mono font-bold uppercase p-2.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Staff Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role Profile</label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-semibold"
                  >
                    <option value="field_inspector">Field Inspector</option>
                    <option value="provincial_coord">Provincial Coordinator</option>
                    <option value="national_mgmt">National / Head Office Management</option>
                    <option value="repair_team">Repair / Maintenance Team</option>
                    <option value="super_admin">Super Administrator – Head Office</option>
                    <option value="viewer">Management Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Designation</label>
                  <input
                    type="text"
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Province Jurisdiction / صوبائی دائرہ اختیار
                  </label>
                  <select
                    value={formProvince}
                    onChange={(e) => {
                      const p = e.target.value;
                      setFormProvince(p);
                      setFormDivision('All Divisions');
                    }}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                  >
                    {availableProvinces.map((p) => (
                      <option key={p.name} value={p.name}>{p.name} ({p.nameUrdu})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Division Jurisdiction / متعلقہ ڈویژن
                  </label>
                  <select
                    value={formDivision}
                    onChange={(e) => setFormDivision(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                  >
                    <option value="All Divisions">All Divisions (تمام ڈویژنز / Entire Province)</option>
                    {divisionsInFormProv.map((d) => (
                      <option key={d.name} value={d.name}>{d.name} ({d.nameUrdu})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="active">Active (فعال)</option>
                    <option value="suspended">Suspended (معطل)</option>
                  </select>
                </div>
              </div>

              {/* Password Change Field */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5">
                <label className="block text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-700" />
                  Change User Password / پاس ورڈ تبدیل کریں (اختیاری)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formNewPassword}
                    onChange={(e) => setFormNewPassword(e.target.value)}
                    placeholder="Leave empty to keep existing password / تبدیل نہ کرنا ہو تو خالی چھوڑیں"
                    className="w-full text-xs p-2.5 bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-amber-800">
                  Enter a new password (minimum 4 characters) only if the user needs their password reset.
                </p>
              </div>

              {/* Granular Rights Matrix */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    Configure Granular Access Rights / اختیارات کی تخصیص
                  </span>
                  <span className="text-[11px] text-slate-500">Toggle rights for this User ID</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formRights.canCreateInspection}
                      onChange={() => handleToggleRight('canCreateInspection')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Create & Submit Audits (نیا معائنہ)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formRights.canEditInspection}
                      onChange={() => handleToggleRight('canEditInspection')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Edit Inspections (ترمیم معائنہ)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formRights.canDeleteInspection}
                      onChange={() => handleToggleRight('canDeleteInspection')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Delete Inspections (حذف معائنہ)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formRights.canReviewAndApprove}
                      onChange={() => handleToggleRight('canReviewAndApprove')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Approve / Return Audits (توثیق و منظوری)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formRights.canManageRepairs}
                      onChange={() => handleToggleRight('canManageRepairs')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Manage & Complete Repairs (مرمت کاری)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formRights.canCreateProject}
                      onChange={() => handleToggleRight('canCreateProject')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Create Water Projects (نیا پراجیکٹ)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formRights.canDeleteProject}
                      onChange={() => handleToggleRight('canDeleteProject')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Delete Projects (حذف پراجیکٹ)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formRights.canExportReports}
                      onChange={() => handleToggleRight('canExportReports')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Export Excel & PDF Reports (ایکسپورٹ)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={!!formRights.canViewDashboard}
                      onChange={() => handleToggleRight('canViewDashboard')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Central Audit Dashboard (ڈیش بورڈ)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={!!formRights.canViewMap}
                      onChange={() => handleToggleRight('canViewMap')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>GIS Pakistan Map (نقشہ پاکستان)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={!!formRights.canManageOpenHeads}
                      onChange={() => handleToggleRight('canManageOpenHeads')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Open Heads Configuration (اوپن ہیڈز)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={!!formRights.canViewActivityLogs}
                      onChange={() => handleToggleRight('canViewActivityLogs')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Activity Log Sheet (لاگ شیٹ)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={formRights.canManageUsers}
                      onChange={() => handleToggleRight('canManageUsers')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span className="font-bold text-purple-900">
                      User Management & Rights Admin (صارفین کی تشکیل و اختیارات – Admin Only)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-lg shadow-xs"
                >
                  Save Changes / ترمیم محفوظ کریں
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm User ID Deletion</h3>
                <span className="font-urdu text-rose-700 text-xs">صارف شناختی کوڈ کو حذف کریں</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete user ID <strong className="font-mono text-slate-900">{deletingUser.id}</strong> ({deletingUser.name})? This user will lose system login privileges immediately.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs"
              >
                Delete User ID
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
