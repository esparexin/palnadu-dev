import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

const iconMasterPath = path.resolve(rootDir, 'packages/config/assets/master-icon-square.png');
const logoMasterPath = path.resolve(rootDir, 'packages/config/assets/master-logo-horizontal.png');

const webPublic = path.resolve(rootDir, 'apps/web/public');
const adminPublic = path.resolve(rootDir, 'apps/admin/public');

/**
 * Builds a standard binary MS Windows ICO file containing multiple PNG images.
 * @param {{ width: number, height: number, buffer: Buffer }[]} images
 * @returns {Buffer}
 */
function createIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved (must be 0)
  header.writeUInt16LE(1, 2); // 1 = ICO resource
  header.writeUInt16LE(count, 4); // Number of images

  let offset = 6 + count * 16;
  const dirEntries = [];

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // Color palette (0 = no palette)
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel (32-bit RGBA)
    entry.writeUInt32LE(img.buffer.length, 8); // Size of image data
    entry.writeUInt32LE(offset, 12); // Offset to image data
    dirEntries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...images.map((img) => img.buffer)]);
}

/**
 * Creates high-contrast white text variant of the horizontal logo for dark surfaces.
 * Preserves the square icon mark and green .dev wordmark, while converting cyan text to pure white.
 */
async function createWhiteVariant(sourceBuffer) {
  const { data, info } = await sharp(sourceBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const output = Buffer.from(data);
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * info.channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (a === 0) continue;

      // Wordmark "palnadu" text area (x: 210 to 755, y < 170)
      if (x >= 210 && x < 755 && y < 170) {
        // Cyan pixels -> pure white
        if (b > 80 && r < 120) {
          output[idx] = 255;
          output[idx + 1] = 255;
          output[idx + 2] = 255;
        }
      }

      // Underline beneath "palnadu" (x: 210 to 755, y >= 170)
      if (x >= 210 && x < 755 && y >= 170) {
        if (b > 80 && r < 120) {
          output[idx] = 255;
          output[idx + 1] = 255;
          output[idx + 2] = 255;
        }
      }
    }
  }

  return sharp(output, { raw: info }).png().toBuffer();
}

/**
 * Creates a responsive, scalable SVG container embedding the lossless high-res PNG.
 */
function createSvgWrapper(pngBuffer, width, height) {
  const base64 = pngBuffer.toString('base64');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <image href="data:image/png;base64,${base64}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" />
</svg>
`;
}

async function main() {
  console.log('--- Generating Palnadu.dev Brand Assets ---');
  console.log(`Source Icon: ${iconMasterPath}`);
  console.log(`Source Logo: ${logoMasterPath}`);

  if (!fs.existsSync(iconMasterPath) || !fs.existsSync(logoMasterPath)) {
    throw new Error('Master logo files missing in packages/config/assets/');
  }

  // 1. Process Favicons and App Icons from Square Master
  console.log('\n[1/4] Processing Favicons & App Icons...');
  const icon16 = await sharp(iconMasterPath).resize(16, 16).png().toBuffer();
  const icon32 = await sharp(iconMasterPath).resize(32, 32).png().toBuffer();
  const icon48 = await sharp(iconMasterPath).resize(48, 48).png().toBuffer();
  const icon96 = await sharp(iconMasterPath).resize(96, 96).png().toBuffer();
  const icon180 = await sharp(iconMasterPath).resize(180, 180).png().toBuffer();
  const icon192 = await sharp(iconMasterPath).resize(192, 192).png().toBuffer();
  const icon512 = await sharp(iconMasterPath).resize(512, 512).png().toBuffer();

  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: icon16 },
    { width: 32, height: 32, buffer: icon32 },
    { width: 48, height: 48, buffer: icon48 },
  ]);

  // 2. Process Horizontal Logos (Light & Dark Variants)
  console.log('[2/4] Processing Horizontal Logos & Variants...');
  const logoHorizontalPng = await sharp(logoMasterPath).png().toBuffer();
  const logoWhitePng = await createWhiteVariant(logoHorizontalPng);

  const logoHorizontalSvg = createSvgWrapper(logoHorizontalPng, 1024, 204);
  const logoWhiteSvg = createSvgWrapper(logoWhitePng, 1024, 204);

  // 3. Write Assets to Target Directories
  const targetDirs = [webPublic, adminPublic];
  for (const dir of targetDirs) {
    const dirLabel = dir.includes('apps/web') ? 'apps/web/public' : 'apps/admin/public';
    console.log(`\n[3/4] Writing assets to ${dirLabel}...`);

    fs.writeFileSync(path.join(dir, 'favicon.ico'), icoBuffer);
    fs.writeFileSync(path.join(dir, 'favicon.png'), icon512);
    fs.writeFileSync(path.join(dir, 'favicon-48.png'), icon48);
    fs.writeFileSync(path.join(dir, 'favicon-96.png'), icon96);
    fs.writeFileSync(path.join(dir, 'favicon-192.png'), icon192);
    fs.writeFileSync(path.join(dir, 'apple-touch-icon.png'), icon180);
    fs.writeFileSync(path.join(dir, 'icon-192.png'), icon192);
    fs.writeFileSync(path.join(dir, 'icon-512.png'), icon512);

    fs.writeFileSync(path.join(dir, 'palnadu-logo-horizontal.png'), logoHorizontalPng);
    fs.writeFileSync(path.join(dir, 'logo.png'), logoHorizontalPng);
    fs.writeFileSync(path.join(dir, 'palnadu-logo-white.png'), logoWhitePng);

    fs.writeFileSync(path.join(dir, 'palnadu-logo-horizontal.svg'), logoHorizontalSvg);
    fs.writeFileSync(path.join(dir, 'palnadu-logo-white.svg'), logoWhiteSvg);
  }

  console.log('\n[4/4] Asset generation complete!');
}

main().catch((err) => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
