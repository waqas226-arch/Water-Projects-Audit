import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  User, 
  Globe, 
  Clock, 
  Activity, 
  Calendar,
  Laptop,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { UserActivityLog, UserProfile } from '../types/index.ts';
import { getActivityLogs, clearActivityLogs, detectClientIp } from '../utils/storage.ts';

interface ActivityLogViewProps {
  currentUser: UserProfile;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<UserActivityLog[]>(() => getActivityLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [clientIp, setClientIp] = useState<string>('192.168.1.105');

  React.useEffect(() => {
    detectClientIp().then((ip) => {
      if (ip) setClientIp(ip);
    });
  }, []);

  const refreshLogs = () => {
    setLogs(getActivityLogs());
  };

  const uniqueUsers = useMemo(() => {
    const map = new Map<string, string>();
    logs.forEach((l) => map.set(l.userId, l.userName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterUser !== 'all' && log.userId !== filterUser) return false;
      if (filterAction !== 'all' && log.actionType !== filterAction) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          log.id.toLowerCase().includes(q) ||
          log.userId.toLowerCase().includes(q) ||
          log.userName.toLowerCase().includes(q) ||
          log.ipAddress.toLowerCase().includes(q) ||
          log.actionType.toLowerCase().includes(q) ||
          log.actionDescription.toLowerCase().includes(q) ||
          (log.details && log.details.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [logs, filterUser, filterAction, searchQuery]);

  const handleExportExcel = () => {
    const dataToExport = filteredLogs.map((l) => ({
      'Log ID': l.id,
      'Timestamp (UTC)': l.timestamp,
      'Local Date & Time': new Date(l.timestamp).toLocaleString(),
      'User ID': l.userId,
      'User Name': l.userName,
      'User Role': l.userRole,
      'Client IP Address': l.ipAddress,
      'Action Type': l.actionType,
      'Action Description': l.actionDescription,
      'Details / Target': l.details || '',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Activity Logs');
    XLSX.writeFile(wb, `FGRF_User_Activity_Logs_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear the activity logs history? This action cannot be reversed.')) {
      clearActivityLogs();
      setLogs([]);
    }
  };

  const getActionBadge = (type: UserActivityLog['actionType']) => {
    switch (type) {
      case 'LOGIN':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">LOGIN / لاگ ان</span>;
      case 'AUDIT_CREATE':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">AUDIT CREATE / نیا معائنہ</span>;
      case 'AUDIT_APPROVE':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">APPROVE / توثیق</span>;
      case 'AUDIT_RETURN':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">RETURN / واپسی</span>;
      case 'PROJECT_CREATE':
        return <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-200">PROJ CREATE / پراجیکٹ</span>;
      case 'PROJECT_UPDATE':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">PROJ EDIT / ترمیم</span>;
      case 'PROJECT_DELETE':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-300">PROJ DELETE / حذف</span>;
      case 'HEADS_UPDATE':
        return <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">HEADS / اوپن ہیڈز</span>;
      case 'REPAIR_UPDATE':
        return <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200">REPAIR / مرمت</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">{type}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold">
                Audit Trail & Security Protocol
              </span>
              <span className="text-indigo-300 text-xs font-semibold">MIS Security System</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              USER ACTIVITY & CLIENT IP ACCESS LOG SHEET
            </h1>
            <h2 className="font-urdu text-lg sm:text-xl font-bold text-indigo-200 mt-1">
              صارفین کی سرگرمی، ایکشن لاگ اور آئی پی ایڈریس شیٹ
            </h2>
            <p className="text-slate-300 text-xs mt-1 max-w-2xl">
              Complete audit trail recording all software interactions, user logins, inspection generations, QR code issuances, project edits, and deletion actions with real-time client IP addresses.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <div className="text-xs text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Current Client IP:</span>
              <span className="font-mono font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                {clientIp}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Active User: <strong className="text-slate-200">{currentUser.name}</strong> ({currentUser.id})
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Logged Actions</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{logs.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">کل ریکارڈ شدہ سرگرمیاں</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active Users Monitored</span>
            <User className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{uniqueUsers.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">مانیٹر شدہ یوزرز</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Inspections & Audits</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1">
            {logs.filter((l) => l.actionType === 'AUDIT_CREATE' || l.actionType === 'AUDIT_APPROVE').length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">آڈٹ و کیو آر کوڈ اندراج</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>DB Changes (Edits/Deletes)</span>
            <Laptop className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {logs.filter((l) => l.actionType === 'PROJECT_UPDATE' || l.actionType === 'PROJECT_DELETE' || l.actionType === 'HEADS_UPDATE').length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">ڈیٹا بیس تبدیلیاں</div>
        </div>
      </div>

      {/* Control Bar: Filters, Search, Export */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, ID, IP address, action or details..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* User Wise Filter */}
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
          >
            <option value="all">All Users (تمام صارفین)</option>
            {uniqueUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.id})
              </option>
            ))}
          </select>

          {/* Action Type Filter */}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
          >
            <option value="all">All Actions (تمام سرگرمیاں)</option>
            <option value="LOGIN">User Login</option>
            <option value="AUDIT_CREATE">New Inspection & QR Generated</option>
            <option value="AUDIT_APPROVE">Inspection Approved</option>
            <option value="AUDIT_RETURN">Inspection Returned</option>
            <option value="PROJECT_CREATE">New Project Registered</option>
            <option value="PROJECT_UPDATE">Project Master DB Updated</option>
            <option value="PROJECT_DELETE">Project Record Deleted</option>
            <option value="HEADS_UPDATE">Open Heads Modified</option>
            <option value="REPAIR_UPDATE">Repair Item Updated</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={refreshLogs}
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
            title="Refresh Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel (.xlsx)</span>
          </button>

          {currentUser.role === 'super_admin' && (
            <button
              onClick={handleClearLogs}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-300 transition-colors flex items-center gap-1"
              title="Clear log history (Admin only)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table: User-wise Activity Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs uppercase text-slate-700">Detailed Action Sheet</span>
            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
              {filteredLogs.length} Records Shown
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-urdu">
            فیضان گلوبل ریلیف فاؤنڈیشن – مرکزی سیکیورٹی آڈٹ ٹریل
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Log ID & Time</th>
                <th className="p-3.5">User ID & Name</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Client IP Address</th>
                <th className="p-3.5">Action Type</th>
                <th className="p-3.5">Action Description</th>
                <th className="p-3.5">Details & Target Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-slate-400">
                    No activity logs match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Log ID & Time */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900">{log.id}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </td>

                    {/* User ID & Name */}
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                          {log.userId}
                        </span>
                        <span>{log.userName}</span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 font-medium">
                        {log.userRole}
                      </span>
                    </td>

                    {/* Client IP Address */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                          {log.ipAddress}
                        </span>
                      </div>
                    </td>

                    {/* Action Type */}
                    <td className="p-3.5 whitespace-nowrap">
                      {getActionBadge(log.actionType)}
                    </td>

                    {/* Action Description */}
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800 leading-snug">
                        {log.actionDescription}
                      </div>
                    </td>

                    {/* Details / Target */}
                    <td className="p-3.5">
                      <div className="text-[11px] text-slate-600 max-w-xs leading-relaxed font-mono bg-slate-50 p-1.5 rounded border border-slate-200">
                        {log.details || 'Standard system action logged.'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
