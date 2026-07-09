import { describe, test, expect } from "bun:test";
import { scaleInput, expandCircular } from "./normalization";

describe("normalization (soft-scale)", () => {
  test("scaleInput(50, 100) -> 0.5", () => {
    expect(scaleInput(50, 100)).toBeCloseTo(0.5, 6);
  });

  test("scaleInput(-20, 100) -> -0.2 (no clamping)", () => {
    expect(scaleInput(-20, 100)).toBeCloseTo(-0.2, 6);
  });

  test("scaleInput(150, 100) -> 1.5 (no clamping)", () => {
    expect(scaleInput(150, 100)).toBeCloseTo(1.5, 6);
  });

  test("scaleInput(10, 0) -> 0 (graceful division by zero)", () => {
    expect(scaleInput(10, 0)).toBe(0);
  });

  test("expandCircular(0) -> [0.5, 1.0]", () => {
    const [s, c] = expandCircular(0);
    expect(s).toBeCloseTo(0.5, 6); // (sin(0)+1)/2 = 0.5
    expect(c).toBeCloseTo(1.0, 6); // (cos(0)+1)/2 = 1.0
  });

  test("expandCircular(Math.PI / 2) -> [1.0, 0.5]", () => {
    const [s, c] = expandCircular(Math.PI / 2);
    expect(s).toBeCloseTo(1.0, 5);
    expect(c).toBeCloseTo(0.5, 5);
  });
});
