// Genera las capturas de presentacion/img/ recorriendo la web (Florencia + Martín).
// Las imagenes NO se versionan (contienen PII de leads reales).
// Requisitos: la web corriendo en localhost:5173 + API en :3001, y puppeteer-core.
//   npm i puppeteer-core   (o: cd a una carpeta con puppeteer-core)
// Uso: node scripts/gen-screenshots.mjs
import puppeteer from 'puppeteer-core';
import { mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(REPO, 'presentacion', 'img');
const BASE = process.env.WEB_URL || 'http://localhost:5173';
mkdirSync(OUT, { recursive: true });

const CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium',
];
const exe = CANDIDATES.find((p) => existsSync(p));
if (!exe) { console.error('No se encontró Chrome/Edge'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox'], defaultViewport: { width: 1440, height: 920, deviceScaleFactor: 2 } });

async function login(page, u, p) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('input[placeholder="Usuario"]');
  await page.type('input[placeholder="Usuario"]', u);
  await page.type('input[placeholder="Contraseña"]', p);
  await page.click('form button[type="submit"], form button');
  await page.waitForFunction(() => location.pathname === '/', { timeout: 8000 });
  await sleep(2500);
}
async function nav(page, path) { await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle0' }); await sleep(1800); }
const shot = (page, name) => page.screenshot({ path: join(OUT, `${name}.png`) }).then(() => console.log('shot', name));

const c1 = await browser.createBrowserContext(); const p1 = await c1.newPage();
await p1.setViewport({ width: 1440, height: 920, deviceScaleFactor: 2 });
await p1.goto(`${BASE}/login`, { waitUntil: 'networkidle0' }); await sleep(800); await shot(p1, '00-login');
await login(p1, 'florencia', 'flor123'); await shot(p1, '01-dashboard');
for (const [path, name] of [['/leads', '02-leads'], ['/pedidos', '03-pedidos'], ['/clientes', '04-clientes'], ['/stock', '05-stock'], ['/ventas', '06-ventas']]) { await nav(p1, path); await shot(p1, name); }
await c1.close();

const c2 = await browser.createBrowserContext(); const p2 = await c2.newPage();
await p2.setViewport({ width: 1440, height: 920, deviceScaleFactor: 2 });
await login(p2, 'martin', 'martin123'); await shot(p2, '07-dashboard-logistica');
await nav(p2, '/pedidos'); await shot(p2, '08-pedidos-logistica');
await c2.close();

await browser.close();
console.log('OK -> ' + OUT);
