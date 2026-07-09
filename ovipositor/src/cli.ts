#!/usr/bin/env bun
/**
 * Sci-FI / Ovipositor — CLI Driver
 *
 * Usage:
 *   ovipositor --docs <path> --out <output.egg> [--timeout <ms>]
 */

import { compileToBinary } from "../../ovipar/src/ovipar";

function getArg(flag: string): string | null {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return null;
  return process.argv[idx + 1];
}

const docsPath = getArg("--docs");
const outPath  = getArg("--out");
const timeoutStr = getArg("--timeout");
const timeout = timeoutStr ? parseInt(timeoutStr, 10) : 30000;

if (!docsPath || !outPath) {
  console.error("Usage: ovipositor --docs <path> --out <output.egg> [--timeout <ms>]");
  process.exit(1);
}

async function run() {
  try {
    const result = await compileToBinary({
      documentPath: docsPath,
      outputPath: outPath,
      inferTimeoutMs: timeout,
    });

    for (const instr of result.instructions) {
      if (instr.kind === "declare_primitive") {
        const scale = instr.unit_scale ?? 1.0;
        console.log(`✓ Compiled ${instr.id} (scale: ${scale}) -> 1 float slot`);
      } else if (instr.kind === "special" && instr.specialRef === "0xCIRCULAR") {
        console.log(`✓ Compiled ${instr.id} (circular) -> 2 float slots`);
      } else if (instr.kind === "special") {
        console.log(`✓ Compiled ${instr.id} (special: ${instr.specialRef}) -> 1 float slot`);
      } else if (instr.kind === "derive") {
        const scale = instr.unit_scale ?? 1.0;
        console.log(`✓ Compiled ${instr.id} (derived: ${instr.op}, scale: ${scale}) -> 1 float slot`);
      }
    }

    console.log(`✓ Egg laid: ${result.outputPath} (total size: ${result.outputBytes} bytes)`);
  } catch (e: any) {
    console.error(`FAILED: ${e.message}`);
    process.exit(1);
  }
}

run();
