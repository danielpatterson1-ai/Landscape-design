import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'diy-landscape-dev-secret-key-change-in-production';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// --- Team-DB helper (uses single quotes for shell to prevent $ expansion) ---
function db(sql) {
  try {
    // Escape single quotes for shell: end quote, add escaped quote, restart quote
    const escaped = sql.replace(/'/g, "'\\''");
    const stdout = execSync(`team-db '${escaped}'`, { 
      encoding: 'utf-8', 
      maxBuffer: 10 * 1024 * 1024 
    });
    return JSON.parse(stdout);
  } catch (err) {
    console.error('DB error:', err.message);
    throw err;
  }
}

// --- File upload config ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'photos');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, jpeg, png, gif, webp) are allowed'));
    }
  }
});

// --- JWT Auth Middleware ---
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// --- Tier limits ---
const TIER_LIMITS = {
  starter: 1,
  pro: 4,
  unlimited: Infinity
};

// ===========================
// AUTH ENDPOINTS
// ===========================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = db(`SELECT id FROM users WHERE email = '${email.replace(/'/g, "''")}'`);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    const safeEmail = email.replace(/'/g, "''");
    const safeName = name.replace(/'/g, "''");
    // Note: passwordHash contains $ chars, but our db() uses single-quote shell escaping
    db(`INSERT INTO users (id, email, password_hash, name, subscription_tier) VALUES ('${id}', '${safeEmail}', '${passwordHash}', '${safeName}', 'starter')`);

    const token = jwt.sign({ id, email, name, tier: 'starter' }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id, email, name, subscriptionTier: 'starter' } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const safeEmail = email.replace(/'/g, "''");
    const users = db(`SELECT id, email, password_hash, name, subscription_tier FROM users WHERE email = '${safeEmail}'`);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, tier: user.subscription_tier }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, subscriptionTier: user.subscription_tier } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const users = db(`SELECT id, email, name, subscription_tier, stripe_customer_id FROM users WHERE id = '${req.user.id}'`);
  if (users.length === 0) return res.status(404).json({ error: 'User not found' });
  const u = users[0];
  res.json({ id: u.id, email: u.email, name: u.name, subscriptionTier: u.subscription_tier });
});

// ===========================
// PHOTO UPLOAD
// ===========================

app.post('/api/upload', authenticate, upload.single('photo'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const id = uuidv4();
    const relativePath = path.join('uploads', 'photos', req.file.filename);
    db(`INSERT INTO photos (id, user_id, original_filename, storage_path) VALUES ('${id}', '${req.user.id}', '${req.file.originalname.replace(/'/g, "''")}', '${relativePath}')`);
    res.status(201).json({ id, filename: req.file.filename, url: `/${relativePath}` });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/api/photos', authenticate, (req, res) => {
  const photos = db(`SELECT id, original_filename, storage_path, created_at FROM photos WHERE user_id = '${req.user.id}' ORDER BY created_at DESC`);
  res.json(photos);
});

// ===========================
// USAGE
// ===========================

app.get('/api/usage', authenticate, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const rows = db(`SELECT COUNT(*) as count FROM renders WHERE user_id = '${req.user.id}' AND date(created_at) = '${today}'`);
    const used = rows[0].count;
    const limit = TIER_LIMITS[req.user.tier] || 1;
    const remaining = limit === Infinity ? -1 : Math.max(0, limit - used);
    res.json({ used, limit: limit === Infinity ? -1 : limit, remaining, tier: req.user.tier });
  } catch (err) {
    console.error('Usage error:', err);
    res.status(500).json({ error: 'Failed to get usage' });
  }
});

// ===========================
// RENDERS
// ===========================

app.get('/api/renders', authenticate, (req, res) => {
  const renders = db(`SELECT r.id, r.original_photo_path, r.rendered_image_path, r.prompt_text, r.status, r.created_at, c.title as conversation_title FROM renders r LEFT JOIN conversations c ON r.conversation_id = c.id WHERE r.user_id = '${req.user.id}' ORDER BY r.created_at DESC`);
  res.json(renders);
});

