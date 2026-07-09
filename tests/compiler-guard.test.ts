import { describe, test, expect } from "bun:test";
import {
  compile,
  CompilerGuardError,
  detectCausalCycle,
  checkAlignmentDrift,
  scanSecretExposure,
  signEgg,
  verifyEggSignature,
} from "../ovipositor/src/compiler";
import type { GeneData } from "../ovipositor/src/compiler";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeGene(dimId: number, scale = 1.0): GeneData {
  return {
    descriptor: {
      dimension_id: dimId,
      byte_offset: 0,
      value_count: 1,
      unit_scale: scale,
      is_circular: false,
    },
    values: new Float32Array([0.5]),
  };
}

function compileValid(): Uint8Array {
  const result = compile([makeGene(0x0001), makeGene(0x0002)]);
  return result.buffer;
}

// ─── detectCausalCycle ────────────────────────────────────────────────────────

describe("detectCausalCycle (0xD1)", () => {
  test("acyclic DAG → tidak throw", () => {
    const edges = new Map([
      ["A", ["B", "C"]],
      ["B", ["D"]],
      ["C", []],
      ["D", []],
    ]);
    expect(() => detectCausalCycle(edges)).not.toThrow();
  });

  test("direct cycle A→B→A → throw CompilerGuardError(0xD1)", () => {
    const edges = new Map([
      ["A", ["B"]],
      ["B", ["A"]],
    ]);
    expect(() => detectCausalCycle(edges)).toThrow(CompilerGuardError);
    try {
      detectCausalCycle(edges);
    } catch (e: any) {
      expect(e.guardId).toBe(0xd1);
      expect(e.message).toContain("0xCAUSAL_CYCLE");
    }
  });

  test("self-loop → throw CompilerGuardError(0xD1)", () => {
    const edges = new Map([["X", ["X"]]]);
    expect(() => detectCausalCycle(edges)).toThrow(CompilerGuardError);
  });
});

// ─── checkAlignmentDrift ──────────────────────────────────────────────────────

describe("checkAlignmentDrift (0xD2)", () => {
  test("valid compiled EGG (8-byte aligned) → tidak throw", () => {
    const buf = compileValid();
    expect(() => checkAlignmentDrift(buf)).not.toThrow();
  });

  test("buffer size not multiple of 8 → throw CompilerGuardError(0xD2)", () => {
    const buf = compileValid();
    // Manually corrupt: append 1 extra byte
    const bad = new Uint8Array(buf.length + 1);
    bad.set(buf);
    expect(() => checkAlignmentDrift(bad)).toThrow(CompilerGuardError);
    try {
      checkAlignmentDrift(bad);
    } catch (e: any) {
      expect(e.guardId).toBe(0xd2);
      expect(e.message).toContain("0xALIGN_DRIFT");
    }
  });

  test("buffer smaller than EGG_HEADER_SIZE → throw CompilerGuardError(0xD2)", () => {
    const tiny = new Uint8Array(4);
    expect(() => checkAlignmentDrift(tiny)).toThrow(CompilerGuardError);
  });
});

// ─── scanSecretExposure ───────────────────────────────────────────────────────

describe("scanSecretExposure (0xD3)", () => {
  test("clean buffer (no secrets) → tidak throw", () => {
    const buf = compileValid();
    const fakeEnv = { MY_API_SECRET: "not-in-buffer-xyz" };
    expect(() => scanSecretExposure(buf, fakeEnv)).not.toThrow();
  });

  test("env var dengan non-secret key → diabaikan", () => {
    const buf = compileValid();
    const fakeEnv = { PATH: "/usr/bin", HOME: "/root" };
    expect(() => scanSecretExposure(buf, fakeEnv)).not.toThrow();
  });

  test("secret nilai pendek (< 8 chars) → diabaikan", () => {
    const buf = compileValid();
    const fakeEnv = { MY_SECRET_KEY: "abc" }; // terlalu pendek
    expect(() => scanSecretExposure(buf, fakeEnv)).not.toThrow();
  });
});

// ─── signEgg + verifyEggSignature ─────────────────────────────────────────────

describe("signEgg + verifyEggSignature (Ed25519 tail)", () => {
  test("sign → verify dengan kunci yang sama → true", async () => {
    const keyPair = await crypto.subtle.generateKey("Ed25519", false, ["sign", "verify"]);
    const buf = compileValid();
    const signed = await signEgg(buf, keyPair.privateKey);

    // Total size = original + 64 bytes signature tail
    expect(signed.length).toBe(buf.length + 64);

    const valid = await verifyEggSignature(signed, keyPair.publicKey);
    expect(valid).toBe(true);
  });

  test("tampered payload → verifyEggSignature returns false", async () => {
    const keyPair = await crypto.subtle.generateKey("Ed25519", false, ["sign", "verify"]);
    const buf = compileValid();
    const signed = await signEgg(buf, keyPair.privateKey);

    // Tamper byte 0 of payload
    signed[0] ^= 0xff;

    const valid = await verifyEggSignature(signed, keyPair.publicKey);
    expect(valid).toBe(false);
  });

  test("buffer terlalu pendek (< 64 bytes) → verifyEggSignature returns false", async () => {
    const keyPair = await crypto.subtle.generateKey("Ed25519", false, ["sign", "verify"]);
    const tiny = new Uint8Array(32);
    const valid = await verifyEggSignature(tiny, keyPair.publicKey);
    expect(valid).toBe(false);
  });
});
