import React, { useState } from 'react';
import { 
  Cloud, 
  Database, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ShieldCheck, 
  RefreshCw, 
  FileText, 
  Layers, 
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { 
  exportLocalDatabaseBackup, 
  migrateLocalDataToCloud, 
  MigrationSummary 
} from '../utils/migration.ts';
import { 
  isFirebaseConfigured, 
  getFirebaseConfig, 
  saveCustomFirebaseConfig, 
  clearCustomFirebaseConfig,
  FirebaseClientConfig 
} from '../firebase/config.ts';
import { getActiveCloudEngine } from '../utils/cloudSync.ts';
import { UserProfile } from '../types/index.ts';

interface CloudMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  showToast: (msg: string) => void;
  onMigrationSuccess?: () => void;
}

export const CloudMigrationModal: React.FC<CloudMigrationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  showToast,
  onMigrationSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'migrate' | 'config'>('migrate');
  const [isRunningDryRun, setIsRunningDryRun] = useState(false);
  const [isRunningLiveMigration, setIsRunningLiveMigration] = useState(false);
  const [migrationReport, setMigrationReport] = useState<MigrationSummary | null>(null);

  // Configuration Form state
  const existingConfig = getFirebaseConfig();
  const [apiKey, setApiKey] = useState(existingConfig?.apiKey || '');
  const [projectId, setProjectId] = useState(existingConfig?.projectId || '');
  const [authDomain, setAuthDomain] = useState(existingConfig?.authDomain || '');
  const [storageBucket, setStorageBucket] = useState(existingConfig?.storageBucket || '');
  const [appId, setAppId] = useState(existingConfig?.appId || '');

  if (!isOpen) return null;

  const isConfigured = isFirebaseConfigured();
  const activeEngine = getActiveCloudEngine();

  // Export local JSON backup file
  const handleDownloadBackup = () => {
    try {
      const json = exportLocalDatabaseBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FGRF_Water_Audit_Local_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Local database backup exported successfully.');
    } catch {
      showToast('Failed to export backup.');
    }
  };

  // Run Dry-Run Migration
  const handleDryRun = async () => {
    setIsRunningDryRun(true);
    try {
      const summary = await migrateLocalDataToCloud(true, currentUser.id);
      setMigrationReport(summary);
      showToast('Dry-run completed. Review record summary below.');
    } catch (err: any) {
      showToast(`Dry-run error: ${err.message || String(err)}`);
    } finally {
      setIsRunningDryRun(false);
    }
  };

  // Run Live Migration
  const handleLiveMigration = async () => {
    if (!window.confirm('Are you sure you want to upload validated local records to Cloud Firestore? Existing local data will NOT be deleted.')) {
      return;
    }

    setIsRunningLiveMigration(true);
    try {
      const summary = await migrateLocalDataToCloud(false, currentUser.id);
      setMigrationReport(summary);
      if (summary.errors.length === 0) {
        showToast('Live cloud migration completed successfully!');
        if (onMigrationSuccess) onMigrationSuccess();
      } else {
        showToast(`Migration completed with ${summary.errors.length} error(s).`);
      }
    } catch (err: any) {
      showToast(`Live migration error: ${err.message || String(err)}`);
    } finally {
      setIsRunningLiveMigration(false);
    }
  };

  // Save custom Firebase credentials
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim()) {
      showToast('API Key and Project ID are required.');
      return;
    }

    const newCfg: FirebaseClientConfig = {
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      storageBucket: storageBucket.trim() || `${projectId.trim()}.appspot.com`,
      appId: appId.trim(),
    };

    saveCustomFirebaseConfig(newCfg);
    showToast('Firebase configuration saved. Reloading services...');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleResetConfig = () => {
    clearCustomFirebaseConfig();
    showToast('Custom configuration cleared. Reverted to environment defaults.');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden text-slate-800">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">
                  Central Cloud Database & Migration Center
                </h3>
                <span className="font-mono text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">
                  Firebase Firestore
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-user cloud synchronization, offline caching & data transfer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Engine Status Banner */}
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Active Database Engine:</span>
            <span className="inline-flex items-center gap-1.5 font-bold font-mono px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-2xs">
              <span className={`w-2 h-2 rounded-full ${activeEngine === 'firebase' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-slate-900">
                {activeEngine === 'firebase' ? 'Google Firebase Cloud Firestore (Live)' : activeEngine === 'local_server' ? 'Local Central DB' : 'Offline Local Storage'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('migrate')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${activeTab === 'migrate' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              Migration Utility
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${activeTab === 'config' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              Cloud Credentials
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {activeTab === 'migrate' && (
            <div className="space-y-6">
              
              {/* Step 1: Backup Local Records */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Download className="w-4 h-4 text-emerald-600" />
                      1. Backup Local Records (Zero Risk)
                    </h4>
                    <p className="text-slate-500 mt-0.5">
                      Download a full JSON backup of your current browser storage before migrating.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadBackup}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 font-bold text-slate-700 flex items-center gap-2 shadow-2xs hover:border-slate-400 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Download JSON Backup</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Dry Run & Validation */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      2. Dry-Run Migration Simulation
                    </h4>
                    <p className="text-slate-500 mt-0.5">
                      Validates all records, checks tombstone IDs, and previews upload counts without writing to the cloud.
                    </p>
                  </div>
                  <button
                    onClick={handleDryRun}
                    disabled={isRunningDryRun}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRunningDryRun ? 'animate-spin' : ''}`} />
                    <span>{isRunningDryRun ? 'Simulating...' : 'Run Dry-Run'}</span>
                  </button>
                </div>
              </div>

              {/* Step 3: Live Upload */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 text-emerald-700" />
                      3. Live Transfer to Cloud Firestore
                    </h4>
                    <p className="text-emerald-800/80 mt-0.5">
                      Uploads validated records to the central database so all computers worldwide see them. Local data is preserved.
                    </p>
                  </div>
                  <button
                    onClick={handleLiveMigration}
                    disabled={isRunningLiveMigration || !isConfigured}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold flex items-center gap-2 shadow-md shadow-emerald-700/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{isRunningLiveMigration ? 'Migrating Live...' : 'Start Live Migration'}</span>
                  </button>
                </div>
                {!isConfigured && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Firebase credentials not yet detected. Switch to "Cloud Credentials" tab to configure.</span>
                  </div>
                )}
              </div>

              {/* Migration Report Display */}
              {migrationReport && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span>{migrationReport.isDryRun ? 'Dry-Run Simulation Report' : 'Live Migration Report'}</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">
                      {new Date(migrationReport.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="text-slate-500 text-[10px] uppercase font-bold">Water Projects</div>
                      <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                        {migrationReport.projects.validCount} <span className="text-[10px] font-normal text-slate-400">/ {migrationReport.projects.localCount}</span>
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">Valid for sync</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="text-slate-500 text-[10px] uppercase font-bold">Audit Records</div>
                      <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                        {migrationReport.audits.validCount} <span className="text-[10px] font-normal text-slate-400">/ {migrationReport.audits.localCount}</span>
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">Valid for sync</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="text-slate-500 text-[10px] uppercase font-bold">Repairs / Orders</div>
                      <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                        {migrationReport.repairs.validCount} <span className="text-[10px] font-normal text-slate-400">/ {migrationReport.repairs.localCount}</span>
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">Valid for sync</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="text-slate-500 text-[10px] uppercase font-bold">Staff Profiles</div>
                      <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                        {migrationReport.users.validCount} <span className="text-[10px] font-normal text-slate-400">/ {migrationReport.users.localCount}</span>
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">Valid for sync</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-600 pt-1">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Master Heads: {migrationReport.headsMigrated ? 'Verified' : 'Skipped'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Geo Hierarchy: {migrationReport.geoMigrated ? 'Verified' : 'Skipped'}
                    </span>
                  </div>

                  {migrationReport.errors.length > 0 && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Notices & Skipped Items:</span>
                      </div>
                      <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                        {migrationReport.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {activeTab === 'config' && (
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                You can configure your Firebase Project credentials here or through environment variables in <code className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">.env</code>.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Firebase API Key <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Project ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="fgrf-water-projects-audit"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Auth Domain
                  </label>
                  <input
                    type="text"
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                    placeholder="project-id.firebaseapp.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Storage Bucket
                  </label>
                  <input
                    type="text"
                    value={storageBucket}
                    onChange={(e) => setStorageBucket(e.target.value)}
                    placeholder="project-id.appspot.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    App ID
                  </label>
                  <input
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="1:123456789012:web:abcdef1234567890"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResetConfig}
                  className="px-3 py-2 rounded-lg text-slate-500 hover:text-rose-600 font-bold hover:bg-rose-50 transition-colors"
                >
                  Clear Custom Config
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer transition-all"
                >
                  Save & Connect Firebase
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Faizan Global Relief Foundation • Data Management & ERP Department</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold border border-slate-300 cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
