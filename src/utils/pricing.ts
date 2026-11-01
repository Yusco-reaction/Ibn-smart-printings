import { PaperSize, PricingRates, PrintSettings, PriceCalculation, ColorMode, DocumentItem } from '../types/index.ts';

/**
 * Exact sheet pricing matrix from official stationery price list
 * Karatasi | Nyeusi na nyeupe (B&W) | Rangi (Colour)
 * A3       | 300                    | 500
 * A4       | 200                    | 300
 * A5       | 100                    | 200
 * A6       | 50                     | 100
 */
export const SHEET_PRICE_TABLE: Record<PaperSize, { bw: number; color: number }> = {
  A3: { bw: 300, color: 500 },
  A4: { bw: 200, color: 300 },
  A5: { bw: 100, color: 200 },
  A6: { bw: 50, color: 100 },
  B5: { bw: 200, color: 300 },
  Legal: { bw: 250, color: 400 },
  Letter: { bw: 200, color: 300 },
  Photo_10x15: { bw: 150, color: 300 },
  Envelope_DL: { bw: 150, color: 250 },
};

export function getSheetPrice(paperSize: PaperSize, colorMode: ColorMode): number {
  const table = SHEET_PRICE_TABLE[paperSize] || SHEET_PRICE_TABLE.A4;
  return colorMode === 'color' ? table.color : table.bw;
}

export const DEFAULT_PRICING_RATES: PricingRates = {
  bwPerPageTZS: 200, // 200 TZS per A4 B&W page
  colorPerPageTZS: 300, // 300 TZS per A4 Color page
  paperMultipliers: {
    A3: 1.5,
    A4: 1.0,
    A5: 0.5,
    A6: 0.25,
    B5: 1.0,
    Legal: 1.25,
    Letter: 1.0,
    Photo_10x15: 1.0,
    Envelope_DL: 1.0,
  },
  manualDuplexDiscountPercent: 10, // 10% discount on paper when customer chooses manual double-sided
  stapleCostTZS: 100, // Staple 100 TZS
  spiralBindingCostTZS: 2500, // Spiral binding 2,500 TZS
  highQualityPhotoMarkupTZS: 0,
};

/**
 * Parses a page range string like "1-3, 5, 8-10" and calculates the number of distinct selected pages
 * Clamped between 1 and docPageCount.
 */
export function parseSelectedPagesCount(rangeStr: string, docPageCount: number): number {
  if (!rangeStr || !rangeStr.trim() || docPageCount <= 0) {
    return Math.max(1, docPageCount);
  }

  const selectedPages = new Set<number>();
  const parts = rangeStr.split(',').map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(docPageCount, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          selectedPages.add(i);
        }
      }
    } else {
      const page = parseInt(part, 10);
      if (!isNaN(page) && page >= 1 && page <= docPageCount) {
        selectedPages.add(page);
      }
    }
  }

  return selectedPages.size > 0 ? selectedPages.size : Math.max(1, docPageCount);
}

/**
 * Calculates print job price breakdown in Tanzanian Shillings (TZS)
 * using the exact price table requested by the user.
 */
