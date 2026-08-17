#!/usr/bin/env node
// Verifica el sitio EN VIVO: que ninguna URL del sitemap devuelva 404, que el
// canonical de cada pagina apunte a si misma, y que las redirecciones de las
// URLs viejas (Wix) sigan existiendo.
//
// Uso:  node tools/verify-live.mjs            (verifica https://www.micontaenlinea.mx)
//       node tools/verify-live.mjs http://localhost:8080

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = (process.argv[2] || 'https://www.micontaenlinea.mx').replace(/\/$/, '');

const sitemapUrls = [...readFileSync(join(ROOT, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const { redirects } = JSON.parse(readFileSync(join(ROOT, 'redirects.json'), 'utf8'));

const errors = [];
const toLocal = (u) => BASE + new URL(u).pathname;

async function check(url, { expectCanonical = null, expectRedirectTo = null } = {}) {
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
    const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];

    if (expectCanonical) {
        if (!canonical) errors.push(`${url} -> sin <link rel="canonical">`);
        else if (canonical !== expectCanonical) errors.push(`${url} -> canonical apunta a ${canonical} (esperado ${expectCanonical})`);
    }
    if (expectRedirectTo) {
        const refresh = html.match(/http-equiv="refresh"\s+content="0;\s*url=([^"]+)"/i)?.[1];
        if (!refresh) errors.push(`${url} -> redireccion vieja perdida (sin meta refresh)`);
        else if (!refresh.endsWith(expectRedirectTo)) errors.push(`${url} -> redirige a ${refresh} (esperado ${expectRedirectTo})`);
    }
}

console.log(`Verificando ${BASE} …\n`);

console.log(`1) ${sitemapUrls.length} URLs del sitemap`);
for (const u of sitemapUrls) await check(toLocal(u), { expectCanonical: u });

const legacy = Object.entries(redirects);
console.log(`2) ${legacy.length} redirecciones de URLs viejas`);
for (const [from, to] of legacy) await check(`${BASE}${from}`, { expectRedirectTo: to });

console.log('3) robots.txt y sitemap.xml');
for (const p of ['/robots.txt', '/sitemap.xml']) {
    const res = await fetch(`${BASE}${p}`).catch(() => null);
    if (!res || res.status !== 200) errors.push(`${BASE}${p} -> HTTP ${res ? res.status : 'sin respuesta'}`);
}

if (errors.length) {
    console.error(`\n✗ ${errors.length} problema(s):\n  ${errors.join('\n  ')}`);
    process.exit(1);
}
console.log('\n✓ Todo bien: sin 404, canonicals correctos, redirecciones vivas.');
