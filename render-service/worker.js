/**
 * Render Worker - Processes pending renders
 * 
 * This script polls the render service for pending jobs and processes them.
 * Since the actual image generation requires agent tools (generate_image),
 * this script documents the flow and can be extended.
 * 
 * Manual processing flow (done by AI agent):
 * 1. GET /api/pending to get next pending render
 * 2. Read the render's prompt field
 * 3. Call generate_image tool with the prompt
 * 4. Save image to render-output/ with the render's filename
 * 5. POST /api/render/:id/complete with { filename }
 * 
 * For CLI usage (if generate_image becomes available as a CLI):
 *  node src/worker.js
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

const API_BASE = process.env.API_BASE || 'http://localhost:3001';
const RENDERS_DIR = path.join(__dirname, '..', '..', '..', 'home', 'team', 'shared', 'render-output');

function apiGet(endpoint) {
  return new Promise((resolve, reject) => {
    http.get(`${API_BASE}${endpoint}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function apiPost(endpoint, body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: endpoint,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function processNextRender() {
  try {
    const { render } = await apiGet('/api/pending');
    if (!render) {
      console.log('[Worker] No pending renders');
      return false;
    }
    
    console.log(`[Worker] Found pending render: ${render.id}`);
    console.log(`[Worker] Prompt: ${render.prompt.substring(0, 200)}...`);
    console.log(`[Worker] Expected filename: ${render.filename}`);
    console.log(`[Worker] To process: run generate_image tool with the prompt above,`);
    console.log(`[Worker] then POST /api/render/${render.id}/complete with { filename: "${render.filename}" }`);
    
    return true;
  } catch (err) {
    console.error('[Worker] Error:', err.message);
    return false;
  }
}

// If run directly
if (require.main === module) {
  console.log('[Worker] Checking for pending renders...');
  processNextRender().then(found => {
    if (!found) console.log('[Worker] Queue empty.');
  });
}

module.exports = { processNextRender, apiGet, apiPost };