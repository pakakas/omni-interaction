/**
 * Sci-FI / Ovipar — Dimension Normalization
 *
 * Soft-scaling strategy:
 *  - linear:   latent = value / unit_scale (no clamping, allows negative and overflow values)
 *  - circular: angle → dual-channel [sin, cos] mapped to [0.0, 1.0]
 */

import type { DimensionSchema } from "./types.ts";

// ─── Normalization Result ─────────────────────────────────────────────────────

/**
 * Result of normalizing a dimension value.
 * - linear:   single-element array [v]
 * - circular: two-element array [sin_channel, cos_channel]
 */
export type NormalizedValues = [number] | [number, number];

// ─── Core Normalizers ─────────────────────────────────────────────────────────

/**
 * Scale input sensor: latent = sensor_value / unit_scale.
 * Does not clamp to any boundary; negative and > 1.0 values flow freely.
 *
 * @param value       Raw sensor value
 * @param unit_scale  Scale factor (must be !== 0)
 * @returns           Scaled latent coordinate
 */
export function scaleInput(value: number, unit_scale: number): number {
  if (unit_scale === 0) return 0;
  return value / unit_scale;
}

/**
 * Circular (angular) normalization.
 * Encodes a radian angle into a dual-channel sin/cos representation.
 *
 * Formulas:
 *   channel_sin = (sin(value_rad) + 1) / 2   → [0.0, 1.0]
 *   channel_cos = (cos(value_rad) + 1) / 2   → [0.0, 1.0]
 *
 * @param value_rad  Angle in radians
 * @returns          Two floats [sin_channel, cos_channel], each in [0.0, 1.0]
 */
export function expandCircular(value_rad: number): [number, number] {
  const channel_sin = (Math.sin(value_rad) + 1) / 2;
  const channel_cos = (Math.cos(value_rad) + 1) / 2;
  return [channel_sin, channel_cos];
}


