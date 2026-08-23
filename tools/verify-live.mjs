#!/usr/bin/env node
// Verifica el sitio EN VIVO:
//   1. ninguna URL del sitemap devuelve 404 y su canonical apunta a si misma
//   2. las redirecciones de las URLs viejas (Wix) siguen vivas
//   3. robots.txt y sitemap.xml responden
//   4. TODO recurso que las paginas referencian (og:image, favicon, imagenes)
//      responde 200  <-- añadido tras descubrir que og:image apuntaba meses a
//      /logo.png inexistente: sin vista previa al compartir por WhatsApp.
//
// Uso:  node tools/verify-live.mjs [base]      (por defecto produccion)

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = (process.argv[2] || 'https://www.micontaenlinea.mx').replace(/\/$/, '');

const sitemapUrls = [...readFileSync(join(ROOT, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const { redirects } = JSON.parse(readFileSync(join(ROOT, 'redirects.json'), 'utf8'));

const errors = [];
const assets = new Set();
const toLocal = (u) => BASE + new URL(u).pathname;

async function check(url, { expectCanonical = null, expectRedirectTo = null, collectAssets = false } = {}) {
    let res;
    try {
        res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'micontaenlinea-seo-check' } });
    } catch (e) {
        errors.push(`${url} -> no respondio (${e.message})`);
        return;
    }
    if (res.status !== 200) {
        errors.push(`${url} -> HTTP ${res.status} (deberia ser 200)`);
        return;
    }
    const html = await res.text();

    if (expectCanonical) {
        const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
        if (!canonical) errors.push(`${url} -> sin <link rel="canonical">`);
        else if (canonical !== expectCanonical) errors.push(`${url} -> canonical apunta a ${canonical} (esperado ${expectCanonical})`);
    }
    if (expectRedirectTo) {
        const refresh = html.match(/http-equiv="refresh"\s+content="0;\s*url=([^"]+)"/i)?.[1];
        if (!refresh) errors.push(`${url} -> redireccion vieja perdida (sin meta refresh)`);
        else if (!refresh.endsWith(expectRedirectTo)) errors.push(`${url} -> redirige a ${refresh} (esperado ${expectRedirectTo})`);
    }
    if (collectAssets) {
        const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)?.[1];
        if (!ogImage) errors.push(`${url} -> sin og:image (no habra vista previa al compartir)`);
        else assets.add(ogImage);
        for (const m of html.matchAll(/<(?:img[^>]+src|link[^>]+rel="icon"[^>]*href)="([^"]+)"/gi)) {
            const v = m[1];
            if (v.startsWith('data:')) continue;
            if (v.startsWith('http') && !v.includes('micontaenlinea.mx')) continue; // pixeles de terceros
            assets.add(v.startsWith('http') ? v : BASE + (v.startsWith('/') ? v : `/${v}`));
        }
    }
}

console.log(`Verificando ${BASE} …\n`);

console.log(`1) ${sitemapUrls.length} URLs del sitemap`);
for (const u of sitemapUrls) await check(toLocal(u), { expectCanonical: u, collectAssets: true });

const legacy = Object.entries(redirects);
console.log(`2) ${legacy.length} redirecciones de URLs viejas`);
for (const [from, to] of legacy) await check(`${BASE}${from}`, { expectRedirectTo: to });

console.log('3) robots.txt y sitemap.xml');
for (const p of ['/robots.txt', '/sitemap.xml']) {
    const res = await fetch(`${BASE}${p}`).catch(() => null);
    if (!res || res.status !== 200) errors.push(`${BASE}${p} -> HTTP ${res ? res.status : 'sin respuesta'}`);
}

console.log(`4) ${assets.size} recursos referenciados (og:image, favicon, imagenes)`);
for (const a of assets) {
    const url = a.replace('https://www.micontaenlinea.mx', BASE);
    const res = await fetch(url, { redirect: 'follow' }).catch(() => null);
    if (!res || res.status !== 200) errors.push(`${url} -> HTTP ${res ? res.status : 'sin respuesta'} (recurso referenciado en el HTML)`);
}

if (errors.length) {
    console.error(`\n✗ ${errors.length} problema(s):\n  ${errors.join('\n  ')}`);
    process.exit(1);
}
console.log('\n✓ Todo bien: sin 404, canonicals correctos, redirecciones vivas, recursos existentes.');
