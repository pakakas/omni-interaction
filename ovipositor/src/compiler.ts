/**
 * Sci-FI / Ovipositor — Binary EGG Compiler
 *
 * Compiles gene data (Shell, Albumin, Membrane, Yolk, Chalaza)
 * into a `.egg` binary file with:
 *   - 16-byte header (magic 0xE661 + version, gene_count, payload_size, reserved)
 *   - Gene Register Table (one entry per gene descriptor, 8-byte aligned)
 *   - Float32 gene payload (8-byte aligned per gene)
 */

import { EGG_MAGIC, EGG_VERSION, EGG_HEADER_SIZE } from "../../ovipar/src/types.ts";
import type { GeneDescriptor } from "../../ovipar/src/types.ts";

// ─── Gene Data ───────────────────────────────────────────────────────────────

/** Compiled gene data: descriptor + raw float values. */
export interface GeneData {
  descriptor: GeneDescriptor;
  values: Float32Array;
}

// ─── EGG Compile Result ───────────────────────────────────────────────────────

export interface EGGCompileResult {
  buffer: Uint8Array;
  gene_count: number;
  payload_size: number;
}

// ─── Alignment Helpers ────────────────────────────────────────────────────────

/** Align n up to the next multiple of 8. */
function align8(n: number): number {
  return (n + 7) & ~7;
}

// ─── Gene Register Table Entry Size ──────────────────────────────────────────

// Each entry: dimension_id (4) + byte_offset (4) + value_count (4) + unit_scale (4) = 16 bytes
const GENE_ENTRY_SIZE = 16;

// ─── Compiler ────────────────────────────────────────────────────────────────

/**
 * Compile genes into a `.egg` binary buffer.
 *
 * Layout:
 *   [0x00] Header (16 bytes)
 *   [0x10] Gene Register Table (gene_count × 16 bytes, 8-byte aligned)
 *   [var]  Gene Payload (Float32 arrays, each 8-byte aligned)
 */
export function compile(genes: GeneData[], version = EGG_VERSION): EGGCompileResult {
  // ── 1. Compute payload layout ──────────────────────────────────────────────
  const geneOffsets: number[] = [];
  let payloadCursor = 0;

  for (const gene of genes) {
    geneOffsets.push(payloadCursor);
    const byteLen = align8(gene.values.length * 4);
    payloadCursor += byteLen;
  }

  const payload_size = payloadCursor;

  // ── 2. Compute Gene Register Table size ────────────────────────────────────
  const tableSize = align8(genes.length * GENE_ENTRY_SIZE);

  // ── 3. Allocate full buffer ────────────────────────────────────────────────
  const totalSize = EGG_HEADER_SIZE + tableSize + payload_size;
  const buffer = new Uint8Array(totalSize);
  const view = new DataView(buffer.buffer);

  // ── 4. Write Header ────────────────────────────────────────────────────────
  // magic signature: 0xE660 + version (big-endian uint16) -> EGG_MAGIC (0xE661)
  const signature = (EGG_MAGIC) & 0xffff;
  view.setUint16(0x00, signature, false);          // big-endian magic
  view.setUint16(0x02, version, true);             // little-endian version field
  view.setUint32(0x04, genes.length, true);        // gene_count
  view.setUint32(0x08, payload_size, true);        // payload_size
  view.setUint32(0x0c, 0, true);                   // reserved = 0

  // ── 5. Write Gene Register Table ──────────────────────────────────────────
  const tableBase = EGG_HEADER_SIZE;
  for (let i = 0; i < genes.length; i++) {
    const { descriptor } = genes[i];
    const base = tableBase + i * GENE_ENTRY_SIZE;
    view.setUint32(base + 0,  descriptor.dimension_id, true);
    view.setUint32(base + 4,  geneOffsets[i], true);
    view.setUint32(base + 8,  descriptor.value_count, true);
    // Write unit_scale as Float32 at offset +12 (replacing legacy kindFlag u32)
    view.setFloat32(base + 12, descriptor.unit_scale, true);
  }

  // ── 6. Write Gene Payload ──────────────────────────────────────────────────
  const payloadBase = tableBase + tableSize;
  for (let i = 0; i < genes.length; i++) {
    const { values } = genes[i];
    const dest = payloadBase + geneOffsets[i];
    for (let j = 0; j < values.length; j++) {
      view.setFloat32(dest + j * 4, values[j], true);
    }
  }

  return { buffer, gene_count: genes.length, payload_size };
}

/**
 * Verify that a compiled EGG buffer has the correct header signature.
 * Returns true if bytes [0..1] equal EGG_MAGIC.
 */
export function verifyHeader(buffer: Uint8Array, _version = EGG_VERSION): boolean {
  if (buffer.length < EGG_HEADER_SIZE) return false;
  const view = new DataView(buffer.buffer, buffer.byteOffset);
  const sig = view.getUint16(0x00, false);  // big-endian
  return sig === EGG_MAGIC;
}

// ─── Compiler Guard (073 metacompiler) ───────────────────────────────────────

/** Thrown by any compiler guard when a violation is detected. */
export class CompilerGuardError extends Error {
  constructor(
    public readonly guardId: number,
    message: string,
    public readonly quarantine = false,
  ) {
    super(message);
    this.name = "CompilerGuardError";
  }
}

// ── Guard 0xD1: Causal Cycle Detection ───────────────────────────────────────

