import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Filter, 
  Search, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  Layers, 
  RotateCcw, 
  Maximize2, 
  Info,
  ExternalLink,
  ClipboardList
} from 'lucide-react';
import { AuditRecord, OverallCondition, WaterProject } from '../types/index.ts';
import { PAKISTAN_PROVINCES } from '../utils/pakistanGeo.ts';

interface PakistanMapViewProps {
  projects: WaterProject[];
  audits: AuditRecord[];
  onSelectProject?: (projectId: string) => void;
  onOpenAuditForm?: (audit: AuditRecord) => void;
}

export type BasemapId = 'osm_de' | 'esri_street' | 'satellite' | 'esri_topo' | 'esri_canvas';

interface BasemapOption {
  id: BasemapId;
  name: string;
  nameUrdu: string;
  icon: string;
  url: string;
  options: L.TileLayerOptions;
}

// 100% Clean, high-speed GIS tile servers with ZERO watermarks and ZERO 403 blocks
const BASEMAP_OPTIONS: Record<BasemapId, BasemapOption> = {
  osm_de: {
    id: 'osm_de',
    name: 'OpenStreetMap (Clean)',
    nameUrdu: 'معیاری اوپن اسٹریٹ میپ',
    icon: '🌍',
    url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors | FGRF Pakistan',
    },
  },
  esri_street: {
    id: 'esri_street',
    name: 'Street & Highways',
    nameUrdu: 'سڑکیں اور شاہراہیں',
    icon: '🛣️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; StreetMap Community | FGRF Pakistan',
    },
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite Aerial',
    nameUrdu: 'سیٹلائٹ منظر',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 18,
      attribution: 'Tiles &copy; Esri &mdash; Earthstar Geographics | FGRF Pakistan',
    },
  },
  esri_topo: {
    id: 'esri_topo',
    name: 'Topographic & Canals',
    nameUrdu: 'نہری و جغرافیائی نقشہ',
    icon: '⛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; National Geographic, USGS | FGRF',
    },
  },
  esri_canvas: {
    id: 'esri_canvas',
    name: 'Clean Light Canvas',
    nameUrdu: 'ہلکا سادہ کینوس',
    icon: '⚪',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 16,
      attribution: 'Tiles &copy; Esri &mdash; HERE, MapmyIndia | FGRF',
    },
  },
};

