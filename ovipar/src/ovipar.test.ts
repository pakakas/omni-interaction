import { describe, test, expect, mock, beforeEach } from "bun:test";
import { compileToBinary } from "./ovipar";
import type { ExtractionResult } from "./extraction-schema";
import * as path from "path";
import * as os from "os";

const mockExtracted: ExtractionResult = {
  source: { title: "Test Paper", domain: "physics", confidence: 0.9 },
  dimensions: [
    { name: "Voltage",  proposed_id: "0x0002", op: "primitive" },
    { name: "Current",  proposed_id: "0x0003", op: "primitive" },
    { name: "Power",    proposed_id: "0x000F", op: "multiply",
      derives_from: ["0x0002", "0x0003"], exponents: [1, 1] },
  ],
  causal_wires: [],
};

const tmpDoc  = path.join(os.tmpdir(), "ovipar-test-input.json");
const tmpEgg  = path.join(os.tmpdir(), "ovipar-test-output.egg");

describe("compileToBinary (pipeline orchestrator)", () => {
  beforeEach(async () => {
    await Bun.write(tmpDoc, JSON.stringify(mockExtracted));
  });

  test("instructions.length === 3 (2 primitive + 1 derive)", async () => {
    const result = await compileToBinary({ documentPath: tmpDoc, outputPath: tmpEgg });
    expect(result.instructions.length).toBe(3);
  });

  test('result.source.domain === "physics"', async () => {
    const result = await compileToBinary({ documentPath: tmpDoc, outputPath: tmpEgg });
    expect(result.source.domain).toBe("physics");
  });

  test("output file exist setelah compile", async () => {
    await compileToBinary({ documentPath: tmpDoc, outputPath: tmpEgg });
    const exists = await Bun.file(tmpEgg).exists();
    expect(exists).toBe(true);
  });
});