/**
 * Detect causal cycles in a dimension dependency graph.
 *
 * @param edges - Map of token_id → depends-on token_ids (direct edges)
 * @throws CompilerGuardError (0xD1) if any cycle is found
 */
export function detectCausalCycle(edges: Map<string, string[]>): void {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();

  function dfs(node: string): void {
    color.set(node, GRAY);
    for (const dep of edges.get(node) ?? []) {
      const c = color.get(dep) ?? WHITE;
      if (c === GRAY) {
        // Back-edge: cycle detected
        throw new CompilerGuardError(
          0xd1,
          `0xCAUSAL_CYCLE detected: "${node}" → "${dep}" forms a cycle in the Membrane DAG`,
        );
      }
      if (c === WHITE) dfs(dep);
    }
    color.set(node, BLACK);
  }

  for (const node of edges.keys()) {
    if ((color.get(node) ?? WHITE) === WHITE) dfs(node);
  }
}

// ── Guard 0xD2: Alignment Drift Check ────────────────────────────────────────

/**
 * Verify that the compiled EGG buffer payload is 8-byte aligned.
 * Checks both payload_size (from header) and total buffer size.
 *
 * @throws CompilerGuardError (0xD2) if alignment drift > 0
 */
export function checkAlignmentDrift(buffer: Uint8Array): void {
  if (buffer.length < EGG_HEADER_SIZE) {
    throw new CompilerGuardError(0xd2, "0xALIGN_DRIFT: buffer too small to contain EGG header");
  }
  const view = new DataView(buffer.buffer, buffer.byteOffset);
  const payloadSize = view.getUint32(0x08, true);

  if (payloadSize % 8 !== 0) {
    throw new CompilerGuardError(
      0xd2,
      `0xALIGN_DRIFT: payload_size=${payloadSize} is not a multiple of 8`,
    );
  }
  if (buffer.length % 8 !== 0) {
    throw new CompilerGuardError(
      0xd2,
      `0xALIGN_DRIFT: total buffer size=${buffer.length} is not a multiple of 8`,
    );
  }
}

// ── Guard 0xD3: Secret Exposure Scan ─────────────────────────────────────────

/**
 * Scan environment variables for secrets and ensure none leaked into metadata.
 *
 * Strategy: collect all string values from `process.env` that look like secrets
 * (key contains SECRET/TOKEN/KEY/PASS/PWD case-insensitive, value length >= 8),
 * then check they do not appear anywhere in the binary buffer bytes as UTF-8.
 *
 * @param buffer  — compiled EGG buffer to scan
 * @param envVars — environment key-value map (default: process.env)
 * @throws CompilerGuardError (0xD3, quarantine=true) if secret is found in buffer
 */
export function scanSecretExposure(
  buffer: Uint8Array,
  envVars: Record<string, string | undefined> = process.env,
): void {
  const SECRET_KEY_PATTERN = /SECRET|TOKEN|KEY|PASS|PWD/i;
  const bufText = Buffer.from(buffer).toString("latin1"); // byte-level scan

  for (const [envKey, envVal] of Object.entries(envVars)) {
    if (!SECRET_KEY_PATTERN.test(envKey)) continue;
    if (!envVal || envVal.length < 8) continue;

    if (bufText.includes(envVal)) {
      throw new CompilerGuardError(
        0xd3,
        `0xSECRET_EXPOSURE: env var "${envKey}" value found in EGG binary — aborting and quarantining`,
        true, // quarantine = true
      );
    }
  }
}

// ── Guard 0xD4 + Ed25519 Tail Signature ──────────────────────────────────────

const ED25519_SIG_BYTES = 64;

/**
 * Sign an EGG binary buffer using Ed25519.
 *
 * Signature location: last 64 bytes of the final file (tail).
 * Data signed: bytes [0 .. fileSize - 65] inclusive.
 * Header EGG v1 does NOT store SIGNATURE_OFFSET — VM reads from `fileSize - 64`.
 *
 * @param buffer     — compiled EGG buffer (before signing)
 * @param privateKey — 64-byte Ed25519 private key (seed + public, as from crypto.subtle)
 * @returns new Uint8Array with 64-byte Ed25519 signature appended at tail
 */
export async function signEgg(buffer: Uint8Array, privateKey: CryptoKey): Promise<Uint8Array> {
  const dataToSign = buffer; // sign entire buffer (signature appended after)
  const sigBuffer = await crypto.subtle.sign("Ed25519", privateKey, dataToSign);
  const sig = new Uint8Array(sigBuffer);

  const signed = new Uint8Array(buffer.length + ED25519_SIG_BYTES);
  signed.set(buffer, 0);
  signed.set(sig, buffer.length);
  return signed;
}

/**
 * Verify the Ed25519 tail signature of a signed EGG buffer.
 *
 * @param signedBuffer — full signed EGG buffer (payload + 64 byte tail)
 * @param publicKey    — Ed25519 public key
 * @returns true if signature is valid
 */
export async function verifyEggSignature(
  signedBuffer: Uint8Array,
  publicKey: CryptoKey,
): Promise<boolean> {
  if (signedBuffer.length < ED25519_SIG_BYTES) return false;
  const payloadEnd = signedBuffer.length - ED25519_SIG_BYTES;
  const payload = signedBuffer.slice(0, payloadEnd);
  const sig     = signedBuffer.slice(payloadEnd);
  return crypto.subtle.verify("Ed25519", publicKey, sig, payload);
}
