#!/usr/bin/env python3
"""Emits each guide's JSON-LD as a static tag, built from the FAQ on the page.

Two problems this fixes on `guias/que-es-resico.html`:

1. Its JSON-LD was created by JavaScript at runtime — `document.createElement`
   plus `el.type = 'application/ld+json'`. It was never in the served HTML. The
   two sibling guides ship theirs statically, and they sit at positions 17.8 and
   22.7 while this one sits at 67.1. That is not proof of causation, but it is
   the only structural difference between the three, and it costs nothing to fix.

2. Its four marked questions were not the five on the page, and two were worded
   differently ("¿Quién puede estar en RESICO?" in markup, "¿Quién puede estar
   en el régimen RESICO?" on the page). Marked-up text that does not appear on
   the page earns nothing and risks a structured-data action.

So the questions are READ OUT OF THE PAGE. They cannot drift, and a question
cannot exist in only one of the two halves.

    python3 tools/gen-schema.py
"""
import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

FAQ_ITEM = re.compile(
    r'<div class="faq-item"><div class="faq-question"><span>(.*?)</span>'
    r'<span>\+</span></div><div class="faq-answer">(.*?)</div></div>',
    re.S,
)

# Only the guides. Service pages carry their own Service/LocalBusiness schema.
GUIDES = {
    "guias/que-es-resico.html": {
        "headline": "¿Qué es el RESICO? Guía del Régimen Simplificado de Confianza",
        "description": "Quién puede tributar en RESICO, tasas de ISR, obligaciones y cómo cumplir.",
    },
}

AUTHOR = {"@type": "Person", "name": "C.P Diego Silva Meneses"}
PUBLISHER = {"@type": "Organization", "name": "MiContaEnLínea"}
BASE = "https://www.micontaenlinea.mx/"

MARK_START = "<!-- SCHEMA:START (generado por tools/gen-schema.py — no editar a mano) -->"
MARK_END = "<!-- SCHEMA:END -->"


def text_of(fragment: str) -> str:
    """Visible text of a fragment: tags out, entities decoded, spaces collapsed."""
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", fragment))).strip()


def build(path: str, meta: dict) -> int:
    file = ROOT / path
    src = file.read_text(encoding="utf-8")

    pairs = [(text_of(q), text_of(a)) for q, a in FAQ_ITEM.findall(src)]
    if not pairs:
        print(f"{path}: no encontré preguntas visibles — ¿cambió el marcado del FAQ?")
        return 1

    article = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": meta["headline"],
        "description": meta["description"],
        "author": AUTHOR,
        "publisher": PUBLISHER,
        "mainEntityOfPage": BASE + path,
    }
    faq = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": q,
                "acceptedAnswer": {"@type": "Answer", "text": a},
            }
            for q, a in pairs
        ],
    }

    block = (
        MARK_START
        + "\n"
        + "\n".join(
            '<script type="application/ld+json">'
            + json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
            + "</script>"
            for obj in (article, faq)
        )
        + "\n"
        + MARK_END
    )

    if MARK_START in src:
        out = re.sub(
            re.escape(MARK_START) + r"[\s\S]*?" + re.escape(MARK_END), block, src, count=1
        )
    else:
        out = src.replace("</head>", block + "\n</head>", 1)

    # Parity, checked before writing: every marked question must be on the page.
    visible = text_of(re.sub(r"<script[\s\S]*?</script>", " ", out))
    for q, _ in pairs:
        if q not in visible:
            print(f"{path}: la pregunta «{q}» no está en el texto visible — no escribo nada")
            return 1

    file.write_text(out, encoding="utf-8")
    print(f"{path}: Article + FAQPage estáticos, {len(pairs)} preguntas leídas de la página")
    return 0


sys.exit(sum(build(p, m) for p, m in GUIDES.items()))
