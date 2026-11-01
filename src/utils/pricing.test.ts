import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseSelectedPagesCount,
  calculatePrintPrice,
  DEFAULT_PRICING_RATES,
  formatTZS,
} from './pricing.ts';
import { PrintSettings } from '../types/index.ts';

test('parseSelectedPagesCount handles full range and custom expressions', () => {
  // Empty or invalid range falls back to total pages
  assert.equal(parseSelectedPagesCount('', 10), 10);
  assert.equal(parseSelectedPagesCount('   ', 5), 5);

  // Single page
  assert.equal(parseSelectedPagesCount('3', 10), 1);

  // Range 1-4
  assert.equal(parseSelectedPagesCount('1-4', 10), 4);

  // Mixed range "1-3, 5, 8-10" on 10 page doc = 1,2,3, 5, 8,9,10 => 7 pages
  assert.equal(parseSelectedPagesCount('1-3, 5, 8-10', 10), 7);

  // Clamping to doc boundaries (doc has 6 pages, requested 1-12)
  assert.equal(parseSelectedPagesCount('1-12', 6), 6);
});

test('calculatePrintPrice calculates B&W standard A4 single copy correctly', () => {
  const settings: PrintSettings = {
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
  };

  const result = calculatePrintPrice(settings, 10, DEFAULT_PRICING_RATES);
  // 10 pages * 1 copy * 200 TZS (A4 B&W from user price table) = 2,000 TZS
  assert.equal(result.totalSelectedPages, 10);
  assert.equal(result.totalPagesToPrint, 10);
  assert.equal(result.totalTZS, 2000);
});

test('calculatePrintPrice calculates exact rates for A3, A4, A5, A6', () => {
  const baseSettings: PrintSettings = {
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
  };

  // A3: B&W 300, Colour 500
  assert.equal(calculatePrintPrice({ ...baseSettings, paperSize: 'A3', colorMode: 'bw' }, 1).totalTZS, 300);
  assert.equal(calculatePrintPrice({ ...baseSettings, paperSize: 'A3', colorMode: 'color' }, 1).totalTZS, 500);

  // A4: B&W 200, Colour 300
  assert.equal(calculatePrintPrice({ ...baseSettings, paperSize: 'A4', colorMode: 'bw' }, 1).totalTZS, 200);
  assert.equal(calculatePrintPrice({ ...baseSettings, paperSize: 'A4', colorMode: 'color' }, 1).totalTZS, 300);

  // A5: B&W 100, Colour 200
  assert.equal(calculatePrintPrice({ ...baseSettings, paperSize: 'A5', colorMode: 'bw' }, 1).totalTZS, 100);
  assert.equal(calculatePrintPrice({ ...baseSettings, paperSize: 'A5', colorMode: 'color' }, 1).totalTZS, 200);

  // A6: B&W 50, Colour 100
  assert.equal(calculatePrintPrice({ ...baseSettings, paperSize: 'A6', colorMode: 'bw' }, 1).totalTZS, 50);
  assert.equal(calculatePrintPrice({ ...baseSettings, paperSize: 'A6', colorMode: 'color' }, 1).totalTZS, 100);
});

test('calculatePrintPrice calculates Color with copies and staple correctly', () => {
  const settings: PrintSettings = {
    colorMode: 'color',
    paperSize: 'A4',
    copies: 3,
    pageRangeMode: 'all',
    customPageRange: '',
    orientation: 'portrait',
    scaling: 'fit',
    quality: 'standard',
    isManualDuplex: false,
    manualDuplexConfirmed: false,
    bindingOrStapling: 'staple',
  };

  const result = calculatePrintPrice(settings, 4, DEFAULT_PRICING_RATES);
  // 4 pages * 3 copies = 12 total pages
  // 12 * 300 TZS (A4 Color) = 3,600 TZS
  // Staple = 100 * 3 copies = 300 TZS
  // Total = 3,900 TZS
  assert.equal(result.totalPagesToPrint, 12);
  assert.equal(result.finishingCost, 300);
  assert.equal(result.totalTZS, 3900);
});

test('calculatePrintPrice applies manual duplex discount when confirmed', () => {
  const settings: PrintSettings = {
    colorMode: 'bw',
    paperSize: 'A4',
    copies: 1,
    pageRangeMode: 'all',
    customPageRange: '',
    orientation: 'portrait',
    scaling: 'fit',
    quality: 'standard',
    isManualDuplex: true,
    manualDuplexConfirmed: true,
    bindingOrStapling: 'none',
  };

  const result = calculatePrintPrice(settings, 10, DEFAULT_PRICING_RATES);
  // Base: 10 * 200 = 2,000 TZS
  // 10% discount = 200 TZS
  // Total: 1,800 TZS
  assert.equal(result.discountAmount, 200);
  assert.equal(result.totalTZS, 1800);
});

test('formatTZS formats numbers nicely with commas', () => {
  assert.equal(formatTZS(1500), 'TZS 1,500');
  assert.equal(formatTZS(25000, true), 'Sh 25,000');
});
