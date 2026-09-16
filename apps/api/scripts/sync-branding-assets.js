const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { v2: cloudinary } = require('cloudinary');

const prisma = new PrismaClient();

// Configure Cloudinary from environment
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'jescuj9a',
  api_key: process.env.CLOUDINARY_API_KEY || '951424588114541',
  api_secret: process.env.CLOUDINARY_API_SECRET || '7VewkCRVUG-Gdiy9zcsydISHz_s',
});

const rootDir = path.resolve(__dirname, '../../..');
const headerFile = path.resolve(rootDir, 'apps/web/public/palnadu-logo-horizontal.png');
const footerFile = path.resolve(rootDir, 'apps/web/public/palnadu-logo-white.png');
const faviconFile = path.resolve(rootDir, 'apps/web/public/favicon.png');

async function uploadToCloudinary(filePath, type) {
  const fileBuffer = fs.readFileSync(filePath);
  const stats = fs.statSync(filePath);
  const fileName = path.basename(filePath);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `palnadu/branding/${type}`,
        resource_type: 'image',
        public_id: `${type}_${Date.now()}`,
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Upload failed'));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          size: stats.size,
          originalName: fileName,
          updatedAt: new Date().toISOString(),
        });
      },
    );
    uploadStream.end(fileBuffer);
  });
}

async function main() {
  console.log('--- Syncing Brand Assets to Cloudinary & Database ---');

  console.log('\n[1/3] Uploading Header Logo to Cloudinary...');
  const headerAsset = await uploadToCloudinary(headerFile, 'header');
  console.log(`Header Logo uploaded: ${headerAsset.url}`);

  console.log('\n[2/3] Uploading Footer Logo to Cloudinary...');
  const footerAsset = await uploadToCloudinary(footerFile, 'footer');
  console.log(`Footer Logo uploaded: ${footerAsset.url}`);

  console.log('\n[3/3] Uploading Favicon to Cloudinary...');
  const faviconAsset = await uploadToCloudinary(faviconFile, 'favicon');
  console.log(`Favicon uploaded: ${faviconAsset.url}`);

  // Fetch current setting to preserve other fields
  const current = await prisma.siteSetting.findUnique({ where: { key: 'branding' } });
  const rawCurrent = current?.value || {};

  const updatedConfig = {
    ...rawCurrent,
    headerLogo: headerAsset,
    footerLogo: footerAsset,
    favicon: faviconAsset,
    ogImage: rawCurrent.ogImage || { url: null, publicId: null },
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin@palnadu.dev',
  };

  await prisma.siteSetting.upsert({
    where: { key: 'branding' },
    update: {
      value: updatedConfig,
      updatedBy: 'admin@palnadu.dev',
    },
    create: {
      key: 'branding',
      value: updatedConfig,
      description: 'Active site branding and brandmark assets',
      updatedBy: 'admin@palnadu.dev',
    },
  });

  console.log('\nSuccessfully synchronized siteSetting.branding in MongoDB!');
  console.log(JSON.stringify(updatedConfig, null, 2));
}

main()
  .catch((err) => {
    console.error('Sync failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
