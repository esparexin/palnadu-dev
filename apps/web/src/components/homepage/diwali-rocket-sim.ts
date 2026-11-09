import type { Particle, SkyRocket, LightFlash } from './diwali-types';
import { rocketPalettes } from './diwali-types';
import { spawnParticle, triggerLightFlash } from './diwali-particles';

export interface RocketLaunchTracker {
  lastLaunchTime: number;
  launchCount: number;
}

export function launchSkyRocket(
  rockets: SkyRocket[],
  currentTime: number,
  tracker: RocketLaunchTracker,
  displayWidth: number,
  displayHeight: number,
  isMobile: boolean
) {
  if (currentTime - tracker.lastLaunchTime <= 2600) return;
  tracker.lastLaunchTime = currentTime;
  tracker.launchCount++;

  for (let i = 0; i < rockets.length; i++) {
    if (!rockets[i].active) {
      const r = rockets[i];
      r.active = true;
      const slot = tracker.launchCount % 3;
      if (slot === 0) {
        r.x = displayWidth * (0.12 + Math.random() * 0.10);
        r.vx = (Math.random() * 2.2 + 1.0) * (isMobile ? 0.75 : 1);
        r.targetY = displayHeight * (isMobile ? 0.22 + Math.random() * 0.14 : 0.14 + Math.random() * 0.14);
        r.burstScale = isMobile ? 1.15 : 1.35;
      } else if (slot === 1) {
        r.x = displayWidth * (0.78 + Math.random() * 0.10);
        r.vx = -(Math.random() * 2.2 + 1.0) * (isMobile ? 0.75 : 1);
        r.targetY = displayHeight * (isMobile ? 0.22 + Math.random() * 0.14 : 0.14 + Math.random() * 0.14);
        r.burstScale = isMobile ? 1.15 : 1.35;
      } else {
        r.x = displayWidth * (0.35 + Math.random() * 0.30);
        r.vx = (Math.random() - 0.5) * (isMobile ? 1.0 : 1.5);
        r.targetY = displayHeight * (isMobile ? 0.18 + Math.random() * 0.12 : 0.11 + Math.random() * 0.14);
        r.burstScale = isMobile ? 1.25 : 1.5;
      }
      r.y = displayHeight + 10;
      r.prevX = r.x;
      r.prevY = r.y;
      r.vy = -(Math.random() * 2.5 + (isMobile ? 13.5 : 18.0));
      r.palette = rocketPalettes[tracker.launchCount % rocketPalettes.length];
      r.color = '#FFFFFF';
      break;
    }
  }
}

export function updateAndRenderRockets(
  rockets: SkyRocket[],
  pool: Particle[],
  flashes: LightFlash[],
  ctx: CanvasRenderingContext2D,
  isMobile: boolean
) {
  for (let i = 0; i < rockets.length; i++) {
    const r = rockets[i];
    if (!r.active) continue;
    r.prevX = r.x;
    r.prevY = r.y;
    r.x += r.vx;
    r.y += r.vy;
    r.vy += isMobile ? 0.13 : 0.11;

    for (let t = 0; t < 3; t++) {
      spawnParticle(
        pool,
        'rocket_tail',
        r.x + (Math.random() - 0.5) * 2.5,
        r.y + 3,
        -r.vx * 0.2 + (Math.random() - 0.5) * 2.0,
        -r.vy * 0.14 + Math.random() * 3.0,
        0.15,
        0.96,
        Math.floor(Math.random() * 12 + 12),
        isMobile ? Math.random() * 2.4 + 1.6 : Math.random() * 2.0 + 1.2,
        Math.random() > 0.35 ? '#FFFFFF' : '#FEF08A'
      );
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(r.prevX, r.prevY);
    ctx.lineTo(r.x, r.y);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = isMobile ? 3.0 : 3.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r.x, r.y, isMobile ? 3.8 : 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FEF08A';
    ctx.fill();
    ctx.restore();

    if (r.y <= r.targetY || r.vy >= -1.0) {
      r.active = false;
      triggerLightFlash(flashes, r.x, r.y, (isMobile ? 180 : 300) * r.burstScale);
      const starCount = Math.floor((isMobile ? 34 : 46) * r.burstScale);
      for (let s = 0; s < starCount; s++) {
        const angle = (s / starCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.32;
        const speed = (Math.random() * 5.5 + 4.0) * (isMobile ? 0.85 : 1.15) * r.burstScale;
        spawnParticle(
          pool,
          'rocket_burst',
          r.x,
          r.y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          0.12,
          0.962,
          Math.floor(Math.random() * 30 + 38),
          isMobile ? Math.random() * 2.6 + 2.4 : Math.random() * 2.4 + 1.8,
          r.palette[s % r.palette.length]
        );
      }
    }
  }
}
