import { describe, test, expect } from "bun:test";
import { compile, verifyHeader } from "../ovipositor/src/compiler.ts";
import type { GeneData } from "../ovipositor/src/compiler.ts";
import { EGG_MAGIC, EGG_VERSION, EGG_HEADER_SIZE } from "../ovipar/src/types.ts";
import { $ } from "bun";
import { unlinkSync, writeFileSync } from "fs";

describe("EGG Compiler", () => {
  // ── Header signature ──────────────────────────────────────────────────────

  describe("header signature", () => {
    test("magic+version bytes are 0xE661 (big-endian) for version 1", () => {
      const genes: GeneData[] = [
        {
          descriptor: { dimension_id: 0x01, byte_offset: 0, value_count: 1, kind: "unsigned" },
          values: new Float32Array([0.5]),
        },
      ];
      const { buffer } = compile(genes, 1);
      const view = new DataView(buffer.buffer);
      const sig = view.getUint16(0x00, false);  // big-endian
      expect(sig).toBe(0xE661);  // 0xE660 + 1
    });

    test("verifyHeader returns true for valid buffer", () => {
      const genes: GeneData[] = [
        {
          descriptor: { dimension_id: 0x02, byte_offset: 0, value_count: 1, kind: "signed" },
          values: new Float32Array([0.25]),
        },
      ];
      const { buffer } = compile(genes);
      expect(verifyHeader(buffer)).toBe(true);
    });

    test("verifyHeader returns false for empty/corrupt buffer", () => {
      expect(verifyHeader(new Uint8Array(0))).toBe(false);
      expect(verifyHeader(new Uint8Array([0x00, 0x00, 0x00, 0x00]))).toBe(false);
    });
  });

  // ── 8-byte alignment ──────────────────────────────────────────────────────

  describe("8-byte alignment", () => {
    test("payload_size is a multiple of 8", () => {
      const genes: GeneData[] = [
        {
          descriptor: { dimension_id: 0x01, byte_offset: 0, value_count: 1, kind: "unsigned" },
          values: new Float32Array([0.1]),
        },
        {
          descriptor: { dimension_id: 0x02, byte_offset: 0, value_count: 2, kind: "circular" },
          values: new Float32Array([0.5, 0.8]),
        },
      ];
      const { payload_size } = compile(genes);
      expect(payload_size % 8).toBe(0);
    });

    test("total buffer size is a multiple of 8", () => {
      const genes: GeneData[] = [
        {
          descriptor: { dimension_id: 0x03, byte_offset: 0, value_count: 1, kind: "signed" },
          values: new Float32Array([0.75]),
        },
      ];
      const { buffer } = compile(genes);
      expect(buffer.length % 8).toBe(0);
    });
  });

  // ── Gene count ────────────────────────────────────────────────────────────

  describe("gene_count", () => {
    test("returns correct gene_count", () => {
      const genes: GeneData[] = [
        { descriptor: { dimension_id: 1, byte_offset: 0, value_count: 1, kind: "unsigned" }, values: new Float32Array([0.1]) },
        { descriptor: { dimension_id: 2, byte_offset: 0, value_count: 1, kind: "signed" },   values: new Float32Array([0.2]) },
        { descriptor: { dimension_id: 9, byte_offset: 0, value_count: 2, kind: "circular" }, values: new Float32Array([0.3, 0.9]) },
      ];
      const { gene_count } = compile(genes);
      expect(gene_count).toBe(3);
    });
  });

  // ── Header fields ─────────────────────────────────────────────────────────

  describe("header structure", () => {
    test("version field is written at offset 0x02", () => {
      const genes: GeneData[] = [
        { descriptor: { dimension_id: 1, byte_offset: 0, value_count: 1, kind: "unsigned" }, values: new Float32Array([0.5]) },
      ];
      const { buffer } = compile(genes, 1);
      const view = new DataView(buffer.buffer);
      const version = view.getUint16(0x02, true);  // little-endian
      expect(version).toBe(1);
    });

    test("reserved field at 0x0C is 0", () => {
      const genes: GeneData[] = [
        { descriptor: { dimension_id: 1, byte_offset: 0, value_count: 1, kind: "unsigned" }, values: new Float32Array([1.0]) },
      ];
      const { buffer } = compile(genes);
      const view = new DataView(buffer.buffer);
      expect(view.getUint32(0x0c, true)).toBe(0);
    });

    test("buffer starts with correct EGG_HEADER_SIZE offset for payload", () => {
      const genes: GeneData[] = [
        { descriptor: { dimension_id: 1, byte_offset: 0, value_count: 1, kind: "unsigned" }, values: new Float32Array([0.5]) },
      ];
      const { buffer } = compile(genes);
      expect(buffer.length).toBeGreaterThan(EGG_HEADER_SIZE);
    });
  });

  // ── CLI Integration (Task 007 Verification) ────────────────────────────────

  describe("CLI integration", () => {
    test("compiles science doc into a valid EGG file via CLI", async () => {
      const tempDoc = "f:/work/00-oss/maintenis/pakakas/sci-fi/tests/temp_doc.txt";
      const tempEgg = "f:/work/00-oss/maintenis/pakakas/sci-fi/tests/temp_compiled.egg";
      
      // Write test document
      writeFileSync(tempDoc, "The object has 15 kg of mass and 30 m of length.", "utf-8");
      
      // Run CLI
      const cliPath = "f:/work/00-oss/maintenis/pakakas/sci-fi/ovipositor/src/cli.ts";
      const result = await $`bun run ${cliPath} --docs ${tempDoc} --out ${tempEgg}`.quiet();
      expect(result.exitCode).toBe(0);
      
      // Read output EGG and verify
      const eggBuffer = await Bun.file(tempEgg).arrayBuffer();
      const bytes = new Uint8Array(eggBuffer);
      
      // Verify signature (0xE661 for version 1)
      expect(verifyHeader(bytes)).toBe(true);
      
      // Verify 8-byte alignment
      expect(bytes.length % 8).toBe(0);
      
      // Cleanup
      try {
        unlinkSync(tempDoc);
        unlinkSync(tempEgg);
      } catch {}
    });
  });
});
