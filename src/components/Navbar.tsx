import React from 'react';
import { Printer, QrCode, FileText, Search, ShieldCheck, Code, Globe, Wifi } from 'lucide-react';
import { Language, EpsonPrinterStatus } from '../types/index.ts';
import { translations } from '../utils/translations.ts';

interface NavbarProps {
  currentTab: 'portal' | 'tracker' | 'admin' | 'poster' | 'code';
  setCurrentTab: (tab: 'portal' | 'tracker' | 'admin' | 'poster' | 'code') => void;
  lang: Language;
  setLang: (lang: Language) => void;
  printerStatus: EpsonPrinterStatus;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  lang,
  setLang,
  printerStatus,
}) => {
  const t = translations[lang];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs no-print">
      {/* Top micro bar for printer status & location */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-950 text-teal-300 border border-teal-800/60">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              Epson EcoTank L3250: {printerStatus.status.toUpperCase()} ({printerStatus.connection.toUpperCase()})
            </span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:inline text-slate-400">Dar es Salaam, Tanzania 🇹🇿</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 hidden md:inline">
              Wi-Fi: <strong className="text-slate-200">IbnStationery_Guest</strong>
            </span>
            <div className="flex items-center gap-1 bg-slate-800 rounded p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setLang('sw')}
                className={`px-2 py-0.5 text-xs font-semibold rounded transition ${
                  lang === 'sw' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                SW (Kiswahili)
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 text-xs font-semibold rounded transition ${
                  lang === 'en' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN (English)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => setCurrentTab('portal')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-md shadow-teal-700/20 group-hover:bg-teal-800 transition">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold text-slate-900 tracking-tight group-hover:text-teal-700 transition">
                  {t.brandName}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  Stationery
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Epson EcoTank L3250 Wi-Fi Cloud Print
              </p>
            </div>
          </button>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 md:gap-2">
            <button
              type="button"
              onClick={() => setCurrentTab('portal')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                currentTab === 'portal'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{t.startPrinting}</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab('tracker')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                currentTab === 'tracker'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>{t.trackJobNav}</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab('poster')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                currentTab === 'poster'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>{t.posterNav}</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                currentTab === 'admin'
                  ? 'bg-emerald-900 text-emerald-100 border border-emerald-800 shadow-sm'
                  : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
              }`}
              title="Django Administration"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-xs font-bold">Django Admin</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab('code')}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                currentTab === 'code'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="View Python Source Code & Local Agent"
            >
              <Code className="w-4 h-4 text-amber-500" />
              <span className="text-xs">Python Code</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
