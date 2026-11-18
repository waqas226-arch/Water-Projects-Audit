import React, { useState, useRef } from 'react';
import { 
  X, 
  Download, 
  Play, 
  Pause, 
  ExternalLink, 
  Video, 
  CheckCircle2, 
  User, 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  FileText, 
  Cloud, 
  Wrench, 
  QrCode, 
  Award,
  Layers
} from 'lucide-react';

interface VideoTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Chapter {
  id: number;
  timeSeconds: number;
  titleEn: string;
  titleUrdu: string;
  icon: React.ReactNode;
  summary: string;
}

const chapters: Chapter[] = [
  {
    id: 1,
    timeSeconds: 0,
    titleEn: 'Intro: Author & Why Built',
    titleUrdu: 'تعارف: مصنف (سید وقاص) اور سسٹم کا مقصد',
    icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
    summary: 'Conceived and architected by Syed Waqas, Manager MIS (Data Management & ERP Department, FGRF). Built to eliminate paper-based checklists and provide real-time digital oversight across Pakistan.'
  },
  {
    id: 2,
    timeSeconds: 38.4,
    titleEn: 'Step 1: Log On to System',
    titleUrdu: 'مرحلہ ۱: سسٹم میں لاگ ان اور اختیارات',
    icon: <ShieldCheck className="w-4 h-4 text-purple-400" />,
    summary: 'Enter User ID (HQ-ADMIN or Inspector ID) and PIN 1234. Isolated role-based permissions protecting sensitive organizational tools.'
  },
  {
    id: 3,
    timeSeconds: 63.2,
    titleEn: 'Step 2: Executive Dashboard',
    titleUrdu: 'مرحلہ ۲: ایگزیکٹو ڈیش بورڈ اور لائیو انڈیکیٹرز',
    icon: <Layers className="w-4 h-4 text-blue-400" />,
    summary: 'Review national KPI statistics: total installations, operational percentages, and immediate repair alerts.'
  },
  {
    id: 4,
    timeSeconds: 83.0,
    titleEn: 'Step 3: Master Projects Directory',
    titleUrdu: 'مرحلہ ۳: ماسٹر پراجیکٹس ڈائریکٹری اور فلٹرز',
    icon: <Layers className="w-4 h-4 text-teal-400" />,
    summary: 'Search and filter water schemes by Province, District, Tehsil, and Union Council. Water table depth metrics and donor attribution.'
  },
  {
    id: 5,
    timeSeconds: 101.4,
    titleEn: 'Step 4: 12-Point Field Inspection Form',
    titleUrdu: 'مرحلہ ۴: ۱۲ نکاتی فیلڈ آڈٹ فارم (FGRF-WTS-AUD-002.00-26)',
    icon: <FileText className="w-4 h-4 text-emerald-400" />,
    summary: 'Official standard Form FGRF-WTS-AUD-002.00-26. Auto-captures GPS coordinates, audits 12 components, and uploads live photos and videos.'
  },
  {
    id: 6,
    timeSeconds: 126.5,
    titleEn: 'Step 5: Central Cloud Master DB Sync',
    titleUrdu: 'مرحلہ ۵: کلاؤڈ ماسٹر ڈیٹا بیس اور خودکار ہم آہنگی',
    icon: <Cloud className="w-4 h-4 text-sky-400" />,
    summary: 'Saved inspections instantly broadcast to HQ central master database in real time without manual file transfer.'
  },
  {
    id: 7,
    timeSeconds: 145.7,
    titleEn: 'Step 6: Defect Logging & Repair Orders',
    titleUrdu: 'مرحلہ ۶: مرمت و بحالی کے ورک آرڈرز',
    icon: <Wrench className="w-4 h-4 text-amber-400" />,
    summary: 'Defective components auto-generate repair work orders (High/Medium/Low priority). Crews upload post-repair photo proof.'
  },
  {
    id: 8,
    timeSeconds: 163.6,
    titleEn: 'Step 7: Interactive Pakistan GIS Map',
    titleUrdu: 'مرحلہ ۷: انٹرایکٹو جی آئی ایس سیٹلائٹ نقشہ',
    icon: <MapPin className="w-4 h-4 text-rose-400" />,
    summary: 'Leaflet satellite map of Pakistan. Click colored pins to view project operational score, water table depth, and audit history.'
  },
  {
    id: 9,
    timeSeconds: 179.1,
    titleEn: 'Step 8: Standalone Public QR Plaque Scans',
    titleUrdu: 'مرحلہ ۸: پبلک کیو آر کوڈ سے عوامی تصدیق',
    icon: <QrCode className="w-4 h-4 text-emerald-400" />,
    summary: 'Zero-login required on physical plaque QR scans (?view_audit=...). Opens 2-Page Verified Certificate with live photos while protecting app login.'
  },
  {
    id: 10,
    timeSeconds: 198.6,
    titleEn: 'Step 9: Reports & Governance',
    titleUrdu: 'مرحلہ ۹: رپورٹس، ایکسل ایکسپورٹ اور شعبہ جاتی رہنمائی',
    icon: <Award className="w-4 h-4 text-yellow-400" />,
    summary: 'Export filtered audit registers and repair work orders to Excel or printable PDF. Enterprise oversight led by Syed Waqas.'
  }
];

