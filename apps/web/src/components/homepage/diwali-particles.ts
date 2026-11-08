import type { Particle, SkyRocket, LightFlash } from './diwali-types';

export function createParticlePool(size = 480): Particle[] {
  return new Array(size).fill(null).map(() => ({
    active: false,
    type: 'anaar',
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    prevX2: 0,
    prevY2: 0,
    vx: 0,
    vy: 0,
    gravity: 0.24,
    drag: 0.988,
    life: 0,
    maxLife: 1,
    size: 1.5,
    color: '#F59E0B',
  }));
}

export function createRocketPool(size = 5): SkyRocket[] {
  return new Array(size).fill(null).map(() => ({
    active: false,
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    vx: 0,
    vy: 0,
    targetY: 0,
    burstScale: 1,
    color: '#FFFBEB',
    palette: ['#FFFFFF', '#FEF08A', '#FDE68A', '#F59E0B', '#D97706'],
  }));
}

export function createFlashPool(size = 4): LightFlash[] {
  return new Array(size).fill(null).map(() => ({
    active: false,
    x: 0,
    y: 0,
    radius: 80,
    maxRadius: 280,
    alpha: 0,
  }));
}

export function spawnParticle(
  pool: Particle[],
  type: 'anaar' | 'rocket_tail' | 'rocket_burst' | 'ember',
  x: number,
  y: number,
  vx: number,
  vy: number,
  gravity: number,
  drag: number,
  life: number,
  size: number,
  color: string
) {
  for (let i = 0; i < pool.length; i++) {
    if (!pool[i].active) {
      const p = pool[i];
      p.active = true;
      p.type = type;
      p.x = x;
      p.y = y;
      p.prevX = x;
      p.prevY = y;
      p.prevX2 = x;
      p.prevY2 = y;
      p.vx = vx;
      p.vy = vy;
      p.gravity = gravity;
      p.drag = drag;
      p.life = life;
      p.maxLife = life;
      p.size = size;
      p.color = color;
      return;
    }
  }
}

export function triggerLightFlash(
  flashes: LightFlash[],
  x: number,
  y: number,
  radius = 280
) {
  for (let i = 0; i < flashes.length; i++) {
    if (!flashes[i].active) {
      flashes[i].active = true;
      flashes[i].x = x;
      flashes[i].y = y;
      flashes[i].radius = 40;
      flashes[i].maxRadius = radius;
      flashes[i].alpha = 0.7;
      return;
    }
  }
}
