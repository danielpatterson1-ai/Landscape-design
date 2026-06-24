/**
 * Prompt Engineering Module
 * 
 * Constructs detailed, vivid prompts for the AI image generation
 * pipeline. Uses a three-part structure:
 * 1. Scene description (from photo + user context)
 * 2. New design elements (from conversation)
 * 3. Photorealism qualifiers
 */

/**
 * Analyze the conversation context to extract design preferences
 * @param {string} conversationContext - User's chat describing their design
 * @returns {object} Parsed design elements
 */
function analyzeConversation(conversationContext) {
  const ctx = conversationContext.toLowerCase();
  
  // Detect yard type
  let yardType = 'backyard';
  if (ctx.includes('front yard') || ctx.includes('front garden')) yardType = 'front yard';
  if (ctx.includes('balcony') || ctx.includes('patio') || ctx.includes('small space')) yardType = 'small space';
  if (ctx.includes('estate') || ctx.includes('large')) yardType = 'large yard';
  
  // Detect style
  let style = 'natural';
  if (ctx.includes('modern') || ctx.includes('minimalist') || ctx.includes('contemporary')) style = 'modern';
  if (ctx.includes('cottage') || ctx.includes('english') || ctx.includes('romantic')) style = 'cottage';
  if (ctx.includes('tropical') || ctx.includes('exotic')) style = 'tropical';
  if (ctx.includes('xeriscape') || ctx.includes('drought') || ctx.includes('desert') || ctx.includes('succulent')) style = 'drought-tolerant';
  if (ctx.includes('japanese') || ctx.includes('zen')) style = 'japanese';
  if (ctx.includes('vegetable') || ctx.includes('kitchen') || ctx.includes('edible')) style = 'edible';
  
  // Detect key features requested
  const features = [];
  if (ctx.includes('path') || ctx.includes('walkway') || ctx.includes('stepping stone')) features.push('pathway');
  if (ctx.includes('patio') || ctx.includes('deck') || ctx.includes('paving')) features.push('patio');
  if (ctx.includes('fence') || ctx.includes('privacy')) features.push('fencing');
  if (ctx.includes('garden bed') || ctx.includes('flower bed') || ctx.includes('border')) features.push('garden-beds');
  if (ctx.includes('tree') || ctx.includes('shade')) features.push('trees');
  if (ctx.includes('water') || ctx.includes('pond') || ctx.includes('fountain')) features.push('water-feature');
  if (ctx.includes('fire pit') || ctx.includes('fireplace')) features.push('fire-pit');
  if (ctx.includes('lighting') || ctx.includes('string light') || ctx.includes('lantern')) features.push('lighting');
  if (ctx.includes('lawn') || ctx.includes('grass')) features.push('lawn');
  if (ctx.includes('gravel') || ctx.includes('mulch') || ctx.includes('stone')) features.push('ground-cover');
  if (ctx.includes('raised bed') || ctx.includes('planter')) features.push('raised-beds');
  if (ctx.includes('pergola') || ctx.includes('arbor') || ctx.includes('trellis')) features.push('structure');
  if (ctx.includes('seating') || ctx.includes('bench') || ctx.includes('chair')) features.push('seating');
  if (ctx.includes('pool') || ctx.includes('spa') || ctx.includes('hot tub')) features.push('pool');
  
  // Detect lighting/atmosphere
  let lighting = 'natural daylight';
  if (ctx.includes('evening') || ctx.includes('sunset') || ctx.includes('twilight')) lighting = 'warm evening light';
  if (ctx.includes('morning') || ctx.includes('sunrise')) lighting = 'soft morning light';
  if (ctx.includes('shade') || ctx.includes('shady')) lighting = 'soft filtered light';
  
  // Detect specific plants mentioned
  const plants = [];
  const plantKeywords = [
    'rose', 'lavender', 'hydrangea', 'hosta', 'fern', 'ornamental grass',
    'succulent', 'cactus', 'agave', 'aloe', 'jasmine', 'clematis',
    'ivy', 'boxwood', 'holly', 'azalea', 'rhododendron', 'peony',
    'daisy', 'tulip', 'daffodil', 'lily', 'iris', 'daylily',
    'maple', 'oak', 'birch', 'dogwood', 'cherry', 'magnolia',
    'pine', 'spruce', 'cedar', 'juniper', 'cypress', 'arborvitae',
    'tomato', 'pepper', 'herb', 'basil', 'mint', 'rosemary', 'thyme'
  ];
  
  for (const plant of plantKeywords) {
    if (ctx.includes(plant)) plants.push(plant);
  }
  
  return { yardType, style, features, lighting, plants };
}

