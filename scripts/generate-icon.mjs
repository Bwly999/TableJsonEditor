import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { writeFileSync } from 'fs';

const svgPath = 'icons/icon.svg';
const icoPath = 'icons/icon.ico';
const sizes = [16, 32, 48, 64, 128, 256];

async function generateIcon() {
  const pngBuffers = await Promise.all(
    sizes.map(size =>
      sharp(svgPath)
        .resize(size, size)
        .png()
        .toBuffer()
    )
  );

  const icoBuffer = await pngToIco(pngBuffers[pngBuffers.length - 1]);
  writeFileSync(icoPath, icoBuffer);
  console.log(`Generated ${icoPath}`);
}

generateIcon().catch(console.error);