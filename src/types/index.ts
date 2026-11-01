export type Language = 'sw' | 'en';

export type PaperSize = 'A3' | 'A4' | 'A5' | 'A6' | 'B5' | 'Legal' | 'Letter' | 'Photo_10x15' | 'Envelope_DL';

export type ColorMode = 'bw' | 'color';

export type PrintQuality = 'draft' | 'standard' | 'high';

export type Orientation = 'portrait' | 'landscape';

export type Scaling = 'fit' | 'actual';

export type PaymentMethod = 'counter' | 'mpesa' | 'tigopesa' | 'airtelmoney' | 'halopesa';

export type JobStatus =
  | 'uploaded'
  | 'awaiting_payment'
  | 'payment_confirmed'
  | 'queued'
  | 'printing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface PrintSettings {
  colorMode: ColorMode;
  paperSize: PaperSize;
  copies: number;
  pageRangeMode: 'all' | 'custom';
  customPageRange: string;
  orientation: Orientation;
  scaling: Scaling;
  quality: PrintQuality;
  isManualDuplex: boolean;
  manualDuplexConfirmed: boolean;
  bindingOrStapling: 'none' | 'staple' | 'spiral_binding';
}

export interface PricingRates {
  bwPerPageTZS: number;
  colorPerPageTZS: number;
  paperMultipliers: Record<PaperSize, number>;
  manualDuplexDiscountPercent: number; // e.g. 10% discount on paper when double sided
  stapleCostTZS: number;
  spiralBindingCostTZS: number;
  highQualityPhotoMarkupTZS: number;
}

export interface PriceCalculation {
  totalSelectedPages: number;
  totalPagesToPrint: number; // totalSelectedPages * copies
  basePricePerPage: number;
  paperMultiplier: number;
  printingCost: number;
  finishingCost: number;
  discountAmount: number;
  totalTZS: number;
  breakdown: {
    labelSw: string;
    labelEn: string;
    amountTZS: number;
  }[];
}

export interface DocumentItem {
  id: string;
  name: string;
  sizeBytes: number;
  type: string;
  pageCount: number;
  previewUrl?: string;
  settings: PrintSettings;
  calculation: PriceCalculation;
}

export interface PrintJob {
  id: string; // e.g. "IBN-2026-1042"
  accessToken: string; // Secure random token
  customerName: string;
  customerPhone: string;
  fileName: string;
  fileSizeBytes: number;
  fileType: string;
  fileUrl?: string;
  pageCount: number;
  files?: DocumentItem[];
  settings: PrintSettings;
  pricing: PriceCalculation;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'completed' | 'counter_pending' | 'failed';
  paymentReference?: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  printerJobId?: number;
  errorMessage?: string;
  printerAssigned: string;
}

export interface EpsonPrinterStatus {
  name: string;
  status: 'online' | 'busy' | 'offline' | 'paper_jam' | 'out_of_paper';
  connection: 'wifi' | 'usb';
  ipAddress: string;
  driverName: string;
  queueCount: number;
  blackInkPercent: number;
  cyanInkPercent: number;
  magentaInkPercent: number;
  yellowInkPercent: number;
  paperTrayStatus: 'ready' | 'empty' | 'low';
  lastHeartbeat: string;
  agentVersion: string;
}
