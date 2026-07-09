import { describe, test, expect } from "bun:test";
import { compile, verifyHeader } from "../ovipositor/src/compiler.ts";
import type { GeneData } from "../ovipositor/src/compiler.ts";
import { EGG_MAGIC, EGG_VERSION, EGG_HEADER_SIZE } from "../ovipar/src/types.ts";
import { $ } from "bun";
import { unlinkSync, writeFileSync } from "fs";

describe("EGG Compiler", () => {
  // ── Header signature ──────────────────────────────────────────────────────

  describe("header signature", () => {
    test("magic bytes are 0xE661 (big-endian)", () => {
      const genes: GeneData[] = [
        {
          descriptor: { dimension_id: 0x01, byte_offset: 0, value_count: 1, unit_scale: 1.0, is_circular: false },
          values: new Float32Array([0.5]),
        },
      ];
      const { buffer } = compile(genes, 1);
      const view = new DataView(buffer.buffer);
      const sig = view.getUint16(0x00, false);  // big-endian
      expect(sig).toBe(EGG_MAGIC);
    });

    test("verifyHeader returns true for valid buffer", () => {
      const genes: GeneData[] = [
        {
          descriptor: { dimension_id: 0x02, byte_offset: 0, value_count: 1, unit_scale: 1.0, is_circular: false },
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

  // ── Register Table & unit_scale ──────────────────────────────────────────

  describe("register table & unit_scale", () => {
    test("writes unit_scale as Float32 at offset 12 of register table", () => {
      const genes: GeneData[] = [
        {
          descriptor: { dimension_id: 0x05, byte_offset: 0, value_count: 2, unit_scale: 100.0, is_circular: true },
          values: new Float32Array([0.5, 0.866]),
        },
      ];
      const { buffer } = compile(genes);
      const view = new DataView(buffer.buffer);
      
      // Register Table starts at EGG_HEADER_SIZE (16).
      // First gene entry:
      // +0: dimension_id (uint32)
      // +4: byte_offset (uint32)
      // +8: value_count (uint32)
      // +12: unit_scale (float32)
      const unitScaleVal = view.getFloat32(EGG_HEADER_SIZE + 12, true);  // little-endian
      expect(unitScaleVal).toBeCloseTo(100.0, 5);

      // Verify hex representation (100.0 in float32 is 0x42c80000)
      const unitScaleU32 = view.getUint32(EGG_HEADER_SIZE + 12, true);
      expect(unitScaleU32).toBe(0x42c80000);
    });
  });

  // ── 8-byte alignment ──────────────────────────────────────────────────────

  describe("8-byte alignment", () => {
    test("payload_size is a multiple of 8", () => {
      const genes: GeneData[] = [
        {
          descriptor: { dimension_id: 0x01, byte_offset: 0, value_count: 1, unit_scale: 1.0, is_circular: false },
          values: new Float32Array([0.1]),
        },
        {
          descriptor: { dimension_id: 0x02, byte_offset: 0, value_count: 2, unit_scale: 1.0, is_circular: true },
          values: new Float32Array([0.5, 0.8]),
        },
      ];
      const { payload_size } = compile(genes);
      expect(payload_size % 8).toBe(0);
    });

    test("total buffer size is a multiple of 8", () => {
      const genes: GeneData[] = [
        {
          descriptor: { dimension_id: 0x03, byte_offset: 0, value_count: 1, unit_scale: 1.0, is_circular: false },
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
        { descriptor: { dimension_id: 1, byte_offset: 0, value_count: 1, unit_scale: 1.0, is_circular: false }, values: new Float32Array([0.1]) },
        { descriptor: { dimension_id: 2, byte_offset: 0, value_count: 1, unit_scale: 1.0, is_circular: false }, values: new Float32Array([0.2]) },
        { descriptor: { dimension_id: 9, byte_offset: 0, value_count: 2, unit_scale: 1.0, is_circular: true },  values: new Float32Array([0.3, 0.9]) },
      ];
      const { gene_count } = compile(genes);
      expect(gene_count).toBe(3);
    });
  });

  // ── Header fields ─────────────────────────────────────────────────────────

  describe("header structure", () => {
    test("version field is written at offset 0x02", () => {
      const genes: GeneData[] = [
        { descriptor: { dimension_id: 1, byte_offset: 0, value_count: 1, unit_scale: 1.0, is_circular: false }, values: new Float32Array([0.5]) },
      ];
      const { buffer } = compile(genes, 1);
      const view = new DataView(buffer.buffer);
      const version = view.getUint16(0x02, true);  // little-endian
      expect(version).toBe(1);
    });

    test("reserved field at 0x0C is 0", () => {
      const genes: GeneData[] = [
        { descriptor: { dimension_id: 1, byte_offset: 0, value_count: 1, unit_scale: 1.0, is_circular: false }, values: new Float32Array([1.0]) },
      ];
      const { buffer } = compile(genes);
      const view = new DataView(buffer.buffer);
      expect(view.getUint32(0x0c, true)).toBe(0);
    });

    test("buffer starts with correct EGG_HEADER_SIZE offset for payload", () => {
      const genes: GeneData[] = [
        { descriptor: { dimension_id: 1, byte_offset: 0, value_count: 1, unit_scale: 1.0, is_circular: false }, values: new Float32Array([0.5]) },
      ];
      const { buffer } = compile(genes);
      expect(buffer.length).toBeGreaterThan(EGG_HEADER_SIZE);
    });
  });
});
