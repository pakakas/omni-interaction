import { describe, test, expect } from "bun:test";
import {
  normalizeUnsigned,
  normalizeSigned,
  normalizeCircular,
  normalizeDimension,
} from "../ovipar/src/normalization.ts";
import type { DimensionSchema } from "../ovipar/src/types.ts";

describe("normalization", () => {
  // ── Kind 1: unsigned ─────────────────────────────────────────────────────

  describe("unsigned (Kind 1)", () => {
    test("maps 0 → 0.0", () => {
      expect(normalizeUnsigned(0, 10)).toBe(0);
    });

    test("maps max → 1.0", () => {
      expect(normalizeUnsigned(10, 10)).toBe(1);
    });

    test("maps mid → 0.5", () => {
      expect(normalizeUnsigned(5, 10)).toBeCloseTo(0.5, 6);
    });

    test("clamps above max → 1.0", () => {
      expect(normalizeUnsigned(20, 10)).toBe(1);
    });

    test("clamps below 0 → 0.0", () => {
      expect(normalizeUnsigned(-5, 10)).toBe(0);
    });

    test("handles max=0 gracefully → 0", () => {
      expect(normalizeUnsigned(5, 0)).toBe(0);
    });
  });

  // ── Kind 2: signed ───────────────────────────────────────────────────────

  describe("signed (Kind 2)", () => {
    test("maps min → 0.0", () => {
      expect(normalizeSigned(-1, -1, 1)).toBe(0);
    });

    test("maps max → 1.0", () => {
      expect(normalizeSigned(1, -1, 1)).toBe(1);
    });

    test("maps 0 → 0.5 for [-1,1]", () => {
      expect(normalizeSigned(0, -1, 1)).toBeCloseTo(0.5, 6);
    });

    test("handles equal min/max → 0", () => {
      expect(normalizeSigned(5, 5, 5)).toBe(0);
    });
  });

  // ── Kind 3: circular ─────────────────────────────────────────────────────

  describe("circular (Kind 3)", () => {
    test("returns exactly 2 channels", () => {
      const result = normalizeCircular(0);
      expect(result).toHaveLength(2);
    });

    test("both channels are in [0, 1]", () => {
      for (const angle of [0, Math.PI / 4, Math.PI / 2, Math.PI, 3 * Math.PI / 2, 2 * Math.PI]) {
        const [a, b] = normalizeCircular(angle);
        expect(a).toBeGreaterThanOrEqual(0);
        expect(a).toBeLessThanOrEqual(1);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(1);
      }
    });

    test("angle=0 → sin_ch=0.5, cos_ch=1.0", () => {
      const [a, b] = normalizeCircular(0);
      expect(a).toBeCloseTo(0.5, 6);  // (sin(0)+1)/2 = 0.5
      expect(b).toBeCloseTo(1.0, 6);  // (cos(0)+1)/2 = 1.0
    });

    test("angle=π/2 → sin_ch≈1.0, cos_ch≈0.5", () => {
      const [a, b] = normalizeCircular(Math.PI / 2);
      expect(a).toBeCloseTo(1.0, 5);
      expect(b).toBeCloseTo(0.5, 5);
    });
  });

  // ── Unified dispatch ──────────────────────────────────────────────────────

  describe("normalizeDimension dispatch", () => {
    test("dispatches unsigned schema correctly", () => {
      const schema: DimensionSchema = {
        id: 1, name: "mass", kind: "unsigned", max: 100,
        max_type: "absolute", unit: "kg", channels: 1,
      };
      const [v] = normalizeDimension(50, schema);
      expect(v).toBeCloseTo(0.5, 6);
    });

    test("dispatches signed schema correctly", () => {
      const schema: DimensionSchema = {
        id: 2, name: "temperature", kind: "signed", min: -273, max: 1000,
        max_type: "absolute", unit: "K", channels: 1,
      };
      const result = normalizeDimension(-273, schema);
      expect(result[0]).toBeCloseTo(0, 6);
    });

    test("dispatches circular schema returning 2 channels", () => {
      const schema: DimensionSchema = {
        id: 9, name: "angle", kind: "circular",
        max_type: "unbounded", unit: "rad", channels: 2,
      };
      const result = normalizeDimension(0, schema);
      expect(result).toHaveLength(2);
    });
  });
});
