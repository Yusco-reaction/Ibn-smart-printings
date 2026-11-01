import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Printer,
  AlertCircle,
  FileText,
  CreditCard,
  RefreshCw,
  XCircle,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  QrCode,
  MapPin,
  Phone,
} from 'lucide-react';
import { Language, PrintJob, JobStatus } from '../types/index.ts';
import { translations } from '../utils/translations.ts';
import { formatTZS } from '../utils/pricing.ts';

interface JobTrackerProps {
  lang: Language;
  jobs: PrintJob[];
  currentJobId?: string;
  onUpdateJobStatus?: (jobId: string, status: JobStatus) => void;
}

export const JobTracker: React.FC<JobTrackerProps> = ({
  lang,
  jobs,
  currentJobId,
  onUpdateJobStatus,
}) => {
  const t = translations[lang];
  const [searchQuery, setSearchQuery] = useState(currentJobId || (jobs[0]?.id ?? ''));
  const [selectedJobId, setSelectedJobId] = useState<string>(currentJobId || (jobs[0]?.id ?? ''));
  const [showReceipt, setShowReceipt] = useState(false);

  const activeJob =
    jobs.find((j) => j.id.toLowerCase() === selectedJobId.toLowerCase()) ||
    jobs.find((j) => j.customerPhone.includes(searchQuery)) ||
    jobs[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    const found = jobs.find(
      (j) => j.id.toLowerCase() === query || j.customerPhone.replace(/\s+/g, '').includes(query)
    );
    if (found) {
      setSelectedJobId(found.id);
    }
  };

  const statusSteps: { key: JobStatus; labelSw: string; labelEn: string; icon: React.ReactNode }[] = [
    { key: 'uploaded', labelSw: 'Imepokelewa', labelEn: 'Received', icon: <FileText className="w-4 h-4" /> },
    { key: 'awaiting_payment', labelSw: 'Inasubiri Malipo', labelEn: 'Awaiting Payment', icon: <Clock className="w-4 h-4" /> },
    { key: 'payment_confirmed', labelSw: 'Malipo Yamethibitishwa', labelEn: 'Payment Confirmed', icon: <CreditCard className="w-4 h-4" /> },
    { key: 'queued', labelSw: 'Foleni ya Epson L3250', labelEn: 'Queued on Epson', icon: <Printer className="w-4 h-4" /> },
    { key: 'printing', labelSw: 'Inachapishwa...', labelEn: 'Printing', icon: <RefreshCw className="w-4 h-4 animate-spin" /> },
    { key: 'completed', labelSw: 'Tayari Kuchukua!', labelEn: 'Ready for Pickup', icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  const getStepIndex = (status: JobStatus): number => {
    switch (status) {
      case 'uploaded': return 0;
      case 'awaiting_payment': return 1;
      case 'payment_confirmed': return 2;
      case 'queued': return 3;
      case 'printing': return 4;
      case 'completed': return 5;
      case 'failed':
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  const currentStepIdx = activeJob ? getStepIndex(activeJob.status) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 mb-8">
        <h1 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Search className="w-5 h-5 text-teal-700" />
          <span>{t.trackTitle}</span>
        </h1>
        <p className="text-xs text-slate-500 mb-4">{t.trackSubtitle}</p>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Weka Namba ya Kazi (e.g. IBN-2026-0841) au Simu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Search className="w-4 h-4" />
            <span>{t.searchJobBtn}</span>
          </button>
        </form>

        {/* Quick Recent Jobs Badges */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium">Kazi za Hivi Karibuni:</span>
          {jobs.map((job) => (
            <button
              key={job.id}
              type="button"
              onClick={() => {
                setSelectedJobId(job.id);
                setSearchQuery(job.id);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition ${
                activeJob?.id === job.id
                  ? 'bg-teal-700 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {job.id} ({job.customerName.split(' ')[0]})
            </button>
          ))}
        </div>
      </div>

      {activeJob ? (
        <div className="space-y-6">
          {/* Main Job Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-lg font-extrabold text-teal-800 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
                    {activeJob.id}
                  </span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                      activeJob.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : activeJob.status === 'printing'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300 animate-pulse'
                        : activeJob.status === 'failed' || activeJob.status === 'cancelled'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {activeJob.status.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-800 mt-2">
                  {activeJob.fileName}
                </h2>
                <p className="text-xs text-slate-500">
                  Mteja: <strong className="text-slate-700">{activeJob.customerName}</strong> ({activeJob.customerPhone})
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Jumla ya Malipo</span>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {formatTZS(activeJob.pricing.totalTZS)}
                </span>
                <span className="block text-[11px] text-teal-700 font-semibold mt-0.5">
                  Njia: {activeJob.paymentMethod.toUpperCase()} ({activeJob.paymentStatus})
                </span>
              </div>
            </div>

            {/* Visual Timeline */}
            <div className="py-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">
                Mwenendo wa Uchapishaji (Real-time Timeline)
              </h3>

              <div className="relative">
                {/* Connecting Line */}
                <div className="absolute top-5 left-4 right-4 h-0.5 bg-slate-200 -z-0 hidden sm:block" />

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 relative z-10">
                  {statusSteps.map((step, idx) => {
                    const isPassed = currentStepIdx >= idx && currentStepIdx !== -1;
                    const isCurrent = currentStepIdx === idx;

                    return (
                      <div key={step.key} className="flex flex-col items-center text-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            isPassed
                              ? 'bg-teal-700 text-white shadow-md shadow-teal-700/30'
                              : isCurrent
                              ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          {step.icon}
                        </div>
                        <span
                          className={`mt-2 text-xs font-bold ${
                            isCurrent
                              ? 'text-teal-800'
                              : isPassed
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {lang === 'sw' ? step.labelSw : step.labelEn}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] text-teal-600 font-semibold mt-0.5">
                            ● Hatua ya Sasa
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Context Notice based on current status */}
            <div className="p-4 rounded-xl border bg-slate-50 text-xs text-slate-700 space-y-2">
              {activeJob.status === 'awaiting_payment' && (
                <div className="flex items-start gap-3 text-amber-900 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <CreditCard className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" />
                  <div>
                    <h5 className="font-bold">Malipo Yanasubiriwa:</h5>
                    <p className="mt-0.5">
                      {activeJob.paymentMethod === 'counter'
                        ? 'Tafadhali fika kaunta ya duka ulipe ' + formatTZS(activeJob.pricing.totalTZS) + ' kwa mhudumu ili kazi itumwe moja kwa moja kwa Epson L3250.'
                        : 'Malipo ya simu yanaendelea kukaguliwa. Printi itaanza mara moja baada ya seva kupokea uthibitisho.'}
                    </p>
                  </div>
                </div>
              )}

              {activeJob.status === 'printing' && (
                <div className="flex items-start gap-3 text-blue-900 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <Printer className="w-5 h-5 shrink-0 text-blue-700 mt-0.5 animate-bounce" />
                  <div>
                    <h5 className="font-bold">Epson EcoTank L3250 Inachapisha Sasa:</h5>
                    <p className="mt-0.5">
                      Kichwa cha wino cha Epson kinakamilisha kurasa zako {activeJob.pricing.totalPagesToPrint}. Tafadhali subiri kidogo karibu na kaunta.
                    </p>
                  </div>
                </div>
              )}

              {activeJob.status === 'completed' && (
                <div className="flex items-start gap-3 text-emerald-900 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-700 mt-0.5" />
                  <div>
                    <h5 className="font-bold">Kazi Imekamilika Kikamilifu!</h5>
                    <p className="mt-0.5">
                      Nyaraka zako zipo tayari kwenye trei ya printer. Onyesha namba <strong>{activeJob.id}</strong> kwa mhudumu wa kaunta kuzichukua.
                    </p>
                  </div>
                </div>
              )}

              {/* Print specs grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block">Karatasi:</span>
                  <strong>{activeJob.settings.paperSize}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Wino / Rangi:</span>
                  <strong>{activeJob.settings.colorMode === 'color' ? 'Full Colour' : 'B&W (Monochrome)'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Nakala (Copies):</span>
                  <strong>{activeJob.settings.copies}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Duplex:</span>
                  <strong>{activeJob.settings.isManualDuplex ? 'Manual (Kugeuza)' : 'Upande Mmoja'}</strong>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowReceipt(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>{t.downloadReceipt}</span>
                </button>

                {activeJob.status === 'awaiting_payment' && (
                  <button
                    type="button"
                    onClick={() => onUpdateJobStatus && onUpdateJobStatus(activeJob.id, 'cancelled')}
                    className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{t.cancelJobBtn}</span>
                  </button>
                )}
              </div>

              {/* Simulation Controls for testing workflow */}
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 px-1">
                  Jaribio la Agent:
                </span>
                {activeJob.status === 'awaiting_payment' && (
                  <button
                    type="button"
                    onClick={() => onUpdateJobStatus && onUpdateJobStatus(activeJob.id, 'queued')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-amber-600 text-white rounded hover:bg-amber-700"
                  >
                    Lipa & Tuma Foleni
                  </button>
                )}
                {activeJob.status === 'queued' && (
                  <button
                    type="button"
                    onClick={() => onUpdateJobStatus && onUpdateJobStatus(activeJob.id, 'printing')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Anza Printi (Agent)
                  </button>
                )}
                {activeJob.status === 'printing' && (
                  <button
                    type="button"
                    onClick={() => onUpdateJobStatus && onUpdateJobStatus(activeJob.id, 'completed')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700"
                  >
                    Kamilisha Printi ✓
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm">Hakuna kazi iliyopatikana kwa utafutaji huo.</p>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {showReceipt && activeJob && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="text-center pb-4 border-b border-slate-200">
              <h3 className="font-extrabold text-lg text-slate-900">IBN SMART PRINT</h3>
              <p className="text-xs text-slate-500">Stationery & Cloud Printing - Dar es Salaam</p>
              <div className="mt-2 inline-block bg-teal-50 border border-teal-200 px-3 py-1 rounded-md font-mono text-sm font-bold text-teal-800">
                {activeJob.id}
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Tarehe:</span>
                <span>{new Date(activeJob.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mteja:</span>
                <span className="font-semibold">{activeJob.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Faili:</span>
                <span className="font-mono truncate max-w-[200px]">{activeJob.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kurasa & Nakala:</span>
                <span>{activeJob.pricing.totalPagesToPrint} pages ({activeJob.settings.copies} nakala)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Wino:</span>
                <span>{activeJob.settings.colorMode === 'color' ? 'Rangi (Colour)' : 'Nyeusi & Nyeupe (B&W)'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold text-sm text-slate-900">
                <span>Jumla Iliyolipwa:</span>
                <span className="text-teal-700 font-mono">{formatTZS(activeJob.pricing.totalTZS)}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-center text-[11px] text-slate-500">
              Onyesha risiti hii au namba ya kazi kaunta kuchukua nakala zako.
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-lg bg-teal-700 text-white text-xs font-bold hover:bg-teal-800"
              >
                Printi Risiti
              </button>
              <button
                type="button"
                onClick={() => setShowReceipt(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                Funga
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
