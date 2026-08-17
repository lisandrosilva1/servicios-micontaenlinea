#!/usr/bin/env node
// Genera sitemap.xml a partir de los archivos HTML que realmente existen.
//
// Por que existe: el sitemap escrito a mano se desincroniza del sitio. Eso fue
// justo lo que rompio la indexacion tras migrar de Wix (el sitemap seguia
// apuntando a URLs del host viejo que ya daban 404). Generarlo desde el disco
// hace imposible listar una URL que no existe.
//
// Uso:  node tools/gen-sitemap.mjs

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.micontaenlinea.mx';
const SKIP_DIRS = new Set(['.git', '.github', 'tools', 'node_modules', 'img', 'gracias']);

// Prioridad por seccion (mayor = mas importante para el negocio)
const priorityFor = (url) => {
    if (url === `${SITE}/`) return '1.0';
    if (url.includes('/servicios/') && url.endsWith('/')) return '0.9';
    if (url.includes('/servicios/')) return '0.9';
    if (url.includes('/guias/')) return '0.8';
    return '0.6';
};
const changefreqFor = (url) => (url === `${SITE}/` ? 'weekly' : 'monthly');

function* walk(dir) {
    for (const entry of readdirSync(dir)) {
        if (SKIP_DIRS.has(entry)) continue;
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) yield* walk(full);
        else if (entry.endsWith('.html')) yield full;
    }
}

const urls = [];
for (const file of walk(ROOT)) {
    const html = readFileSync(file, 'utf8');
    if (html.includes('http-equiv="refresh"')) continue;                       // redireccion
    if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) continue; // noindex
    const rel = relative(ROOT, file);
    if (rel === '404.html') continue;
    urls.push(rel === 'index.html' ? `${SITE}/` : `${SITE}/${rel.replace(/index\.html$/, '')}`);
}

urls.sort((a, b) => (priorityFor(b) + b).localeCompare(priorityFor(a) + a));

const today = new Date().toISOString().slice(0, 10);
const body = urls
    .map((u) => `    <url><loc>${u}</loc><lastmod>${today}</lastmod><changefreq>${changefreqFor(u)}</changefreq><priority>${priorityFor(u)}</priority></url>`)
    .join('\n');

writeFileSync(
    join(ROOT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
    'utf8'
);

console.log(`OK: sitemap.xml con ${urls.length} URLs:\n  ${urls.join('\n  ')}`);
