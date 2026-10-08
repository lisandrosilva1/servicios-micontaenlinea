#!/usr/bin/env node
// Avisa a Bing (y Yandex, Naver, Seznam) que hay URLs nuevas o actualizadas.
//
// Por que existe: la mitad del trafico real del sitio llega por Bing, no por
// Google. IndexNow es el unico canal que permite avisarles al instante, y no
// necesita cuenta: basta con la clave y su archivo .txt en la raiz del sitio.
//
// Uso:  node tools/indexnow.mjs                 (manda todas las URLs del sitemap)
//       node tools/indexnow.mjs /guias/x.html   (manda solo esas rutas)

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { key, keyLocation } = JSON.parse(readFileSync(join(ROOT, 'indexnow-key.json'), 'utf8'));
const SITE = 'https://www.micontaenlinea.mx';

const rutas = process.argv.slice(2);
const urlList = rutas.length
    ? rutas.map((r) => (r.startsWith('http') ? r : SITE + (r.startsWith('/') ? r : `/${r}`)))
    : [...readFileSync(join(ROOT, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: 'www.micontaenlinea.mx', key, keyLocation, urlList }),
});

console.log(`IndexNow -> HTTP ${res.status} (${res.status === 200 ? 'aceptado' : res.status === 202 ? 'aceptado, clave en validacion' : 'revisar'})`);
console.log(`${urlList.length} URL(s) enviadas:\n  ${urlList.join('\n  ')}`);
if (res.status >= 400) { console.error(await res.text()); process.exit(1); }
