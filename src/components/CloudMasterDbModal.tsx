import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cloud, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  ExternalLink, 
  Key, 
  Server, 
  Globe, 
  HelpCircle,
  FileJson
} from 'lucide-react';
import { AuditRecord, WaterProject, RepairItem, UserProfile } from '../types/index.ts';
import { 
  getCloudSyncEndpoint, 
  setCloudSyncEndpoint, 
  getLastSyncTime, 
  syncAllWithCloud, 
  fetchCloudData, 
  pushLocalToCloud,
  getGitHubToken,
  setGitHubToken,
  mergeAudits,
  mergeProjects,
  mergeRepairs,
  mergeUsers,
  GOOGLE_APPS_SCRIPT_TEMPLATE
} from '../utils/cloudSync.ts';
import { 
  getAudits, 
  getProjects, 
  getRepairs, 
  getGeoHierarchy,
  saveGeoHierarchy,
  getMasterHeads,
  saveMasterHeads,
  saveAudits, 
  saveProjects, 
  saveRepairs,
  getUsers,
  saveUsers
} from '../utils/storage.ts';
import { mergeGeoHierarchy } from '../utils/pakistanGeo.ts';

interface CloudMasterDbModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  audits: AuditRecord[];
  projects: WaterProject[];
  repairs: RepairItem[];
  onDataUpdated: () => void;
  showToast: (msg: string) => void;
}

