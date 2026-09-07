/**
 * ==============================================================================
 * PALNADU.DEV — SINGLE SOURCE OF TRUTH (SSOT) COLOR PALETTE
 * ==============================================================================
 * Any modification to the website color system MUST originate from here.
 * Do not hardcode arbitrary hex codes in consuming apps.
 */

export interface ColorToken {
  name: string;
  hex: string;
  rgb: [number, number, number];
  hsl: [number, number, number];
  description: string;
}

export const palnaduColors = {
  // Primary Colors (Use Most)
  primaryDark: {
    name: 'Primary Dark',
    hex: '#042C53',
    rgb: [4, 44, 83] as [number, number, number],
    hsl: [210, 91, 17] as [number, number, number],
    description: 'Headings, main text, dark sections',
  },
  primaryBlue: {
    name: 'Primary Blue',
    hex: '#185FA5',
    rgb: [24, 95, 165] as [number, number, number],
    hsl: [210, 75, 37] as [number, number, number],
    description: 'Buttons, links, accents, mark',
  },
  accentTeal: {
    name: 'Accent Teal',
    hex: '#1D9E75',
    rgb: [29, 158, 117] as [number, number, number],
    hsl: [161, 69, 37] as [number, number, number],
    description: 'Secondary buttons, highlights, call-to-action',
  },

  // Neutral / Background Colors
  lightBlue: {
    name: 'Light Blue',
    hex: '#E6F1FB',
    rgb: [230, 241, 251] as [number, number, number],
    hsl: [209, 68, 94] as [number, number, number],
    description: 'Light backgrounds, card backgrounds',
  },
  offWhite: {
    name: 'Off White',
    hex: '#F1EFE8',
    rgb: [241, 239, 232] as [number, number, number],
    hsl: [47, 23, 93] as [number, number, number],
    description: 'Subtle backgrounds, card fills',
  },
  white: {
    name: 'White',
    hex: '#FFFFFF',
    rgb: [255, 255, 255] as [number, number, number],
    hsl: [0, 0, 100] as [number, number, number],
    description: 'Main background, content areas',
  },

  // Text Colors
  bodyText: {
    name: 'Body Text',
    hex: '#5F5E5A',
    rgb: [95, 94, 90] as [number, number, number],
    hsl: [48, 3, 36] as [number, number, number],
    description: 'Paragraph text, descriptions',
  },
  secondaryText: {
    name: 'Secondary Text',
    hex: '#888780',
    rgb: [136, 135, 128] as [number, number, number],
    hsl: [52, 3, 52] as [number, number, number],
    description: 'Captions, fine print, secondary info',
  },
  border: {
    name: 'Border Color',
    hex: '#D3D1C7',
    rgb: [211, 209, 199] as [number, number, number],
    hsl: [50, 13, 80] as [number, number, number],
    description: 'Lines, dividers, subtle separation',
  },

  // Accents & Highlights
  success: {
    name: 'Success / Positive',
    hex: '#1D9E75',
    rgb: [29, 158, 117] as [number, number, number],
    hsl: [161, 69, 37] as [number, number, number],
    description: 'Positive state, success messages',
  },
  error: {
    name: 'Error / Negative',
    hex: '#D84040',
    rgb: [216, 64, 64] as [number, number, number],
    hsl: [0, 66, 55] as [number, number, number],
    description: 'Form errors, alert badges',
  },
  warning: {
    name: 'Warning',
    hex: '#F59E0B',
    rgb: [245, 158, 11] as [number, number, number],
    hsl: [38, 92, 50] as [number, number, number],
    description: 'Pending state, warnings',
  },
  info: {
    name: 'Info',
    hex: '#185FA5',
    rgb: [24, 95, 165] as [number, number, number],
    hsl: [210, 75, 37] as [number, number, number],
    description: 'Informational badges, alerts',
  },
} as const;

/**
 * Raw Hex Lookup for convenience
 */
export const palnaduHex = {
  primaryDark: palnaduColors.primaryDark.hex,
  primaryBlue: palnaduColors.primaryBlue.hex,
  accentTeal: palnaduColors.accentTeal.hex,
  lightBlue: palnaduColors.lightBlue.hex,
  offWhite: palnaduColors.offWhite.hex,
  white: palnaduColors.white.hex,
  bodyText: palnaduColors.bodyText.hex,
  secondaryText: palnaduColors.secondaryText.hex,
  border: palnaduColors.border.hex,
  success: palnaduColors.success.hex,
  error: palnaduColors.error.hex,
  warning: palnaduColors.warning.hex,
  info: palnaduColors.info.hex,
} as const;

/**
 * Shared Tailwind Palette Map
 * Ready to merge into tailwind theme.extend.colors
 */
export const palnaduTailwindColors = {
  palnadu: {
    dark: palnaduColors.primaryDark.hex,
    blue: palnaduColors.primaryBlue.hex,
    teal: palnaduColors.accentTeal.hex,
    'light-blue': palnaduColors.lightBlue.hex,
    'off-white': palnaduColors.offWhite.hex,
    white: palnaduColors.white.hex,
    body: palnaduColors.bodyText.hex,
    secondary: palnaduColors.secondaryText.hex,
    border: palnaduColors.border.hex,
    success: palnaduColors.success.hex,
    error: palnaduColors.error.hex,
    warning: palnaduColors.warning.hex,
    info: palnaduColors.info.hex,
  },
};
