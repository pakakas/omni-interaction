import { describe, test, expect } from "bun:test";
import { extractFromDocument } from "./mt-infer-client";
import type { ExtractionResult } from "./extraction-schema";

const validDoc: ExtractionResult = {
  source: { title: "Basic Electrics", domain: "physics", confidence: 0.9 },
  dimensions: [
    { name: "Voltage", proposed_id: "0x0002", op: "primitive" },
  ],
  causal_wires: [],
};

describe("mt-infer-client (mock mode)", () => {
  test("valid ExtractionResult JSON → return object dengan dimensions.length > 0", async () => {
    const result = await extractFromDocument(JSON.stringify(validDoc));
    expect(result.dimensions.length).toBeGreaterThan(0);
    expect(result.source.domain).toBe("physics");
  });

  test("input JSON dengan confidence: 2.0 → throw Error dari validateExtractionResult", async () => {
    const bad: ExtractionResult = {
      ...validDoc,
      source: { ...validDoc.source, confidence: 2.0 },
    };
    expect(async () => await extractFromDocument(JSON.stringify(bad)))
      .toThrow("confidence harus di [0.0, 1.0]");
  });

  test("input bukan JSON → throw SyntaxError", async () => {
    expect(async () => await extractFromDocument("ini bukan JSON {}{}"))
      .toThrow(SyntaxError);
  });
});
