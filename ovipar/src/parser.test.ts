import { describe, test, expect } from "bun:test";
import { parseScience } from "./parser";
import type { ExtractionResult } from "./extraction-schema";

const mockDoc: ExtractionResult = {
  source: { title: "Basic Physics", domain: "physics", confidence: 0.95 },
  dimensions: [
    { name: "Mass",        proposed_id: "0x0001", op: "primitive" },
    { name: "Velocity",    proposed_id: "0x0002", op: "primitive" },
    { name: "KineticEnergy", proposed_id: "0x0005", op: "multiply",
      derives_from: ["0x0001", "0x0002"], exponents: [1, 2] },
  ],
  causal_wires: [],
};

describe("parser (HLM-integrated)", () => {
  test("parses structured HLM JSON and generates correct instructions", async () => {
    const result = await parseScience(JSON.stringify(mockDoc));
    expect(result.source.domain).toBe("physics");
    expect(result.instructions).toHaveLength(3);
    expect(result.instructions[0].kind).toBe("declare_primitive");
    expect(result.instructions[2].kind).toBe("derive");
  });
});
