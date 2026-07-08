#!/usr/bin/env bun
/**
 * Sci-FI / Ovipositor — CLI
 *
 * Usage:
 *   ovipositor --docs <path> --out <path.egg>
 *
 * Reads science documents from `--docs` (file or directory),
 * parses them via Ovipar, and compiles to a `.egg` binary.
 */

import { parseScience } from "../../ovipar/src/parser.ts";
import { compile } from "./compiler.ts";
import type { GeneData } from "./compiler.ts";
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";
import { normalizeDimension } from "../../ovipar/src/normalization.ts";
import type { DimensionSchema } from "../../ovipar/src/types.ts";

// ─── Arg Parsing ──────────────────────────────────────────────────────────────

function getArg(flag: string): string | null {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return null;
  return process.argv[idx + 1];
}

const docsPath = getArg("--docs");
const outPath  = getArg("--out");

if (!docsPath || !outPath) {
  console.error("Usage: ovipositor --docs <path> --out <output.egg>");
  process.exit(1);
}

// ─── Collect Doc Files ────────────────────────────────────────────────────────

function collectDocs(p: string): string[] {
  const s = statSync(p);
  if (s.isFile()) return [p];
  return readdirSync(p)
    .filter(f => [".txt", ".md"].includes(extname(f)))
    .map(f => join(p, f));
}

const docFiles = collectDocs(docsPath);
if (docFiles.length === 0) {
  console.error(`No .txt or .md files found in: ${docsPath}`);
  process.exit(1);
}

// ─── Parse + Build Gene Data ──────────────────────────────────────────────────

const genes: GeneData[] = [];

for (const file of docFiles) {
  const text = readFileSync(file, "utf-8");
  const { atoms } = parseScience(text);

  for (const atom of atoms) {
    // Build a minimal schema to drive normalization
    const schema: DimensionSchema = {
      id:       atom.dimension_id,
      name:     `dim_${atom.dimension_id.toString(16)}`,
      kind:     "unsigned",
      max:      atom.raw_value * 2 || 1,
      max_type: "consensus",
      unit:     atom.source ?? "?",
      channels: 1,
    };

    const values = normalizeDimension(atom.raw_value, schema);

    genes.push({
      descriptor: {
        dimension_id: atom.dimension_id,
        byte_offset:  0,  // will be computed by compiler
        value_count:  values.length,
        kind:         schema.kind,
      },
      values: new Float32Array(values),
    });
  }
}

if (genes.length === 0) {
  console.error("No genes extracted from documents.");
  process.exit(1);
}

// ─── Compile ──────────────────────────────────────────────────────────────────

const { buffer, gene_count, payload_size } = compile(genes);
writeFileSync(outPath, buffer);

console.log(`✓ Compiled ${gene_count} genes → ${outPath} (payload: ${payload_size} bytes)`);
