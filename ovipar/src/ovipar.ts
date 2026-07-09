import { extractFromDocument } from "./mt-infer-client";
import { wireYolk, type DimRegistry, type DimWireInstruction } from "./yolk-wirer";
import type { ExtractionResult } from "./extraction-schema";

export interface CompileOptions {
  /** Path ke dokumen sains (text/markdown/PDF yang sudah di-convert ke teks) */
  documentPath: string;
  /** Path output file .egg */
  outputPath: string;
  /** Registry dimensi existing */
  registry?: DimRegistry;
  /** Timeout HLM inference (ms) */
  inferTimeoutMs?: number;
}

export interface CompileResult {
  source: ExtractionResult["source"];
  instructions: DimWireInstruction[];
  /** Path ke file .egg yang dihasilkan */
  outputPath: string;
  /** Ukuran file .egg dalam bytes */
  outputBytes: number;
}

/**
 * Ovipar pipeline orchestrator.
 * Ovipar tidak membaca/parse teks sains sendiri — delegasi ke HLM.
 *
 * Steps:
 *  1. Baca dokumen dari disk
 *  2. Delegasi ke HLM via extractFromDocument()
 *  3. Wire Yolk via wireYolk()
 *  4. Serialize ke .egg biner (stub — tulis empty buffer)
 *
 * Note: Step 4 sementara di-stub sampai ovipositor serializer siap dari plan 069/074.
 */
export async function compileToBinary(options: CompileOptions): Promise<CompileResult> {
  const { documentPath, outputPath, registry = new Map(), inferTimeoutMs } = options;

  // Step 1: Baca dokumen
  const documentText = await Bun.file(documentPath).text();

  // Step 2: Delegasi ke HLM — BUKAN parsing manual
  const extracted = await extractFromDocument(documentText, { timeoutMs: inferTimeoutMs });

  // Step 3: Wire-man — generate Yolk instructions
  const instructions = wireYolk(extracted, registry);

  // Step 4: Serialize ke .egg biner (stub)
  // TODO: const eggBuffer = serializeToEgg(instructions, extracted.causal_wires);
  const outputBytes = 0;
  await Bun.write(outputPath, new Uint8Array(0));

  return {
    source: extracted.source,
    instructions,
    outputPath,
    outputBytes,
  };
}
