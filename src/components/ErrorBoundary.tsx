import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, ShieldCheck } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[FGRF ErrorBoundary] Caught render exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.href = window.location.origin + window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center p-4 font-sans text-slate-100">
          <div className="max-w-xl w-full bg-white text-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 border-4 border-emerald-600 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <div className="p-3 bg-amber-100 rounded-2xl text-amber-700">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900">
                  Application Recovery Shield
                </h1>
                <p className="font-urdu text-emerald-800 font-bold text-sm">
                  ایپلی کیشن ریکوری شیلڈ • نظام محفوظ ہے
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
              <p className="font-semibold text-slate-700">
                A rendering issue was safely intercepted to protect your session. Your saved audit records and project database are intact.
              </p>
              <p className="font-urdu text-slate-600 text-xs leading-relaxed">
                معائنہ ریکارڈز میں کسی غیر متوقع ڈیٹا کی وجہ سے عارضی رکاوٹ آئی ہے۔ آپ کا ڈیٹا مکمل محفوظ ہے۔ نیچے دیے گئے بٹن سے دوبارہ لوڈ کریں۔
              </p>
              {this.state.error && (
                <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-mono text-[11px] overflow-auto max-h-32">
                  {this.state.error.message || String(this.state.error)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload App / دوبارہ چلائیں</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetCache}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-sm rounded-xl border border-slate-300 hover:border-rose-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Clean Cache & Reset</span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> FGRF Water Projects Audit System
              </span>
              <span>Syed Waqas (Manager MIS)</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
