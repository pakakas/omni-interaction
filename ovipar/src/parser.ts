/**
 * Sci-FI / Ovipar — Science Document Parser
 *
 * delegates the task of reading & understanding science documents
 * to HLM (via mt-infer-client), and converts the structured ExtractionResult
 * into Yolk wiring instructions.
 */

import { extractFromDocument } from "./mt-infer-client";
import { wireYolk } from "./yolk-wirer";
import type { DimWireInstruction } from "./yolk-wirer";

export interface ParseResult {
  instructions: DimWireInstruction[];
  source: {
    title: string;
    domain: string;
  };
}

/**
 * Parse a raw science document string.
 * Calls extractFromDocument to get HLM output and wires them into instructions.
 */
export async function parseScience(doc: string): Promise<ParseResult> {
  const result = await extractFromDocument(doc);
  const registry = new Map<string, string>();
  const instructions = wireYolk(result, registry);
  return {
    instructions,
    source: {
      title: result.source.title,
      domain: result.source.domain,
    },
  };
}