export function calculatePrintPrice(
  settings: PrintSettings,
  docPageCount: number,
  rates: PricingRates = DEFAULT_PRICING_RATES,
  fileName?: string
): PriceCalculation {
  const safeDocPages = Math.max(1, docPageCount);
  const totalSelectedPages =
    settings.pageRangeMode === 'all' && !settings.customPageRange.trim()
      ? safeDocPages
      : parseSelectedPagesCount(settings.customPageRange, safeDocPages);

  const safeCopies = Math.max(1, Math.min(settings.copies || 1, 500));
  const totalPagesToPrint = totalSelectedPages * safeCopies;

  // Use direct exact sheet price
  const costPerPage = getSheetPrice(settings.paperSize, settings.colorMode);
  let printingCost = costPerPage * totalPagesToPrint;

  // Manual duplex discount (saves paper for customer)
  let discountAmount = 0;
  if (settings.isManualDuplex && settings.manualDuplexConfirmed) {
    discountAmount = Math.round(printingCost * (rates.manualDuplexDiscountPercent / 100));
    printingCost = Math.max(0, printingCost - discountAmount);
  }

  // Finishing options
  let finishingCost = 0;
  if (settings.bindingOrStapling === 'staple') {
    finishingCost += rates.stapleCostTZS * safeCopies;
  } else if (settings.bindingOrStapling === 'spiral_binding') {
    finishingCost += rates.spiralBindingCostTZS * safeCopies;
  }

  const totalTZS = Math.round(printingCost + finishingCost);

  const colorLabel = settings.colorMode === 'color' ? 'Colour' : 'Black and white';
  const colorLabelSw = settings.colorMode === 'color' ? 'Rangi' : 'Nyeusi na nyeupe';

  const breakdown: PriceCalculation['breakdown'] = [
    {
      labelSw: `${fileName ? fileName + ' · ' : ''}Kurasa ${totalSelectedPages} × ${safeCopies} · TZS ${costPerPage} (${settings.paperSize}, ${colorLabelSw})`,
      labelEn: `${fileName ? fileName + ' · ' : ''}Pages ${totalSelectedPages} × ${safeCopies} · TZS ${costPerPage} (${settings.paperSize}, ${colorLabel})`,
      amountTZS: Math.round(printingCost + discountAmount),
    },
  ];

  if (discountAmount > 0) {
    breakdown.push({
      labelSw: `Punguzo la Pande Mbili (Manual Duplex -${rates.manualDuplexDiscountPercent}%)`,
      labelEn: `Manual Duplex Paper Discount (-${rates.manualDuplexDiscountPercent}%)`,
      amountTZS: -discountAmount,
    });
  }

  if (settings.bindingOrStapling === 'staple') {
    breakdown.push({
      labelSw: `Kubana na Pini (Stapling) x ${safeCopies}`,
      labelEn: `Stapling Finishing x ${safeCopies}`,
      amountTZS: rates.stapleCostTZS * safeCopies,
    });
  } else if (settings.bindingOrStapling === 'spiral_binding') {
    breakdown.push({
      labelSw: `Kuweka Jalada la Spesho (Spiral Binding) x ${safeCopies}`,
      labelEn: `Spiral Binding Finishing x ${safeCopies}`,
      amountTZS: rates.spiralBindingCostTZS * safeCopies,
    });
  }

  return {
    totalSelectedPages,
    totalPagesToPrint,
    basePricePerPage: costPerPage,
    paperMultiplier: 1.0,
    printingCost,
    finishingCost,
    discountAmount,
    totalTZS,
    breakdown,
  };
}

/**
 * Calculates cumulative total across multiple documents
 */
export function calculateDocumentsTotal(docs: { calculation: PriceCalculation }[]): {
  grandTotalTZS: number;
  totalSheetsToPrint: number;
  totalSelectedPages: number;
} {
  return docs.reduce(
    (acc, doc) => ({
      grandTotalTZS: acc.grandTotalTZS + doc.calculation.totalTZS,
      totalSheetsToPrint: acc.totalSheetsToPrint + doc.calculation.totalPagesToPrint,
      totalSelectedPages: acc.totalSelectedPages + doc.calculation.totalSelectedPages,
    }),
    { grandTotalTZS: 0, totalSheetsToPrint: 0, totalSelectedPages: 0 }
  );
}

/**
 * Format currency into standard Tanzanian Shillings representation
 * e.g. "TZS 1,500" or "Sh 1,500"
 */
export function formatTZS(amount: number, shortPrefix = false): string {
  const formatted = Math.round(amount).toLocaleString('en-US');
  return shortPrefix ? `Sh ${formatted}` : `TZS ${formatted}`;
}