/**
 * Generate a detailed scene description from context
 * @param {object} analysis - Output from analyzeConversation
 * @returns {string} Scene description paragraph
 */
function buildSceneDescription(analysis) {
  const { yardType, lighting, style } = analysis;
  
  const descriptions = {
    'backyard': `A ${style} backyard with a well-maintained lawn and natural garden space`,
    'front yard': `A ${style} front yard with a neat lawn leading up to the entrance`,
    'small space': `A charming small ${style} outdoor space with container-friendly layout`,
    'large yard': `A spacious ${style} landscape with room for multiple garden zones`
  };
  
  return descriptions[yardType] || descriptions['backyard'];
}

/**
 * Build the design elements description
 * @param {object} analysis - Output from analyzeConversation
 * @param {string} rawContext - Original conversation text
 * @returns {string} Design description paragraph
 */
function buildDesignDescription(analysis, rawContext) {
  const { features, plants, style } = analysis;
  const parts = [];
  
  // Style-specific design language
  const styleDescriptions = {
    'modern': 'Clean geometric lines, minimalist planting scheme, architectural focal points',
    'cottage': 'Lush romantic planting, informal clustering, abundant flowers and soft colors',
    'tropical': 'Bold foliage, layered planting, vibrant colors, exotic textures',
    'drought-tolerant': 'Succulents, gravel mulch, Mediterranean plants, water-wise design',
    'japanese': 'Tranquil composition, moss, stone elements, pruned evergreens',
    'edible': 'Productive vegetable beds, herb borders, fruit trees integrated beautifully',
    'natural': 'Organic flowing borders, native plants, wildlife-friendly mixed planting'
  };
  
  parts.push(styleDescriptions[style] || styleDescriptions['natural']);
  
  if (features.length > 0) {
    const featureTexts = {
      'pathway': 'a winding natural stone pathway',
      'patio': 'a welcoming patio seating area',
      'fencing': 'attractive screening or fencing',
      'garden-beds': 'curated garden beds with layered planting',
      'trees': 'carefully positioned specimen trees',
      'water-feature': 'a soothing water feature as a focal point',
      'fire-pit': 'a cozy fire pit seating circle',
      'lighting': 'ambient garden lighting for evening enjoyment',
      'lawn': 'a lush healthy lawn area',
      'ground-cover': 'decorative ground cover materials',
      'raised-beds': 'stylish raised planter beds',
      'structure': 'a garden structure for vertical interest',
      'seating': 'inviting seating areas throughout',
      'pool': 'a sparkling pool integrated into the landscape'
    };
    
    const featureList = features.map(f => featureTexts[f] || f).filter(Boolean);
    if (featureList.length > 0) {
      parts.push('featuring ' + featureList.join(', '));
    }
  }
  
  if (plants.length > 0) {
    parts.push('with ' + plants.join(', ') + ' as key plantings');
  }
  
  return parts.join('. ') + '.';
}

/**
 * Main function: Build a complete generation prompt
 * @param {string} photoUrl - URL of user's original yard photo
 * @param {string} conversationContext - User's design description from chat
 * @returns {string} Complete prompt ready for image generation
 */
function buildPrompt(photoUrl, conversationContext) {
  const analysis = analyzeConversation(conversationContext);
  const sceneDesc = buildSceneDescription(analysis);
  const designDesc = buildDesignDescription(analysis, conversationContext);
  
  // Use the conversation directly to capture specific user requests
  const userRequests = conversationContext.trim();
  
  const prompt = `A photorealistic landscape design transformation of a residential outdoor space.

Original scene: ${sceneDesc}.

User's requested design: ${userRequests}

Design implementation: ${designDesc}

The result should be a beautifully landscaped outdoor space that looks professionally designed and naturally integrated. The plants should look healthy and established, not freshly planted. Colors should be rich and natural. The lighting should feel natural and inviting.

Photorealistic quality. Professional garden photography style. Rich natural colors and textures. Depth of field. Well-composed garden view. No cartoon or illustration style. Warm inviting atmosphere. Realistic plant sizes and proportions.`;

  return prompt;
}

/**
 * Determine optimal image generation settings based on context
 * @param {string} conversationContext - User's design description
 * @returns {object} { size, quality }
 */
function getGenerationSettings(conversationContext) {
  // Default landscape size works well for yard scenes
  return {
    size: '1536x1024',
    quality: 'high'
  };
}

export { buildPrompt, getGenerationSettings, analyzeConversation };