'use strict';
/**
 * GiftCompass MVP server. Node.js 18+ standard library only (no npm installs).
 *
 *   GET  /                 -> web app (public/)
 *   GET  /api/health       -> { ok: true }
 *   GET  /api/options      -> questionnaire options, labels, limits, scoring weights
 *   GET  /api/catalog      -> demo catalogue (clearly marked as demo data)
 *   POST /api/recommend    -> 10-question profile: { relationship, occasion, interests[], personalities[],
 *                             styles[], giftTypes[], wishes, owned, avoid[], minBudget, maxBudget }
 *
 * Privacy: the server is stateless. Questionnaire answers are used only to
 * compute the response and are never written to disk, logged, or shared.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { recommend, LABELS, LIMITS, WEIGHTS } = require('./src/engine');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'catalog.json'), 'utf8'));

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
};

function sendJSON(res, status, body) {
  res.writeHead(status, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store', ...SECURITY_HEADERS });
  res.end(JSON.stringify(body));
}

function readBody(req, limit = 10_000) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    // Oversized bodies are drained (not stored) so the client still gets a clean 413 response.
    req.on('data', (c) => { size += c.length; if (size <= limit) chunks.push(c); });
    req.on('end', () => (size > limit ? reject(new Error('too_large')) : resolve(Buffer.concat(chunks).toString('utf8'))));
    req.on('error', reject);
  });
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', ...SECURITY_HEADERS });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://x');
  try {
    if (pathname === '/api/health' && req.method === 'GET') return sendJSON(res, 200, { ok: true });
    if (pathname === '/api/options' && req.method === 'GET') return sendJSON(res, 200, { labels: LABELS, limits: LIMITS, weights: WEIGHTS });
    if (pathname === '/api/catalog' && req.method === 'GET') return sendJSON(res, 200, catalog);
    if (pathname === '/api/recommend') {
      if (req.method !== 'POST') return sendJSON(res, 405, { ok: false, errors: ['Use POST.'] });
      let body;
      try { body = JSON.parse(await readBody(req)); } catch (e) {
        return sendJSON(res, e.message === 'too_large' ? 413 : 400, { ok: false, errors: ['Invalid request body.'] });
      }
      const out = recommend(catalog.products, body, 5);
      return sendJSON(res, out.ok ? 200 : 422, { ...out, notice: catalog.notice });
    }
    if (pathname.startsWith('/api/')) return sendJSON(res, 404, { ok: false, errors: ['Unknown endpoint.'] });
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    return serveStatic(req, res);
  } catch (e) {
    return sendJSON(res, 500, { ok: false, errors: ['Server error.'] });
  }
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`GiftCompass MVP running at http://localhost:${PORT}`));
}
module.exports = server;
