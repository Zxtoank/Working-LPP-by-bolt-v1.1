export type CropShape = 'circle' | 'oval' | 'square' | 'rectangle' | 'heart';

export interface User {
  email: string;
  isPremium: boolean;
}

export interface ExportOptions {
  format: 'png' | 'pdf';
  dpi: number;
  premium: boolean;
}