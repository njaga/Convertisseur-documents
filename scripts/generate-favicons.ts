import sharp from 'sharp';

const sizes = [16, 32, 48, 64, 128, 256];

async function generateFavicons() {
  const svgBuffer = await sharp('public/favicon.svg').toBuffer();
  
  // Générer les PNG
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(`public/favicon-${size}x${size}.png`);
  }
  
  // Générer l'ICO (combinaison des tailles 16, 32, 48)
  await sharp(svgBuffer)
    .resize(32, 32)
    .toFile('public/favicon.ico');
}

generateFavicons();
