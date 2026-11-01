import React, { useState } from 'react';
import { Eye, ChevronLeft, ChevronRight, Maximize2, X, ZoomIn, FileText, Image as ImageIcon } from 'lucide-react';
import { Orientation, Scaling, ColorMode, PaperSize } from '../types/index.ts';

interface DocumentPreviewProps {
  fileName: string;
  fileType: string;
  pageCount: number;
  orientation: Orientation;
  scaling: Scaling;
  colorMode: ColorMode;
  paperSize: PaperSize;
  customPageRange?: string;
  previewUrl?: string;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  fileName,
  fileType,
  pageCount,
  orientation,
  scaling,
  colorMode,
  paperSize,
  customPageRange = '',
  previewUrl,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);

  const isLandscape = orientation === 'landscape';
  const isColor = colorMode === 'color';
  const isFit = scaling === 'fit';
  const isImage = fileType.startsWith('image/');

  const handlePrevPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPage((prev) => Math.min(pageCount, prev + 1));
  };

  const renderSheetContent = (inZoom = false) => (
    <div
      className={`relative w-full h-full bg-white transition-all duration-300 flex flex-col justify-between overflow-hidden ${
        isFit ? (inZoom ? 'p-6' : 'p-3') : (inZoom ? 'p-2' : 'p-1.5')
      } ${!isColor ? 'grayscale' : ''}`}
    >
      {/* Printable Margin Indicator (when Fit to Page) */}
      {isFit && (
        <div className="absolute inset-1.5 border border-dashed border-slate-300 pointer-events-none rounded-sm" />
      )}

      {/* Top Header Simulation */}
      <div className="relative z-10 flex items-center justify-between border-b pb-1 border-slate-200">
        <div className="flex items-center gap-1.5">
          {isImage ? (
            <ImageIcon className={`w-3 h-3 ${isColor ? 'text-teal-600' : 'text-slate-600'}`} />
          ) : (
            <FileText className={`w-3 h-3 ${isColor ? 'text-blue-600' : 'text-slate-600'}`} />
          )}
          <span className="font-bold text-[9px] text-slate-800 truncate max-w-[130px]">
            {fileName}
          </span>
        </div>
        <span
          className={`text-[8px] font-mono px-1 py-0.2 rounded font-semibold ${
            isColor ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-700'
          }`}
        >
          {paperSize} • {colorMode.toUpperCase()}
        </span>
      </div>

      {/* Sheet Body Simulation */}
      <div className="relative z-10 my-2 flex-1 flex flex-col justify-center space-y-1.5">
        {previewUrl && isImage ? (
          <div className="w-full h-full flex items-center justify-center overflow-hidden rounded bg-slate-50">
            <img
              src={previewUrl}
              alt="Document preview"
              className={`max-h-full max-w-full object-contain ${!isColor ? 'grayscale contrast-125' : ''}`}
            />
          </div>
        ) : (
          <>
            {/* Title bar */}
            <div
              className={`h-2.5 rounded w-3/4 ${
                isColor ? 'bg-gradient-to-r from-blue-600 to-teal-500' : 'bg-slate-700'
              }`}
            />
            
            {/* Paragraph lines */}
            <div className="space-y-1 py-1">
              <div className="h-1 bg-slate-300 rounded w-full" />
              <div className="h-1 bg-slate-300 rounded w-11/12" />
              <div className="h-1 bg-slate-200 rounded w-4/5" />
            </div>

            {/* Simulated Chart or Visual element */}
            <div
              className={`rounded p-1.5 flex items-end gap-1.5 h-10 ${
                isColor ? 'bg-blue-50/70 border border-blue-100' : 'bg-slate-100 border border-slate-200'
              }`}
            >
              <div
                className={`w-3 h-4 rounded-t ${isColor ? 'bg-blue-500' : 'bg-slate-400'}`}
              />
              <div
                className={`w-3 h-7 rounded-t ${isColor ? 'bg-teal-500' : 'bg-slate-600'}`}
              />
              <div
                className={`w-3 h-5 rounded-t ${isColor ? 'bg-amber-400' : 'bg-slate-500'}`}
              />
              <div
                className={`w-3 h-8 rounded-t ${isColor ? 'bg-indigo-500' : 'bg-slate-700'}`}
              />
              <div className="flex-1 flex flex-col justify-center pl-1">
                <span className="text-[7px] font-mono text-slate-500">
                  {isLandscape ? 'Landscape layout' : 'Portrait layout'}
                </span>
                <span className="text-[6.5px] font-semibold text-slate-400">
                  {isFit ? 'Fit to printable area' : '100% actual scale'}
                </span>
              </div>
            </div>

            {/* Additional paragraph lines */}
            <div className="space-y-1 pt-0.5">
              <div className="h-1 bg-slate-300 rounded w-full" />
              <div className="h-1 bg-slate-200 rounded w-2/3" />
            </div>
          </>
        )}
      </div>

      {/* Bottom Footer Simulation */}
      <div className="relative z-10 flex items-center justify-between border-t pt-1 border-slate-200 text-[8px] text-slate-500 font-mono">
        <span>Epson L3250</span>
        <span className="font-bold">
          {currentPage} / {pageCount}
        </span>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-slate-100/90 rounded-2xl p-3 border border-slate-200">
      {/* Preview Header & Controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-bold text-slate-800">
            Preview ya Karatasi (Live Document Preview)
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsZoomModalOpen(true)}
          className="px-2 py-1 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-700 rounded-lg border border-slate-300 flex items-center gap-1 shadow-2xs cursor-pointer"
          title="Zoom Preview"
        >
          <Maximize2 className="w-3 h-3 text-slate-600" />
          <span>Kuza (Zoom)</span>
        </button>
      </div>

      {/* Visual Canvas Area */}
      <div className="relative w-full py-4 bg-slate-200/70 rounded-xl flex items-center justify-center overflow-hidden border border-slate-300/60 shadow-inner">
        {/* Paper Sheet Representation */}
        <div
          className={`bg-white rounded-sm shadow-md transition-all duration-300 border border-slate-300/80 ${
            isLandscape
              ? 'w-56 h-40 max-w-[90%]'
              : 'w-40 h-56 max-w-[70%]'
          }`}
        >
          {renderSheetContent(false)}
        </div>
      </div>

      {/* Page Paging & Layout Attributes */}
      <div className="mt-2.5 flex items-center justify-between text-xs">
        {/* Pager buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={handlePrevPage}
            className="w-6 h-6 rounded-md bg-white border border-slate-300 flex items-center justify-center text-slate-700 disabled:opacity-30 hover:bg-slate-50 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] font-bold text-slate-700">
            {currentPage} / {pageCount}
          </span>
          <button
            type="button"
            disabled={currentPage >= pageCount}
            onClick={handleNextPage}
            className="w-6 h-6 rounded-md bg-white border border-slate-300 flex items-center justify-center text-slate-700 disabled:opacity-30 hover:bg-slate-50 cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live attributes tags */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-300 font-semibold text-slate-700">
            {isLandscape ? 'Mlalo (Landscape)' : 'Wima (Portrait)'}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-300 font-semibold text-slate-700">
            {isFit ? 'Fit' : 'Actual'}
          </span>
        </div>
      </div>

      {/* Zoom / Fullscreen Modal */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 shadow-2xl space-y-3 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="truncate pr-2">
                <span className="font-bold text-sm text-slate-900 block truncate">
                  {fileName}
                </span>
                <span className="text-xs text-slate-500">
                  Ukurasa {currentPage} wa {pageCount} • {paperSize} • {colorMode === 'color' ? 'Rangi' : 'Nyeusi na Nyeupe'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Large paper preview */}
            <div className="bg-slate-200/90 p-4 rounded-xl flex items-center justify-center">
              <div
                className={`bg-white rounded shadow-lg border border-slate-300 ${
                  isLandscape ? 'w-full aspect-[1.414/1]' : 'w-[280px] aspect-[1/1.414]'
                }`}
              >
                {renderSheetContent(true)}
              </div>
            </div>

            {/* Pager in modal */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={handlePrevPage}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 disabled:opacity-40"
                >
                  Nyuma
                </button>
                <span className="text-xs font-mono font-bold">
                  {currentPage} / {pageCount}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= pageCount}
                  onClick={handleNextPage}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 disabled:opacity-40"
                >
                  Mbele
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
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
