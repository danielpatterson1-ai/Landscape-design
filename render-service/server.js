import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve rendered images
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ===========================
// AI Chat Handler
// ===========================

function generateChatResponse(message, conversationId, photoUrl) {
  // If user uploaded a photo, acknowledge it
  if (photoUrl) {
    const lower = message.toLowerCase();
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return "I can see you've uploaded a photo of your space! That's great. Tell me about your vision — what style are you thinking? Cottage, modern, tropical, or something else? The more you describe, the better I can design it for you.";
    }
    if (lower.includes('garden') || lower.includes('plant') || lower.includes('flower')) {
      return "Looking at your photo, I can see the space has great potential for planting. What kind of plants are you drawn to? Native species, drought-tolerant, or something lush and colorful? Let me know your preferences and I'll suggest a planting plan.";
    }
    if (lower.includes('patio') || lower.includes('paving') || lower.includes('deck') || lower.includes('stone')) {
      return "I can see your yard in the photo. For hardscaping like patios or pathways, consider how you'll use the space — entertaining, quiet retreat, or kid-friendly? Natural stone, pavers, or decking each give a different feel. What's your preference?";
    }
    if (lower.includes('modern') || lower.includes('minimal') || lower.includes('contemporary')) {
      return "Great choice! A modern look would work well with the space in your photo. Think clean lines, architectural plants like grasses or succulents, and maybe some gravel or sleek pavers. Would you like me to suggest a specific layout?";
    }
    if (lower.includes('cottage') || lower.includes('english') || lower.includes('romantic') || lower.includes('colorful')) {
      return "A cottage garden style would look charming in the space from your photo! I'm thinking layered borders with perennials, climbing roses, and a winding path. What's your sun exposure like — is the spot mostly sunny or shaded?";
    }
    if (lower.includes('render') || lower.includes('design') || lower.includes('generate') || lower.includes('create')) {
      return "I'd love to generate a design render for you! Based on the photo you uploaded and what you've described, I'll create a realistic preview. Click the 'Generate My Design' button and I'll work my magic!";
    }
    return "I can see the photo of your space. That's a great starting point! Tell me more about what you'd like to do — any particular style, plants, or features you're considering? The more details you share, the more personalized the design will be.";
  }

  // No photo uploaded yet — generic responses
  const lower = message.toLowerCase();
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "Welcome to DIY Landscape Design! I'm your AI design assistant. To get started, upload a photo of your yard and tell me what you're dreaming of — a cozy garden, modern entertaining space, or something else entirely?";
  }
  if (lower.includes('plant') || lower.includes('flower') || lower.includes('tree')) {
    return "I'd love to help with plant recommendations! Could you upload a photo of your space first? Knowing the light conditions, soil type, and existing layout helps me give you the best advice.";
  }
  return "That sounds like a great idea! To help you visualize it, upload a photo of your yard and I'll use it as the canvas for your design. What kind of look are you going for?";
}

// POST /api/chat
app.post('/api/chat', async (req, res) => {
  try {
    const { conversationId, message, userId, photoUrl } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = generateChatResponse(message, conversationId, photoUrl);
    res.json({ response });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// ===========================
// AI Render Handler
// ===========================

async function generateRender(photoPath, prompt, renderId, userId) {
  // Placeholder — AI/Image Engineer will implement actual image generation
  // For now, just return a placeholder path
  const outputDir = path.join(__dirname, '..', 'uploads', 'renders');
  fs.mkdirSync(outputDir, { recursive: true });
  const placeholderPath = path.join(outputDir, `${renderId}.txt`);
  fs.writeFileSync(placeholderPath, `Render placeholder for: ${prompt}`);
  return `uploads/renders/${renderId}.txt`;
}

// POST /api/render
app.post('/api/render', async (req, res) => {
  try {
    const { photoPath, prompt, renderId, userId } = req.body;
    if (!photoPath || !prompt) {
      return res.status(400).json({ error: 'photoPath and prompt are required' });
    }

    const outputPath = await generateRender(photoPath, prompt, renderId, userId);
    res.json({ outputPath });
  } catch (err) {
    console.error('Render error:', err);
    res.status(500).json({ error: 'Failed to generate render' });
  }
});

// ===========================
// Health check
// ===========================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'AI render service', port: PORT });
});

// ===========================
// Start server
// ===========================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AI Render Service running on http://0.0.0.0:${PORT}`);
});