#!/usr/bin/env node
// Asegura que TODA pagina indexable tenga <link rel="canonical"> auto-referencial
// y <meta property="og:url"> con la URL definitiva (https://www.micontaenlinea.mx/...).
//
// Por que existe: sin canonical, cada vez que el sitio se sirve desde otro host
// (subdominio viejo servicios., dominio .pages.dev, apex sin www) Google puede
// indexar el duplicado en vez de la URL buena. Paso obligatorio antes de publicar.
//
// Uso:  node tools/fix-canonicals.mjs

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.micontaenlinea.mx';
const SKIP_DIRS = new Set(['.git', '.github', 'tools', 'node_modules', 'img']);

// Paginas que NO deben llevar canonical auto-referencial:
// - gracias/*  -> son noindex
// - 404.html   -> es noindex
// - redirecciones generadas -> su canonical apunta al destino, no a si mismas
const isRedirectStub = (html) => html.includes('http-equiv="refresh"');
const isNoindex = (html) => /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);

function* walk(dir) {
    for (const entry of readdirSync(dir)) {
        if (SKIP_DIRS.has(entry)) continue;
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) yield* walk(full);
        else if (entry.endsWith('.html')) yield full;
    }
}

const canonicalFor = (file) => {
    const rel = relative(ROOT, file);
    return rel === 'index.html' ? `${SITE}/` : `${SITE}/${rel.replace(/index\.html$/, '')}`;
};

let fixed = 0;
const missing = [];

for (const file of walk(ROOT)) {
    let html = readFileSync(file, 'utf8');
    if (isRedirectStub(html) || isNoindex(html)) continue;

    const url = canonicalFor(file);
    const canonicalTag = `    <link rel="canonical" href="${url}">`;
    const ogTag = `    <meta property="og:url" content="${url}">`;
    let changed = false;

    if (!/<link\s+rel="canonical"/i.test(html)) {
        html = html.replace(/([ \t]*<title>)/i, `${canonicalTag}\n$1`);
        changed = true;
    }
    if (!/<meta\s+property="og:url"/i.test(html)) {
        html = html.replace(/([ \t]*<title>)/i, `${ogTag}\n$1`);
        changed = true;
    }

    if (changed) {
        writeFileSync(file, html, 'utf8');
        fixed++;
        console.log(`  + canonical/og:url -> ${relative(ROOT, file)}`);
    }
    if (!/<link\s+rel="canonical"/i.test(readFileSync(file, 'utf8'))) missing.push(relative(ROOT, file));
}

if (missing.length) {
    console.error(`ERROR: quedaron paginas sin canonical:\n  ${missing.join('\n  ')}`);
    process.exit(1);
}
console.log(`OK: ${fixed} pagina(s) corregida(s); todas las paginas indexables tienen canonical.`);
