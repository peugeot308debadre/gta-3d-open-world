import { createServer } from 'http'
import { readFileSync, existsSync, statSync } from 'fs'
import { resolve, dirname, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = 8012
const PROXY_PREFIX = '/agent/34411'

const distDir = resolve(__dirname, 'dist')
const indexHtml = resolve(distDir, 'index.html')

if (!existsSync(indexHtml)) {
  console.error('❌ dist/index.html not found. Run: npm run build')
  process.exit(1)
}

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
}

// Read HTML and strip crossorigin to avoid CORS issues behind reverse proxy
let indexContent = readFileSync(indexHtml, 'utf8')
indexContent = indexContent.replace(/\s+crossorigin/g, '')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function serveFile(res, filePath) {
  if (!existsSync(filePath)) return false
  const stat = statSync(filePath)
  if (stat.isDirectory()) return false

  const ext = extname(filePath)
  const mime = MIME[ext] || 'application/octet-stream'
  const data = readFileSync(filePath)
  res.writeHead(200, {
    ...CORS_HEADERS,
    'content-type': mime + (ext === '.js' || ext === '.mjs' ? '; charset=utf-8' : ''),
    'cache-control': 'no-cache, no-store, must-revalidate',
  })
  res.end(data)
  return true
}

createServer((req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS)
    res.end()
    return
  }

  let url = req.url.split('?')[0]

  // Strip proxy prefix for internal routing
  if (url.startsWith(PROXY_PREFIX)) {
    url = url.slice(PROXY_PREFIX.length) || '/'
  }

  // Serve static file from dist
  const filePath = resolve(distDir, url.slice(1))
  if (!filePath.startsWith(distDir)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  if (serveFile(res, filePath)) return

  // For asset requests (has extension), return 404
  if (extname(url)) {
    res.writeHead(404, { 'content-type': 'text/plain', ...CORS_HEADERS })
    res.end('Not found')
    return
  }

  // SPA fallback → index.html (no crossorigin, no cache)
  res.writeHead(200, {
    ...CORS_HEADERS,
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-cache, no-store, must-revalidate',
    'pragma': 'no-cache',
    'expires': '0',
  })
  res.end(indexContent)
}).listen(PORT, '0.0.0.0', () => {
  console.log(`
  🎮 GTA WORLD Server running!

  → Local:   http://localhost:${PORT}/
  → Proxy:   http://localhost:${PORT}${PROXY_PREFIX}/
  → Public:  https://www.graalnode.com${PROXY_PREFIX}
  `)
})
