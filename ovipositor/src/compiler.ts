/**
 * Sci-FI / Ovipositor — Binary EGG Compiler
 *
 * Compiles gene data (Shell, Albumin, Membrane, Yolk, Chalaza)
 * into a `.egg` binary file with:
 *   - 16-byte header (magic 0xE660 + version, gene_count, payload_size, reserved)
 *   - Gene Register Table (one entry per gene descriptor, 8-byte aligned)
 *   - Float32 gene payload (8-byte aligned per gene)
 *
 * Header signature formula: 0xE660 + version
 *   For version 1: 0xE661  →  bytes [0xe6, 0x61] (big-endian)
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

// Each entry: dimension_id (4) + byte_offset (4) + value_count (4) + kind_flags (4) = 16 bytes
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
    // Each float32 is 4 bytes; align total to 8 bytes
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
  // magic signature: 0xE660 + version (big-endian uint16)
  const signature = (EGG_MAGIC + version) & 0xffff;
  view.setUint16(0x00, signature, false);          // big-endian magic+version
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
    // kind flags: 0=unsigned, 1=signed, 2=circular
    const kindFlag = descriptor.kind === "unsigned" ? 0 : descriptor.kind === "signed" ? 1 : 2;
    view.setUint32(base + 12, kindFlag, true);
  }

  // ── 6. Write Gene Payload ──────────────────────────────────────────────────
  const payloadBase = tableBase + tableSize;
  for (let i = 0; i < genes.length; i++) {
    const { values } = genes[i];
    const dest = payloadBase + geneOffsets[i];
    for (let j = 0; j < values.length; j++) {
      view.setFloat32(dest + j * 4, values[j], true);
    }
    // padding bytes already zero from Uint8Array initialization
  }

  return { buffer, gene_count: genes.length, payload_size };
}

/**
 * Verify that a compiled EGG buffer has the correct header signature.
 * Returns true if bytes [0..1] equal (0xE660 + version) big-endian.
 */
export function verifyHeader(buffer: Uint8Array, version = EGG_VERSION): boolean {
  if (buffer.length < EGG_HEADER_SIZE) return false;
  const view = new DataView(buffer.buffer, buffer.byteOffset);
  const sig = view.getUint16(0x00, false);  // big-endian
  return sig === ((EGG_MAGIC + version) & 0xffff);
}
