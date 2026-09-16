import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

const logoMasterPath = path.resolve(rootDir, 'packages/config/assets/master-logo-horizontal.png');
const webPublicOg = path.resolve(rootDir, 'apps/web/public/og.png');

async function main() {
  console.log('--- Generating High-Res OpenGraph Social Card (1200x630) ---');

  const width = 1200;
  const height = 630;

  // Scale logo crisply to 540px width (maintaining 5:1 aspect ratio ~ 108px height)
  const logoBuffer = await sharp(logoMasterPath)
    .resize(540, 108, { fit: 'contain' })
    .png()
    .toBuffer();

  const backgroundSvg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Rich Dark Radial and Linear Gradient Background -->
        <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#020d1a" />
          <stop offset="45%" stop-color="#041b34" />
          <stop offset="100%" stop-color="#010811" />
        </linearGradient>

        <radialGradient id="cyanAmbient" cx="15%" cy="15%" r="65%">
          <stop offset="0%" stop-color="#0084c7" stop-opacity="0.25" />
          <stop offset="60%" stop-color="#0084c7" stop-opacity="0.05" />
          <stop offset="100%" stop-color="#0084c7" stop-opacity="0" />
        </radialGradient>

        <radialGradient id="greenAmbient" cx="85%" cy="85%" r="60%">
          <stop offset="0%" stop-color="#2bb836" stop-opacity="0.20" />
          <stop offset="60%" stop-color="#2bb836" stop-opacity="0.04" />
          <stop offset="100%" stop-color="#2bb836" stop-opacity="0" />
        </radialGradient>

        <linearGradient id="cardBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0084c7" stop-opacity="0.7" />
          <stop offset="50%" stop-color="#ffffff" stop-opacity="0.1" />
          <stop offset="100%" stop-color="#2bb836" stop-opacity="0.7" />
        </linearGradient>

        <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#38BDF8" />
          <stop offset="100%" stop-color="#4ADE80" />
        </linearGradient>
      </defs>

      <!-- Base Canvas Fill -->
      <rect width="${width}" height="${height}" fill="url(#cardBg)" />
      <rect width="${width}" height="${height}" fill="url(#cyanAmbient)" />
      <rect width="${width}" height="${height}" fill="url(#greenAmbient)" />

      <!-- Sleek Container Border -->
      <rect x="28" y="28" width="${width - 56}" height="${height - 56}" rx="24" fill="none" stroke="url(#cardBorder)" stroke-width="1.5" />

      <!-- Top Tag Badge -->
      <g transform="translate(80, 72)">
        <rect width="250" height="34" rx="17" fill="#0084c7" fill-opacity="0.12" stroke="#0084c7" stroke-opacity="0.4" stroke-width="1" />
        <circle cx="20" cy="17" r="4.5" fill="#2bb836" />
        <text x="36" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#BAE6FD" letter-spacing="1.2">ENTERPRISE SOFTWARE &amp; APPS</text>
      </g>

      <!-- Main Catchphrase & Mission -->
      <text x="80" y="278" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="900" fill="#FFFFFF" letter-spacing="-1.2">
        Start With The Problem.
      </text>
      <text x="80" y="336" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="900" fill="url(#textGrad)" letter-spacing="-1.2">
        We Build The Solution.
      </text>

      <!-- Subtitle Description -->
      <text x="80" y="396" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="400" fill="#94A3B8" letter-spacing="0.1">
        High-Performance Web Platforms • Android &amp; iOS Applications • Business Automation Systems
      </text>

      <!-- Core Capabilities Row -->
      <g transform="translate(80, 442)">
        <!-- Pill 1 -->
        <g transform="translate(0, 0)">
          <rect width="180" height="38" rx="10" fill="#FFFFFF" fill-opacity="0.05" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="1" />
          <text x="90" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#F1F5F9" text-anchor="middle">Web Applications</text>
        </g>
        <!-- Pill 2 -->
        <g transform="translate(195, 0)">
          <rect width="190" height="38" rx="10" fill="#FFFFFF" fill-opacity="0.05" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="1" />
          <text x="95" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#F1F5F9" text-anchor="middle">Android &amp; iOS Apps</text>
        </g>
        <!-- Pill 3 -->
        <g transform="translate(400, 0)">
          <rect width="185" height="38" rx="10" fill="#FFFFFF" fill-opacity="0.05" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="1" />
          <text x="92" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#F1F5F9" text-anchor="middle">Business Automation</text>
        </g>
        <!-- Pill 4 -->
        <g transform="translate(600, 0)">
          <rect width="175" height="38" rx="10" fill="#FFFFFF" fill-opacity="0.05" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="1" />
          <text x="87" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#F1F5F9" text-anchor="middle">Cloud Architecture</text>
        </g>
      </g>

      <!-- Bottom Status & Domain Strip -->
      <g transform="translate(80, 545)">
        <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="#38BDF8">
          https://www.palnadu.dev
          <tspan fill="#64748B" font-weight="400">  |  Palnadu Engineering Hub  |  Global Software Delivery</tspan>
        </text>
      </g>
    </svg>
  `;

  // Composite the background with the authentic brand logo positioned at top-left
  const finalOgBuffer = await sharp(Buffer.from(backgroundSvg))
    .composite([
      {
        input: logoBuffer,
        top: 130,
        left: 80,
      },
    ])
    .png({ quality: 95 })
    .toBuffer();

  fs.writeFileSync(webPublicOg, finalOgBuffer);
  console.log(`Saved refreshed OpenGraph card to ${webPublicOg} (${finalOgBuffer.length} bytes)`);
}

main().catch((err) => {
  console.error('Failed to generate OG card:', err);
  process.exit(1);
});