export const PakistanMapView: React.FC<PakistanMapViewProps> = ({
  projects,
  audits,
  onSelectProject,
  onOpenAuditForm,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Basemap selection state - defaults to clean OSM Mirror (Zero 403, Zero Watermarks)
  const [activeBasemap, setActiveBasemap] = useState<BasemapId>('osm_de');
  const [tileErrorOccurred, setTileErrorOccurred] = useState<boolean>(false);

  // Filters state
  const [filterProvince, setFilterProvince] = useState<string>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Helper for pin color
  const getMarkerColor = (condition: OverallCondition) => {
    switch (condition) {
      case 'Functional':
        return '#10b981'; // Green
      case 'Functional – Repair Needed':
        return '#f59e0b'; // Amber / Orange
      case 'Non-functional':
        return '#ef4444'; // Red
      case 'Not Installed / Wrong Location':
        return '#64748b'; // Slate Grey
      default:
        return '#3b82f6';
    }
  };

  const createCustomIcon = (condition: OverallCondition) => {
    const color = getMarkerColor(condition);
    const html = `
      <div style="position: relative; transform: translate(-50%, -100%);">
        <div style="
          background-color: ${color};
          width: 28px;
          height: 28px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 10px;
            height: 10px;
            background: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      </div>
    `;
    return L.divIcon({
      className: 'fgrf-map-pin',
      html,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28],
    });
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center of Pakistan roughly 30.15, 69.8
    const map = L.map(mapContainerRef.current, {
      center: [30.15, 69.8],
      zoom: 6,
      minZoom: 4,
      maxZoom: 19,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topleft' }).addTo(map);

    // Initial tile layer from reliable Fastly/CartoDB provider
    const initialConfig = BASEMAP_OPTIONS[activeBasemap];
    const initialTileLayer = L.tileLayer(initialConfig.url, {
      ...initialConfig.options,
    });

    initialTileLayer.on('tileerror', () => {
      setTileErrorOccurred(true);
    });

    initialTileLayer.addTo(map);
    currentTileLayerRef.current = initialTileLayer;

    // Markers layer
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Trigger invalidation after container mount
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
      currentTileLayerRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // 2. Handle switching Basemap
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const config = BASEMAP_OPTIONS[activeBasemap];
    const newLayer = L.tileLayer(config.url, {
      ...config.options,
    });

    newLayer.on('tileerror', () => {
      setTileErrorOccurred(true);
    });

    newLayer.addTo(map);
    currentTileLayerRef.current = newLayer;
  }, [activeBasemap]);

  // Invalidate map size on tab/window resize
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(handleResize, 300);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // 3. Filtered projects calculation
  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects.filter((p) => {
      if (filterProvince !== 'all' && p.province !== filterProvince) return false;
      if (filterDistrict !== 'all' && p.district !== filterDistrict) return false;
      if (filterCondition !== 'all' && p.currentCondition !== filterCondition) return false;
      if (q) {
        const matchesId = p.id.toLowerCase().includes(q);
        const matchesVillage = p.village?.toLowerCase().includes(q);
        const matchesBeneficiary = p.beneficiaryName?.toLowerCase().includes(q);
        const matchesTehsil = p.tehsil?.toLowerCase().includes(q);
        if (!matchesId && !matchesVillage && !matchesBeneficiary && !matchesTehsil) {
          return false;
        }
      }
      return true;
    });
  }, [projects, filterProvince, filterDistrict, filterCondition, searchQuery]);

  // 4. Update markers on the map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    const bounds: L.LatLngExpression[] = [];

    filteredProjects.forEach((proj) => {
      if (!proj.gpsCoordinates || !proj.gpsCoordinates.lat || !proj.gpsCoordinates.lng) return;

      const latLng: [number, number] = [proj.gpsCoordinates.lat, proj.gpsCoordinates.lng];
      bounds.push(latLng);

      const latestAudit = audits.find((a) => a.projectId === proj.id);
      const icon = createCustomIcon(proj.currentCondition);

      const marker = L.marker(latLng, { icon });

      // Build rich popup content
      const popupDiv = document.createElement('div');
      popupDiv.className = 'fgrf-popup p-1 text-slate-800 text-xs font-sans max-w-xs';
      popupDiv.innerHTML = `
        <div style="border-bottom: 2px solid #0d9488; padding-bottom: 6px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 800; color: #065f46; font-size: 13px;">${proj.id}</span>
            <span style="font-size: 10px; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 700;">${proj.installationType}</span>
          </div>
          <div style="color: #475569; font-size: 11px; margin-top: 2px; font-weight: 500;">
            📍 ${proj.village || 'Village'}, ${proj.tehsil ? proj.tehsil + ', ' : ''}${proj.district} (${proj.province})
          </div>
        </div>

        <div style="margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700;">Condition Status</span>
            <span style="background: ${getMarkerColor(proj.currentCondition)}25; color: ${getMarkerColor(proj.currentCondition)}; padding: 2px 8px; border-radius: 9999px; font-weight: 800; font-size: 10px; border: 1px solid ${getMarkerColor(proj.currentCondition)}50;">
              ${proj.currentCondition}
            </span>
          </div>
          <div style="font-size: 11px; margin-bottom: 3px;">
            <strong>Beneficiary:</strong> ${proj.beneficiaryName} ${proj.beneficiaryMobile ? `(${proj.beneficiaryMobile})` : ''}
          </div>
          <div style="font-size: 11px; margin-bottom: 3px;">
            <strong>Last Inspection:</strong> ${proj.lastInspectionDate ? `${proj.lastInspectionDate} (${latestAudit?.id || 'Recorded'})` : '<span style="color: #f59e0b; font-weight: 600;">Pending First Audit</span>'}
          </div>
          <div style="font-size: 10px; color: #64748b; font-family: monospace; background: #f8fafc; padding: 3px 6px; border-radius: 4px; border: 1px solid #e2e8f0; margin-top: 4px; display: flex; justify-content: space-between;">
            <span>GPS: ${proj.gpsCoordinates.lat.toFixed(5)}, ${proj.gpsCoordinates.lng.toFixed(5)}</span>
            <a href="https://www.google.com/maps?q=${proj.gpsCoordinates.lat},${proj.gpsCoordinates.lng}" target="_blank" rel="noopener" style="color: #0284c7; text-decoration: underline; font-weight: 600;">Open Map ↗</a>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 8px;">
          ${latestAudit ? `
            <button id="view-audit-btn-${proj.id}" style="
              width: 100%;
              background: #0d9488;
              color: white;
              border: none;
              padding: 7px 10px;
              border-radius: 6px;
              font-weight: 700;
              font-size: 11px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
            ">
              📄 View Detailed Audit Form (${latestAudit.id})
            </button>
          ` : ''}
          <button id="new-audit-btn-${proj.id}" style="
            width: 100%;
            background: #0284c7;
            color: white;
            border: none;
            padding: 6px 10px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 11px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          ">
            ✍️ Open Audit Form / نیا معائنہ شروع کریں
          </button>
        </div>
      `;

      marker.bindPopup(popupDiv, { maxWidth: 300 });

      marker.on('popupopen', () => {
        // Wire up View Audit button
        const viewBtn = document.getElementById(`view-audit-btn-${proj.id}`);
        if (viewBtn) {
          viewBtn.onclick = () => {
            if (latestAudit && onOpenAuditForm) {
              onOpenAuditForm(latestAudit);
            }
          };
        }

        // Wire up New Audit button
        const newBtn = document.getElementById(`new-audit-btn-${proj.id}`);
        if (newBtn) {
          newBtn.onclick = () => {
            if (onSelectProject) {
              onSelectProject(proj.id);
            }
          };
        }
      });

      marker.addTo(layer);
    });

    // Auto-fit if filtered specifically by province or district
    if (bounds.length > 0 && (filterProvince !== 'all' || filterDistrict !== 'all' || searchQuery.trim() !== '')) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 13 });
    }
  }, [filteredProjects, audits, filterProvince, filterDistrict, searchQuery]);

  // Reset View to Full Pakistan
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([30.15, 69.8], 6);
    }
  };

  // Fit bounds to all filtered projects
  const handleFitAllProjects = () => {
    if (!mapInstanceRef.current) return;
    const bounds: L.LatLngExpression[] = [];
    filteredProjects.forEach((p) => {
      if (p.gpsCoordinates && p.gpsCoordinates.lat && p.gpsCoordinates.lng) {
        bounds.push([p.gpsCoordinates.lat, p.gpsCoordinates.lng]);
      }
    });
    if (bounds.length > 0) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 13 });
    } else {
      handleResetView();
    }
  };

  const uniqueDistricts = useMemo(() => {
    return Array.from(
      new Set(
        projects
          .filter((p) => filterProvince === 'all' || p.province === filterProvince)
          .map((p) => p.district)
          .filter(Boolean)
      )
    );
  }, [projects, filterProvince]);

  // Condition count breakdown
  const stats = useMemo(() => {
    const functional = projects.filter((p) => p.currentCondition === 'Functional').length;
    const repair = projects.filter((p) => p.currentCondition === 'Functional – Repair Needed').length;
    const nonFunctional = projects.filter((p) => p.currentCondition === 'Non-functional').length;
    const wrongLocation = projects.filter((p) => p.currentCondition === 'Not Installed / Wrong Location').length;
    return { functional, repair, nonFunctional, wrongLocation, total: projects.length };
  }, [projects]);

  return (
    <div className="space-y-4">
      {/* Top Filter and Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Pakistan-Wide Water Projects Map</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {filteredProjects.length} / {projects.length} Active
                </span>
              </div>
              <div className="font-urdu text-emerald-800 text-xs">پاکستان بھر میں واٹر پراجیکٹس کی جغرافیائی مانیٹرنگ اور نقشہ</div>
            </div>
          </div>

          {/* Basemap Switcher Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(Object.keys(BASEMAP_OPTIONS) as BasemapId[]).map((key) => {
              const opt = BASEMAP_OPTIONS[key];
              const isActive = activeBasemap === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setActiveBasemap(key);
                    setTileErrorOccurred(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  title={`${opt.name} (${opt.nameUrdu})`}
                >
                  <span>{opt.icon}</span>
                  <span className="hidden sm:inline">{opt.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Inputs & Action Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-1">
          {/* Search box */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search project ID, village, tehsil, beneficiary..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
              />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-500 hover:text-slate-800 px-1 font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterProvince}
                onChange={(e) => {
                  setFilterProvince(e.target.value);
                  setFilterDistrict('all');
                }}
                className="bg-transparent font-medium text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Provinces / تمام صوبے</option>
                {PAKISTAN_PROVINCES.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <select
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                className="bg-transparent font-medium text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Districts / تمام اضلاع</option>
                {uniqueDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <select
                value={filterCondition}
                onChange={(e) => setFilterCondition(e.target.value)}
                className="bg-transparent font-medium text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Conditions / تمام حالتیں</option>
                <option value="Functional">🟢 Functional ({stats.functional})</option>
                <option value="Functional – Repair Needed">🟠 Repair Needed ({stats.repair})</option>
                <option value="Non-functional">🔴 Non-functional ({stats.nonFunctional})</option>
                <option value="Not Installed / Wrong Location">⚪ Wrong Location ({stats.wrongLocation})</option>
              </select>
            </div>

            {/* View Reset & Fit Buttons */}
            <div className="flex items-center gap-1 pl-1">
              <button
                type="button"
                onClick={handleResetView}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
                title="Reset View to Pakistan Center (30.15°N, 69.80°E)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden xl:inline">Reset View</span>
              </button>
              <button
                type="button"
                onClick={handleFitAllProjects}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-semibold transition-colors"
                title="Fit View to All Visible Project Markers"
              >
                <Maximize2 className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden xl:inline">Fit Projects</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map Canvas Frame */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-slate-200 h-[620px] w-full">
        {/* Leaflet container */}
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Legend Overlay (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-xl shadow-lg border border-slate-200 text-xs space-y-2 pointer-events-auto max-w-[240px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="font-bold text-slate-900">Marker Legend / اشارے</span>
            <span className="text-[10px] text-slate-400 font-mono">FGRF-GIS</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs" />
                <span className="text-slate-700 font-medium">Functional</span>
              </div>
              <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">{stats.functional}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs" />
                <span className="text-slate-700 font-medium">Repair Needed</span>
              </div>
              <span className="font-mono text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded text-[11px]">{stats.repair}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 shadow-xs" />
                <span className="text-slate-700 font-medium">Non-functional</span>
              </div>
              <span className="font-mono text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded text-[11px]">{stats.nonFunctional}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-500 shadow-xs" />
                <span className="text-slate-700 font-medium">Wrong Location</span>
              </div>
              <span className="font-mono text-slate-700 font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">{stats.wrongLocation}</span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Total Projects:</span>
            <span className="font-bold text-slate-800">{stats.total}</span>
          </div>
        </div>

        {/* Offline / Provider Status Pill (Bottom Right) */}
        <div className="absolute bottom-4 right-4 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-md border border-slate-200 text-[11px] text-slate-700 flex items-center gap-2 pointer-events-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium">
            Active Basemap: <strong className="text-slate-900">{BASEMAP_OPTIONS[activeBasemap].name}</strong>
          </span>
          {tileErrorOccurred && (
            <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-semibold">
              Offline Cache Mode
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
