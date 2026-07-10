/**
 * Photo Analysis Module
 * 
 * Analyzes yard photos to extract scene characteristics for site-specific renders.
 * Uses image metadata and filename-based heuristics as a base, with a structured
 * analysis store that the prompt engine uses for context-aware prompt building.
 * 
 * For the MVP, analysis is derived from image metadata and user-provided context.
 * In the future, this will be replaced with OpenAI Vision API calls.
 */

import path from 'path';
import fs from 'fs';

/**
 * Analyze a photo file to extract scene characteristics
 * @param {string} photoPath - Absolute or relative path to the photo
 * @param {string} userContext - Optional user-provided description of their yard
 * @returns {object} Photo analysis result
 */
export function analyzePhoto(photoPath, userContext = '') {
  const result = {
    yardType: null,
    estimatedSize: null,
    features: [],
    dominantColors: [],
    lighting: null,
    perspective: null,
    confidence: 'low',
    source: 'metadata'
  };

  // Try to get image metadata
  const metadata = getImageMetadata(photoPath);
  
  // Determine yard type from path/filename conventions
  result.yardType = detectYardType(photoPath, userContext);
  
  // Estimate size from image dimensions
  result.estimatedSize = estimateSize(metadata, userContext);
  
  // Detect features from user context
  result.features = detectFeatures(userContext);
  
  // Estimate lighting conditions
  result.lighting = detectLighting(userContext);
  
  // Determine perspective (eye-level, top-down, etc.)
  result.perspective = detectPerspective(metadata, userContext);
  
  // Parse colors from context
  result.dominantColors = detectColors(userContext);
  
  return result;
}

/**
 * Read basic image metadata (dimensions, type, size)
 */
function getImageMetadata(photoPath) {
  try {
    const stats = fs.statSync(photoPath);
    return {
      exists: true,
      fileSize: stats.size,
      fileName: path.basename(photoPath),
      ext: path.extname(photoPath).toLowerCase()
    };
  } catch {
    return { exists: false };
  }
}

/**
 * Detect yard type from path and user context
 */
function detectYardType(photoPath, context) {
  const lower = (photoPath + ' ' + context).toLowerCase();
  
  if (lower.includes('front') && (lower.includes('yard') || lower.includes('garden') || lower.includes('house'))) {
    return 'front yard';
  }
  if (lower.includes('back') && (lower.includes('yard') || lower.includes('garden'))) {
    return 'backyard';
  }
  if (lower.includes('side') && (lower.includes('yard') || lower.includes('garden'))) {
    return 'side yard';
  }
  if (lower.includes('balcony') || lower.includes('patio') || lower.includes('deck')) {
    return 'patio/deck';
  }
  if (lower.includes('driveway') || lower.includes('entrance') || lower.includes('walkway')) {
    return 'entrance/driveway';
  }
  
  return 'backyard'; // Default most common
}

/**
 * Estimate size from context clues
 */
function estimateSize(metadata, context) {
  const lower = context.toLowerCase();
  
  if (lower.includes('large') || lower.includes('spacious') || lower.includes('estate') || lower.includes('acre')) {
    return 'large';
  }
  if (lower.includes('small') || lower.includes('tiny') || lower.includes('compact') || lower.includes('narrow') || lower.includes('balcony')) {
    return 'small';
  }
  if (lower.includes('medium') || lower.includes('average') || lower.includes('moderate')) {
    return 'medium';
  }
  
  // Default to medium if unknown
  return 'medium';
}

/**
 * Detect existing features from user context
 */
function detectFeatures(context) {
  const lower = context.toLowerCase();
  const features = [];
  
  const featurePatterns = [
    { keyword: 'lawn', feature: 'lawn' },
    { keyword: 'grass', feature: 'lawn' },
    { keyword: 'patio', feature: 'patio' },
    { keyword: 'deck', feature: 'deck' },
    { keyword: 'fence', feature: 'fence' },
    { keyword: 'wall', feature: 'wall' },
    { keyword: 'tree', feature: 'trees' },
    { keyword: 'bush', feature: 'shrubs' },
    { keyword: 'shrub', feature: 'shrubs' },
    { keyword: 'flower bed', feature: 'garden-beds' },
    { keyword: 'garden bed', feature: 'garden-beds' },
    { keyword: 'path', feature: 'pathway' },
    { keyword: 'walkway', feature: 'pathway' },
    { keyword: 'driveway', feature: 'driveway' },
    { keyword: 'pond', feature: 'water-feature' },
    { keyword: 'pool', feature: 'pool' },
    { keyword: 'shed', feature: 'shed' },
    { keyword: 'garage', feature: 'garage' },
    { keyword: 'pergola', feature: 'pergola' },
    { keyword: 'arbor', feature: 'pergola' },
    { keyword: 'trellis', feature: 'trellis' },
    { keyword: 'raised bed', feature: 'raised-beds' },
    { keyword: 'planter', feature: 'raised-beds' },
    { keyword: 'concrete', feature: 'concrete' },
    { keyword: 'stone', feature: 'stone' },
    { keyword: 'brick', feature: 'brick' },
    { keyword: 'gravel', feature: 'gravel' }
  ];
  
  for (const { keyword, feature } of featurePatterns) {
    if (lower.includes(keyword) && !features.includes(feature)) {
      features.push(feature);
    }
  }
  
  return features;
}

