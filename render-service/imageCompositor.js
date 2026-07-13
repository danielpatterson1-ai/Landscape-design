/**
 * Image Compositing Pipeline
 * 
 * Takes the user's original yard photo and the generated AI garden render,
 * and composites them together to produce a realistic "after" preview.
 * 
 * Uses Sharp for image processing:
 * - Resize render to match original photo dimensions
 * - Blend render onto original with configurable opacity
 * - Smart edge blending for natural-looking integration
 * - Color correction for consistency
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Composite the generated render onto the original photo
 * @param {string} originalPhotoPath - Absolute path to the user's uploaded photo
 * @param {string} renderPath - Absolute path to the generated AI render
 * @param {object} options - Compositing options
 * @param {number} options.blendOpacity - Opacity of the render overlay (0-1, default: 0.85)
 * @param {boolean} options.preserveExposure - Whether to adjust exposure (default: true)
 * @returns {Promise<string>} Path to the composited output image
 */
export async function compositeImages(originalPhotoPath, renderPath, options = {}) {
  const {
    blendOpacity = 0.85,
    preserveExposure = true
  } = options;

  if (!fs.existsSync(originalPhotoPath)) {
    throw new Error(`Original photo not found: ${originalPhotoPath}`);
  }
  if (!fs.existsSync(renderPath)) {
    throw new Error(`Render image not found: ${renderPath}`);
  }

  // Load images and get metadata
  const original = sharp(originalPhotoPath);
  const render = sharp(renderPath);
  
  const originalMeta = await original.metadata();
  const renderMeta = await render.metadata();

  console.log(`[Composite] Original: ${originalMeta.width}x${originalMeta.height}, Render: ${renderMeta.width}x${renderMeta.height}`);

  // Step 1: Resize render to match original photo dimensions
  // This ensures the overlay fits perfectly over the original
  const resizedRender = await render
    .resize(originalMeta.width, originalMeta.height, {
      fit: 'cover',
      position: 'centre'
    })
    .png()
    .toBuffer();

  // Step 2: If preserving exposure, try to match brightness
  let processedRender = resizedRender;
  if (preserveExposure) {
    processedRender = await matchExposure(originalPhotoPath, resizedRender);
  }

  // Step 3: Composite the render onto the original
  // Using the 'over' blend mode with configurable opacity
  const compositeImage = await sharp(originalPhotoPath)
    .composite([{
      input: processedRender,
      blend: 'over',
      opacity: blendOpacity
    }])
    .png()
    .toBuffer();

  // Step 4: Apply subtle vignette for natural look
  const finalImage = await applyVignette(compositeImage, originalMeta.width, originalMeta.height);

  // Determine output path
  const renderDir = path.dirname(renderPath);
  const renderName = path.basename(renderPath, path.extname(renderPath));
  const outputPath = path.join(renderDir, `${renderName}-composited.png`);

  // Save the result
  await sharp(finalImage).toFile(outputPath);

  console.log(`[Composite] Saved composited image: ${outputPath}`);
  return outputPath;
}

/**
 * Match the render's exposure/brightness to the original photo
 * by sampling brightness levels
 */
async function matchExposure(originalPath, renderBuffer) {
  try {
    // Get average brightness of both images
    const originalStats = await sharp(originalPath)
      .resize(100, 100, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const renderStats = await sharp(renderBuffer)
      .resize(100, 100, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Calculate average pixel values
    const origAvg = averagePixel(originalStats.data);
    const renderAvg = averagePixel(renderStats.data);

    // Calculate exposure adjustment factor
    const adjustFactor = origAvg / renderAvg;
    
    // Only adjust if the difference is significant (>10%)
    if (Math.abs(adjustFactor - 1) > 0.1) {
      console.log(`[Composite] Adjusting exposure by factor ${adjustFactor.toFixed(2)}`);
      
      // Apply gamma adjustment to match brightness
      return await sharp(renderBuffer)
        .gamma(1 / adjustFactor)
        .png()
        .toBuffer();
    }
  } catch (err) {
    console.warn(`[Composite] Exposure matching failed, using render as-is: ${err.message}`);
  }
  
  return renderBuffer;
}

/**
 * Calculate average pixel value from raw image data
 */
function averagePixel(data) {
  let total = 0;
  const count = data.length / 3; // RGB channels
  for (let i = 0; i < data.length; i += 3) {
    total += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  return total / count / 255; // Normalize to 0-1
}

/**
 * Apply a subtle vignette effect for a more natural photographic look
 */
async function applyVignette(imageBuffer, width, height) {
  try {
    // Create a radial gradient vignette
    const vignetteSize = Math.max(width, height);
    
    // SVG for vignette overlay (subtle darkening at edges)
    const vignetteSvg = Buffer.from(
      `<svg width="${width}" height="${height}">
        <defs>
          <radialGradient id="vignette" cx="50%" cy="50%" r="60%">
            <stop offset="40%" stop-color="rgba(0,0,0,0)" />
            <stop offset="100%" stop-color="rgba(0,0,0,0.15)" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#vignette)" />
      </svg>`
    );

    return await sharp(imageBuffer)
      .composite([{
        input: vignetteSvg,
        blend: 'multiply',
        opacity: 0.3
      }])
      .png()
      .toBuffer();
  } catch (err) {
    console.warn(`[Composite] Vignette failed, applying without it: ${err.message}`);
    return imageBuffer;
  }
}

/**
 * Generate a before/after comparison image
 * @param {string} originalPhotoPath - Path to the original photo
 * @param {string} compositedPath - Path to the composited result
 * @returns {Promise<string>} Path to the comparison image
 */
export async function createComparisonImage(originalPhotoPath, compositedPath) {
  const renderDir = path.dirname(compositedPath);
  const outputPath = path.join(renderDir, 'comparison.png');

  const original = sharp(originalPhotoPath);
  const composited = sharp(compositedPath);
  
  const meta = await original.metadata();
  const compMeta = await composited.metadata();
  
  // Resize both to same height for side-by-side
  const targetHeight = Math.min(meta.height || 600, compMeta.height || 600, 800);
  
  const [origBuffer, compBuffer] = await Promise.all([
    original.resize(null, targetHeight).png().toBuffer(),
    composited.resize(null, targetHeight).png().toBuffer()
  ]);

  // Get widths after resize
  const origMeta = await sharp(origBuffer).metadata();
  const compMeta2 = await sharp(compBuffer).metadata();
  
  const totalWidth = (origMeta.width || targetHeight) + (compMeta2.width || targetHeight) + 4; // 4px gap

  // Create side-by-side with label bars
  const svgLabels = Buffer.from(
    `<svg width="${totalWidth}" height="${targetHeight + 40}">
      <rect x="0" y="0" width="${totalWidth}" height="${targetHeight + 40}" fill="#1a1a2e"/>
      <text x="${(origMeta.width || targetHeight) / 2}" y="${targetHeight + 28}" 
            font-family="Arial" font-size="16" fill="white" text-anchor="middle" font-weight="bold">BEFORE</text>
      <text x="${(origMeta.width || targetHeight) + 2 + (compMeta2.width || targetHeight) / 2}" y="${targetHeight + 28}" 
            font-family="Arial" font-size="16" fill="white" text-anchor="middle" font-weight="bold">AFTER</text>
    </svg>`
  );

  const combined = await sharp(svgLabels)
    .composite([
      { input: origBuffer, top: 0, left: 0 },
      { input: compBuffer, top: 0, left: (origMeta.width || targetHeight) + 4 }
    ])
    .png()
    .toFile(outputPath);

  console.log(`[Composite] Saved comparison image: ${outputPath}`);
  return outputPath;
}