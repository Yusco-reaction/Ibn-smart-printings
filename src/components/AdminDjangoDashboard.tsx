import React, { useState } from 'react';
import {
  ShieldCheck,
  Printer,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  Settings,
  DollarSign,
  Activity,
  Layers,
  ChevronRight,
  ExternalLink,
  Sliders,
  Check,
} from 'lucide-react';
import { Language, PrintJob, EpsonPrinterStatus, PricingRates, JobStatus } from '../types/index.ts';
import { translations } from '../utils/translations.ts';
import { formatTZS } from '../utils/pricing.ts';

interface AdminDjangoDashboardProps {
  lang: Language;
  jobs: PrintJob[];
  printerStatus: EpsonPrinterStatus;
  pricingRates: PricingRates;
  onUpdatePricing: (rates: PricingRates) => void;
  onUpdateJobStatus: (jobId: string, status: JobStatus) => void;
  onApproveCounterPayment: (jobId: string) => void;
  onBackToCustomerPortal?: () => void;
}

export const AdminDjangoDashboard: React.FC<AdminDjangoDashboardProps> = ({
  lang,
  jobs,
  printerStatus,
  pricingRates,
  onUpdatePricing,
  onUpdateJobStatus,
  onApproveCounterPayment,
  onBackToCustomerPortal,
}) => {
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<'jobs' | 'printer' | 'pricing' | 'audit'>('jobs');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState<string>('approve_payment');
  const [tempPricing, setTempPricing] = useState<PricingRates>({ ...pricingRates });
  const [pricingSavedToast, setPricingSavedToast] = useState(false);

  // Financial aggregates
  const totalRevenueTZS = jobs
    .filter((j) => j.paymentStatus === 'completed')
    .reduce((sum, j) => sum + j.pricing.totalTZS, 0);

  const pendingCounterCount = jobs.filter(
    (j) => j.status === 'awaiting_payment' && j.paymentMethod === 'counter'
  ).length;

  const queuedCount = jobs.filter((j) => j.status === 'queued' || j.status === 'printing').length;
  const completedCount = jobs.filter((j) => j.status === 'completed').length;

  // Filtered jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'counter_pending'
        ? job.status === 'awaiting_payment' && job.paymentMethod === 'counter'
        : job.status === statusFilter;

    const matchesSearch =
      !searchQuery ||
      job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customerPhone.includes(searchQuery) ||
      job.fileName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedJobIds(filteredJobs.map((j) => j.id));
    } else {
      setSelectedJobIds([]);
    }
  };

  const toggleSelectJob = (id: string) => {
    if (selectedJobIds.includes(id)) {
      setSelectedJobIds(selectedJobIds.filter((jId) => jId !== id));
    } else {
      setSelectedJobIds([...selectedJobIds, id]);
    }
  };

  const handleExecuteAction = () => {
    if (selectedJobIds.length === 0) {
      alert('Tafadhali chagua angalau kazi moja kwenye orodha.');
      return;
    }

    if (selectedAction === 'approve_payment') {
      selectedJobIds.forEach((id) => onApproveCounterPayment(id));
      setSelectedJobIds([]);
    } else if (selectedAction === 'cancel_job') {
      selectedJobIds.forEach((id) => onUpdateJobStatus(id, 'cancelled'));
      setSelectedJobIds([]);
    } else if (selectedAction === 'export_csv') {
      handleExportCSV();
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Job ID',
      'Customer',
      'Phone',
      'File Name',
      'Pages',
      'Copies',
      'Color Mode',
      'Paper Size',
      'Total TZS',
      'Payment Method',
      'Payment Status',
      'Job Status',
      'Created At',
    ];

    const rows = jobs.map((j) => [
      j.id,
      `"${j.customerName}"`,
      `"${j.customerPhone}"`,
      `"${j.fileName}"`,
      j.pageCount,
      j.settings.copies,
      j.settings.colorMode,
      j.settings.paperSize,
      j.pricing.totalTZS,
      j.paymentMethod,
      j.paymentStatus,
      j.status,
      j.createdAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ibn_smart_print_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePricing(tempPricing);
    setPricingSavedToast(true);
    setTimeout(() => setPricingSavedToast(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-16">
      {/* Django Admin Classic Top Header */}
      <div className="bg-[#092e20] text-white px-6 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight font-mono text-emerald-300">
              Django administration
            </h1>
            <span className="text-emerald-500 font-mono text-sm hidden sm:inline">/</span>
            <span className="text-sm font-semibold text-slate-200">
              Ibn Smart Print Stationery (Tanzania)
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-emerald-200">
            {onBackToCustomerPortal && (
              <button
                type="button"
                onClick={onBackToCustomerPortal}
                className="px-3 py-1 rounded-md bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition border border-emerald-600 shadow-xs cursor-pointer"
              >
                <span>📱 Rudi kwenye Tovuti ya Wateja (Simu)</span>
              </button>
            )}
            <span className="hidden md:inline">
              Msimamizi: <strong className="text-white">admin@ibn-stationery.tz</strong>
            </span>
            <span className="bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800 text-[11px] font-mono hidden sm:inline">
              Django 5.0.3 | Python 3.11
            </span>
          </div>
        </div>
      </div>

      {/* Django Sub-nav tabs */}
      <div className="bg-[#124d36] text-white px-6 border-t border-emerald-900/60 shadow-xs">
        <div className="max-w-7xl mx-auto flex gap-6 text-xs font-bold uppercase tracking-wider overflow-x-auto py-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('jobs')}
            className={`transition pb-1 border-b-2 ${
              activeTab === 'jobs'
                ? 'border-emerald-300 text-white'
                : 'border-transparent text-emerald-200 hover:text-white'
            }`}
          >
            Kazi za Printi (Print Jobs) ({jobs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('printer')}
            className={`transition pb-1 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'printer'
                ? 'border-emerald-300 text-white'
                : 'border-transparent text-emerald-200 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Epson EcoTank L3250 Agent
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`transition pb-1 border-b-2 ${
              activeTab === 'pricing'
                ? 'border-emerald-300 text-white'
                : 'border-transparent text-emerald-200 hover:text-white'
            }`}
          >
            Mipangilio ya Bei (TZS)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`transition pb-1 border-b-2 ${
              activeTab === 'audit'
                ? 'border-emerald-300 text-white'
                : 'border-transparent text-emerald-200 hover:text-white'
            }`}
          >
            Kumbukumbu za Usalama (Audit Logs)
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Mapato ya Leo (TZS)
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1 block">
              {formatTZS(totalRevenueTZS)}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Malipo Yaliyothibitishwa
            </span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Inasubiri Kaunta (Pesa)
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-700 font-mono mt-1 block">
              {pendingCounterCount} kazi
            </span>
            <span className="text-[11px] text-amber-800 font-medium mt-1 block">
              Zinahitaji idhini ya mhudumu
            </span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Kwenye Foleni ya Epson
            </span>
            <span className="text-xl sm:text-2xl font-black text-blue-700 font-mono mt-1 block">
              {queuedCount} kazi
            </span>
            <span className="text-[11px] text-blue-600 font-medium mt-1 block">
              Zinachapishwa na Windows Spooler
            </span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Zilizokamilika
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1 block">
              {completedCount} kazi
            </span>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
              Tayari kuchukuliwa
            </span>
          </div>
        </div>

        {/* TAB 1: Print Jobs Management */}
        {activeTab === 'jobs' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Filter and Action bar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
              {/* Filter tabs */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    statusFilter === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Zote ({jobs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('counter_pending')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    statusFilter === 'counter_pending'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  Inasubiri Kaunta ({pendingCounterCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('queued')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    statusFilter === 'queued'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Foleni ya Epson
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('completed')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    statusFilter === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Zilizokamilika ({completedCount})
                </button>
              </div>

              {/* Search & Export */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tafuta jina, simu, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Export to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">CSV Report</span>
                </button>
              </div>
            </div>

            {/* Django Action Dropdown Row */}
            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-700 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold">Hatua (Action):</span>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-medium focus:outline-none"
                >
                  <option value="approve_payment">
                    Thibitisha Malipo ya Kaunta & Tuma kwa Epson L3250
                  </option>
                  <option value="cancel_job">Ghairi Kazi (Cancel)</option>
                  <option value="export_csv">Export Zilizochaguliwa kwenda CSV</option>
                </select>
                <button
                  type="button"
                  onClick={handleExecuteAction}
                  className="px-3 py-1 bg-[#124d36] hover:bg-[#092e20] text-white font-bold rounded text-xs transition"
                >
                  Tekeleza (Go)
                </button>
                <span className="text-slate-500 font-mono">
                  {selectedJobIds.length} kati ya {filteredJobs.length} zimechaguliwa
                </span>
              </div>
            </div>

            {/* Jobs Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 w-8">
                      <input
                        type="checkbox"
                        checked={
                          selectedJobIds.length === filteredJobs.length && filteredJobs.length > 0
                        }
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th className="py-3 px-4">Kazi ID</th>
                    <th className="py-3 px-4">Mteja & Simu</th>
                    <th className="py-3 px-4">Faili & Kurasa</th>
                    <th className="py-3 px-4">Mipangilio</th>
                    <th className="py-3 px-4">Gharama (TZS)</th>
                    <th className="py-3 px-4">Malipo</th>
                    <th className="py-3 px-4">Hali ya Printi</th>
                    <th className="py-3 px-4 text-right">Kitendo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Hakuna kazi zilizolingana na vichujio hivyo.
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((job) => (
                      <tr
                        key={job.id}
                        className={`hover:bg-slate-50 transition ${
                          selectedJobIds.includes(job.id) ? 'bg-emerald-50/50' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedJobIds.includes(job.id)}
                            onChange={() => toggleSelectJob(job.id)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-teal-800">
                          {job.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{job.customerName}</div>
                          <div className="text-slate-500 font-mono text-[11px]">
                            {job.customerPhone}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800 truncate max-w-[150px]">
                            {job.fileName}
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            {job.pricing.totalPagesToPrint} kurasa ({job.settings.copies} nakala)
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-semibold ${
                              job.settings.colorMode === 'color'
                                ? 'text-amber-700'
                                : 'text-slate-600'
                            }`}
                          >
                            {job.settings.colorMode === 'color' ? '● Colour' : '○ B&W'}
                          </span>
                          <span className="text-slate-400"> • </span>
                          <span>{job.settings.paperSize}</span>
                          {job.settings.isManualDuplex && (
                            <div className="text-[10px] text-amber-700 font-bold">
                              [Manual Duplex]
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {formatTZS(job.pricing.totalTZS)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              job.paymentStatus === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : job.paymentStatus === 'counter_pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {job.paymentMethod.toUpperCase()} ({job.paymentStatus})
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              job.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : job.status === 'printing'
                                ? 'bg-blue-100 text-blue-800 animate-pulse'
                                : job.status === 'queued'
                                ? 'bg-cyan-100 text-cyan-800'
                                : job.status === 'awaiting_payment'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {job.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          {job.status === 'awaiting_payment' && (
                            <button
                              type="button"
                              onClick={() => onApproveCounterPayment(job.id)}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-[11px] transition shadow-xs"
                            >
                              Thibitisha Kaunta
                            </button>
                          )}
                          {job.status === 'queued' && (
                            <button
                              type="button"
                              onClick={() => onUpdateJobStatus(job.id, 'printing')}
                              className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded text-[11px] transition"
                            >
                              Printi Sasa
                            </button>
                          )}
                          {job.status === 'printing' && (
                            <button
                              type="button"
                              onClick={() => onUpdateJobStatus(job.id, 'completed')}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-[11px] transition"
                            >
                              Kamilisha ✓
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Epson EcoTank L3250 Windows Agent Status */}
        {activeTab === 'printer' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-800 text-white flex items-center justify-center">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {printerStatus.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span>IP: {printerStatus.ipAddress}</span>
                    <span>•</span>
                    <span>Driver: {printerStatus.driverName}</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-bold">
                      Agent: {printerStatus.agentVersion}
                    </span>
                  </div>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Printer Inafanya Kazi (ONLINE)
              </span>
            </div>

            {/* EcoTank Ink Levels Monitor */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-700" />
                <span>Viwango vya Wino wa Epson EcoTank (Continuous Ink Supply)</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Black Ink */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-xs text-slate-900">BK (Nyeusi Asilia)</span>
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {printerStatus.blackInkPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-900 h-full rounded-full transition-all"
                      style={{ width: `${printerStatus.blackInkPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Tangi 003 Black</span>
                </div>

                {/* Cyan Ink */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-xs text-cyan-800">C (Cyan / Bluu)</span>
                    <span className="font-mono text-xs font-bold text-cyan-700">
                      {printerStatus.cyanInkPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full rounded-full transition-all"
                      style={{ width: `${printerStatus.cyanInkPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Tangi 003 Cyan</span>
                </div>

                {/* Magenta Ink */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-xs text-rose-800">M (Magenta / Nyekundu)</span>
                    <span className="font-mono text-xs font-bold text-rose-700">
                      {printerStatus.magentaInkPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all"
                      style={{ width: `${printerStatus.magentaInkPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Tangi 003 Magenta</span>
                </div>

                {/* Yellow Ink */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-xs text-amber-800">Y (Yellow / Njano)</span>
                    <span className="font-mono text-xs font-bold text-amber-700">
                      {printerStatus.yellowInkPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all"
                      style={{ width: `${printerStatus.yellowInkPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Tangi 003 Yellow</span>
                </div>
              </div>
            </div>

            {/* Hardware notes & Spooler */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h5 className="font-bold text-slate-800">Hali ya Windows Print Spooler:</h5>
                <p className="text-slate-600">
                  • Spooler Service: <strong className="text-emerald-700">Inafanya kazi (Running)</strong>
                </p>
                <p className="text-slate-600">
                  • Kazi kwenye Foleni ya OS: <strong className="font-mono">{printerStatus.queueCount}</strong>
                </p>
                <p className="text-slate-600">
                  • Trei ya Karatasi (Rear Tray): <strong className="text-emerald-700">Tayari (Ready)</strong>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2 text-amber-900">
                <h5 className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Maagizo ya Epson L3250 Duplex:</span>
                </h5>
                <p className="leading-relaxed">
                  Printer ya Epson EcoTank L3250 haina motor ya kugeuza karatasi yenyewe (no auto-duplex).
                  Kazi zenye <em>Manual Duplex</em> zitasimama katikati na kuonyesha taarifa kwenye skrini ya kompyuta ya duka ili mwendeshaji ageuze karatasi.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Price Configuration */}
        {activeTab === 'pricing' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Mipangilio ya Bei za Duka (Tanzanian Shillings - TZS)
                </h3>
                <p className="text-xs text-slate-500">
                  Badilisha bei kwa kila ukurasa, aina ya wino, na huduma za ziada. Mabadiliko yataonekana mara moja kwa wateja.
                </p>
              </div>
              {pricingSavedToast && (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-300 flex items-center gap-1">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Bei Zimehifadhiwa!
                </span>
              )}
            </div>

            <form onSubmit={handleSavePricing} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bei ya Nyeusi & Nyeupe kwa Ukurasa (TZS)
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    value={tempPricing.bwPerPageTZS}
                    onChange={(e) =>
                      setTempPricing({ ...tempPricing, bwPerPageTZS: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bei ya Rangi (Colour) kwa Ukurasa (TZS)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={tempPricing.colorPerPageTZS}
                    onChange={(e) =>
                      setTempPricing({ ...tempPricing, colorPerPageTZS: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nyongeza ya Picha / Karatasi ya Glossy (TZS)
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={tempPricing.highQualityPhotoMarkupTZS}
                    onChange={(e) =>
                      setTempPricing({
                        ...tempPricing,
                        highQualityPhotoMarkupTZS: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Punguzo la Pande Mbili (Manual Duplex %)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={tempPricing.manualDuplexDiscountPercent}
                    onChange={(e) =>
                      setTempPricing({
                        ...tempPricing,
                        manualDuplexDiscountPercent: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gharama ya Kubana na Pini (Stapling) (TZS)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={tempPricing.stapleCostTZS}
                    onChange={(e) =>
                      setTempPricing({ ...tempPricing, stapleCostTZS: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jalada la Spesho (Spiral Binding) (TZS)
                  </label>
                  <input
                    type="number"
                    min="500"
                    step="100"
                    value={tempPricing.spiralBindingCostTZS}
                    onChange={(e) =>
                      setTempPricing({
                        ...tempPricing,
                        spiralBindingCostTZS: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#124d36] hover:bg-[#092e20] text-white font-bold text-xs rounded-lg transition shadow-md shadow-emerald-900/20 cursor-pointer"
                >
                  Hifadhi Mipangilio ya Bei (Save Pricing)
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: Audit Logs */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                Kumbukumbu Rasmi ya Miamala & Vitendo (Audit Trail)
              </h3>
              <p className="text-xs text-slate-500">
                Inarekodi kila uthibitisho wa fedha taslimu kaunta na mabadiliko ya mfumo kwa uwazi.
              </p>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Uthibitisho wa Malipo ya Kaunta</span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    Mhudumu <strong>admin@ibn-stationery.tz</strong> amethibitisha pesa taslimu za kazi{' '}
                    <strong className="font-mono text-teal-800">IBN-2026-0842</strong>. Kazi imeingizwa kwenye foleni ya Epson L3250.
                  </p>
                </div>
              </div>

              <div className="p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Print Job Spooled</span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {new Date(Date.now() - 15 * 60 * 1000).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    Windows Print Agent imepakua faili na kutuma amri kwa Windows Spooler ya Epson L3250 (Job ID: 104).
                  </p>
                </div>
              </div>

              <div className="p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Agent Heartbeat Synchronized</span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {new Date(Date.now() - 30 * 60 * 1000).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    Kifaa cha stationery (Windows 11 PC) kimethibitisha mawasiliano na seva kupitia X-Agent-Secret.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
