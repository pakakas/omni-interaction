/**
 * Sci-FI / Ovipar — Dimension Normalization
 *
 * Implements three normalization strategies for latent dimensions:
 *  - unsigned: linear [0, max] → [0.0, 1.0]
 *  - signed:   linear [min, max] → [0.0, 1.0]
 *  - circular: angle → dual-channel (sin, cos) each mapped to [0.0, 1.0]
 */

import type { DimensionSchema, DimensionKind } from "./types.ts";

// ─── Normalization Result ─────────────────────────────────────────────────────

/**
 * Result of normalizing a dimension value.
 * - unsigned/signed: single-element array [v]
 * - circular: two-element array [sin_channel, cos_channel]
 */
export type NormalizedValues = [number] | [number, number];

// ─── Core Normalizers ─────────────────────────────────────────────────────────

/**
 * Kind 1 — Unsigned normalization.
 * Formula: normalized = value / max
 *
 * @param value  Raw value in [0, max]
 * @param max    Upper bound (must be > 0)
 * @returns      Single float in [0.0, 1.0]
 */
export function normalizeUnsigned(value: number, max: number): number {
  if (max === 0) return 0;
  return Math.min(1, Math.max(0, value / max));
}

/**
 * Kind 2 — Signed normalization.
 * Formula: normalized = (value - min) / (max - min)
 *
 * @param value  Raw value in [min, max]
 * @param min    Lower bound
 * @param max    Upper bound
 * @returns      Single float in [0.0, 1.0]
 */
export function normalizeSigned(value: number, min: number, max: number): number {
  const range = max - min;
  if (range === 0) return 0;
  return Math.min(1, Math.max(0, (value - min) / range));
}

/**
 * Kind 3 — Circular (angular) normalization.
 * Encodes a radian angle into a dual-channel representation to avoid
 * discontinuity at the 0 / 2π boundary.
 *
 * Formulas:
 *   channel_a = (sin(value_rad) + 1) / 2   → [0.0, 1.0]
 *   channel_b = (cos(value_rad) + 1) / 2   → [0.0, 1.0]
 *
 * @param value_rad  Angle in radians
 * @returns          Two floats [sin_channel, cos_channel], each in [0.0, 1.0]
 */
export function normalizeCircular(value_rad: number): [number, number] {
  const channel_a = (Math.sin(value_rad) + 1) / 2;
  const channel_b = (Math.cos(value_rad) + 1) / 2;
  return [channel_a, channel_b];
}

// ─── Unified Dispatch ─────────────────────────────────────────────────────────

/**
 * Normalize a raw value according to its DimensionSchema.
 *
 * For circular dimensions, the `value` is treated as radians.
 * For signed/unsigned, `min` and `max` are taken from the schema;
 * if absent, sensible defaults are used (0 and 1 respectively).
 *
 * @param value   Raw value (pre-normalization)
 * @param schema  DimensionSchema describing bounds and kind
 * @returns       NormalizedValues array (length 1 or 2 depending on kind)
 */
export function normalizeDimension(
  value: number,
  schema: DimensionSchema
): NormalizedValues {
  switch (schema.kind) {
    case "unsigned": {
      const max = schema.max ?? 1;
      return [normalizeUnsigned(value, max)];
    }
    case "signed": {
      const min = schema.min ?? -1;
      const max = schema.max ?? 1;
      return [normalizeSigned(value, min, max)];
    }
    case "circular": {
      return normalizeCircular(value);
    }
  }
}

/**
 * Returns the number of float32 slots consumed by a dimension kind in
 * the workspace / ADN encoding.
 *
 * - unsigned → 1 slot
 * - signed   → 1 slot
 * - circular → 2 slots (sin + cos channels)
 */
export function channelCount(kind: DimensionKind): 1 | 2 {
  return kind === "circular" ? 2 : 1;
}
