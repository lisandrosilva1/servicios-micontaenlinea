#!/usr/bin/env node
// Genera las paginas de redireccion para las URLs viejas del sitio Wix.
//
// Por que existe: al migrar de Wix a GitHub Pages las URLs viejas quedaron
// indexadas en Google y empezaron a devolver 404 ("No se ha encontrado (404)"
// en Search Console). GitHub Pages no permite redirecciones 301 del servidor,
// asi que servimos una pagina con <link rel="canonical"> + meta refresh, que
// Google trata como redireccion y consolida la autoridad en la URL nueva.
//
// Uso:  node tools/gen-redirects.mjs
// Fuente de verdad: redirects.json  (NO editar los index.html generados)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.micontaenlinea.mx';
const GA4 = 'G-THLWVWLHXE';

const { redirects } = JSON.parse(readFileSync(join(ROOT, 'redirects.json'), 'utf8'));

const page = (target) => `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redirigiendo… | MiContaEnLinea.mx</title>
    <link rel="canonical" href="${SITE}${target}">
    <meta http-equiv="refresh" content="0; url=${SITE}${target}">
    <script async src="https://www.googletagmanager.com/gtag/js?id=${GA4}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA4}');
      gtag('event', 'redirect_legacy_url', { old_path: location.pathname, new_path: '${target}' });
      location.replace('${target}');
    </script>
    <style>
        body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#fafaf8;color:#2c2c2c;
             display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:2rem;text-align:center}
        a{color:#0D5A8F;font-weight:600}
    </style>
</head>
<body>
    <main>
        <h1 style="font-size:1.25rem;margin-bottom:.75rem">Esta página se movió</h1>
        <p>Te estamos llevando a la nueva dirección.</p>
        <p style="margin-top:1rem"><a href="${target}">Continuar &rarr;</a></p>
    </main>
</body>
</html>
`;

let written = 0;
for (const [from, to] of Object.entries(redirects)) {
    if (!from.startsWith('/') || !to.startsWith('/')) {
        throw new Error(`Rutas invalidas en redirects.json: ${from} -> ${to}`);
    }
    // /book-online  ->  book-online/index.html  (GitHub Pages sirve el index del directorio)
    const dir = join(ROOT, from.replace(/^\//, '').replace(/\/$/, ''));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), page(to), 'utf8');
    written++;
}

console.log(`OK: ${written} redirecciones generadas desde redirects.json`);
