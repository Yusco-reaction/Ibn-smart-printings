import React from 'react';
import { Trash2, FileText, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { DocumentItem, PaperSize, ColorMode, Orientation, Scaling, PrintSettings } from '../types/index.ts';
import { getSheetPrice, formatTZS, parseSelectedPagesCount, calculatePrintPrice } from '../utils/pricing.ts';
import { DocumentPreview } from './DocumentPreview.tsx';

interface DocumentSetupCardProps {
  document: DocumentItem;
  docIndex: number;
  totalDocs: number;
  onUpdateSettings: (docId: string, newSettings: Partial<PrintSettings>) => void;
  onRemoveDocument: (docId: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const DocumentSetupCard: React.FC<DocumentSetupCardProps> = ({
  document,
  docIndex,
  totalDocs,
  onUpdateSettings,
  onRemoveDocument,
  isExpanded = true,
  onToggleExpand,
}) => {
  const { settings, calculation } = document;
  const isImage = document.type.startsWith('image/');

  const handleCopiesChange = (delta: number) => {
    const nextCopies = Math.max(1, Math.min(500, (settings.copies || 1) + delta));
    onUpdateSettings(document.id, { copies: nextCopies });
  };

  const handlePageRangeChange = (val: string) => {
    onUpdateSettings(document.id, {
      customPageRange: val,
      pageRangeMode: val.trim() ? 'custom' : 'all',
    });
  };

  const currentSheetPrice = getSheetPrice(settings.paperSize, settings.colorMode);
  const colorLabelEn = settings.colorMode === 'color' ? 'Colour' : 'Black and white';
  const colorLabelSw = settings.colorMode === 'color' ? 'Rangi' : 'Nyeusi na nyeupe';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
      {/* Card Header */}
      <div className="p-3.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2 truncate pr-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs text-slate-900 truncate">
                {totalDocs > 1 ? `#${docIndex + 1}: ` : ''}
                {document.name}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium block">
              {document.pageCount} {document.pageCount === 1 ? 'ukurasa' : 'kurasa'} • {(document.sizeBytes / 1024).toFixed(0)} KB
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {totalDocs > 1 && (
            <button
              type="button"
              onClick={() => onRemoveDocument(document.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
              title="Ondoa faili hili (Remove file)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* 1. Document Preview */}
          <DocumentPreview
            fileName={document.name}
            fileType={document.type}
            pageCount={document.pageCount}
            orientation={settings.orientation}
            scaling={settings.scaling}
            colorMode={settings.colorMode}
            paperSize={settings.paperSize}
            customPageRange={settings.customPageRange}
            previewUrl={document.previewUrl}
          />

          {/* 2. Colour Selection (Matching screenshot style) */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Colour
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onUpdateSettings(document.id, { colorMode: 'bw' })}
                className={`py-3 px-4 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center ${
                  settings.colorMode === 'bw'
                    ? 'bg-[#0e253e] text-white border border-transparent shadow-xs'
                    : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                Black and white
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings(document.id, { colorMode: 'color' })}
                className={`py-3 px-4 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center ${
                  settings.colorMode === 'color'
                    ? 'bg-[#0e253e] text-white border border-transparent shadow-xs'
                    : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                Colour
              </button>
            </div>
          </div>

          {/* 3. Paper Dropdown (Matching screenshot style with dynamic rates) */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Paper
            </label>
            <select
              value={settings.paperSize}
              onChange={(e) => onUpdateSettings(document.id, { paperSize: e.target.value as PaperSize })}
              className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 cursor-pointer shadow-2xs"
            >
              <option value="A4">
                A4 · TZS {getSheetPrice('A4', settings.colorMode)} per sheet
              </option>
              <option value="A3">
                A3 · TZS {getSheetPrice('A3', settings.colorMode)} per sheet
              </option>
              <option value="A5">
                A5 · TZS {getSheetPrice('A5', settings.colorMode)} per sheet
              </option>
              <option value="A6">
                A6 · TZS {getSheetPrice('A6', settings.colorMode)} per sheet
              </option>
            </select>
          </div>

          {/* 4. Orientation (Matching screenshot style) */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Orientation
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onUpdateSettings(document.id, { orientation: 'portrait' })}
                className={`py-3 px-4 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center ${
                  settings.orientation === 'portrait'
                    ? 'bg-[#0e253e] text-white border border-transparent shadow-xs'
                    : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                Portrait
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings(document.id, { orientation: 'landscape' })}
                className={`py-3 px-4 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center ${
                  settings.orientation === 'landscape'
                    ? 'bg-[#0e253e] text-white border border-transparent shadow-xs'
                    : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                Landscape
              </button>
            </div>
          </div>

          {/* 5. Scaling (Matching screenshot style) */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Scaling
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onUpdateSettings(document.id, { scaling: 'fit' })}
                className={`py-3 px-4 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center ${
                  settings.scaling === 'fit'
                    ? 'bg-[#0e253e] text-white border border-transparent shadow-xs'
                    : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                Fit to page
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings(document.id, { scaling: 'actual' })}
                className={`py-3 px-4 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center ${
                  settings.scaling === 'actual'
                    ? 'bg-[#0e253e] text-white border border-transparent shadow-xs'
                    : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                Actual size
              </button>
            </div>
          </div>

          {/* 6. Copies (Matching screenshot style: [-] 1 [+]) */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Copies
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleCopiesChange(-1)}
                className="w-10 h-10 rounded-xl border border-slate-300 bg-white font-bold text-lg text-slate-800 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition cursor-pointer shadow-2xs"
              >
                -
              </button>
              <span className="w-8 text-center font-bold text-base text-slate-900 font-mono">
                {settings.copies || 1}
              </span>
              <button
                type="button"
                onClick={() => handleCopiesChange(1)}
                className="w-10 h-10 rounded-xl border border-slate-300 bg-white font-bold text-lg text-slate-800 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition cursor-pointer shadow-2xs"
              >
                +
              </button>
            </div>
          </div>

          {/* 7. Pages (optional, e.g. 1-3,5) */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Pages (optional, e.g. 1-3,5)
            </label>
            <input
              type="text"
              value={settings.customPageRange}
              onChange={(e) => handlePageRangeChange(e.target.value)}
              placeholder="e.g. 1-3,5"
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-blue-600 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs"
            />
            {settings.customPageRange.trim() && (
              <span className="text-[10px] text-teal-700 font-semibold mt-1 block">
                Kurasa {calculation.totalSelectedPages} kati ya {document.pageCount} zitachapishwa
              </span>
            )}
          </div>

          {/* 8. Single Document Cost Card (Exact design from screenshot!) */}
          <div className="rounded-2xl bg-[#0e253e] text-white p-4 space-y-1 shadow-sm">
            <div className="flex items-baseline justify-between text-xs font-medium">
              <span className="truncate pr-2 max-w-[200px]">
                {document.name} · Pages {calculation.totalSelectedPages} × {settings.copies}
              </span>
              <span className="font-mono font-bold shrink-0">
                TZS {calculation.totalTZS}
              </span>
            </div>

            <div className="text-[11px] text-slate-400">
              × TZS {currentSheetPrice} ({settings.paperSize}, {colorLabelEn})
            </div>

            <div className="border-t border-slate-700/70 pt-2 mt-2">
              <div className="text-2xl font-black font-mono tracking-tight text-white">
                TZS {calculation.totalTZS}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Estimate. Staff confirm the final price.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
