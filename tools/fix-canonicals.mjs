#!/usr/bin/env node
// Normaliza el <head> de toda pagina indexable:
//   - <link rel="canonical"> auto-referencial
//   - <meta property="og:url"> con la URL definitiva
//   - <meta property="og:image"> + twitter:image (vista previa al compartir)
//   - <link rel="icon" href="/favicon.ico">
//
// Por que existe:
//   1. Sin canonical, si el sitio se sirve desde otro host (subdominio viejo,
//      .pages.dev, apex sin www) Google puede indexar el duplicado.
//   2. El og:image apuntaba a /logo.png, que NO existia: compartir el sitio por
//      WhatsApp no mostraba vista previa, y TODO el embudo del negocio es
//      WhatsApp. Ninguna pagina salvo el home tenia siquiera la etiqueta.
//
// Uso:  node tools/fix-canonicals.mjs

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.micontaenlinea.mx';
const OG_IMAGE = `${SITE}/og-image.png`;
const SKIP_DIRS = new Set(['.git', '.github', 'tools', 'node_modules', 'img']);

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
    let changed = false;
    const before = html;

    // og:image roto historico: /logo.png no era una imagen de vista previa valida
    html = html.replace(
        /(<meta\s+property="og:image"\s+content=")[^"]*logo\.png(")/i,
        `$1${OG_IMAGE}$2`
    );

    const add = (tag) => {
        html = html.replace(/([ \t]*<title>)/i, `${tag}\n$1`);
        changed = true;
    };

    if (!/<link\s+rel="canonical"/i.test(html)) add(`    <link rel="canonical" href="${url}">`);
    if (!/<meta\s+property="og:url"/i.test(html)) add(`    <meta property="og:url" content="${url}">`);
    if (!/<meta\s+property="og:image"/i.test(html)) {
        add(`    <meta property="og:image" content="${OG_IMAGE}">`);
        add(`    <meta property="og:image:width" content="1200">`);
        add(`    <meta property="og:image:height" content="630">`);
    }
    if (!/<meta\s+name="twitter:image"/i.test(html)) add(`    <meta name="twitter:image" content="${OG_IMAGE}">`);
    if (!/<link\s+rel="icon"[^>]*favicon\.ico/i.test(html)) add(`    <link rel="icon" href="/favicon.ico" sizes="32x32">`);

    if (changed || html !== before) {
        writeFileSync(file, html, 'utf8');
        fixed++;
        console.log(`  + head normalizado -> ${relative(ROOT, file)}`);
    }
    const now = readFileSync(file, 'utf8');
    if (!/<link\s+rel="canonical"/i.test(now) || !/<meta\s+property="og:image"/i.test(now)) {
        missing.push(relative(ROOT, file));
    }
}

if (missing.length) {
    console.error(`ERROR: paginas sin canonical u og:image:\n  ${missing.join('\n  ')}`);
    process.exit(1);
}
console.log(`OK: ${fixed} pagina(s) corregida(s); todas tienen canonical y og:image.`);
