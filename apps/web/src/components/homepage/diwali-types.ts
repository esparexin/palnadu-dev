export type IntroState = 'intro' | 'transitioning' | 'website';

export interface Particle {
  active: boolean;
  type: 'anaar' | 'rocket_tail' | 'rocket_burst' | 'ember';
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  prevX2: number;
  prevY2: number;
  vx: number;
  vy: number;
  gravity: number;
  drag: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface SkyRocket {
  active: boolean;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  targetY: number;
  burstScale: number;
  color: string;
  palette: string[];
}

export interface LightFlash {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export const anaarColors = [
  '#FFFFFF',
  '#FEF08A',
  '#FDE68A',
  '#F59E0B',
  '#D97706',
  '#EA580C',
];

export const rocketPalettes = [
  ['#FFFFFF', '#FEF08A', '#FDE68A', '#F59E0B', '#D97706'],
  ['#FFFFFF', '#FDE68A', '#1D9E75', '#157C5C', '#F59E0B'],
  ['#FFFFFF', '#FEF08A', '#EA580C', '#D97706', '#F59E0B'],
  ['#FFFFFF', '#FFFBEB', '#FDE68A', '#F59E0B', '#B45309'],
];
