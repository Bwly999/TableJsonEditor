import sharp from 'sharp';
import { writeFileSync } from 'fs';

const svgPath = 'icons/icon.svg';
const icoPath = 'icons/icon.ico';
const sizes = [16, 32, 48, 64, 128, 256];

/**
 * Build a multi-size ICO file manually.
 * ICO format: header (6 bytes) + directory entries (16 bytes each) + PNG image data.
 * We store images as PNG inside ICO (Vista+ format), which supports 256x256.
 */
async function generateIcon() {
  // Generate PNG buffers for all sizes
  const pngBuffers = await Promise.all(
    sizes.map(size =>
      sharp(svgPath)
        .resize(size, size)
        .png()
        .toBuffer()
    )
  );

  // Build ICO binary
  const imageCount = pngBuffers.length;

  // ICO header: reserved(2) + type(2) + count(2)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);   // reserved
  header.writeUInt16LE(1, 2);   // type = ICO
  header.writeUInt16LE(imageCount, 4);

  // Directory entries: 16 bytes each
  const entries = [];
  let dataOffset = 6 + imageCount * 16;

  for (let i = 0; i < imageCount; i++) {
    const size = sizes[i];
    const buf = pngBuffers[i];
    const entry = Buffer.alloc(16);
    // Width/Height: 0 means 256 for ICO format
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);       // color palette
    entry.writeUInt8(0, 3);       // reserved
    entry.writeUInt16LE(1, 4);    // color planes
    entry.writeUInt16LE(32, 6);   // bits per pixel
    entry.writeUInt32LE(buf.length, 8);  // image data size
    entry.writeUInt32LE(dataOffset, 12); // image data offset
    entries.push(entry);
    dataOffset += buf.length;
  }

  const ico = Buffer.concat([header, ...entries, ...pngBuffers]);
  writeFileSync(icoPath, ico);
  console.log(`Generated ${icoPath} with sizes: ${sizes.join(', ')}`);
}

generateIcon().catch(console.error);