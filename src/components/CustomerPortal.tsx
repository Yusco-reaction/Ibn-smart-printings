import React, { useState, useId } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Copy,
  Smartphone,
  CreditCard,
  Layers,
  Sparkles,
  HelpCircle,
  Eye,
  X,
  FileCheck,
  Zap,
} from 'lucide-react';
import {
  ColorMode,
  Language,
  PaperSize,
  PaymentMethod,
  PrintQuality,
  PrintSettings,
  PrintJob,
  PricingRates,
} from '../types/index.ts';
import { translations } from '../utils/translations.ts';
import { calculatePrintPrice, formatTZS, DEFAULT_PRICING_RATES } from '../utils/pricing.ts';
import { SAMPLE_DOCUMENTS } from '../utils/dummyData.ts';

interface CustomerPortalProps {
  lang: Language;
  onJobCreated: (job: PrintJob) => void;
  pricingRates?: PricingRates;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  lang,
  onJobCreated,
  pricingRates = DEFAULT_PRICING_RATES,
}) => {
  const t = translations[lang];

  // Upload State
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    sizeBytes: number;
    type: string;
    pageCount: number;
    previewUrl?: string;
  } | null>({
    name: SAMPLE_DOCUMENTS[0].name,
    sizeBytes: SAMPLE_DOCUMENTS[0].sizeBytes,
    type: SAMPLE_DOCUMENTS[0].type,
    pageCount: SAMPLE_DOCUMENTS[0].pageCount,
  });

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [showDuplexModal, setShowDuplexModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileNetwork, setMobileNetwork] = useState<'mpesa' | 'tigopesa' | 'airtelmoney' | 'halopesa'>('mpesa');

  // Customer Contact State
  const [customerName, setCustomerName] = useState('Baraka Juma');
  const [customerPhone, setCustomerPhone] = useState('0754 889 900');

  // Print Settings State
  const [settings, setSettings] = useState<PrintSettings>({
    colorMode: 'bw',
    paperSize: 'A4',
    copies: 1,
    pageRangeMode: 'all',
    customPageRange: '',
    orientation: 'portrait',
    scaling: 'fit',
    quality: 'standard',
    isManualDuplex: false,
    manualDuplexConfirmed: false,
    bindingOrStapling: 'none',
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('counter');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute live price
  const priceResult = calculatePrintPrice(
    settings,
    selectedFile ? selectedFile.pageCount : 1,
    pricingRates
  );

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // Validate size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage(
        lang === 'sw'
          ? 'Ukubwa wa faili umezidi kiwango cha 50MB. Tafadhali chagua faili dogo.'
          : 'File size exceeds 50MB maximum limit. Please choose a smaller file.'
      );
      return;
    }

    // Determine estimated page count from file size & extension
    let estimatedPages = 1;
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'pdf') {
      estimatedPages = Math.max(1, Math.round(file.size / (180 * 1024)));
    } else if (ext === 'docx' || ext === 'doc') {
      estimatedPages = Math.max(1, Math.round(file.size / (120 * 1024)));
    } else if (ext === 'xlsx' || ext === 'xls') {
      estimatedPages = Math.max(1, Math.round(file.size / (90 * 1024)));
    } else {
      estimatedPages = 1; // Images are 1 page
    }

    setSelectedFile({
      name: file.name,
      sizeBytes: file.size,
      type: file.type || `application/${ext}`,
      pageCount: estimatedPages,
      previewUrl: URL.createObjectURL(file),
    });
  };

  const selectSample = (sample: typeof SAMPLE_DOCUMENTS[0]) => {
    setSelectedFile({
      name: sample.name,
      sizeBytes: sample.sizeBytes,
      type: sample.type,
      pageCount: sample.pageCount,
    });
    setErrorMessage(null);
  };

  // Submission
  const handleSubmitJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage(
        lang === 'sw'
          ? 'Tafadhali pakia au chagua faili ya kuprinti kwanza.'
          : 'Please upload or select a document to print first.'
      );
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage(
        lang === 'sw'
          ? 'Tafadhali jaza Jina lako na Namba ya Simu kwa ajili ya risiti.'
          : 'Please enter your Name and Phone Number for identification.'
      );
      return;
    }

    if (settings.isManualDuplex && !settings.manualDuplexConfirmed) {
      setShowDuplexModal(true);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const year = new Date().getFullYear();
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const newJobId = `IBN-${year}-${randomId}`;
      const accessToken = `sec_${Math.random().toString(36).substring(2, 12)}`;

      const newJob: PrintJob = {
        id: newJobId,
        accessToken,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        fileName: selectedFile.name,
        fileSizeBytes: selectedFile.sizeBytes,
        fileType: selectedFile.type,
        pageCount: selectedFile.pageCount,
        settings: { ...settings },
        pricing: priceResult,
        paymentMethod: paymentMethod === 'counter' ? 'counter' : mobileNetwork,
        paymentStatus: paymentMethod === 'counter' ? 'counter_pending' : 'completed',
        paymentReference:
          paymentMethod === 'counter'
            ? undefined
            : `${mobileNetwork.toUpperCase()}-TZ-${Math.floor(1000000 + Math.random() * 9000000)}`,
        status: paymentMethod === 'counter' ? 'awaiting_payment' : 'queued',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        printerAssigned: 'EPSON L3250 Series (Wi-Fi)',
      };

      setIsSubmitting(false);
      onJobCreated(newJob);
    }, 900);
  };

  const manualDuplexCheckboxId = useId();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Announcement Banner */}
      <div className="bg-linear-to-r from-teal-800 via-teal-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Stationery ya Kisasa - Epson EcoTank L3250</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
            {t.heroTitle}
          </h1>
          <p className="text-teal-100 text-sm sm:text-base leading-relaxed mb-4">
            {t.heroSubtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-teal-200/90 font-medium">
            <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              B&W: {pricingRates.bwPerPageTZS} TZS / page
            </span>
            <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              Colour: {pricingRates.colorPerPageTZS} TZS / page
            </span>
            <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              M-Pesa / Tigo / Airtel / Kaunta
            </span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-shake">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmitJob} className="space-y-8">
        {/* STEP 1: Upload Document */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 text-xs font-extrabold flex items-center justify-center">
                1
              </span>
              <span>{t.step1Title}</span>
            </h2>
            {selectedFile && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t.uploadSuccess}
              </span>
            )}
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-300 hover:border-teal-600 rounded-xl p-6 text-center transition bg-slate-50/60 hover:bg-teal-50/30 relative">
            <input
              type="file"
              id="doc-upload"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 mb-1">
                {t.uploadInstruction}
              </p>
              <p className="text-xs text-slate-500 mb-1">{t.supportedFormats}</p>
              <p className="text-[11px] text-slate-400">{t.maxFileSize}</p>
            </div>
          </div>

          {/* Selected File Details */}
          {selectedFile && (
            <div className="mt-4 p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                    {selectedFile.name}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span>
                      {t.fileSize}: {(selectedFile.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-teal-800">
                      {t.pageCountDetected}: {selectedFile.pageCount}{' '}
                      {selectedFile.pageCount === 1 ? 'ukurasa' : 'kurasa'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-teal-300 text-teal-800 hover:bg-teal-100/50 flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t.previewDoc}</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Sample Selector for immediate smartphone testing */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <span className="text-xs font-medium text-slate-500 block mb-2">
              {t.selectSample}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_DOCUMENTS.map((doc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectSample(doc)}
                  className={`text-left p-2.5 rounded-lg border text-xs transition flex items-center justify-between ${
                    selectedFile?.name === doc.name
                      ? 'border-teal-600 bg-teal-50 text-teal-900 font-semibold'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <span className="truncate pr-2">{doc.name}</span>
                  <span className="text-[10px] text-slate-500 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">
                    {doc.pageCount} pgs
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* STEP 2: Epson EcoTank L3250 Print Settings */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 text-xs font-extrabold flex items-center justify-center">
                2
              </span>
              <span>{t.step2Title}</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Driver: EPSON L3250 ESC/P-R
            </span>
          </div>

          {/* 1. Colour vs B&W Mode */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              {t.colorModeLabel}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, colorMode: 'bw' })}
                className={`p-3.5 rounded-xl border-2 text-left transition relative ${
                  settings.colorMode === 'bw'
                    ? 'border-slate-800 bg-slate-900 text-white shadow-md'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">{t.bwOption}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                      settings.colorMode === 'bw'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {pricingRates.bwPerPageTZS} TZS / pg
                  </span>
                </div>
                <p
                  className={`text-xs ${
                    settings.colorMode === 'bw' ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {t.bwDesc}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, colorMode: 'color' })}
                className={`p-3.5 rounded-xl border-2 text-left transition relative ${
                  settings.colorMode === 'color'
                    ? 'border-teal-600 bg-linear-to-br from-teal-700 to-teal-900 text-white shadow-md'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-linear-to-r from-red-500 via-green-500 to-blue-500" />
                    {t.colorOption}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                      settings.colorMode === 'color'
                        ? 'bg-teal-500/40 text-teal-100'
                        : 'bg-teal-100 text-teal-800'
                    }`}
                  >
                    {pricingRates.colorPerPageTZS} TZS / pg
                  </span>
                </div>
                <p
                  className={`text-xs ${
                    settings.colorMode === 'color' ? 'text-teal-100' : 'text-slate-500'
                  }`}
                >
                  {t.colorDesc}
                </p>
              </button>
            </div>
          </div>

          {/* 2. Paper Size and Copies */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                {t.paperSizeLabel}
              </label>
              <select
                value={settings.paperSize}
                onChange={(e) =>
                  setSettings({ ...settings, paperSize: e.target.value as PaperSize })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="A4">A4 (210 x 297 mm) - Karatasi ya Kawaida</option>
                <option value="Legal">Legal (8.5 x 14 in) - Hati / Mahakama</option>
                <option value="Letter">Letter (8.5 x 11 in)</option>
                <option value="A5">A5 (148 x 210 mm) - Kijitabu</option>
                <option value="A6">A6 (105 x 148 mm)</option>
                <option value="B5">B5 (182 x 257 mm)</option>
                <option value="Photo_10x15">Photo 10x15 cm (4x6 in) - Glossy Photo</option>
                <option value="Envelope_DL">Envelope DL (Bahasha)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                {t.copiesLabel}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSettings({ ...settings, copies: Math.max(1, settings.copies - 1) })
                  }
                  className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-lg transition"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.copies}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      copies: Math.max(1, parseInt(e.target.value) || 1),
                    })
                  }
                  className="w-full text-center bg-slate-50 border border-slate-300 rounded-lg py-2 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setSettings({ ...settings, copies: Math.min(100, settings.copies + 1) })
                  }
                  className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-lg transition"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* 3. Page Range */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              {t.pageRangeLabel}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
              <label className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="pageRangeMode"
                  checked={settings.pageRangeMode === 'all'}
                  onChange={() => setSettings({ ...settings, pageRangeMode: 'all' })}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm font-semibold text-slate-800">
                  {t.allPages} ({selectedFile?.pageCount || 1} kurasa)
                </span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="pageRangeMode"
                  checked={settings.pageRangeMode === 'custom'}
                  onChange={() => setSettings({ ...settings, pageRangeMode: 'custom' })}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm font-semibold text-slate-800">
                  {t.customRange}
                </span>
              </label>
            </div>

            {settings.pageRangeMode === 'custom' && (
              <div className="mt-2 p-3 rounded-lg bg-teal-50/50 border border-teal-200">
                <input
                  type="text"
                  placeholder={t.customRangePlaceholder}
                  value={settings.customPageRange}
                  onChange={(e) =>
                    setSettings({ ...settings, customPageRange: e.target.value })
                  }
                  className="w-full bg-white border border-teal-300 rounded-lg px-3 py-1.5 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <div className="flex items-center justify-between text-[11px] text-teal-800 mt-1.5">
                  <span>{t.customRangeHint}</span>
                  <span className="font-bold">
                    Kurasa zilizochaguliwa: {priceResult.totalSelectedPages}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 4. Orientation & Quality */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                {t.orientationLabel}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, orientation: 'portrait' })}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition ${
                    settings.orientation === 'portrait'
                      ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  {t.portrait}
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, orientation: 'landscape' })}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition ${
                    settings.orientation === 'landscape'
                      ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  {t.landscape}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                {t.qualityLabel}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, quality: 'standard' })}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition ${
                    settings.quality === 'standard'
                      ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  {t.standardQuality}
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, quality: 'high' })}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition ${
                    settings.quality === 'high'
                      ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  {t.highQuality} (+200 TZS)
                </button>
              </div>
            </div>
          </div>

          {/* 5. MANUAL DUPLEX WORKFLOW NOTICE (CRITICAL FOR EPSON L3250) */}
          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-amber-950">
                    {t.duplexWarningTitle}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      if (!settings.isManualDuplex) {
                        setShowDuplexModal(true);
                      } else {
                        setSettings({
                          ...settings,
                          isManualDuplex: false,
                          manualDuplexConfirmed: false,
                        });
                      }
                    }}
                    className={`text-xs px-3 py-1 font-bold rounded-lg transition ${
                      settings.isManualDuplex
                        ? 'bg-amber-600 text-white'
                        : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
                    }`}
                  >
                    {settings.isManualDuplex ? '✓ Imewashwa (Manual)' : 'Washa Duplex ya Mkono'}
                  </button>
                </div>
                <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                  {t.duplexWarningBody}
                </p>
                {settings.isManualDuplex && (
                  <div className="mt-2 text-xs font-semibold text-emerald-800 flex items-center gap-1.5 bg-emerald-100/70 px-2.5 py-1 rounded-md border border-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      Punguzo la 10% la karatasi limetumika: -{formatTZS(priceResult.discountAmount)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 6. Finishing Options */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              {t.finishingLabel}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, bindingOrStapling: 'none' })}
                className={`p-2.5 rounded-lg border text-xs text-left transition ${
                  settings.bindingOrStapling === 'none'
                    ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                {t.noFinishing}
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, bindingOrStapling: 'staple' })}
                className={`p-2.5 rounded-lg border text-xs text-left transition ${
                  settings.bindingOrStapling === 'staple'
                    ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                {t.stapleFinishing}
              </button>
              <button
                type="button"
                onClick={() =>
                  setSettings({ ...settings, bindingOrStapling: 'spiral_binding' })
                }
                className={`p-2.5 rounded-lg border text-xs text-left transition ${
                  settings.bindingOrStapling === 'spiral_binding'
                    ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                {t.spiralBindingFinishing}
              </button>
            </div>
          </div>
        </section>

        {/* STEP 3 & 4: Customer Details, Live Pricing & Payment */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 text-xs font-extrabold flex items-center justify-center">
              3
            </span>
            <span>Maelezo Yako & Njia ya Malipo</span>
          </h2>

          {/* Customer Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                {t.customerNameLabel} *
              </label>
              <input
                type="text"
                required
                placeholder={t.customerNamePlaceholder}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                {t.customerPhoneLabel} *
              </label>
              <input
                type="tel"
                required
                placeholder={t.customerPhonePlaceholder}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Live Price Summary Box */}
          <div className="rounded-xl bg-slate-900 text-white p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t.breakdownTitle}
              </span>
              <span className="text-xs font-mono text-teal-400">
                Jumla ya Karatasi: {priceResult.totalPagesToPrint}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              {priceResult.breakdown.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span>{lang === 'sw' ? item.labelSw : item.labelEn}</span>
                  <span
                    className={`font-mono font-semibold ${
                      item.amountTZS < 0 ? 'text-emerald-400' : 'text-slate-100'
                    }`}
                  >
                    {item.amountTZS < 0 ? '-' : ''}
                    {formatTZS(Math.abs(item.amountTZS))}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">{t.totalPayable}</span>
                <span className="text-2xl font-extrabold text-teal-400 font-mono tracking-tight">
                  {formatTZS(priceResult.totalTZS)}
                </span>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                <span>Epson EcoTank L3250</span>
                <span className="block text-emerald-400 font-semibold">Wi-Fi Ready</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              {t.paymentMethodTitle}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* Option A: Pay at Counter */}
              <button
                type="button"
                onClick={() => setPaymentMethod('counter')}
                className={`p-4 rounded-xl border-2 text-left transition ${
                  paymentMethod === 'counter'
                    ? 'border-teal-600 bg-teal-50/50 text-teal-950 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-teal-700" />
                  <span className="font-bold text-sm">{t.payAtCounter}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t.payAtCounterDesc}
                </p>
              </button>

              {/* Option B: Mobile Money */}
              <button
                type="button"
                onClick={() => setPaymentMethod('mpesa')}
                className={`p-4 rounded-xl border-2 text-left transition ${
                  paymentMethod !== 'counter'
                    ? 'border-teal-600 bg-teal-50/50 text-teal-950 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-sm">{t.payMobile}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t.payMobileDesc}
                </p>
              </button>
            </div>

            {/* Mobile Network Selection if Mobile Money selected */}
            {paymentMethod !== 'counter' && (
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-300/80 space-y-3">
                <span className="text-xs font-bold text-slate-700 block">
                  Chagua Mtandao wa Simu (Tanzania):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileNetwork('mpesa');
                      setPaymentMethod('mpesa');
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition ${
                      mobileNetwork === 'mpesa'
                        ? 'bg-red-700 text-white border-red-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    M-Pesa (Vodacom)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileNetwork('tigopesa');
                      setPaymentMethod('tigopesa');
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition ${
                      mobileNetwork === 'tigopesa'
                        ? 'bg-blue-700 text-white border-blue-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    Tigo Pesa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileNetwork('airtelmoney');
                      setPaymentMethod('airtelmoney');
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition ${
                      mobileNetwork === 'airtelmoney'
                        ? 'bg-red-600 text-white border-red-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    Airtel Money
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileNetwork('halopesa');
                      setPaymentMethod('halopesa');
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition ${
                      mobileNetwork === 'halopesa'
                        ? 'bg-orange-600 text-white border-orange-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    Halopesa
                  </button>
                </div>
                <p className="text-[11px] text-slate-600">
                  Uthibitisho wa muamala unakaguliwa moja kwa moja na seva (Authenticated Webhook).
                </p>
              </div>
            )}
          </div>

          {/* Final Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-base shadow-lg shadow-teal-700/25 flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Inawasilisha kazi yako kwa seva...</span>
              </>
            ) : (
              <>
                <Printer className="w-5 h-5" />
                <span>{t.submitPrintJob} ({formatTZS(priceResult.totalTZS)})</span>
              </>
            )}
          </button>
        </section>
      </form>

      {/* Manual Duplex Confirmation Modal */}
      {showDuplexModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {t.duplexWarningTitle}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t.duplexWarningBody}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label htmlFor={manualDuplexCheckboxId} className="flex items-start gap-2.5 text-xs text-slate-800 cursor-pointer">
                <input
                  id={manualDuplexCheckboxId}
                  type="checkbox"
                  checked={settings.manualDuplexConfirmed}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      manualDuplexConfirmed: e.target.checked,
                      isManualDuplex: e.target.checked,
                    })
                  }
                  className="mt-0.5 text-teal-600 rounded focus:ring-teal-500"
                />
                <span className="font-semibold">{t.confirmDuplex}</span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSettings({
                    ...settings,
                    isManualDuplex: false,
                    manualDuplexConfirmed: false,
                  });
                  setShowDuplexModal(false);
                }}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
              >
                Ghairi / Tumia Upande Mmoja
              </button>
              <button
                type="button"
                disabled={!settings.manualDuplexConfirmed}
                onClick={() => setShowDuplexModal(false)}
                className="flex-1 py-2.5 rounded-lg bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition disabled:opacity-50"
              >
                Thibitisha Duplex
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {isPreviewModalOpen && selectedFile && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900 truncate max-w-md">
                  {selectedFile.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="aspect-3/4 max-w-sm mx-auto bg-white border border-slate-300 shadow-md rounded p-6 flex flex-col justify-between text-[11px] text-slate-600 font-mono">
                <div className="border-b pb-2 mb-2 flex justify-between">
                  <span>IBN SMART PRINT PREVIEW</span>
                  <span>Page 1 of {selectedFile.pageCount}</span>
                </div>
                <div className="space-y-2 opacity-80">
                  <div className="h-3 bg-slate-300 rounded w-3/4" />
                  <div className="h-2 bg-slate-200 rounded w-full" />
                  <div className="h-2 bg-slate-200 rounded w-5/6" />
                  <div className="h-2 bg-slate-200 rounded w-4/6" />
                  <div className="h-2 bg-slate-200 rounded w-full" />
                  <div className="h-2 bg-slate-200 rounded w-3/4" />
                </div>
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  [Muonekano wa Nyaraka - Epson L3250 Print Spool Simulation]
                </div>
                <div className="border-t pt-2 text-[10px] text-slate-400 flex justify-between">
                  <span>Paper: {settings.paperSize}</span>
                  <span>Mode: {settings.colorMode.toUpperCase()}</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 text-center">
                Kurasa zote {selectedFile.pageCount} zitasafishwa na kutumwa kwa wino asili wa Epson EcoTank.
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition"
              >
                Funga Muonekano
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