export const VideoTutorialModal: React.FC<VideoTutorialModalProps> = ({ isOpen, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);

  if (!isOpen) return null;

  const seekToChapter = (chapter: Chapter, index: number) => {
    setActiveChapterIndex(index);
    if (videoRef.current) {
      videoRef.current.currentTime = chapter.timeSeconds;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      for (let i = chapters.length - 1; i >= 0; i--) {
        if (current >= chapters[i].timeSeconds) {
          setActiveChapterIndex(i);
          break;
        }
      }
    }
  };

  const videoUrl = 'assets/video/FGRF_Water_Projects_System_Video_Tutorial.webm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* ================= MODAL HEADER ================= */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-800/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg border border-emerald-400/40 text-white">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Official System Video Guide & Training
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded border border-emerald-400/30 flex items-center gap-1">
                  <span>🔊 Voice-Over</span>
                  <span>•</span>
                  <span>One-Screen Mode</span>
                </span>
              </div>
              <p className="text-xs text-emerald-300/90 font-medium">
                Conceived, Architected & Managed by <strong className="text-white">Syed Waqas</strong> (Manager MIS, FGRF) • رہنمائی ویڈیو ٹیوٹوریل
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={videoUrl}
              download="FGRF_Water_Projects_System_Video_Tutorial.webm"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Video (.webm)
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= MODAL BODY ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Main Player & Chapter Navigator Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Left 8 Cols: Video Player */}
            <div className="lg:col-span-8 space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-700 shadow-2xl aspect-video flex items-center justify-center group">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  className="w-full h-full object-contain"
                >
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Video Quick Controls & Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-800/80 rounded-2xl border border-slate-700/80">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlayPause}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>

                  <div className="text-xs text-slate-300 font-mono hidden sm:block">
                    Active: <span className="text-emerald-400 font-bold">{chapters[activeChapterIndex]?.titleEn}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="video_tutorial.html"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-medium transition-all cursor-pointer"
                    title="Open standalone player in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Fullscreen Page</span>
                  </a>

                  <a
                    href={videoUrl}
                    download="FGRF_Water_Projects_System_Video_Tutorial.webm"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download (.webm)</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Interactive Chapter Navigation */}
            <div className="lg:col-span-4 bg-slate-950/70 rounded-2xl border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  Chapters & Modules (9 Steps)
                </h3>
                <span className="text-[10px] text-slate-400">Click to seek</span>
              </div>

              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                {chapters.map((ch, idx) => {
                  const isActive = activeChapterIndex === idx;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => seekToChapter(ch, idx)}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer border ${
                        isActive
                          ? 'bg-emerald-950/80 border-emerald-500/60 shadow-md shadow-emerald-950/50'
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">{ch.icon}</div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-bold leading-tight ${isActive ? 'text-emerald-300' : 'text-slate-200'}`}>
                          {ch.titleEn}
                        </div>
                        <div className="font-urdu text-[11px] text-slate-400 leading-tight mt-0.5">
                          {ch.titleUrdu}
                        </div>
                        <div className="text-[10px] text-slate-400/90 line-clamp-1 mt-1">
                          {ch.summary}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ================= ARCHITECT & CONCEPT ATTRIBUTION BANNER ================= */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-teal-950/80 to-slate-900 border border-emerald-500/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shrink-0 shadow-lg border border-emerald-400/50">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">
                    System Vision & Project Architect
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-400/30">
                    Lead Management
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white">
                  Syed Waqas • Manager MIS
                </h4>
                <p className="text-xs text-slate-300">
                  Data Management & ERP Department — Faizan Global Relief Foundation (FGRF)
                </p>
              </div>
            </div>

            <div className="text-right text-xs text-slate-300 max-w-md hidden md:block">
              <p className="font-urdu text-[13px] text-emerald-300 leading-relaxed text-right">
                یہ جامع ڈیجیٹل آڈٹ سسٹم سید وقاص (منیجر ایم آئی ایس) کی قیادت اور وژن کے تحت تیار کیا گیا ہے تاکہ واٹر پراجیکٹس کی شفاف مانیٹرنگ اور عوامی فلاح کو یقینی بنایا جا سکے۔
              </p>
            </div>
          </div>

          {/* ================= STEP-BY-STEP OPERATIONAL GUIDE ================= */}
          <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Operational Training Manual & Workflow Steps / طریقہ کار
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Standard operating procedures for field engineers, audit teams, and headquarters management
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-[10px]">1</span>
                  Field Inspection & Evidence
                </div>
                <div className="font-urdu text-slate-300 text-[11px]">موقع پر معائنہ اور تصاویر</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Open <strong>New Inspection</strong> (Form FGRF-WTS-AUD-002.00-26). Capture live GPS coordinates, record physical component health, and take mandatory Before/After photos and repair videos.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="font-bold text-sky-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-950 border border-sky-500 flex items-center justify-center text-[10px]">2</span>
                  Real-Time Cloud Synchronization
                </div>
                <div className="font-urdu text-slate-300 text-[11px]">کلاؤڈ سنک اور ہیڈ کوارٹر ڈیٹا بیس</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Upon saving, data automatically broadcasts to the central cloud master database. Super Admin instantly views the new inspection across Pakistan without manual file transfers.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-950 border border-amber-500 flex items-center justify-center text-[10px]">3</span>
                  Site Plaque QR Verification
                </div>
                <div className="font-urdu text-slate-300 text-[11px]">کیو آر کوڈ سے عوامی تصدیق</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Every site plaque bears an isolated verification QR code. Donors and community members scan with any phone to open the verified certificate without accessing internal software functions.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Faizan Global Relief Foundation</span>
            <span>•</span>
            <span>ERP & MIS Department</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={videoUrl}
              download="FGRF_Water_Projects_System_Video_Tutorial.webm"
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Video File (.webm)
            </a>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-colors cursor-pointer"
            >
              Close / بند کریں
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