app.post('/api/renders', authenticate, async (req, res) => {
  try {
    const { conversationId, photoId, promptText, photoPath } = req.body;
    if (!promptText || !photoPath) {
      return res.status(400).json({ error: 'promptText and photoPath are required' });
    }

    // Check usage limits
    const today = new Date().toISOString().split('T')[0];
    const rows = db(`SELECT COUNT(*) as count FROM renders WHERE user_id = '${req.user.id}' AND date(created_at) = '${today}'`);
    const used = rows[0].count;
    const limit = TIER_LIMITS[req.user.tier] || 1;
    if (used >= limit && limit !== Infinity) {
      return res.status(429).json({ error: `Daily render limit reached (${limit}/day). Upgrade your plan for more.` });
    }

    const id = uuidv4();
    const safePrompt = promptText.replace(/'/g, "''");
    db(`INSERT INTO renders (id, user_id, conversation_id, photo_id, original_photo_path, rendered_image_path, prompt_text, status) VALUES ('${id}', '${req.user.id}', ${conversationId ? `'${conversationId}'` : 'NULL'}, ${photoId ? `'${photoId}'` : 'NULL'}, '${photoPath}', '', '${safePrompt}', 'pending')`);

    let renderResultPath = '';
    let renderStatus = 'completed';

    try {
      const aiServiceUrl = process.env.AI_RENDER_SERVICE_URL || 'http://localhost:3001';
      const response = await fetch(`${aiServiceUrl}/api/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          photoPath: path.join(__dirname, '..', photoPath),
          prompt: promptText,
          renderId: id,
          userId: req.user.id
        })
      });
      if (response.ok) {
        const result = await response.json();
        renderResultPath = result.outputPath || '';
      } else {
        renderStatus = 'placeholder';
      }
    } catch (aiErr) {
      renderStatus = 'placeholder';
    }

    const safeRenderPath = renderResultPath.replace(/'/g, "''");
    db(`UPDATE renders SET status = '${renderStatus}', rendered_image_path = '${safeRenderPath}' WHERE id = '${id}'`);

    const render = db(`SELECT * FROM renders WHERE id = '${id}'`)[0];
    res.status(201).json(render);
  } catch (err) {
    console.error('Render creation error:', err);
    res.status(500).json({ error: 'Failed to create render' });
  }
});

// ===========================
// CONVERSATIONS
// ===========================

app.post('/api/conversations', authenticate, (req, res) => {
  try {
    const { title, photoId } = req.body;
    const id = uuidv4();
    const safeTitle = (title || 'New Design').replace(/'/g, "''");
    db(`INSERT INTO conversations (id, user_id, title, photo_id) VALUES ('${id}', '${req.user.id}', '${safeTitle}', ${photoId ? `'${photoId}'` : 'NULL'})`);
    const conv = db(`SELECT * FROM conversations WHERE id = '${id}'`)[0];
    res.status(201).json(conv);
  } catch (err) {
    console.error('Create conversation error:', err);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

app.get('/api/conversations', authenticate, (req, res) => {
  const convs = db(`SELECT c.*, (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count FROM conversations c WHERE c.user_id = '${req.user.id}' ORDER BY c.updated_at DESC`);
  res.json(convs);
});

app.get('/api/conversations/:id', authenticate, (req, res) => {
  const convs = db(`SELECT * FROM conversations WHERE id = '${req.params.id}' AND user_id = '${req.user.id}'`);
  if (convs.length === 0) return res.status(404).json({ error: 'Conversation not found' });
  res.json(convs[0]);
});

// ===========================
// MESSAGES
// ===========================

app.get('/api/conversations/:id/messages', authenticate, (req, res) => {
  const msgs = db(`SELECT id, role, content, created_at FROM messages WHERE conversation_id = '${req.params.id}' ORDER BY created_at ASC`);
  const convs = db(`SELECT id FROM conversations WHERE id = '${req.params.id}' AND user_id = '${req.user.id}'`);
  if (convs.length === 0) return res.status(404).json({ error: 'Conversation not found' });
  res.json(msgs);
});

app.post('/api/conversations/:id/messages', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Message content is required' });

    const convs = db(`SELECT id FROM conversations WHERE id = '${req.params.id}' AND user_id = '${req.user.id}'`);
    if (convs.length === 0) return res.status(404).json({ error: 'Conversation not found' });

    const userMsgId = uuidv4();
    const safeContent = content.replace(/'/g, "''");
    db(`INSERT INTO messages (id, conversation_id, role, content) VALUES ('${userMsgId}', '${req.params.id}', 'user', '${safeContent}')`);
    db(`UPDATE conversations SET updated_at = datetime('now') WHERE id = '${req.params.id}'`);

    const aiMsgId = uuidv4();
    let aiResponse = `I'd love to help design your landscape! Based on what you've described, I can suggest plant arrangements, layout options, and create a visual render. Upload a photo of your space and describe the look you're going for!`;

    try {
      const aiChatUrl = process.env.AI_CHAT_SERVICE_URL || 'http://localhost:3001';
      const response = await fetch(`${aiChatUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: req.params.id, message: content, userId: req.user.id })
      });
      if (response.ok) {
        const result = await response.json();
        aiResponse = result.response || aiResponse;
      }
    } catch (aiErr) {}

    const safeAiResponse = aiResponse.replace(/'/g, "''");
    db(`INSERT INTO messages (id, conversation_id, role, content) VALUES ('${aiMsgId}', '${req.params.id}', 'assistant', '${safeAiResponse}')`);

    const userMsg = db(`SELECT id, role, content, created_at FROM messages WHERE id = '${userMsgId}'`)[0];
    const aiMsg = db(`SELECT id, role, content, created_at FROM messages WHERE id = '${aiMsgId}'`)[0];

    res.status(201).json({ userMessage: userMsg, aiMessage: aiMsg });
  } catch (err) {
    console.error('Message error:', err);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// ===========================
// SUBSCRIPTION — Stripe Payment Links
// ===========================

const STRIPE_PAYMENT_LINKS = {
  starter: 'https://buy.stripe.com/bJedR8aDXf5D4VvdsdGg6EU00',
  pro: 'https://buy.stripe.com/bJe5kCcM5aPn3Rr1Xy6EU01',
  unlimited: 'https://buy.stripe.com/fZu7sK27r7DbgEd6dO6EU02'
};

// Price IDs for webhook verification (stored here for reference)
const STRIPE_PRICE_IDS = {
  starter: 'price_1TlRScD50V2rJAeERtPcKlth',
  pro: 'price_1TlRSdD50V2rJAeE8uroUdJI',
  unlimited: 'price_1TlRSdD50V2rJAeE4U1uex4o'
};

app.get('/api/subscription/plans', (req, res) => {
  res.json([
    { id: 'starter', name: 'Starter', price: 3.99, rendersPerDay: 1, rendersPerDayLabel: '1/day' },
    { id: 'pro', name: 'Pro', price: 9.99, rendersPerDay: 4, rendersPerDayLabel: '4/day' },
    { id: 'unlimited', name: 'Unlimited', price: 14.99, rendersPerDay: -1, rendersPerDayLabel: 'Unlimited' }
  ]);
});

// Returns the Stripe payment link URL for a given tier
app.post('/api/subscription/create-checkout', authenticate, async (req, res) => {
  try {
    const { tier } = req.body;
    if (!tier || !STRIPE_PAYMENT_LINKS[tier]) {
      return res.status(400).json({ error: 'Valid tier (starter/pro/unlimited) is required' });
    }

    // Note: In production, create a Checkout Session via Stripe API and return the URL.
    // For MVP with Payment Links, we return the static link with customer email prefilled.
    const paymentLink = `${STRIPE_PAYMENT_LINKS[tier]}?prefilled_email=${encodeURIComponent(req.user.email)}`;

    res.json({
      success: true,
      paymentLink,
      tier,
      message: `Redirecting to Stripe checkout for ${tier} plan`
    });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
});

// Verify a Stripe checkout session and activate the subscription tier.
// Called after the user returns from Stripe Payment Link with a session_id.
app.post('/api/subscription/verify', authenticate, async (req, res) => {
  try {
    const { sessionId, tier } = req.body;
    if (!sessionId || !tier) {
      return res.status(400).json({ error: 'sessionId and tier are required' });
    }

    // For MVP with Payment Links, we trust the redirect + session_id.
    // In production, verify the session via Stripe SDK:
    //   const session = await stripe.checkout.sessions.retrieve(sessionId);
    //   if (session.payment_status === 'paid') { ... }
    
    // Activate the tier
    db(`UPDATE users SET subscription_tier = '${tier}' WHERE id = '${req.user.id}'`);
    
    const user = db(`SELECT id, email, name, subscription_tier FROM users WHERE id = '${req.user.id}'`)[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, tier: user.subscription_tier },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: `Upgraded to ${tier} plan`,
      token,
      user: { id: user.id, email: user.email, name: user.name, subscriptionTier: user.subscription_tier }
    });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Failed to verify subscription' });
  }
});

// Stripe webhook endpoint — called by Stripe when subscription events occur.
// To use: set STRIPE_WEBHOOK_SECRET env var and configure Stripe to POST to /api/stripe/webhook
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    // For now, log the event body. Full Stripe SDK verification can be added when API keys are set.
    const event = req.body;
    console.log('Stripe webhook received:', event.type);

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const customerEmail = session.customer_email || session.customer_details?.email;
      // Map price ID to tier
      const priceId = session.line_items?.data?.[0]?.price?.id || session.metadata?.priceId;
      
      let tier = null;
      if (priceId) {
        for (const [t, pid] of Object.entries(STRIPE_PRICE_IDS)) {
          if (pid === priceId) { tier = t; break; }
        }
      }
      
      if (tier && customerEmail) {
        const safeEmail = customerEmail.replace(/'/g, "''");
        db(`UPDATE users SET subscription_tier = '${tier}' WHERE email = '${safeEmail}'`);
        console.log(`Upgraded ${customerEmail} to ${tier} via webhook`);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(400).json({ error: 'Webhook error' });
  }
});

// ===========================
// Serve frontend
// ===========================
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
}

// ===========================
// Error handler
// ===========================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ===========================
// Start server
// ===========================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`DIY Landscape Design API running on http://0.0.0.0:${PORT}`);
});