import React, { useState } from 'react';
import { 
  FolderTree, 
  Layers, 
  HelpCircle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Globe, 
  MapPin, 
  AlertCircle,
  Building,
  Tag,
  RotateCcw,
  Sliders,
  Check,
  ChevronRight
} from 'lucide-react';
import { MasterHeadsConfig, MasterHeadOption, MasterQuestionHead, UserProfile } from '../types/index.ts';
import { CountryInfo, ProvinceInfo, DivisionInfo, DistrictInfo } from '../utils/pakistanGeo.ts';
import { 
  getMasterHeads, 
  saveMasterHeads, 
  getGeoHierarchy, 
  saveGeoHierarchy, 
  logUserActivity, 
  DEFAULT_MASTER_HEADS_CONFIG 
} from '../utils/storage.ts';

interface OpenHeadsViewProps {
  currentUser: UserProfile;
  onRefreshGeo?: () => void;
  showToast: (msg: string) => void;
}

type ActiveHeadTab = 'geo' | 'categories' | 'questions' | 'conditions';

export const OpenHeadsView: React.FC<OpenHeadsViewProps> = ({
  currentUser,
  onRefreshGeo,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveHeadTab>('geo');

  // Master Heads state
  const [masterConfig, setMasterConfig] = useState<MasterHeadsConfig>(() => getMasterHeads());
  // Geo hierarchy state
  const [geoCountries, setGeoCountries] = useState<CountryInfo[]>(() => getGeoHierarchy());

  // Category modal / editing
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [editingCategoryText, setEditingCategoryText] = useState('');

  // Condition modal / editing
  const [newConditionEn, setNewConditionEn] = useState('');
  const [newConditionUrdu, setNewConditionUrdu] = useState('');
  const [newConditionColor, setNewConditionColor] = useState('emerald');
  const [editingConditionId, setEditingConditionId] = useState<string | null>(null);
  const [editingConditionEn, setEditingConditionEn] = useState('');
  const [editingConditionUrdu, setEditingConditionUrdu] = useState('');

  // Question modal / editing with Category & Region mapping
  const [newQuestionEn, setNewQuestionEn] = useState('');
  const [newQuestionUrdu, setNewQuestionUrdu] = useState('');
  const [newQuestionCategory, setNewQuestionCategory] = useState<string>('all');
  const [newQuestionRegion, setNewQuestionRegion] = useState<string>('all');
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editingQuestionEn, setEditingQuestionEn] = useState('');
  const [editingQuestionUrdu, setEditingQuestionUrdu] = useState('');
  const [editingQuestionCategory, setEditingQuestionCategory] = useState<string>('all');
  const [editingQuestionRegion, setEditingQuestionRegion] = useState<string>('all');
  const [filterQuestionCategory, setFilterQuestionCategory] = useState<string>('all');
  const [filterQuestionRegion, setFilterQuestionRegion] = useState<string>('all');

  // Geo selection & inputs
  const [selectedCountryName, setSelectedCountryName] = useState<string>(geoCountries[0]?.name || 'Pakistan');
  const selectedCountry = geoCountries.find((c) => c.name === selectedCountryName) || geoCountries[0];
  
  const [selectedProvinceName, setSelectedProvinceName] = useState<string>(selectedCountry?.provinces[0]?.name || '');
  const selectedProvince = selectedCountry?.provinces.find((p) => p.name === selectedProvinceName) || selectedCountry?.provinces[0];

  const [selectedDivisionName, setSelectedDivisionName] = useState<string>(selectedProvince?.divisions[0]?.name || '');
  const selectedDivision = selectedProvince?.divisions.find((d) => d.name === selectedDivisionName) || selectedProvince?.divisions[0];

  const [selectedDistrictName, setSelectedDistrictName] = useState<string>(selectedDivision?.districts[0]?.name || '');
  const selectedDistrict = selectedDivision?.districts.find((d) => d.name === selectedDistrictName) || selectedDivision?.districts[0];

  // Geo add states
  const [newCountryName, setNewCountryName] = useState('');
  const [newCountryUrdu, setNewCountryUrdu] = useState('');
  const [newProvinceName, setNewProvinceName] = useState('');
  const [newProvinceUrdu, setNewProvinceUrdu] = useState('');
  const [newDivisionName, setNewDivisionName] = useState('');
  const [newDivisionUrdu, setNewDivisionUrdu] = useState('');
  const [newDistrictName, setNewDistrictName] = useState('');
  const [newDistrictUrdu, setNewDistrictUrdu] = useState('');
  const [newTehsilName, setNewTehsilName] = useState('');

  // ----------------------------------------------------------------------
  // CATEGORIES HANDLERS
  // ----------------------------------------------------------------------
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (masterConfig.categories.includes(trimmed)) {
      showToast('This project category already exists.');
      return;
    }
    const updated = {
      ...masterConfig,
      categories: [...masterConfig.categories, trimmed],
    };
    setMasterConfig(updated);
    saveMasterHeads(updated);
    setNewCategoryName('');
    showToast(`Added new project category: "${trimmed}"`);
    logUserActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: 'MASTER_HEAD_UPDATE',
      actionDescription: `Added project category: ${trimmed}`,
    });
  };

  const handleSaveEditCategory = (index: number) => {
    const trimmed = editingCategoryText.trim();
    if (!trimmed) return;
    const newCats = [...masterConfig.categories];
    newCats[index] = trimmed;
    const updated = { ...masterConfig, categories: newCats };
    setMasterConfig(updated);
    saveMasterHeads(updated);
    setEditingCategoryIndex(null);
    showToast('Category updated successfully.');
  };

  const handleDeleteCategory = (index: number) => {
    const target = masterConfig.categories[index];
    if (confirm(`Are you sure you want to delete category "${target}"?`)) {
      const updated = {
        ...masterConfig,
        categories: masterConfig.categories.filter((_, i) => i !== index),
      };
      setMasterConfig(updated);
      saveMasterHeads(updated);
      showToast(`Category "${target}" deleted.`);
    }
  };

  // ----------------------------------------------------------------------
  // CONDITIONS HANDLERS
  // ----------------------------------------------------------------------
  const handleAddCondition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConditionEn.trim()) return;
    const newHead: MasterHeadOption = {
      id: newConditionEn.trim(),
      labelEn: newConditionEn.trim(),
      labelUrdu: newConditionUrdu.trim() || newConditionEn.trim(),
      color: newConditionColor,
      isSystem: false,
    };
    const updated = {
      ...masterConfig,
      conditions: [...masterConfig.conditions, newHead],
    };
    setMasterConfig(updated);
    saveMasterHeads(updated);
    setNewConditionEn('');
    setNewConditionUrdu('');
    showToast(`Added overall condition head: "${newHead.labelEn}"`);
    logUserActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: 'MASTER_HEAD_UPDATE',
      actionDescription: `Added overall condition head: ${newHead.labelEn}`,
    });
  };

  const handleSaveEditCondition = (id: string) => {
    const updated = {
      ...masterConfig,
      conditions: masterConfig.conditions.map((c) =>
        c.id === id ? { ...c, labelEn: editingConditionEn, labelUrdu: editingConditionUrdu } : c
      ),
    };
    setMasterConfig(updated);
    saveMasterHeads(updated);
    setEditingConditionId(null);
    showToast('Overall condition updated.');
  };

  const handleDeleteCondition = (id: string) => {
    if (confirm(`Are you sure you want to delete condition head "${id}"?`)) {
      const updated = {
        ...masterConfig,
        conditions: masterConfig.conditions.filter((c) => c.id !== id),
      };
      setMasterConfig(updated);
      saveMasterHeads(updated);
      showToast(`Condition "${id}" removed.`);
    }
  };

  // ----------------------------------------------------------------------
  // QUESTIONS / CHECKPOINTS HANDLERS (CATEGORY & REGION MAPPED)
  // ----------------------------------------------------------------------
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionEn.trim()) return;
    const nextNum = masterConfig.questions.length + 1;
    const newQ: MasterQuestionHead = {
      id: Date.now(),
      number: nextNum,
      titleEn: newQuestionEn.trim(),
      titleUrdu: newQuestionUrdu.trim() || newQuestionEn.trim(),
      category: newQuestionCategory,
      region: newQuestionRegion,
      options: [
        { value: 'Yes', labelEn: 'Yes', labelUrdu: 'ہاں' },
        { value: 'No', labelEn: 'No', labelUrdu: 'نہیں' },
        { value: 'N/A', labelEn: 'N/A', labelUrdu: 'لاگو نہیں' },
      ],
    };
    const updated = {
      ...masterConfig,
      questions: [...masterConfig.questions, newQ],
    };
    setMasterConfig(updated);
    saveMasterHeads(updated);
    setNewQuestionEn('');
    setNewQuestionUrdu('');
    setNewQuestionCategory('all');
    setNewQuestionRegion('all');
    showToast(`Added inspection question #${nextNum} (Mapped: ${newQuestionCategory} / ${newQuestionRegion})`);
    logUserActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: 'MASTER_HEAD_UPDATE',
      actionDescription: `Added inspection question #${nextNum}: ${newQ.titleEn}`,
      details: `Category: ${newQuestionCategory} • Region: ${newQuestionRegion} • Impact: New inspection entries only`,
    });
  };

  const handleSaveEditQuestion = (id: number) => {
    const updated = {
      ...masterConfig,
      questions: masterConfig.questions.map((q) =>
        q.id === id
          ? {
              ...q,
              titleEn: editingQuestionEn,
              titleUrdu: editingQuestionUrdu,
              category: editingQuestionCategory,
              region: editingQuestionRegion,
            }
          : q
      ),
    };
    setMasterConfig(updated);
    saveMasterHeads(updated);
    setEditingQuestionId(null);
    showToast('Question checkpoint updated for future inspections.');
  };

  const handleDeleteQuestion = (id: number) => {
    if (confirm('Are you sure you want to delete this inspection question? (Note: Historical saved forms retain their original records).')) {
      const updated = {
        ...masterConfig,
        questions: masterConfig.questions
          .filter((q) => q.id !== id)
          .map((q, idx) => ({ ...q, number: idx + 1 })),
      };
      setMasterConfig(updated);
      saveMasterHeads(updated);
      showToast('Question deleted successfully.');
    }
  };

  // ----------------------------------------------------------------------
  // GEOGRAPHICAL HIERARCHY HANDLERS
  // ----------------------------------------------------------------------
  const handleAddCountry = () => {
    const name = newCountryName.trim();
    if (!name) return;
    if (geoCountries.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      showToast('Country already exists.');
      return;
    }
    const newC: CountryInfo = {
      name,
      nameUrdu: newCountryUrdu.trim() || name,
      code: name.slice(0, 3).toUpperCase(),
      flag: '🌐',
      centerCoordinates: { lat: 30, lng: 70 },
      provinces: [],
    };
    const updated = [...geoCountries, newC];
    setGeoCountries(updated);
    saveGeoHierarchy(updated);
    setSelectedCountryName(name);
    setNewCountryName('');
    setNewCountryUrdu('');
    showToast(`Country "${name}" added.`);
    if (onRefreshGeo) onRefreshGeo();
  };

  const handleAddProvince = () => {
    const pName = newProvinceName.trim();
    if (!pName || !selectedCountry) return;
    const newProv: ProvinceInfo = {
      name: pName,
      nameUrdu: newProvinceUrdu.trim() || pName,
      divisions: [],
    };
    const updated = geoCountries.map((c) =>
      c.name === selectedCountry.name
        ? { ...c, provinces: [...c.provinces, newProv] }
        : c
    );
    setGeoCountries(updated);
    saveGeoHierarchy(updated);
    setSelectedProvinceName(pName);
    setNewProvinceName('');
    setNewProvinceUrdu('');
    showToast(`Province "${pName}" added under ${selectedCountry.name}.`);
    if (onRefreshGeo) onRefreshGeo();
  };

  const handleAddDivision = () => {
    const dName = newDivisionName.trim();
    if (!dName || !selectedCountry || !selectedProvince) return;
    const newDiv: DivisionInfo = {
      name: dName,
      nameUrdu: newDivisionUrdu.trim() || dName,
      districts: [],
    };
    const updated = geoCountries.map((c) => {
      if (c.name !== selectedCountry.name) return c;
      return {
        ...c,
        provinces: c.provinces.map((p) =>
          p.name === selectedProvince.name
            ? { ...p, divisions: [...p.divisions, newDiv] }
            : p
        ),
      };
    });
    setGeoCountries(updated);
    saveGeoHierarchy(updated);
    setSelectedDivisionName(dName);
    setNewDivisionName('');
    setNewDivisionUrdu('');
    showToast(`Division "${dName}" added.`);
    if (onRefreshGeo) onRefreshGeo();
  };

  const handleAddDistrict = () => {
    const distName = newDistrictName.trim();
    if (!distName || !selectedCountry || !selectedProvince || !selectedDivision) return;
    const newDist: DistrictInfo = {
      name: distName,
      nameUrdu: newDistrictUrdu.trim() || distName,
      tehsils: ['Center'],
      lat: 25.0,
      lng: 68.0,
    };
    const updated = geoCountries.map((c) => {
      if (c.name !== selectedCountry.name) return c;
      return {
        ...c,
        provinces: c.provinces.map((p) => {
          if (p.name !== selectedProvince.name) return p;
          return {
            ...p,
            divisions: p.divisions.map((d) =>
              d.name === selectedDivision.name
                ? { ...d, districts: [...d.districts, newDist] }
                : d
            ),
          };
        }),
      };
    });
    setGeoCountries(updated);
    saveGeoHierarchy(updated);
    setSelectedDistrictName(distName);
    setNewDistrictName('');
    setNewDistrictUrdu('');
    showToast(`District "${distName}" added.`);
    if (onRefreshGeo) onRefreshGeo();
  };

  const handleAddTehsil = () => {
    const tName = newTehsilName.trim();
    if (!tName || !selectedCountry || !selectedProvince || !selectedDivision || !selectedDistrict) return;
    if (selectedDistrict.tehsils.includes(tName)) {
      showToast('Tehsil already exists in this district.');
      return;
    }
    const updated = geoCountries.map((c) => {
      if (c.name !== selectedCountry.name) return c;
      return {
        ...c,
        provinces: c.provinces.map((p) => {
          if (p.name !== selectedProvince.name) return p;
          return {
            ...p,
            divisions: p.divisions.map((d) => {
              if (d.name !== selectedDivision.name) return d;
              return {
                ...d,
                districts: d.districts.map((dist) =>
                  dist.name === selectedDistrict.name
                    ? { ...dist, tehsils: [...dist.tehsils, tName] }
                    : dist
                ),
              };
            }),
          };
        }),
      };
    });
    setGeoCountries(updated);
    saveGeoHierarchy(updated);
    setNewTehsilName('');
    showToast(`Tehsil "${tName}" added to ${selectedDistrict.name}.`);
    if (onRefreshGeo) onRefreshGeo();
  };

  const handleDeleteTehsil = (tehsilToRemove: string) => {
    if (!confirm(`Delete Tehsil "${tehsilToRemove}"?`)) return;
    const updated = geoCountries.map((c) => {
      if (c.name !== selectedCountry.name) return c;
      return {
        ...c,
        provinces: c.provinces.map((p) => {
          if (p.name !== selectedProvince.name) return p;
          return {
            ...p,
            divisions: p.divisions.map((d) => {
              if (d.name !== selectedDivision.name) return d;
              return {
                ...d,
                districts: d.districts.map((dist) =>
                  dist.name === selectedDistrict.name
                    ? { ...dist, tehsils: dist.tehsils.filter((t) => t !== tehsilToRemove) }
                    : dist
                ),
              };
            }),
          };
        }),
      };
    });
    setGeoCountries(updated);
    saveGeoHierarchy(updated);
    showToast(`Tehsil "${tehsilToRemove}" removed.`);
    if (onRefreshGeo) onRefreshGeo();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-xs font-mono font-bold border border-emerald-400/30">
              Master Configuration
            </span>
            <span className="text-xs text-slate-300">Open Heads Control / اوپن ہیڈز مینجمنٹ</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Open Heads & System Configuration Control
          </h1>
          <div className="font-urdu text-base sm:text-lg text-emerald-300 font-semibold mt-1">
            ملک، تحصیل، پراجیکٹ اقسام، سوالات اور مجموعی حالت کے اختیارات کا انتظام
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Add, edit, and delete geographical hierarchies, project categories, inspection questions, and overall condition heads.
          </p>
        </div>

        <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl p-3 text-xs text-slate-300 self-start sm:self-auto space-y-1">
          <div className="font-bold text-white flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Master Heads Control</span>
          </div>
          <div className="text-[11px] text-slate-400">All modifications take instant effect for new forms</div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('geo')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'geo'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Country to Tehsil Hierarchy / علاقائی ہیڈز</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'categories'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Project Categories / پراجیکٹ اقسام ({masterConfig.categories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'questions'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Inspection Questions / چیک پوائنٹس ({masterConfig.questions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('conditions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'conditions'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Overall Conditions / مجموعی حالت ({masterConfig.conditions.length})</span>
        </button>
      </div>

      {/* ====================================================================== */}
      {/* TAB 1: GEOGRAPHICAL HIERARCHY (COUNTRY -> PROVINCE -> DIVISION -> TEHSIL) */}
      {/* ====================================================================== */}
      {activeTab === 'geo' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-600" />
                <span>Geographical Open Heads: Country to Tahseel</span>
              </h2>
              <div className="font-urdu text-sm text-emerald-800">
                ملک، صوبہ، ڈویژن، ضلع اور تحصیل کے نام شامل اور ترمیم کریں
              </div>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-semibold">
              Cascading 5-Tier Registry
            </span>
          </div>

          {/* Stepper Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Country Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">1. Select Country / ملک</label>
              <select
                value={selectedCountryName}
                onChange={(e) => {
                  setSelectedCountryName(e.target.value);
                  const c = geoCountries.find((item) => item.name === e.target.value);
                  setSelectedProvinceName(c?.provinces[0]?.name || '');
                  setSelectedDivisionName(c?.provinces[0]?.divisions[0]?.name || '');
                  setSelectedDistrictName(c?.provinces[0]?.divisions[0]?.districts[0]?.name || '');
                }}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
              >
                {geoCountries.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.flag} {c.name} ({c.nameUrdu})
                  </option>
                ))}
              </select>
            </div>

            {/* Province Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">2. Select Province / صوبہ</label>
              <select
                value={selectedProvinceName}
                onChange={(e) => {
                  setSelectedProvinceName(e.target.value);
                  const p = selectedCountry?.provinces.find((item) => item.name === e.target.value);
                  setSelectedDivisionName(p?.divisions[0]?.name || '');
                  setSelectedDistrictName(p?.divisions[0]?.districts[0]?.name || '');
                }}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
              >
                {selectedCountry?.provinces.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} ({p.nameUrdu})
                  </option>
                ))}
              </select>
            </div>

            {/* Division Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">3. Select Division / ڈویژن</label>
              <select
                value={selectedDivisionName}
                onChange={(e) => {
                  setSelectedDivisionName(e.target.value);
                  const d = selectedProvince?.divisions.find((item) => item.name === e.target.value);
                  setSelectedDistrictName(d?.districts[0]?.name || '');
                }}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
              >
                {selectedProvince?.divisions.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} ({d.nameUrdu})
                  </option>
                ))}
              </select>
            </div>

            {/* District Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">4. Select District / ضلع</label>
              <select
                value={selectedDistrictName}
                onChange={(e) => setSelectedDistrictName(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
              >
                {selectedDivision?.districts.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} ({d.nameUrdu})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Current Tehsils under Selected District */}
          {selectedDistrict && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase">
                    5. Tehsils in {selectedDistrict.name} ({selectedDistrict.nameUrdu}):
                  </h3>
                  <div className="font-urdu text-xs text-slate-500">تحصیلوں کی فہرست</div>
                </div>
                <span className="text-xs font-mono text-emerald-800 font-bold">
                  {selectedDistrict.tehsils.length} Tehsils Registered
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedDistrict.tehsils.map((t) => (
                  <div
                    key={t}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs group"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTehsil(t)}
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title={`Delete Tehsil ${t}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Tehsil Inline */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <input
                  type="text"
                  value={newTehsilName}
                  onChange={(e) => setNewTehsilName(e.target.value)}
                  placeholder={`Add new Tehsil in ${selectedDistrict.name}...`}
                  className="flex-1 text-xs p-2 bg-white border border-slate-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleAddTehsil}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tehsil / تحصیل شامل کریں</span>
                </button>
              </div>
            </div>
          )}

          {/* Add New Geographical Heads Forms */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
            {/* Add Country */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Add New Country / نیا ملک</span>
              <input
                type="text"
                placeholder="Country Name (e.g. Turkey)"
                value={newCountryName}
                onChange={(e) => setNewCountryName(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Urdu Name (e.g. ترکی)"
                value={newCountryUrdu}
                onChange={(e) => setNewCountryUrdu(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-urdu"
              />
              <button
                type="button"
                onClick={handleAddCountry}
                className="w-full py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-lg"
              >
                + Add Country
              </button>
            </div>

            {/* Add Province */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Add Province in {selectedCountry?.name}</span>
              <input
                type="text"
                placeholder="Province Name (e.g. Gilgit Baltistan)"
                value={newProvinceName}
                onChange={(e) => setNewProvinceName(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Urdu Name (e.g. گلگت بلتستان)"
                value={newProvinceUrdu}
                onChange={(e) => setNewProvinceUrdu(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-urdu"
              />
              <button
                type="button"
                onClick={handleAddProvince}
                className="w-full py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-lg"
              >
                + Add Province
              </button>
            </div>

            {/* Add Division */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Add Division in {selectedProvince?.name}</span>
              <input
                type="text"
                placeholder="Division Name"
                value={newDivisionName}
                onChange={(e) => setNewDivisionName(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Urdu Name"
                value={newDivisionUrdu}
                onChange={(e) => setNewDivisionUrdu(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-urdu"
              />
              <button
                type="button"
                onClick={handleAddDivision}
                className="w-full py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-lg"
              >
                + Add Division
              </button>
            </div>

            {/* Add District */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Add District in {selectedDivision?.name}</span>
              <input
                type="text"
                placeholder="District Name"
                value={newDistrictName}
                onChange={(e) => setNewDistrictName(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Urdu Name"
                value={newDistrictUrdu}
                onChange={(e) => setNewDistrictUrdu(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-urdu"
              />
              <button
                type="button"
                onClick={handleAddDistrict}
                className="w-full py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-lg"
              >
                + Add District
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 2: PROJECT CATEGORIES / INSTALLATION TYPES                          */}
      {/* ====================================================================== */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <span>Project Categories (Installation Types)</span>
              </h2>
              <div className="font-urdu text-sm text-emerald-800">
                واٹر پراجیکٹ اقسام و کیٹگریز کے اوپن ہیڈز
              </div>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200">
              {masterConfig.categories.length} Categories Active
            </span>
          </div>

          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Solar Tube Well, Community RO Plant, Desalination Unit..."
              required
              className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category / نیا ہیڈ شامل کریں</span>
            </button>
          </form>

          {/* Categories Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[11px] text-slate-600">
                <tr>
                  <th className="p-3.5">#</th>
                  <th className="p-3.5">Project Category / Installation Type</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {masterConfig.categories.map((cat, idx) => {
                  const isEditing = editingCategoryIndex === idx;
                  return (
                    <tr key={cat} className="hover:bg-slate-50/70">
                      <td className="p-3.5 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingCategoryText}
                              onChange={(e) => setEditingCategoryText(e.target.value)}
                              className="p-1.5 border border-slate-300 rounded-lg text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditCategory(idx)}
                              className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCategoryIndex(null)}
                              className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span>{cat}</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        {!isEditing && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategoryIndex(idx);
                                setEditingCategoryText(cat);
                              }}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 3: QUESTIONS / CHECKPOINTS (APPLIES TO NEW AUDIT FORMS ONLY)         */}
      {/* ====================================================================== */}
      {activeTab === 'questions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-600" />
                <span>Inspection Checkpoint Questions Open Heads</span>
              </h2>
              <div className="font-urdu text-sm text-emerald-800">
                معائنہ چیک پوائنٹس اور تکنیکی سوالات کی فہرست
              </div>
            </div>
            
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Modifications apply only to newly created inspection forms. Saved audit records retain their historical snapshots.</span>
            </div>
          </div>

          {/* Add Question Form with Category & Region Mapping */}
          <form onSubmit={handleAddQuestion} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              + Add New Mandatory Inspection Question / نیا سوال شامل کریں:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Question in English</label>
                <input
                  type="text"
                  placeholder="e.g. Check solar inverter, wiring & battery storage"
                  value={newQuestionEn}
                  onChange={(e) => setNewQuestionEn(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">اردو ترجمہ (سوال)</label>
                <input
                  type="text"
                  placeholder="مثلاً: سولر انورٹر، وائرنگ اور بیٹری سٹوریج درست حالت میں ہے"
                  value={newQuestionUrdu}
                  onChange={(e) => setNewQuestionUrdu(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-urdu"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Map to Project Category / کیٹیگری پر میپ کریں
                </label>
                <select
                  value={newQuestionCategory}
                  onChange={(e) => setNewQuestionCategory(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-medium"
                >
                  <option value="all">🌟 All Categories / تمام پراجیکٹ کیٹیگریز پر لاگو</option>
                  {masterConfig.categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">اگر مخصوص کیٹیگری منتخب کریں تو سوال صرف اسی پراجیکٹ کے فارم میں ظاہر ہوگا۔</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Map to Region / صوبہ یا علاقہ پر میپ کریں
                </label>
                <select
                  value={newQuestionRegion}
                  onChange={(e) => setNewQuestionRegion(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-medium"
                >
                  <option value="all">🌟 All Regions / تمام صوبے و علاقہ جات</option>
                  {geoCountries.find((c) => c.name === 'Pakistan')?.provinces.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} ({p.nameUrdu})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">اگر مخصوص علاقہ منتخب کریں تو سوال صرف اسی صوبے کے پراجیکٹس پر لاگو ہوگا۔</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save & Map Question / سوال محفوظ کریں</span>
              </button>
            </div>
          </form>

          {/* Filter Bar for Questions */}
          <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-700">Filter Questions:</span>
              <select
                value={filterQuestionCategory}
                onChange={(e) => setFilterQuestionCategory(e.target.value)}
                className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
              >
                <option value="all">All Categories ({masterConfig.questions.length})</option>
                {masterConfig.categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={filterQuestionRegion}
                onChange={(e) => setFilterQuestionRegion(e.target.value)}
                className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
              >
                <option value="all">All Regions</option>
                {geoCountries.find((c) => c.name === 'Pakistan')?.provinces.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              Showing {
                masterConfig.questions.filter((q) => {
                  const matchCat = filterQuestionCategory === 'all' || !q.category || q.category === 'all' || q.category === filterQuestionCategory;
                  const matchReg = filterQuestionRegion === 'all' || !q.region || q.region === 'all' || q.region === filterQuestionRegion;
                  return matchCat && matchReg;
                }).length
              } of {masterConfig.questions.length} Active Questions
            </span>
          </div>

          {/* Questions List */}
          <div className="space-y-3">
            {masterConfig.questions
              .filter((q) => {
                const matchCat = filterQuestionCategory === 'all' || !q.category || q.category === 'all' || q.category === filterQuestionCategory;
                const matchReg = filterQuestionRegion === 'all' || !q.region || q.region === 'all' || q.region === filterQuestionRegion;
                return matchCat && matchReg;
              })
              .map((q) => {
                const isEditing = editingQuestionId === q.id;
                return (
                  <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {q.number}
                      </span>
                      {isEditing ? (
                        <div className="space-y-2 flex-1">
                          <input
                            type="text"
                            value={editingQuestionEn}
                            onChange={(e) => setEditingQuestionEn(e.target.value)}
                            className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                          />
                          <input
                            type="text"
                            value={editingQuestionUrdu}
                            onChange={(e) => setEditingQuestionUrdu(e.target.value)}
                            className="w-full text-xs p-2 border border-slate-300 rounded-lg font-urdu"
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Category Mapping</label>
                              <select
                                value={editingQuestionCategory}
                                onChange={(e) => setEditingQuestionCategory(e.target.value)}
                                className="w-full text-xs p-1.5 border border-slate-300 rounded-lg"
                              >
                                <option value="all">All Categories</option>
                                {masterConfig.categories.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Region Mapping</label>
                              <select
                                value={editingQuestionRegion}
                                onChange={(e) => setEditingQuestionRegion(e.target.value)}
                                className="w-full text-xs p-1.5 border border-slate-300 rounded-lg"
                              >
                                <option value="all">All Regions</option>
                                {geoCountries.find((c) => c.name === 'Pakistan')?.provinces.map((p) => (
                                  <option key={p.name} value={p.name}>{p.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleSaveEditQuestion(q.id)}
                              className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                            >
                              Save Changes
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingQuestionId(null)}
                              className="px-3 py-1 bg-slate-200 text-slate-700 text-xs rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{q.titleEn}</div>
                          <div className="font-urdu text-xs text-emerald-800 mt-0.5">{q.titleUrdu}</div>
                          
                          {/* Category and Region Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              🏷️ Category: {q.category === 'all' || !q.category ? 'All Categories' : q.category}
                            </span>
                            <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              📍 Region: {q.region === 'all' || !q.region ? 'All Regions' : q.region}
                            </span>
                          </div>

                          <div className="flex gap-1.5 mt-2 text-[10px] text-slate-500">
                            <span>Options:</span>
                            {q.options.map((opt) => (
                              <span key={opt.value} className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {opt.labelEn} / {opt.labelUrdu}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuestionId(q.id);
                            setEditingQuestionEn(q.titleEn);
                            setEditingQuestionUrdu(q.titleUrdu);
                            setEditingQuestionCategory(q.category || 'all');
                            setEditingQuestionRegion(q.region || 'all');
                          }}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Question"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 4: OVERALL CONDITIONS HEADS                                         */}
      {/* ====================================================================== */}
      {activeTab === 'conditions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                <span>Overall Condition Heads Control</span>
              </h2>
              <div className="font-urdu text-sm text-emerald-800">
                واٹر پراجیکٹ مجموعی حالت اور اسٹیٹس کے اوپن ہیڈز
              </div>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full">
              {masterConfig.conditions.length} Condition Heads
            </span>
          </div>

          {/* Add Condition Form */}
          <form onSubmit={handleAddCondition} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              + Add New Overall Condition Head / نیا اسٹیٹس ہیڈ درج کریں:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Condition in English (e.g. Under Decommissioning)"
                value={newConditionEn}
                onChange={(e) => setNewConditionEn(e.target.value)}
                required
                className="text-xs p-2.5 bg-white border border-slate-300 rounded-xl"
              />
              <input
                type="text"
                placeholder="اردو نام (مثلاً: منسوخی و بندش کے تحت)"
                value={newConditionUrdu}
                onChange={(e) => setNewConditionUrdu(e.target.value)}
                required
                className="text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-urdu"
              />
              <select
                value={newConditionColor}
                onChange={(e) => setNewConditionColor(e.target.value)}
                className="text-xs p-2.5 bg-white border border-slate-300 rounded-xl"
              >
                <option value="emerald">Green / فعال (Emerald)</option>
                <option value="amber">Yellow / مرمت درکار (Amber)</option>
                <option value="rose">Red / خراب یا بند (Rose)</option>
                <option value="slate">Grey / غلط مقام (Slate)</option>
                <option value="blue">Blue / زیر جائزہ (Blue)</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Condition Head / ہیڈ محفوظ کریں</span>
            </button>
          </form>

          {/* Condition Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {masterConfig.conditions.map((cond) => {
              const isEditing = editingConditionId === cond.id;
              return (
                <div key={cond.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      ID: {cond.id}
                    </span>
                    {!isEditing && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingConditionId(cond.id);
                            setEditingConditionEn(cond.labelEn);
                            setEditingConditionUrdu(cond.labelUrdu);
                          }}
                          className="p-1 text-slate-400 hover:text-emerald-700 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCondition(cond.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 pt-1">
                      <input
                        type="text"
                        value={editingConditionEn}
                        onChange={(e) => setEditingConditionEn(e.target.value)}
                        className="w-full text-xs p-1.5 border border-slate-300 rounded"
                      />
                      <input
                        type="text"
                        value={editingConditionUrdu}
                        onChange={(e) => setEditingConditionUrdu(e.target.value)}
                        className="w-full text-xs p-1.5 border border-slate-300 rounded font-urdu"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveEditCondition(cond.id)}
                          className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingConditionId(null)}
                          className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{cond.labelEn}</div>
                      <div className="font-urdu text-xs text-emerald-800 font-semibold">{cond.labelUrdu}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
