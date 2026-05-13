// Parser PDF Yardstick Swiss Sailing → JSON.
// Esecuzione: `pnpm run parse-yardstick`
//
// NB: questo script è un best-effort. Il PDF di Swiss Sailing cambia layout ogni anno;
// in caso di parsing fallato, intervenire manualmente sul JSON di output.
// Dipendenza: `pdf-parse` (installazione opzionale, non inclusa nelle deps di runtime).
//
// Per usarlo:
//   pnpm add -D pdf-parse @types/pdf-parse
//   pnpm run parse-yardstick

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { BoatCategory, BoatClass } from '../src/types';

const PDF_URL =
  'https://www.swiss-sailing.ch/_Resources/Persistent/8/5/6/5/856574101793d127739073b39bde20817a90f594/Yardstickzahlen2026.pdf';
const OUT_PATH = resolve(process.cwd(), 'src', 'data', 'yardstick2026.json');

const CATEGORY_HEADERS: Record<string, BoatCategory> = {
  Jollen: 'Jollen',
  Jollenkreuzer: 'Jollenkreuzer',
  Libera: 'Libera',
  Mehrrumpfboote: 'Mehrrumpfboote',
  Yachten: 'Yachten',
};

async function loadPdfText(): Promise<string> {
  const res = await fetch(PDF_URL);
  if (!res.ok) throw new Error(`Download PDF failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  // Dynamic import per non rendere pdf-parse una dep obbligatoria.
  let pdfParse: (b: Buffer) => Promise<{ text: string }>;
  try {
    const mod = await import('pdf-parse');
    pdfParse = (mod as any).default ?? (mod as any);
  } catch {
    throw new Error(
      'pdf-parse non installato. Esegui: pnpm add -D pdf-parse @types/pdf-parse',
    );
  }
  const { text } = await pdfParse(buffer);
  return text;
}

function parseClasses(text: string): BoatClass[] {
  const out: BoatClass[] = [];
  let current: BoatCategory | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const header = CATEGORY_HEADERS[line];
    if (header) {
      current = header;
      continue;
    }
    if (!current) continue;

    // Pattern: "<YS> <name optional details>" — l'YS è sempre il primo intero.
    const m = line.match(/^(\d{2,3})\s+(.+)$/);
    if (!m) continue;
    const ys = Number.parseInt(m[1], 10);
    const name = m[2].trim();
    if (!Number.isFinite(ys) || ys < 50 || ys > 250) continue;
    if (name.length < 2) continue;

    out.push({ ys, name, category: current });
  }

  return out.sort((a, b) =>
    a.category === b.category ? a.name.localeCompare(b.name) : a.category.localeCompare(b.category),
  );
}

async function main() {
  console.log(`Downloading ${PDF_URL}...`);
  const text = await loadPdfText();
  console.log(`PDF text length: ${text.length}`);
  const classes = parseClasses(text);
  console.log(`Parsed ${classes.length} classes`);
  writeFileSync(OUT_PATH, `${JSON.stringify(classes, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
