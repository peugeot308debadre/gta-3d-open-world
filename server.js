import { createServer } from 'http'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { resolve, dirname, extname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = 8011
const PROXY_PREFIX = '/agent/42739'

const distDir = resolve(__dirname, 'dist')
const indexHtml = resolve(distDir, 'index.html')

if (!existsSync(indexHtml)) {
  console.error('❌ dist/index.html not found. Run: npm run build')
  process.exit(1)
}

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const indexContent = readFileSync(indexHtml, 'utf8')

function serveFile(res, filePath) {
  if (!existsSync(filePath)) return false
  const stat = statSync(filePath)
  if (stat.isDirectory()) return false

  const ext = extname(filePath)
  const mime = MIME[ext] || 'application/octet-stream'
  const data = readFileSync(filePath)
  res.writeHead(200, {
    'content-type': mime + (ext === '.js' ? '; charset=utf-8' : ''),
    'cache-control': ext === '.js' || ext === '.css' ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
  })
  res.end(data)
  return true
}

createServer((req, res) => {
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

  // SPA fallback → index.html
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
  res.end(indexContent)
}).listen(PORT, '0.0.0.0', () => {
  console.log(`
  🎮 GTA WORLD Server running!

  → Local:   http://localhost:${PORT}/
  → Proxy:   http://localhost:${PORT}${PROXY_PREFIX}/
  → Public:  https://www.graalnode.com${PROXY_PREFIX}
  `)
})
