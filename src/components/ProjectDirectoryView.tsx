import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Plus, 
  Upload, 
  Search, 
  Filter, 
  MapPin, 
  Droplet, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle,
  X,
  ExternalLink,
  Trash2,
  Settings,
  Check,
  Edit
} from 'lucide-react';
import { InstallationType, OverallCondition, UserProfile, WaterProject } from '../types/index.ts';
import { validateProjectId } from '../utils/auditLogic.ts';
import { GLOBAL_COUNTRIES, PAKISTAN_PROVINCES, findGlobalDistrictCoordinates, findDistrictCoordinates } from '../utils/pakistanGeo.ts';
import { getMasterHeads, getGeoHierarchy, logUserActivity } from '../utils/storage.ts';

interface ProjectDirectoryViewProps {
  projects: WaterProject[];
  currentUser: UserProfile;
  onAddProject: (newProject: WaterProject) => void;
  onBulkImportProjects: (importedProjects: WaterProject[]) => void;
  onSelectProjectForAudit: (projectId: string) => void;
  onUpdateProject?: (updated: WaterProject) => void;
  onDeleteProject?: (id: string) => void;
}

export const ProjectDirectoryView: React.FC<ProjectDirectoryViewProps> = ({
  projects,
  currentUser,
  onAddProject,
  onBulkImportProjects,
  onSelectProjectForAudit,
  onUpdateProject,
  onDeleteProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [filterProvince, setFilterProvince] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCondition, setFilterCondition] = useState<string>('all');

  // Add modal state with 5-level global hierarchy
  const [showAddModal, setShowAddModal] = useState(false);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newCountry, setNewCountry] = useState('Pakistan');
  const [newProvince, setNewProvince] = useState('Sindh');
  const [newDivision, setNewDivision] = useState('Mirpur Khas');
  const [newDistrict, setNewDistrict] = useState('Tharparkar');
  const [newTehsil, setNewTehsil] = useState('Mithi');
  const [newUC, setNewUC] = useState('UC Chelhar');
  const [newVillage, setNewVillage] = useState('');
  const [newType, setNewType] = useState<InstallationType>('Filter Hand Pump');
  const [newInstallDate, setNewInstallDate] = useState(new Date().toISOString().slice(0, 10));
  const [newBeneficiary, setNewBeneficiary] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newDonorRef, setNewDonorRef] = useState('');
  const [validationError, setValidationError] = useState('');

  // Bulk import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');

  // Edit project state & rights
  const [editingProject, setEditingProject] = useState<WaterProject | null>(null);
  const [editError, setEditError] = useState('');

  const masterHeads = useMemo(() => getMasterHeads(), []);
  const geoHierarchy = useMemo(() => getGeoHierarchy(), []);

  const handleOpenEditModal = (proj: WaterProject) => {
    setEditingProject({ ...proj });
    setEditError('');
  };

  const handleSaveEditProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    if (!editingProject.name.trim() || !editingProject.village.trim() || !editingProject.beneficiaryName.trim()) {
      setEditError('Project name, village, and beneficiary name are required.');
      return;
    }
    if (onUpdateProject) {
      onUpdateProject(editingProject);
    }
    logUserActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: 'PROJECT_UPDATE',
      actionDescription: `Updated Project Master Database for ${editingProject.id}`,
      details: `${editingProject.name} (${editingProject.district}, ${editingProject.village}). Condition: ${editingProject.currentCondition}`
    });
    setEditingProject(null);
  };

  const handleDeleteProject = (proj: WaterProject) => {
    if (window.confirm(`Are you sure you want to delete project ${proj.id} (${proj.name}) from Pakistan Water Projects Master Database? This action cannot be reversed.`)) {
      if (onDeleteProject) {
        onDeleteProject(proj.id);
      }
      logUserActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        actionType: 'PROJECT_DELETE',
        actionDescription: `Deleted Project ${proj.id} from Master Database`,
        details: `${proj.name} in ${proj.village}, ${proj.district}`
      });
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filterCountry !== 'all') {
        const pCountry = p.country || 'Pakistan';
        if (pCountry !== filterCountry) return false;
      }
      if (filterProvince !== 'all' && p.province !== filterProvince) return false;
      if (filterType !== 'all' && p.installationType !== filterType) return false;
      if (filterCondition !== 'all' && p.currentCondition !== filterCondition) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          p.id.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          (p.country && p.country.toLowerCase().includes(q)) ||
          p.village.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q) ||
          p.tehsil.toLowerCase().includes(q) ||
          p.beneficiaryName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [projects, filterCountry, filterProvince, filterType, filterCondition, searchQuery]);

  // Modal 5-tier cascade references
  const selectedCountryObj = GLOBAL_COUNTRIES.find((c) => c.name === newCountry) || GLOBAL_COUNTRIES[0];
  const availableProvincesInAdd = selectedCountryObj?.provinces || [];
  const selectedProvObj = availableProvincesInAdd.find((p) => p.name === newProvince) || availableProvincesInAdd[0];
  const availableDivisionsInAdd = selectedProvObj?.divisions || [];
  const selectedDivObj = availableDivisionsInAdd.find((d) => d.name === newDivision) || availableDivisionsInAdd[0];
  const availableDistrictsInAdd = selectedDivObj?.districts || [];
  const selectedDistObj = availableDistrictsInAdd.find((d) => d.name === newDistrict) || availableDistrictsInAdd[0];
  const availableTehsilsInAdd = selectedDistObj?.tehsils || [];

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const validation = validateProjectId(newId, projects);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid Project ID');
      return;
    }
    if (!newVillage.trim()) {
      setValidationError('Village name is required');
      return;
    }
    if (!newBeneficiary.trim()) {
      setValidationError('Beneficiary contact name is required');
      return;
    }

    const coords = findGlobalDistrictCoordinates(newCountry, newDistrict);
    const proj: WaterProject = {
      id: newId.trim().toUpperCase(),
      name: newName.trim() || `${newVillage} ${newType}`,
      country: newCountry,
      province: newProvince,
      division: newDivision,
      district: newDistrict,
      tehsil: newTehsil,
      unionCouncil: newUC,
      village: newVillage,
      installationType: newType,
      installationDate: newInstallDate,
      contractorOrDonorRef: newDonorRef,
      beneficiaryName: newBeneficiary,
      beneficiaryMobile: newMobile,
      gpsCoordinates: {
        lat: Number((coords.lat + (Math.random() - 0.5) * 0.05).toFixed(5)),
        lng: Number((coords.lng + (Math.random() - 0.5) * 0.05).toFixed(5)),
      },
      currentCondition: 'Functional',
      totalInspections: 0,
      status: 'Active',
    };

    onAddProject(proj);
    setShowAddModal(false);
    // Reset
    setNewId('');
    setNewName('');
    setNewVillage('');
    setNewBeneficiary('');
    setNewMobile('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('Processing file...');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          setImportStatus('Error: The uploaded sheet contains no records.');
          return;
        }

        const imported: WaterProject[] = [];
        let skipped = 0;

        data.forEach((row, index) => {
          const rawId = (row['Project ID'] || row['ID'] || `FGRF-WTS-IMP-${Date.now()}-${index}`).toString().trim().toUpperCase();
          // Check if duplicate
          const existing = projects.some((p) => p.id === rawId) || imported.some((p) => p.id === rawId);
          if (existing) {
            skipped++;
            return;
          }

          const dist = (row['District'] || 'Thatta').toString();
          const prov = (row['Province'] || 'Sindh').toString();
          const coords = findDistrictCoordinates(dist);

          imported.push({
            id: rawId,
            name: (row['Project Name'] || row['Name'] || `${row['Village'] || 'Site'} Water Point`).toString(),
            province: prov,
            division: (row['Division'] || 'Division').toString(),
            district: dist,
            tehsil: (row['Tehsil'] || 'Tehsil').toString(),
            unionCouncil: (row['Union Council'] || row['UC'] || 'UC-1').toString(),
            village: (row['Village'] || 'Village').toString(),
            installationType: (row['Type'] || 'Filter Hand Pump').includes('Filter') ? 'Filter Hand Pump' : 'Hand Pump',
            installationDate: (row['Installation Date'] || new Date().toISOString().slice(0, 10)).toString(),
            contractorOrDonorRef: (row['Donor Ref'] || 'EXCEL-IMPORT').toString(),
            beneficiaryName: (row['Beneficiary'] || 'Community Contact').toString(),
            beneficiaryMobile: (row['Mobile'] || '0300-0000000').toString(),
            gpsCoordinates: {
              lat: Number(parseFloat(row['Latitude']) || coords.lat),
              lng: Number(parseFloat(row['Longitude']) || coords.lng),
            },
            currentCondition: (row['Condition'] || 'Functional') as OverallCondition,
            totalInspections: 0,
            status: 'Active',
          });
        });

        if (imported.length > 0) {
          onBulkImportProjects(imported);
          setImportStatus(`Successfully imported ${imported.length} new water projects (${skipped} duplicates skipped).`);
          setTimeout(() => {
            setShowImportModal(false);
            setImportStatus('');
          }, 1800);
        } else {
          setImportStatus(`All ${skipped} records in the file already exist in the database.`);
        }
      } catch (err: any) {
        setImportStatus(`Import Error: ${err.message}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadSampleTemplate = () => {
    const sample = [
      {
        'Project ID': 'FGRF-WTS-SND-010',
        'Project Name': 'Goth Qasim Hand Pump',
        'Province': 'Sindh',
        'Division': 'Mirpur Khas',
        'District': 'Tharparkar',
        'Tehsil': 'Mithi',
        'Union Council': 'UC Chelhar',
        'Village': 'Goth Qasim',
        'Type': 'Filter Hand Pump',
        'Installation Date': '2025-05-10',
        'Donor Ref': 'DONOR-UK-12',
        'Beneficiary': 'Muhammad Qasim',
        'Mobile': '0300-1122334',
        'Latitude': 24.745,
        'Longitude': 69.805,
        'Condition': 'Functional',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample Projects');
    XLSX.writeFile(wb, 'FGRF_Water_Projects_Import_Template.xlsx');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Pakistan Water Projects Master Database</h2>
            <span className="font-urdu text-emerald-800 text-base">واٹر پراجیکٹس مرکزی رجسٹری</span>
          </div>
          <p className="text-xs text-slate-500">
            Official centralized registry of all FGRF water hand pumps and filtration stations across Pakistan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 border border-slate-300"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            Bulk Import Excel
          </button>

          <button
            type="button"
            onClick={() => onSelectProjectForAudit('')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Projects are automatically entered and registered at the inspection form level"
          >
            <Plus className="w-4 h-4" />
            <span>Enter via Inspection Form / نیا معائنہ فارم</span>
          </button>
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
            placeholder="Search by Project ID, Village, District, Beneficiary..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Countries / تمام ممالک</option>
            {GLOBAL_COUNTRIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.flag} {c.name} ({c.nameUrdu})
              </option>
            ))}
          </select>

          <select
            value={filterProvince}
            onChange={(e) => setFilterProvince(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Provinces / تمام صوبے</option>
            {PAKISTAN_PROVINCES.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Types / تمام اقسام</option>
            <option value="Hand Pump">Hand Pump (ہینڈ پمپ)</option>
            <option value="Filter Hand Pump">Filter Hand Pump (فلٹر پمپ)</option>
          </select>

          <select
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Conditions / تمام حالتیں</option>
            <option value="Functional">Functional</option>
            <option value="Functional – Repair Needed">Repair Needed</option>
            <option value="Non-functional">Non-functional</option>
            <option value="Not Installed / Wrong Location">Wrong Location</option>
          </select>
        </div>
      </div>

      {/* Projects Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Project ID</th>
                <th className="p-3.5">Location & Village</th>
                <th className="p-3.5">District / Region / Country</th>
                <th className="p-3.5">Installation Type</th>
                <th className="p-3.5">Beneficiary Contact</th>
                <th className="p-3.5">Current Status</th>
                <th className="p-3.5">Inspections</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-3 py-6">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                        <Droplet className="w-6 h-6" />
                      </div>
                      <div className="font-bold text-slate-800 text-sm">Water Projects Master Registry is Ready</div>
                      <div className="font-urdu text-emerald-800 text-xs">واٹر پراجیکٹس مرکزی رجسٹری فیلڈ ڈیٹا کے اندراج کے لیے تیار ہے</div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Projects are registered and updated automatically into this master database when field inspection forms are submitted.
                      </p>
                      <button
                        type="button"
                        onClick={() => onSelectProjectForAudit('')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Go to New Inspection Form / نیا معائنہ فارم کھولیں</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((proj) => (
                  <tr key={proj.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-emerald-950">
                      {proj.id}
                      <div className="text-[10px] text-slate-400 font-sans">{proj.contractorOrDonorRef}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-slate-800">{proj.village}</div>
                      <div className="text-slate-500 text-[11px]">{proj.name}</div>
                      <div className="text-[10px] text-emerald-700 font-medium">Tehsil: {proj.tehsil}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{proj.district}</div>
                      <div className="text-slate-500 text-[10px] flex items-center gap-1 mt-0.5">
                        <span className="bg-slate-100 text-slate-700 px-1 py-0.2 rounded border border-slate-200">
                          {proj.country || 'Pakistan'}
                        </span>
                        <span>•</span>
                        <span>{proj.province}</span>
                      </div>
                    </td>

                    <td className="p-3.5 font-medium text-slate-700">
                      {proj.installationType}
                    </td>

                    <td className="p-3.5">
                      <div className="text-slate-800 font-medium">{proj.beneficiaryName}</div>
                      <div className="text-slate-500 font-mono text-[10px]">{proj.beneficiaryMobile}</div>
                    </td>

                    <td className="p-3.5">
                      {proj.currentCondition === 'Functional' ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                          Functional
                        </span>
                      ) : proj.currentCondition === 'Functional – Repair Needed' ? (
                        <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                          Repair Needed
                        </span>
                      ) : proj.currentCondition === 'Non-functional' ? (
                        <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-rose-300">
                          Non-functional
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-slate-300">
                          Wrong Location
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 font-semibold text-slate-700">
                      {proj.totalInspections} audit{proj.totalInspections !== 1 ? 's' : ''}
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectProjectForAudit(proj.id)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs text-[11px]"
                          title="Conduct Official Audit for this Project / اس پراجیکٹ کا نیا معائنہ کریں"
                        >
                          <Droplet className="w-3.5 h-3.5" />
                          <span>Audit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(proj)}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 rounded-lg transition-colors"
                          title="Edit Master Database Record / ڈیٹا بیس ریکارڈ میں ترمیم کریں"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(proj)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg transition-colors"
                          title="Delete Project Record / پراجیکٹ ڈیٹا بیس سے حذف کریں"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Bulk Import Projects via Excel</h3>
                <span className="font-urdu text-emerald-800 text-xs">ایکسل فائل کے ذریعے ایک ساتھ اندراج</span>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Upload an Excel (.xlsx or .csv) file with columns: <strong>Project ID, Village, District, Province, Type, Installation Date, Beneficiary, Mobile, Latitude, Longitude</strong>. Duplicate project IDs will automatically be prevented.
            </p>

            <div className="flex justify-start">
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 underline"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Download Sample Excel Template (.xlsx)
              </button>
            </div>

            <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50 transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-bold text-slate-700">Select .xlsx or .csv file</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Click or drag file here</span>
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
            </label>

            {importStatus && (
              <div className="p-3 bg-slate-100 rounded-xl text-xs font-medium text-slate-800">
                {importStatus}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal (Master Database Rights) */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                    <Edit className="w-4 h-4" />
                  </span>
                  Edit Water Project Record (Master Database)
                </h3>
                <span className="font-urdu text-amber-800 text-xs">واٹر پراجیکٹ ماسٹر ڈیٹا بیس ریکارڈ میں ترمیم کریں</span>
              </div>
              <button onClick={() => setEditingProject(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEditProject} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Project ID / Code (Read-Only)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingProject.id}
                    className="w-full text-xs p-2.5 bg-slate-100 border border-slate-300 rounded-lg font-mono font-bold text-slate-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Project Name / شناخت <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProject.name}
                    onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Geographic Hierarchy */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Geographic Location (Country to Tehsil)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Country</label>
                    <input
                      type="text"
                      value={editingProject.country || 'Pakistan'}
                      onChange={(e) => setEditingProject({ ...editingProject, country: e.target.value })}
                      className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Province</label>
                    <input
                      type="text"
                      value={editingProject.province}
                      onChange={(e) => setEditingProject({ ...editingProject, province: e.target.value })}
                      className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Division</label>
                    <input
                      type="text"
                      value={editingProject.division}
                      onChange={(e) => setEditingProject({ ...editingProject, division: e.target.value })}
                      className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">District</label>
                    <input
                      type="text"
                      value={editingProject.district}
                      onChange={(e) => setEditingProject({ ...editingProject, district: e.target.value })}
                      className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Tehsil / Town</label>
                    <input
                      type="text"
                      value={editingProject.tehsil}
                      onChange={(e) => setEditingProject({ ...editingProject, tehsil: e.target.value })}
                      className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Union Council</label>
                    <input
                      type="text"
                      value={editingProject.unionCouncil}
                      onChange={(e) => setEditingProject({ ...editingProject, unionCouncil: e.target.value })}
                      className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Village / Goth / Site Address <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editingProject.village}
                    onChange={(e) => setEditingProject({ ...editingProject, village: e.target.value })}
                    className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Technical & Operational Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Installation Type</label>
                  <select
                    value={editingProject.installationType}
                    onChange={(e) => setEditingProject({ ...editingProject, installationType: e.target.value as InstallationType })}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    {masterHeads.categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Condition</label>
                  <select
                    value={editingProject.currentCondition}
                    onChange={(e) => setEditingProject({ ...editingProject, currentCondition: e.target.value as OverallCondition })}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-bold"
                  >
                    {masterHeads.conditions.map((c) => (
                      <option key={c.id} value={c.id}>{c.labelEn} ({c.labelUrdu})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingProject.status}
                    onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value as any })}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Active">Active / چالو</option>
                    <option value="Under Maintenance">Under Maintenance / زیر مرمت</option>
                    <option value="Decommissioned">Decommissioned / منسوخ</option>
                  </select>
                </div>
              </div>

              {/* Beneficiary & Donor */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Beneficiary Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editingProject.beneficiaryName}
                    onChange={(e) => setEditingProject({ ...editingProject, beneficiaryName: e.target.value })}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Beneficiary Mobile</label>
                  <input
                    type="text"
                    value={editingProject.beneficiaryMobile}
                    onChange={(e) => setEditingProject({ ...editingProject, beneficiaryMobile: e.target.value })}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Donor / Contractor Ref</label>
                  <input
                    type="text"
                    value={editingProject.contractorOrDonorRef || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, contractorOrDonorRef: e.target.value })}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* GPS Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GPS Latitude (شمالی عرض بلد)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={editingProject.gpsCoordinates.lat}
                    onChange={(e) => setEditingProject({
                      ...editingProject,
                      gpsCoordinates: { ...editingProject.gpsCoordinates, lat: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GPS Longitude (مشرقی طول بلد)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={editingProject.gpsCoordinates.lng}
                    onChange={(e) => setEditingProject({
                      ...editingProject,
                      gpsCoordinates: { ...editingProject.gpsCoordinates, lng: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Save Changes to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
