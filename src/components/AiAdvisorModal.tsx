import React, { useState } from 'react';
import { Sparkles, Brain, X, Send, AlertTriangle, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';
import { AuditRecord, WaterProject } from '../types/index.ts';

interface AiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit?: AuditRecord | null;
  projects?: WaterProject[];
}

export const AiAdvisorModal: React.FC<AiAdvisorModalProps> = ({
  isOpen,
  onClose,
  audit,
  projects,
}) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isSimulated, setIsSimulated] = useState(false);

  if (!isOpen) return null;

  const handleRunAnalysis = async (customPrompt?: string) => {
    setLoading(true);
    setAnalysisResult('');

    try {
      const payloadAudit = audit || (projects && projects[0] ? {
        projectId: projects[0].id,
        district: projects[0].district,
        province: projects[0].province,
        village: projects[0].village,
        overallCondition: projects[0].currentCondition,
        installationType: projects[0].installationType,
      } : {
        projectId: 'FGRF-WTS-NATIONAL-PORTFOLIO',
        district: 'Multi-District Pakistan',
        province: 'Sindh / Punjab / KPK / Balochistan',
        overallCondition: 'Operational Review',
      });

      const res = await fetch('/api/gemini/analyze-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditData: payloadAudit,
          question: customPrompt || question,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAnalysisResult(data.analysis);
        setIsSimulated(Boolean(data.mode === 'simulated' || data.fallback));
      } else {
        setAnalysisResult('Error running AI audit quality assessment.');
      }
    } catch (err: any) {
      setAnalysisResult(`Failed to connect to AI server: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 via-cyan-900 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/30 rounded-xl border border-cyan-400/30">
              <Brain className="w-6 h-6 text-cyan-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">FGRF High-Thinking Quality Advisor</h2>
                <span className="bg-cyan-400/30 text-cyan-200 border border-cyan-300/30 text-[10px] px-2 py-0.5 rounded-full font-mono">
                  gemini-4-carbon (ThinkingLevel.HIGH)
                </span>
              </div>
              <p className="text-cyan-100 text-xs mt-0.5">
                Deep reasoning for hydrogeological compliance, structural integrity, and water safety scrutiny.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Target Record Info */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-500">Target Audit / Project:</span>
              <span className="font-mono text-emerald-900">{audit?.id || audit?.projectId || 'FGRF Water Projects Portfolio'}</span>
            </div>
            {audit && (
              <div className="flex justify-between text-slate-600">
                <span>Location: {audit.village}, {audit.district} ({audit.province})</span>
                <span className="font-bold text-slate-800">Condition: {audit.overallCondition}</span>
              </div>
            )}
          </div>

          {/* Quick Questions */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 uppercase">
              Suggested Deep Scrutiny Questions
            </label>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  const q = 'Analyze the apron and drainage channel defects for microbial groundwater contamination risks.';
                  setQuestion(q);
                  handleRunAnalysis(q);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-left transition-colors"
              >
                🔬 Apron Defect & Groundwater Contamination Risk
              </button>
              <button
                type="button"
                onClick={() => {
                  const q = 'Provide a preventative maintenance schedule for hand pumps in arid sandy regions like Tharparkar.';
                  setQuestion(q);
                  handleRunAnalysis(q);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-left transition-colors"
              >
                🛠️ Arid Region Preventative Maintenance Plan
              </button>
            </div>
          </div>

          {/* Prompt input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask any complex technical question or press Run Scrutiny below..."
              className="flex-1 text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="button"
              onClick={() => handleRunAnalysis()}
              disabled={loading}
              className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Thinking...' : 'Run Scrutiny'}
            </button>
          </div>

          {/* Results Output */}
          {loading && (
            <div className="p-8 text-center space-y-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-xs font-bold text-slate-800">
                Engaging Gemini 4 Carbon Deep Reasoning Engine...
              </div>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Analyzing checkpoint failure modes, hydrological flow parameters, and regional groundwater safety protocols.
              </p>
            </div>
          )}

          {analysisResult && !loading && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs leading-relaxed text-slate-800">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  Engineering Quality Scrutiny Findings
                </span>
                {isSimulated && (
                  <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono font-medium">
                    Heuristic Quality Engine
                  </span>
                )}
              </div>
              <div className="prose prose-xs max-w-none whitespace-pre-line text-slate-700 font-sans">
                {analysisResult}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
