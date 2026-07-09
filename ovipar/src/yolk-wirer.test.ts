import { describe, test, expect } from "bun:test";
import { wireYolk, type DimRegistry } from "./yolk-wirer";
import type { ExtractionResult } from "./extraction-schema";

function makeResult(dimensions: ExtractionResult["dimensions"]): ExtractionResult {
  return {
    source: { title: "t", domain: "physics", confidence: 0.9 },
    dimensions,
    causal_wires: [],
  };
}

describe("wireYolk", () => {
  test("dimensi baru primitif → declare_primitive instruction", () => {
    const registry: DimRegistry = new Map();
    const result = makeResult([{ name: "Voltage", proposed_id: "0x0002", op: "primitive" }]);
    const instr = wireYolk(result, registry);
    expect(instr).toHaveLength(1);
    expect(instr[0].kind).toBe("declare_primitive");
    expect(instr[0].id).toBe("0x0002");
    expect(registry.has("0x0002")).toBe(true);
  });

  test("dimensi turunan (multiply) → derive instruction", () => {
    const registry: DimRegistry = new Map([["0x0002", "Voltage"], ["0x0003", "Current"]]);
    const result = makeResult([{
      name: "Power", proposed_id: "0x000F", op: "multiply",
      derives_from: ["0x0002", "0x0003"], exponents: [1, 1],
    }]);
    const instr = wireYolk(result, registry);
    expect(instr).toHaveLength(1);
    expect(instr[0].kind).toBe("derive");
    if (instr[0].kind === "derive") {
      expect(instr[0].op).toBe("multiply");
      expect(instr[0].from).toEqual(["0x0002", "0x0003"]);
      expect(instr[0].exponents).toEqual([1, 1]);
    }
  });

  test("dimensi sudah ada di registry → di-skip (kosong)", () => {
    const registry: DimRegistry = new Map([["0x0002", "Voltage"]]);
    const result = makeResult([{ name: "Voltage", proposed_id: "0x0002", op: "primitive" }]);
    const instr = wireYolk(result, registry);
    expect(instr).toHaveLength(0);
  });

  test("derives_from belum di registry → throw Error", () => {
    const registry: DimRegistry = new Map();
    const result = makeResult([{
      name: "Power", proposed_id: "0x000F", op: "multiply",
      derives_from: ["0x0002", "0x0003"],
    }]);
    expect(() => wireYolk(result, registry)).toThrow("belum terdaftar di registry");
  });

  test('dimensi circular (op: "special") → special instruction dengan specialRef: "0xCIRCULAR"', () => {
    const registry: DimRegistry = new Map();
    const result = makeResult([{
      name: "Joint_Angle", proposed_id: "0x0010", op: "special", derives_from: ["0xCIRCULAR"],
    }]);
    const instr = wireYolk(result, registry);
    expect(instr).toHaveLength(1);
    expect(instr[0].kind).toBe("special");
    if (instr[0].kind === "special") {
      expect(instr[0].specialRef).toBe("0xCIRCULAR");
    }
  });
});
