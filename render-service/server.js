/**
 * AI Render Service - Microservice for DIY Landscape Design
 *
 * Matches the API spec in /home/team/shared/API_SPEC.md
 * Called by the main backend at http://localhost:8001
 *
 * Endpoints:
 *   POST /api/render  — Generate a landscape render
 *   POST /api/chat    — Chat with the AI about design
 *   GET  /health      — Health check
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { buildPrompt, getGenerationSettings } from './promptEngine.js';
import { analyzePhoto, formatAnalysisForPrompt, storeAnalysis, getStoredAnalysis } from './photoAnalysis.js';
import { compositeImages, createComparisonImage } from './imageCompositor.js';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.AI_RENDER_PORT || 8001;

// ---------------------------------------------------------------------------
// OpenAI Configuration
// ---------------------------------------------------------------------------
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// Resolve project root (Landscape-design repo)
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', 'Landscape-design');
const RENDERS_DIR = path.join(PROJECT_ROOT, 'uploads', 'renders');
const RENDERS_META_DIR = path.join(__dirname, '..', 'data');
const RENDERS_META_FILE = path.join(RENDERS_META_DIR, 'renders.json');

// Ensure directories exist
if (!fs.existsSync(RENDERS_DIR)) {
  fs.mkdirSync(RENDERS_DIR, { recursive: true });
}
if (!fs.existsSync(RENDERS_META_DIR)) {
  fs.mkdirSync(RENDERS_META_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Data store
// ---------------------------------------------------------------------------
function loadRenders() {
  try {
    if (fs.existsSync(RENDERS_META_FILE)) {
      return JSON.parse(fs.readFileSync(RENDERS_META_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading renders data:', err.message);
  }
  return {};
}

function saveRenders(renders) {
  fs.writeFileSync(RENDERS_META_FILE, JSON.stringify(renders, null, 2));
}

// ---------------------------------------------------------------------------
// Conversation data store
// ---------------------------------------------------------------------------
const CONVERSATIONS_META_FILE = path.join(RENDERS_META_DIR, 'conversations.json');

function loadConversations() {
  try {
    if (fs.existsSync(CONVERSATIONS_META_FILE)) {
      return JSON.parse(fs.readFileSync(CONVERSATIONS_META_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading conversations data:', err.message);
  }
  return {};
}

function saveConversations(conversations) {
  fs.writeFileSync(CONVERSATIONS_META_FILE, JSON.stringify(conversations, null, 2));
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/renders', express.static(RENDERS_DIR));

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-render-service', version: '2.1.0' });
});

// ---------------------------------------------------------------------------
// GET /api/health — OpenAI-connected health check
// ---------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  const aiConnected = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-');
  res.json({
    status: 'ok',
    ai: aiConnected ? 'connected' : 'disconnected'
  });
});

// ---------------------------------------------------------------------------
// POST /api/analyze-photo — Analyze a yard photo for site-specific context
// Request:  { photoPath, userContext }
// Response: { analysis }
// ---------------------------------------------------------------------------
app.post('/api/analyze-photo', (req, res) => {
  const { photoPath, userContext } = req.body;

  if (!photoPath) {
    return res.status(400).json({ error: 'photoPath is required' });
  }

  // Resolve absolute path
  const absolutePath = path.isAbsolute(photoPath)
    ? photoPath
    : path.join(PROJECT_ROOT, photoPath);

  // Check if we already have stored analysis
  let analysis = getStoredAnalysis(absolutePath);

  if (!analysis) {
    // Perform analysis
    analysis = analyzePhoto(absolutePath, userContext || '');
    // Store for future use
    storeAnalysis(absolutePath, analysis);
  }

  // Format as scene description for prompts
  const sceneDescription = formatAnalysisForPrompt(analysis);

  console.log(`[Analysis] Analyzed photo: ${photoPath} → ${analysis.yardType}, ${analysis.estimatedSize}`);

  res.json({
    analysis,
    sceneDescription
  });
});

// ---------------------------------------------------------------------------
// POST /api/composite — Composite render onto original photo
// Request:  { originalPhotoPath, renderPath, blendOpacity }
// Response: { outputPath }
// ---------------------------------------------------------------------------
app.post('/api/composite', async (req, res) => {
  try {
    const { originalPhotoPath, renderPath, blendOpacity } = req.body;

    if (!originalPhotoPath || !renderPath) {
      return res.status(400).json({ error: 'originalPhotoPath and renderPath are required' });
    }

    // Resolve absolute paths
    const resolvePath = (p) => path.isAbsolute(p) ? p : path.join(PROJECT_ROOT, p);
    const absOriginal = resolvePath(originalPhotoPath);
    const absRender = resolvePath(renderPath);

    // Run compositing
    const outputPath = await compositeImages(absOriginal, absRender, {
      blendOpacity: blendOpacity || 0.85
    });

    // Return relative path from project root
    const relativePath = path.relative(PROJECT_ROOT, outputPath);
    console.log(`[Composite] Created: ${relativePath}`);

    res.json({ outputPath: relativePath });
  } catch (err) {
    console.error(`[Composite] Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/comparison — Create before/after comparison image
// Request:  { originalPhotoPath, compositedPath }
// Response: { outputPath }
// ---------------------------------------------------------------------------
app.post('/api/comparison', async (req, res) => {
  try {
    const { originalPhotoPath, compositedPath } = req.body;

    if (!originalPhotoPath || !compositedPath) {
      return res.status(400).json({ error: 'originalPhotoPath and compositedPath are required' });
    }

    const resolvePath = (p) => path.isAbsolute(p) ? p : path.join(PROJECT_ROOT, p);
    const absOriginal = resolvePath(originalPhotoPath);
    const absComposite = resolvePath(compositedPath);

    const outputPath = await createComparisonImage(absOriginal, absComposite);
    const relativePath = path.relative(PROJECT_ROOT, outputPath);

    console.log(`[Comparison] Created: ${relativePath}`);
    res.json({ outputPath: relativePath });
  } catch (err) {
    console.error(`[Comparison] Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/render — Generate a landscape render
// Request:  { photoPath, prompt, renderId, userId }
// Response: { outputPath }
// ---------------------------------------------------------------------------
app.post('/api/render', (req, res) => {
  const { photoPath, prompt, renderId, userId } = req.body;

  // Validate input
  if (!photoPath) {
    return res.status(400).json({ error: 'photoPath is required' });
  }
  if (!prompt || prompt.trim().length < 5) {
    return res.status(400).json({ error: 'prompt is required and must be at least 5 characters' });
  }

  // Use provided renderId or generate one
  const id = renderId || uuidv4();

  // Build the enhanced prompt using prompt engineering
  const enhancedPrompt = buildPrompt(photoPath, prompt);
  const settings = getGenerationSettings(prompt);

  // Determine output filename
  const timestamp = Date.now();
  const filename = `render-${id}-${timestamp}.png`;
  const outputPath = path.join('uploads', 'renders', filename);

  // Store render metadata
  const renderRecord = {
    id,
    userId: userId || null,
    photoPath,
    originalPrompt: prompt,
    enhancedPrompt,
    settings,
    status: 'pending',
    filename,
    outputPath,
    createdAt: new Date().toISOString(),
    completedAt: null,
    error: null
  };

  const renders = loadRenders();
  renders[id] = renderRecord;
  saveRenders(renders);

  console.log(`[Render] Created render job ${id} for user ${userId || 'anonymous'}`);

  // Return the expected response format
  res.json({
    outputPath: outputPath
  });
});

// ---------------------------------------------------------------------------
// POST /api/chat — Chat with the AI about landscape design
// Request:  { conversationId, message, userId }
// Response: { response }
// ---------------------------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  const { conversationId, message, userId } = req.body;

  if (!message || message.trim().length < 2) {
    return res.status(400).json({ error: 'message is required' });
  }

  const convoId = conversationId || uuidv4();

  console.log(`[Chat] Message from user ${userId || 'anonymous'} in conversation ${convoId}: "${message.substring(0, 100)}..."`);

  try {
    // Load or initialize conversation history
    const conversations = loadConversations();
    if (!conversations[convoId]) {
      conversations[convoId] = {
        id: convoId,
        userId: userId || null,
        messages: [
          {
            role: 'system',
            content: `You are a knowledgeable and friendly landscape design assistant for the DIY Garden Design app. 
Your role is to help users plan their outdoor spaces by:
- Asking about their yard (size, sunlight, soil type, existing features)
- Recommending plants suitable for their climate and conditions
- Suggesting design styles (modern, cottage, tropical, native, xeriscape, etc.)
- Providing practical advice on layout, spacing, hardscaping, and maintenance
- Being encouraging and helping them visualize their dream garden
- Keeping responses concise but informative (2-4 paragraphs max)
- Never being pushy about spending money — suggest budget-friendly options

When the user is ready to generate a design, guide them to describe what they want clearly so the AI can create the perfect render.`
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // Add user message to history
    conversations[convoId].messages.push({
      role: 'user',
      content: message
    });
    conversations[convoId].updatedAt = new Date().toISOString();

    // Keep last 20 messages for context window management
    const messagesForApi = conversations[convoId].messages.slice(-20);

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messagesForApi,
      max_tokens: 500,
      temperature: 0.8
    });

    const responseText = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";

    // Add assistant response to history
    conversations[convoId].messages.push({
      role: 'assistant',
      content: responseText
    });
    conversations[convoId].updatedAt = new Date().toISOString();

    saveConversations(conversations);

    console.log(`[Chat] Response to ${convoId}: "${responseText.substring(0, 100)}..."`);

    res.json({
      response: responseText,
      conversationId: convoId
    });
  } catch (err) {
    console.error(`[Chat] OpenAI error: ${err.message}`);
    // Fallback: if OpenAI fails, use keyword matching
    const fallbackResponse = generateFallbackResponse(message);
    res.json({
      response: fallbackResponse,
      conversationId: convoId,
      fallback: true
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/render/:id — Check render status (for internal / agent use)
// ---------------------------------------------------------------------------
app.get('/api/render/:id', (req, res) => {
  const renders = loadRenders();
  const render = renders[req.params.id];

  if (!render) {
    return res.status(404).json({ error: 'Render not found' });
  }

  res.json({
    renderId: render.id,
    status: render.status,
    outputPath: render.outputPath,
    error: render.error,
    createdAt: render.createdAt,
    completedAt: render.completedAt
  });
});

// ---------------------------------------------------------------------------
// POST /api/render/:id/complete — Mark render complete (for agent/worker)
// ---------------------------------------------------------------------------
app.post('/api/render/:id/complete', (req, res) => {
  const renders = loadRenders();
  const render = renders[req.params.id];

  if (!render) {
    return res.status(404).json({ error: 'Render not found' });
  }

  const { error } = req.body;

  if (error) {
    render.status = 'failed';
    render.error = error;
    render.completedAt = new Date().toISOString();
  } else {
    render.status = 'completed';
    render.completedAt = new Date().toISOString();
  }

  saveRenders(renders);
  console.log(`[Render] Completed render ${render.id} with status: ${render.status}`);

  res.json({ status: render.status, outputPath: render.status === 'completed' ? render.outputPath : null });
});

// ---------------------------------------------------------------------------
// GET /api/pending — Get next pending render (for agent/worker)
// ---------------------------------------------------------------------------
app.get('/api/pending', (req, res) => {
  const renders = loadRenders();
  const pending = Object.values(renders).find(r => r.status === 'pending');

  if (!pending) {
    return res.json({ render: null });
  }

  res.json({ render: pending });
});

// ---------------------------------------------------------------------------
// Fallback chat response generation (used when OpenAI is unavailable)
// ---------------------------------------------------------------------------
function generateFallbackResponse(message, conversationId) {
  const lower = message.toLowerCase();

  // Detect design intent and provide helpful responses
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "Hello! I'm your landscape design assistant. Tell me about your outdoor space — what kind of garden or yard are you dreaming of?";
  }

  if (lower.includes('help') || lower.includes('what can you')) {
    return "I can help you design your landscape! Tell me about your yard (size, sunlight, soil) and what you'd like (plants, features, style), and I'll create a photorealistic preview of the new design.";
  }

  if (lower.includes('plant') || lower.includes('flower') || lower.includes('shrub') || lower.includes('tree')) {
    return "Great choices! Plants are the soul of a garden. Could you tell me more about:\n- How much sun does the area get? (full sun, part shade, full shade)\n- What's your soil like? (clay, sandy, loamy)\n- Do you prefer native plants, low-maintenance options, or something specific?\n- Any colors you're drawn to?";
  }

  if (lower.includes('budget') || lower.includes('cost') || lower.includes('price') || lower.includes('cheap')) {
    return "Good landscape design doesn't have to break the bank! Here are some cost-effective ideas:\n- Start with a clear plan (that's what I'm here for!)\n- Use gravel or mulch instead of paving for paths\n- Choose perennial plants that come back year after year\n- Incorporate native plants — they're cheaper and thrive naturally\n- DIY hardscaping projects like simple raised beds\n\nWhat's your approximate budget range?";
  }

  if (lower.includes('small') || lower.includes('tiny') || lower.includes('narrow') || lower.includes('balcony')) {
    return "Small spaces can be incredibly charming! Here are some tips:\n- Use vertical space with trellises, wall planters, and hanging baskets\n- Choose multi-functional elements (bench with storage, foldable furniture)\n- Create depth with layered planting (tall plants at back, short in front)\n- A mirror can make a tiny garden feel twice as big\n- Container gardening for flexibility\n\nWhat are the dimensions of your space?";
  }

  if (lower.includes('shade') || lower.includes('shady') || lower.includes('no sun')) {
    return "Shade gardens can be lush and beautiful! Great shade-loving plants include:\n- Hostas (amazing foliage variety)\n- Ferns (elegant and textural)\n- Astilbe (lovely plumes of flowers)\n- Bleeding heart (delicate spring blooms)\n- Heuchera (colorful foliage)\n- Impatiens (bright flowers even in deep shade)\n\nShade gardens often need less watering too, which is a bonus!";
  }

  if (lower.includes('modern') || lower.includes('contemporary') || lower.includes('minimalist')) {
    return "Modern landscape design is clean, geometric, and architectural. Key elements:\n- Straight lines and defined edges\n- Monochromatic or limited color palette\n- Structural plants like boxwood, ornamental grasses, agave\n- Hardscaping materials: concrete, steel, gravel, dark stone\n- Statement pieces: a single sculptural tree, a water feature, fire pit\n- Minimal but impactful lighting\n\nWould you like me to focus on a particular area — patio, entrance, or whole yard?";
  }

  if (lower.includes('cottage') || lower.includes('english') || lower.includes('romantic')) {
    return "Cottage gardens are delightful! They're informal, abundant, and romantic. Key ingredients:\n- Overflowing flower beds with mixed perennials and annuals\n- Roses, lavender, peonies, foxgloves, and delphiniums\n- Curved paths of stone or gravel\n- A white picket fence or rustic trellis\n- Climbing plants on walls and archways\n- Cozy seating tucked among the flowers\n\nWant help choosing specific plants for your climate zone?";
  }

  if (lower.includes('vegetable') || lower.includes('edible') || lower.includes('garden') || lower.includes('grow food')) {
    return "Edible gardens can be both productive and beautiful! Here's what to consider:\n- Sunlight: most vegetables need 6+ hours of direct sun\n- Raised beds: great for drainage, soil control, and easy access\n- Companion planting: basil with tomatoes, marigolds as pest deterrents\n- Succession planting: plan for continuous harvests\n- Incorporate edible perennials: asparagus, rhubarb, fruit trees, berries\n- Mix ornamentals with edibles for a stunning potager garden\n\nWhat vegetables or herbs are you most excited to grow?";
  }

  if (lower.includes('water') || lower.includes('pond') || lower.includes('fountain') || lower.includes('rain')) {
    return "Water features add tranquility and wildlife to any garden! Options include:\n- Fountains (great for small spaces and patios)\n- Bird baths (simple and charming)\n- Small pond with aquatic plants (can attract frogs and dragonflies)\n- Rain garden: a beautiful, eco-friendly way to manage stormwater\n- Recirculating streams or waterfalls for larger spaces\n\nA water feature doesn't have to be expensive — even a simple ceramic pot fountain can be lovely!";
  }

  if (lower.includes('lawn') || lower.includes('grass')) {
    return "Lawns are wonderful for play and relaxation. Some thoughts:\n- Clover lawns: low-maintenance, stays green, great for pollinators\n- No-mow grass mixes for a natural meadow look\n- If you want traditional lawn, consider fescue blends (drought-tolerant)\n- For small spaces, artificial turf can work well\n- Reduced lawn + more garden beds = less mowing, more beauty\n\nWhat do you use your lawn for — kids playing, lounging, or just for looks?";
  }

  // Default helpful response
  return "That sounds like a wonderful project! To help me design the perfect landscape for you, could you tell me about:\n1. The size and shape of your outdoor space?\n2. How much sunlight does it get?\n3. What styles do you like? (modern, cottage, tropical, native, etc.)\n4. Any must-have features? (patio, fire pit, veggie beds, water feature)\n5. Your general climate or region?\n\nThe more details you share, the better I can visualize your dream garden!";
}

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[AI Render Service] Listening on http://0.0.0.0:${PORT}`);
  console.log(`[AI Render Service] Render output directory: ${RENDERS_DIR}`);
  console.log(`[AI Render Service] API endpoints:`);
  console.log(`  POST /api/render         - Generate render (main endpoint)`);
  console.log(`  POST /api/analyze-photo  - Analyze yard photo for scene context`);
  console.log(`  POST /api/composite      - Composite render onto original photo`);
  console.log(`  POST /api/comparison     - Create before/after comparison image`);
  console.log(`  POST /api/chat           - Chat with AI about design`);
  console.log(`  GET  /api/render/:id     - Check render status`);
  console.log(`  GET  /api/pending        - Get next pending render`);
  console.log(`  POST /api/render/:id/complete - Mark render complete`);
  console.log(`  GET  /health             - Health check`);
});