/**
 * Detect lighting conditions from context
 */
function detectLighting(context) {
  const lower = context.toLowerCase();
  
  if (lower.includes('full sun') || lower.includes('sunny') || lower.includes('south-facing')) {
    return 'full sun';
  }
  if (lower.includes('part shade') || lower.includes('partial shade') || lower.includes('morning sun')) {
    return 'partial shade';
  }
  if (lower.includes('full shade') || lower.includes('shady') || lower.includes('no sun') || lower.includes('north-facing')) {
    return 'full shade';
  }
  if (lower.includes('evening') || lower.includes('sunset') || lower.includes('twilight')) {
    return 'warm evening light';
  }
  if (lower.includes('morning') || lower.includes('sunrise')) {
    return 'soft morning light';
  }
  
  return 'natural daylight'; // Default
}

/**
 * Detect perspective from metadata and context
 */
function detectPerspective(metadata, context) {
  const lower = context.toLowerCase();
  
  if (lower.includes('aerial') || lower.includes('bird\'s eye') || lower.includes('top down') || lower.includes('from above')) {
    return 'aerial';
  }
  if (lower.includes('wide angle') || lower.includes('panoramic') || lower.includes('panorama')) {
    return 'wide angle';
  }
  if (lower.includes('close up') || lower.includes('close-up') || lower.includes('detail')) {
    return 'close-up';
  }
  
  return 'eye-level'; // Default outdoor photo perspective
}

/**
 * Detect dominant colors from context
 */
function detectColors(context) {
  const lower = context.toLowerCase();
  const colors = [];
  
  const colorMap = [
    'green', 'brown', 'gray', 'grey', 'white', 'blue', 'red', 
    'yellow', 'pink', 'purple', 'orange', 'black', 'tan', 'beige'
  ];
  
  for (const color of colorMap) {
    if (lower.includes(color)) {
      colors.push(color);
    }
  }
  
  if (colors.length === 0) {
    colors.push('green', 'brown'); // Default yard colors
  }
  
  return colors;
}

/**
 * Format analysis as a readable scene description for prompt context
 */
export function formatAnalysisForPrompt(analysis) {
  const parts = [];
  
  if (analysis.yardType) {
    parts.push(`Yard type: ${analysis.yardType}`);
  }
  if (analysis.estimatedSize) {
    parts.push(`Size: ${analysis.estimatedSize}`);
  }
  if (analysis.features.length > 0) {
    parts.push(`Existing features: ${analysis.features.join(', ')}`);
  }
  if (analysis.lighting) {
    parts.push(`Lighting: ${analysis.lighting}`);
  }
  if (analysis.perspective) {
    parts.push(`Perspective: ${analysis.perspective}`);
  }
  if (analysis.dominantColors.length > 0) {
    parts.push(`Dominant colors: ${analysis.dominantColors.join(', ')}`);
  }
  
  return parts.join('. ');
}

/**
 * Store photo analysis in the analysis store
 */
export function storeAnalysis(photoPath, analysis) {
  const ANALYSIS_STORE = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    '..', 'data', 'photo-analysis.json'
  );
  
  // Ensure directory exists
  const dir = path.dirname(ANALYSIS_STORE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Load existing
  let store = {};
  try {
    if (fs.existsSync(ANALYSIS_STORE)) {
      store = JSON.parse(fs.readFileSync(ANALYSIS_STORE, 'utf-8'));
    }
  } catch { /* ignore */ }
  
  // Store by photo path
  store[photoPath] = {
    analysis,
    analyzedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(ANALYSIS_STORE, JSON.stringify(store, null, 2));
}

/**
 * Retrieve stored analysis for a photo
 */
export function getStoredAnalysis(photoPath) {
  const ANALYSIS_STORE = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    '..', 'data', 'photo-analysis.json'
  );
  
  try {
    if (fs.existsSync(ANALYSIS_STORE)) {
      const store = JSON.parse(fs.readFileSync(ANALYSIS_STORE, 'utf-8'));
      return store[photoPath]?.analysis || null;
    }
  } catch { /* ignore */ }
  
  return null;
}