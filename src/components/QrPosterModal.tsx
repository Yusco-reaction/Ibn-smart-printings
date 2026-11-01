import React, { useState } from 'react';
import { QrCode, Printer, Wifi, Globe, Smartphone, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Language } from '../types/index.ts';
import { translations } from '../utils/translations.ts';

interface QrPosterModalProps {
  lang: Language;
}

export const QrPosterModal: React.FC<QrPosterModalProps> = ({ lang }) => {
  const t = translations[lang];

  const [shopUrl, setShopUrl] = useState(
    typeof window !== 'undefined' ? window.location.origin : 'https://ibn-print.tz'
  );
  const [wifiSsid, setWifiSsid] = useState('IbnStationery_Guest');
  const [wifiPassword, setWifiPassword] = useState('Karibu2026');

  // Simple clean SVG QR Code generator representation
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
    shopUrl
  )}&color=092e20&bgcolor=ffffff&qzone=1`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Controls Bar (Hidden during print) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 mb-8 no-print">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-teal-700" />
              <span>{t.posterTitle}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">{t.posterSubtitle}</p>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-md shadow-teal-700/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t.printPosterBtn}</span>
          </button>
        </div>

        {/* Configuration Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {t.shopUrlLabel}
            </label>
            <input
              type="url"
              value={shopUrl}
              onChange={(e) => setShopUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {t.wifiNameLabel}
            </label>
            <input
              type="text"
              value={wifiSsid}
              onChange={(e) => setWifiSsid(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {t.wifiPassLabel}
            </label>
            <input
              type="text"
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Printable A4 Poster Sheet */}
      <div className="bg-white border-2 border-slate-300 shadow-xl rounded-2xl p-8 sm:p-12 max-w-2xl mx-auto print:border-none print:shadow-none print:p-0 print:max-w-none">
        <div className="border-4 border-teal-800 rounded-2xl p-6 sm:p-8 text-center space-y-6">
          {/* Header */}
          <div className="space-y-2 border-b-2 border-teal-100 pb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-800 text-white text-xs font-bold uppercase tracking-wider">
              <Printer className="w-3.5 h-3.5" />
              <span>Epson EcoTank L3250 Smart Print</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              IBN SMART PRINT
            </h2>
            <p className="text-sm font-semibold text-teal-800 uppercase tracking-widest">
              HUDUMA YA KUPRINTI KWA SIMU YAKO (SMARTPHONE CLOUD PRINT)
            </p>
          </div>

          {/* Core Call to action */}
          <div className="bg-teal-50/80 rounded-xl p-4 border border-teal-200">
            <h3 className="text-xl sm:text-2xl font-black text-teal-950 mb-1">
              CHANGANUA HAPA KUPRINTI BILA FOLENI!
            </h3>
            <p className="text-xs sm:text-sm font-medium text-teal-800">
              Scan this QR Code to print documents directly from your phone
            </p>
          </div>

          {/* Central QR Code Display */}
          <div className="py-2 flex flex-col items-center justify-center">
            <div className="p-4 bg-white border-4 border-teal-800 rounded-2xl shadow-md inline-block">
              <img
                src={qrSvgUrl}
                alt="Ibn Smart Print QR Code"
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto"
              />
            </div>
            <p className="mt-2 text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
              {shopUrl}
            </p>
          </div>

          {/* Simple 3 Step Guide */}
          <div className="grid grid-cols-3 gap-3 text-left pt-2 border-t-2 border-slate-100">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-teal-800 text-white font-extrabold text-xs flex items-center justify-center mb-1">
                1
              </span>
              <h4 className="text-xs font-bold text-slate-800">Changanua QR</h4>
              <p className="text-[11px] text-slate-500">Fungua kamera ya simu na gusa kiungo.</p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-teal-800 text-white font-extrabold text-xs flex items-center justify-center mb-1">
                2
              </span>
              <h4 className="text-xs font-bold text-slate-800">Pakia & Chagua</h4>
              <p className="text-[11px] text-slate-500">Chagua PDF/Word, Rangi au B&W.</p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-teal-800 text-white font-extrabold text-xs flex items-center justify-center mb-1">
                3
              </span>
              <h4 className="text-xs font-bold text-slate-800">Chukua Kaunta</h4>
              <p className="text-[11px] text-slate-500">Lipa M-Pesa au Kaunta na chukua printi.</p>
            </div>
          </div>

          {/* Wi-Fi & Support Box */}
          <div className="rounded-xl bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-teal-400" />
              <div className="text-left">
                <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                  Wi-Fi ya Bure ya Wateja
                </span>
                <span className="font-bold text-slate-100">
                  SSID: {wifiSsid} | Password: {wifiPassword}
                </span>
              </div>
            </div>

            <div className="text-right text-[11px] text-teal-300 font-medium">
              Epson EcoTank L3250 Wi-Fi Print Hub
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
