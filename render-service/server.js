import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve rendered images
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ===========================
// OpenAI Client
// ===========================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// System prompt for the AI landscape designer
const SYSTEM_PROMPT = `You are a friendly and knowledgeable AI landscape design assistant for DIY Garden Design. 
Your role is to help users design their outdoor spaces by having natural, helpful conversations.

Key behaviors:
- Always be encouraging and enthusiastic about their space
- Ask about their yard conditions (sunlight, soil, climate zone) when relevant
- Suggest specific plants, materials, and layouts based on their preferences
- Reference the uploaded photo of their yard when one is provided
- If they mention a photoURL, acknowledge that you can see their space
- Keep responses conversational but informative (2-4 paragraphs usually)
- When they describe a style, give specific recommendations
- Suggest they click "Generate My Design" to see a visual render after they've described their vision

Styles you can help with: cottage garden, modern/minimalist, tropical, desert/xeriscape, Japanese/zen, English country, Mediterranean, woodland, prairie/native, formal, edible/kitchen garden, pollinator-friendly

Plants you can recommend: appropriate for their described conditions and style
Hardscaping: patios, pathways, decking, pergolas, water features, lighting, fire pits, retaining walls`;

// ===========================
// AI Chat Handler
// ===========================

app.post('/api/chat', async (req, res) => {
  try {
    const { conversationId, message, userId, photoUrl } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build context about the photo if available
    let photoContext = '';
    if (photoUrl) {
      photoContext = `\n\nThe user has uploaded a photo of their yard (available at: ${photoUrl}). Reference this in your response as if you can see their space.`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + photoContext },
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const aiResponse = response.choices[0]?.message?.content || 
      "I'd love to help design your landscape! Tell me more about what you're looking for.";

    res.json({ response: aiResponse });
  } catch (err) {
    console.error('Chat error:', err);
    
    // Fallback if OpenAI fails
    if (err.status === 401) {
      return res.status(500).json({ 
        error: 'AI service configuration error',
        response: "I'm having trouble connecting to my AI brain. Please try again in a moment!"
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate response',
      response: "I'm sorry, I couldn't generate a response right now. Please try again!"
    });
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
  res.json({ 
    status: 'ok', 
    service: 'AI render service', 
    port: PORT,
    ai: process.env.OPENAI_API_KEY ? 'connected' : 'not configured'
  });
});

// ===========================
// Start server
// ===========================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AI Render Service running on http://0.0.0.0:${PORT}`);
  if (!process.env.OPENAI_API_KEY) {
    console.warn('WARNING: OPENAI_API_KEY environment variable is not set! Chat will use fallback responses.');
  } else {
    console.log('OpenAI API key is configured — using GPT-4o-mini for chat.');
  }
});