export const CloudMasterDbModal: React.FC<CloudMasterDbModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  audits,
  projects,
  repairs,
  onDataUpdated,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'setup' | 'exchange'>('status');
  const [endpointUrl, setEndpointUrl] = useState<string>(getCloudSyncEndpoint());
  const [githubToken, setGithubTokenState] = useState<string>(getGitHubToken());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [lastSync, setLastSync] = useState<string | null>(getLastSyncTime());
  const [remoteStats, setRemoteStats] = useState<{ audits: number; projects: number; users?: number; lastUpdated?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEndpointUrl(getCloudSyncEndpoint());
      setGithubTokenState(getGitHubToken());
      setLastSync(getLastSyncTime());
      handleTestConnection(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Test live cloud connectivity
  const handleTestConnection = async (verbose: boolean = true) => {
    setTestStatus('testing');
    setTestMessage('Pinging cloud database / ڈیٹا بیس چیک ہو رہا ہے...');
    try {
      const data = await fetchCloudData();
      if (data) {
        setTestStatus('success');
        setRemoteStats({
          audits: data.audits.length,
          projects: data.projects.length,
          users: data.users?.length || 0,
          lastUpdated: data.lastUpdated
        });
        setTestMessage(`Online & Operational (${data.audits.length} audits, ${data.projects.length} projects, ${data.users?.length || 0} users in cloud)`);
        if (verbose) showToast('Cloud Master DB connection confirmed active!');
      } else {
        setTestStatus('failed');
        setTestMessage('Cloud endpoint returned an error or is offline. Please check custom URL.');
        if (verbose) showToast('Could not reach cloud database. Check endpoint settings.');
      }
    } catch (e: any) {
      setTestStatus('failed');
      setTestMessage(`Connection failed: ${e?.message || 'Network unreachable'}`);
    }
  };

  // Perform full two-way sync
  const handlePerformSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncAllWithCloud(currentUser.id);
      setLastSync(new Date().toISOString());
      onDataUpdated();
      showToast(res.message);
      await handleTestConnection(false);
    } catch {
      showToast('Synchronization completed with local fallback.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Force push local records to cloud
  const handleForcePush = async () => {
    setIsSyncing(true);
    try {
      const success = await pushLocalToCloud(
        getAudits(),
        getProjects(),
        getRepairs(),
        currentUser.id,
        getGeoHierarchy(),
        getMasterHeads(),
        getUsers()
      );
      if (success) {
        setLastSync(new Date().toISOString());
        showToast('All local inspection records, locations and user IDs uploaded to Cloud Master DB!');
        await handleTestConnection(false);
      } else {
        showToast('Upload failed. Verify cloud endpoint URL.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Save new custom endpoint URL
  const handleSaveEndpoint = () => {
    setCloudSyncEndpoint(endpointUrl);
    setGitHubToken(githubToken);
    showToast('Cloud Master DB configuration saved.');
    handleTestConnection(true);
  };

  // Reset to default
  const handleResetToDefault = () => {
    setCloudSyncEndpoint('');
    setEndpointUrl(getCloudSyncEndpoint());
    showToast('Reset to default cloud endpoint.');
    handleTestConnection(true);
  };

  // Copy Google Apps Script code to clipboard
  const handleCopyScriptCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedCode(true);
    showToast('Google Apps Script code copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 3000);
  };

  // Export local database to a downloadable JSON file
  const handleExportDatabase = () => {
    const payload = {
      system: 'Faizan Global Relief Foundation (FGRF) - Water Projects Audit System',
      formReference: 'FGRF-WTS-AUD-002.00-26',
      architect: 'Syed Waqas, Manager MIS (Data Management & ERP Department)',
      exportTimestamp: new Date().toISOString(),
      exportedBy: `${currentUser.name} (${currentUser.id})`,
      audits: getAudits(),
      projects: getProjects(),
      repairs: getRepairs(),
      geoHierarchy: getGeoHierarchy(),
      masterHeads: getMasterHeads(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FGRF_Water_Master_DB_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Master Database exported to JSON file successfully.');
  };

  // Import JSON file from field inspector / peer
  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed || typeof parsed !== 'object') {
          showToast('Invalid file format. Must be an official FGRF Master DB JSON.');
          return;
        }

        const incomingAudits = Array.isArray(parsed.audits) ? parsed.audits : [];
        const incomingProjects = Array.isArray(parsed.projects) ? parsed.projects : [];
        const incomingRepairs = Array.isArray(parsed.repairs) ? parsed.repairs : [];

        const { merged: mergedAudits, newCount: newAudits } = mergeAudits(getAudits(), incomingAudits);
        const { merged: mergedProjects, newCount: newProjects } = mergeProjects(getProjects(), incomingProjects);
        const mergedRepairs = mergeRepairs(getRepairs(), incomingRepairs);

        saveAudits(mergedAudits);
        saveProjects(mergedProjects);
        saveRepairs(mergedRepairs);

        if (parsed.geoHierarchy && Array.isArray(parsed.geoHierarchy) && parsed.geoHierarchy.length > 0) {
          const mergedGeo = mergeGeoHierarchy(getGeoHierarchy(), parsed.geoHierarchy);
          saveGeoHierarchy(mergedGeo);
        }

        if (parsed.masterHeads && typeof parsed.masterHeads === 'object') {
          saveMasterHeads(parsed.masterHeads);
        }

        if (parsed.users && Array.isArray(parsed.users) && parsed.users.length > 0) {
          const { merged: mergedUsers } = mergeUsers(getUsers(), parsed.users);
          saveUsers(mergedUsers);
        }

        onDataUpdated();
        showToast(`Imported & Merged: ${newAudits} new audits, ${newProjects} new projects!`);

        // Also push merged to cloud
        await pushLocalToCloud(
          mergedAudits,
          mergedProjects,
          mergedRepairs,
          currentUser.id,
          getGeoHierarchy(),
          getMasterHeads(),
          getUsers()
        );
      } catch (err: any) {
        showToast(`Import failed: ${err?.message || 'Could not parse JSON'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white flex items-center justify-between border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-md">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">Cloud Master Database Manager</h3>
                <span className="font-urdu text-emerald-300 text-xs font-semibold">مرکزی کلاؤڈ ڈیٹا بیس</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Multi-Location Real-Time Live Synchronization across Pakistan • Syed Waqas (Manager MIS)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'border-emerald-600 text-emerald-900 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Live Sync Status</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('setup')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'setup'
                ? 'border-emerald-600 text-emerald-900 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Cloud Endpoint Setup (Free & Unlimited)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('exchange')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'exchange'
                ? 'border-emerald-600 text-emerald-900 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Emergency Offline Backup & Merge</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-slate-800 text-xs">
          
          {/* TAB 1: STATUS & IMMEDIATE ACTIONS */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              
              {/* Connection Status Box */}
              <div className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                testStatus === 'success' 
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                  : testStatus === 'failed'
                  ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    testStatus === 'success' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                  }`}>
                    {testStatus === 'success' ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm">
                        {testStatus === 'success' ? 'Real-Time Master Database Online' : 'Database Status / رابطہ کی کیفیت'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        testStatus === 'success' ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                      }`}>
                        {testStatus}
                      </span>
                    </div>
                    <p className="mt-1 text-xs opacity-90">{testMessage}</p>
                    <div className="mt-2 text-[11px] opacity-75 font-mono">
                      Active Relay: <span className="font-semibold truncate inline-block max-w-[360px] align-bottom">{endpointUrl}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTestConnection(true)}
                  disabled={testStatus === 'testing'}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold transition-all shrink-0 cursor-pointer text-xs flex items-center gap-1 shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                  <span>Test Connection</span>
                </button>
              </div>

              {/* Data Statistics Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Local Audits</div>
                  <div className="text-lg font-extrabold text-emerald-800 mt-0.5">{audits.length}</div>
                  <div className="text-[10px] text-slate-400 font-urdu mt-0.5">معائنہ فارمز</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Local Projects</div>
                  <div className="text-lg font-extrabold text-teal-800 mt-0.5">{projects.length}</div>
                  <div className="text-[10px] text-slate-400 font-urdu mt-0.5">واٹر پراجیکٹس</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Staff User IDs</div>
                  <div className="text-lg font-extrabold text-purple-800 mt-0.5">{getUsers().length}</div>
                  <div className="text-[10px] text-slate-400 font-urdu mt-0.5">صارفین شناختی کوڈز</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Cloud Audits</div>
                  <div className="text-lg font-extrabold text-blue-800 mt-0.5">
                    {remoteStats ? remoteStats.audits : '—'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-urdu mt-0.5">کلاؤڈ ریکارڈز</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Real-Time Sync</div>
                  <div className="text-xs font-bold text-emerald-700 mt-1 truncate">
                    {lastSync ? new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live (15s)'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-urdu mt-0.5">ہر 15 سیکنڈ میں فعال</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePerformSync}
                  disabled={isSyncing}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer text-xs"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <div>
                    <div>Perform Two-Way Live Sync Now</div>
                    <div className="font-urdu text-[10px] font-normal opacity-90">دو طرفہ مکمل ہم وقت سازی کریں</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleForcePush}
                  disabled={isSyncing}
                  className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-emerald-300 hover:text-white font-bold flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer text-xs shadow-xs"
                >
                  <Upload className="w-4 h-4" />
                  <div>
                    <div>Force Upload All Local to Cloud Master</div>
                    <div className="font-urdu text-[10px] font-normal opacity-90">تمام لوکل ریکارڈز کلاؤڈ پر اپلوڈ کریں</div>
                  </div>
                </button>
              </div>

              {/* Note on Multi-location usage */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-relaxed flex items-start gap-2">
                <Globe className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Multi-Location Field Staff Collaboration:</span> When field inspectors submit an inspection anywhere across Pakistan, the system automatically pushes the form into the cloud master database. Clicking <strong>Two-Way Live Sync</strong> pulls in all newly verified reports across all regional coordinators.
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SETUP PERMANENT & UNLIMITED ENDPOINT */}
          {activeTab === 'setup' && (
            <div className="space-y-4">
              
              {/* Recommended Solution: Google Apps Script Web App */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-300 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      RECOMMENDED FOR FGRF
                    </span>
                    <h4 className="font-bold text-emerald-950 text-xs">
                      Permanent 100% Free & Unlimited Cloud Database (Google Apps Script)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyScriptCode}
                    className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-emerald-100 border border-emerald-400 text-emerald-900 font-bold rounded-lg transition-all text-xs cursor-pointer shadow-2xs"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy Script Code'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  Google Apps Script runs on Google's cloud infrastructure, is 100% free forever for all Google accounts, never gets blocked by Pakistani corporate firewalls (Sophos/Dawateislami), and has zero 50-request daily rate limits.
                </p>

                <div className="bg-white p-3 rounded-xl border border-emerald-200 text-[11px] space-y-1.5 text-slate-700">
                  <div className="font-bold text-slate-900">How to set up in 2 minutes:</div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                    <li>Open <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-emerald-700 font-bold underline inline-flex items-center gap-0.5">script.google.com <ExternalLink className="w-3 h-3" /></a> with your Google account.</li>
                    <li>Click <strong>New Project</strong>, paste the copied code, and click <strong>Deploy &gt; New deployment</strong>.</li>
                    <li>Select <strong>Web app</strong>, set <em>Who has access</em> to <strong>Anyone</strong>, and copy your Web App URL.</li>
                    <li>Paste your Web App URL in the box below and click <strong>Save & Connect</strong>!</li>
                  </ol>
                </div>
              </div>

              {/* Endpoint Input Box */}
              <div className="space-y-2">
                <label className="font-bold text-slate-900 flex items-center justify-between text-xs">
                  <span>Custom Cloud Database Endpoint / Web App URL:</span>
                  <span className="font-urdu text-[11px] text-slate-500">کلاؤڈ ڈیٹا بیس اینڈ پوائنٹ</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={endpointUrl}
                    onChange={(e) => setEndpointUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec or https://api.restful-api.dev/..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleSaveEndpoint}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all cursor-pointer text-xs shrink-0"
                  >
                    Save & Connect
                  </button>
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="px-3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs shrink-0"
                    title="Reset to Default Relay"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Optional GitHub Token for Auto-Commits */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="font-bold text-slate-900 flex items-center justify-between text-xs">
                  <span>GitHub Personal Access Token (Optional for Direct Repo Commits):</span>
                  <span className="font-urdu text-[11px] text-slate-500">گٹ ہب ٹوکن</span>
                </label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubTokenState(e.target.value)}
                  placeholder="ghp_... (Allows frontend to commit master_cloud_database.json directly to repo)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none font-mono text-xs"
                />
                <p className="text-[10px] text-slate-400">
                  When provided, the app will also commit the master database to GitHub repository <code>waqas226-arch/Water-project-Audit</code>.
                </p>
              </div>

            </div>
          )}

          {/* TAB 3: EMERGENCY OFFLINE BACKUP & EXCHANGE */}
          {activeTab === 'exchange' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-950 text-xs leading-relaxed flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Offline Emergency File Exchange:</span> If field inspectors work in remote areas with poor or blocked 3G/4G connectivity, they can export all inspections as a single file and share it via WhatsApp or Email. HQ Management can then import and merge the file without data loss.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Export Card */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-emerald-700" />
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">Export Master Database File</div>
                      <div className="text-[10px] text-slate-500">Download .json backup file</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Exports {audits.length} audits and {projects.length} water projects into a single verified JSON file.
                  </p>
                  <button
                    type="button"
                    onClick={handleExportDatabase}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download JSON Backup</span>
                  </button>
                </div>

                {/* Import Card */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-teal-700" />
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">Import & Merge Records</div>
                      <div className="text-[10px] text-slate-500">Select file received from field</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Safely merges records into existing database. Conflicting or duplicate records are resolved by newest timestamp.
                  </p>
                  <label className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-emerald-300 font-bold transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-2xs">
                    <Upload className="w-4 h-4" />
                    <span>Select & Merge JSON File</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportDatabase}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            FGRF Form: FGRF-WTS-AUD-002.00-26
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition-colors cursor-pointer text-xs"
          >
            Close / بند کریں
          </button>
        </div>

      </div>
    </div>
  );
};
