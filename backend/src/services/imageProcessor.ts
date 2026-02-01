/**
 * Image transformation utilities using Sharp.
 */
import sharp from 'sharp';

/**
 * Flip an image horizontally (mirror effect).
 * @param imageBuffer - The source image as a Buffer
 * @returns Buffer containing the flipped image as PNG
 */
export async function flipHorizontal(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer).flop().png().toBuffer();
}
