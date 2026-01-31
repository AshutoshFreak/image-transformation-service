import sharp from 'sharp';

export async function flipHorizontal(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer).flop().png().toBuffer();
}
