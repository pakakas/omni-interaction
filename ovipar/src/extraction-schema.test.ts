import { describe, test, expect } from "bun:test";
import {
  validateExtractionResult,
  type ExtractionResult,
} from "./extraction-schema";

const validResult: ExtractionResult = {
  source: { title: "Newton Mechanics", domain: "physics", confidence: 0.95 },
  dimensions: [
    { name: "Mass",       proposed_id: "0x0001", op: "primitive" },
    { name: "Force",      proposed_id: "0x0003", op: "multiply",
      derives_from: ["0x0001", "0x0002"], exponents: [1, 1] },
    { name: "Joint_Angle", proposed_id: "0x0010", op: "special",
      derives_from: ["0xCIRCULAR"] },
  ],
  causal_wires: [
    { name: "Newton 2nd", relation: "F = M * A", token_ids: ["0x0001", "0x0002"], exponents: [1, 1] },
  ],
};

describe("extraction-schema validator", () => {
  test("valid ExtractionResult (primitive + multiply + special circular) → tidak throw", () => {
    expect(() => validateExtractionResult(validResult)).not.toThrow();
  });

  test("confidence: 1.5 → throw Error", () => {
    const bad: ExtractionResult = {
      ...validResult,
      source: { ...validResult.source, confidence: 1.5 },
    };
    expect(() => validateExtractionResult(bad)).toThrow("confidence harus di [0.0, 1.0]");
  });

  test('op: "multiply" tanpa derives_from → throw Error', () => {
    const bad: ExtractionResult = {
      ...validResult,
      dimensions: [
        { name: "Force", proposed_id: "0x0003", op: "multiply" },
      ],
    };
    expect(() => validateExtractionResult(bad)).toThrow('harus punya derives_from');
  });

  test('op: "special" dengan derives_from: ["0xUNKNOWN"] → throw Error', () => {
    const bad: ExtractionResult = {
      ...validResult,
      dimensions: [
        { name: "Bad", proposed_id: "0x0099", op: "special", derives_from: ["0xUNKNOWN"] },
      ],
    };
    expect(() => validateExtractionResult(bad)).toThrow("bukan dimensi spesial yang dikenal");
  });

  test('dimensi dengan field "kind" → throw Error', () => {
    const bad: ExtractionResult = {
      ...validResult,
      dimensions: [
        { name: "Mass", proposed_id: "0x0001", op: "primitive", kind: "linear" } as any,
      ],
    };
    expect(() => validateExtractionResult(bad)).toThrow('tidak boleh punya field "kind"');
  });

  test("CausalWire token_ids.length !== exponents.length → throw Error", () => {
    const bad: ExtractionResult = {
      ...validResult,
      causal_wires: [
        { name: "Bad Wire", relation: "X", token_ids: ["0x0001", "0x0002"], exponents: [1] },
      ],
    };
    expect(() => validateExtractionResult(bad)).toThrow("token_ids.length !== exponents.length");
  });
});
