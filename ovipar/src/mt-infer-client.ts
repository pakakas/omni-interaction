import type { ExtractionResult } from "./extraction-schema";
import { validateExtractionResult } from "./extraction-schema";

// ─── SYSTEM_PROMPT ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are a physics and science dimension extractor.
Given a science document, extract:
1. All physical dimensions mentioned (name, SI unit, whether it's a primitive SI base, derived from others, or a global anchor)
2. All causal relationships between dimensions (which law, which tokens, exponents)

Dimension classification rules (NO "kind" field):
- Linear dimensions: op = "primitive" or any derive op. Single float, unbounded.
- Circular dimensions: op = "special", derives_from = ["0xCIRCULAR"]. Will become dual sin/cos channels.
- Safety bounds: op = "special", derives_from = ["0xCONSENSUS"]. Scale [0.0, 1.0].

Output ONLY a valid JSON object matching this schema:
{
  "source": { "title": string, "domain": "physics"|"chem"|"bio"|"econ"|"unknown", "confidence": number },
  "dimensions": [ { "name": string, "proposed_id": string, "op": "primitive"|"multiply"|"divide"|"add"|"power"|"special", "derives_from"?: string[], "exponents"?: number[], "unit_scale"?: number|null } ],
  "causal_wires": [ { "name": string, "relation": string, "token_ids": string[], "exponents": number[] } ]
}
Do not include any explanation outside the JSON.
`.trim();

// ─── InferOptions ─────────────────────────────────────────────────────────────
export interface InferOptions {
  /** Timeout dalam millisecond (default: 30000) */
  timeoutMs?: number;
  /** Model HLM yang dipakai (default: dari mt-infer config) */
  model?: string;
}

/**
 * Delegasikan pembacaan dokumen sains ke HLM via mt-infer.
 * Ovipar memanggil fungsi ini — bukan parsing sendiri.
 *
 * Current mode: parse documentText sebagai JSON langsung (mock/stub).
 * Ganti `JSON.parse(documentText)` dengan actual mt-infer call setelah
 * pakakas/mt-infer API diverifikasi path & signaturenya.
 */
export async function extractFromDocument(
  documentText: string,
  options: InferOptions = {}
): Promise<ExtractionResult> {
  const { timeoutMs = 30_000, model } = options;

  // Panggil mt-infer — implementasi sesuai API actual mt-infer
  // const raw = await infer({ system: SYSTEM_PROMPT, user: documentText, model, timeoutMs });

  // Mock mode (untuk test & pipeline E2E tanpa network):
  // parse documentText sebagai JSON langsung
  const raw = JSON.parse(documentText) as ExtractionResult;

  validateExtractionResult(raw);
  return raw;
}
