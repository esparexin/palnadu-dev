import type { Particle, LightFlash } from './diwali-types';
import { anaarColors } from './diwali-types';
import { spawnParticle } from './diwali-particles';

export function emitAnaarSparks(
  pool: Particle[],
  currentTime: number,
  displayWidth: number,
  displayHeight: number,
  isMobile: boolean
) {
  const leftNozzleX = displayWidth * (isMobile ? 0.13 : 0.15);
  const rightNozzleX = displayWidth * (isMobile ? 0.87 : 0.85);
  const nozzleY = displayHeight - (isMobile ? 54 : 68);

  const cycleTime = (currentTime % 7000) / 7000;
  let leftIntensity = 0.5;
  let rightIntensity = 0.5;

  if (cycleTime < 0.45) {
    leftIntensity = 1.6;
    rightIntensity = 0.5;
  } else if (cycleTime < 0.5) {
    leftIntensity = 1.0;
    rightIntensity = 1.0;
  } else if (cycleTime < 0.95) {
    leftIntensity = 0.5;
    rightIntensity = 1.6;
  } else {
    leftIntensity = 1.7;
    rightIntensity = 1.7;
  }

  if (Math.random() > 0.88) {
    leftIntensity *= 1.25;
    rightIntensity *= 1.25;
  }

  const leftSparks = Math.floor(leftIntensity * (isMobile ? 2.5 : 2.8));
  for (let i = 0; i < leftSparks; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.44;
    const speed = (Math.random() * 8.5 + 6.5) * (isMobile ? 0.88 : 1) * (0.8 + 0.35 * leftIntensity);
    spawnParticle(
      pool,
      'anaar',
      leftNozzleX,
      nozzleY,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      0.25,
      0.988,
      Math.floor(Math.random() * 25 + 35),
      isMobile ? Math.random() * 1.8 + 1.8 : Math.random() * 1.6 + 1.2,
      anaarColors[Math.floor(Math.random() * anaarColors.length)]
    );
  }

  const rightSparks = Math.floor(rightIntensity * (isMobile ? 2.5 : 2.8));
  for (let i = 0; i < rightSparks; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.44;
    const speed = (Math.random() * 8.5 + 6.5) * (isMobile ? 0.88 : 1) * (0.8 + 0.35 * rightIntensity);
    spawnParticle(
      pool,
      'anaar',
      rightNozzleX,
      nozzleY,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      0.25,
      0.988,
      Math.floor(Math.random() * 25 + 35),
      isMobile ? Math.random() * 1.8 + 1.8 : Math.random() * 1.6 + 1.2,
      anaarColors[Math.floor(Math.random() * anaarColors.length)]
    );
  }
}

export function renderLightFlashes(flashes: LightFlash[], ctx: CanvasRenderingContext2D) {
  for (let i = 0; i < flashes.length; i++) {
    const f = flashes[i];
    if (!f.active) continue;
    f.radius += (f.maxRadius - f.radius) * 0.35;
    ctx.save();
    const flashGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
    flashGrad.addColorStop(0, `rgba(255, 255, 255, ${f.alpha})`);
    flashGrad.addColorStop(0.25, `rgba(254, 240, 138, ${f.alpha * 0.65})`);
    flashGrad.addColorStop(0.65, `rgba(245, 158, 11, ${f.alpha * 0.25})`);
    flashGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = flashGrad;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    f.alpha -= 0.07;
    if (f.alpha <= 0) f.active = false;
  }
}

export function updateAndRenderParticles(
  pool: Particle[],
  ctx: CanvasRenderingContext2D,
  delta: number,
  displayWidth: number,
  displayHeight: number
) {
  ctx.save();
  for (let i = 0; i < pool.length; i++) {
    const p = pool[i];
    if (!p.active) continue;
    const step = delta / 16.6;
    p.prevX2 = p.prevX;
    p.prevY2 = p.prevY;
    p.prevX = p.x;
    p.prevY = p.y;
    p.x += p.vx * step;
    p.y += p.vy * step;
    p.vx *= p.drag;
    p.vy += p.gravity * step;
    p.life -= step;

    if (p.life <= 0 || p.y > displayHeight + 25 || p.x < -30 || p.x > displayWidth + 30) {
      if (p.type === 'ember') {
        p.active = true;
        p.x = Math.random() * displayWidth;
        p.y = displayHeight + 10;
        p.prevX = p.x;
        p.prevY = p.y;
        p.prevX2 = p.x;
        p.prevY2 = p.y;
        p.vx = (Math.random() - 0.5) * 0.4;
        p.vy = -(Math.random() * 0.6 + 0.3);
        p.life = Math.floor(Math.random() * 120 + 80);
        p.maxLife = p.life;
      } else {
        p.active = false;
        continue;
      }
    }

    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.size;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.prevX, p.prevY);
    if (p.type === 'rocket_burst') ctx.lineTo(p.prevX2, p.prevY2);
    ctx.stroke();

    if (p.type === 'rocket_burst' && alpha > 0.35) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.65, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
