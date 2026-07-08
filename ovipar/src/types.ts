/**
 * Sci-FI / Ovipar — Core Types & Schema
 *
 * Defines the type system for the EGG binary model format,
 * dimension normalization, and stateful link-tracking tokens.
 */

// ─── Dimension Kind ───────────────────────────────────────────────────────────

/** Normalization strategy for a dimension. */
export type DimensionKind = "unsigned" | "signed" | "circular";

/** How the maximum boundary is determined. */
export type MaxType = "absolute" | "consensus" | "learnable" | "unbounded";

// ─── Dimension Schema ─────────────────────────────────────────────────────────

/**
 * Describes a single latent dimension in the sci-fi state space.
 */
export interface DimensionSchema {
  /** Token ID (unique numeric identifier for this dimension). */
  id: number;
  /** Human-readable name. */
  name: string;
  /** Normalization kind: unsigned [0,1], signed [-1,1], or circular (sin/cos dual-channel). */
  kind: DimensionKind;
  /** Minimum value (optional; defaults to 0 for unsigned, -1 for signed). */
  min?: number;
  /** Maximum value (optional; only relevant for bounded dimensions). */
  max?: number;
  /** How the max boundary is determined. */
  max_type: MaxType;
  /** Physical or semantic unit (e.g. "meters", "radians", "probability"). */
  unit: string;
  /**
   * Number of output channels in the encoded representation.
   * - unsigned/signed: 1
   * - circular: 2 (sin channel + cos channel)
   */
  channels: 1 | 2;
}

// ─── Stateful Link-Tracking Token IDs ────────────────────────────────────────

/**
 * Security & stateful link-tracking Token IDs.
 * These dimensions accumulate history across time-steps.
 */
export const TOKEN_IDS = {
  /** 0x2B — Accumulated suspicion level across interaction history. */
  SUSPICION_ACCUMULATED: 0x2b,
  /** 0x2C — Historical latent state drift (deviation from baseline). */
  HISTORICAL_DRIFT: 0x2c,
} as const;

// ─── Ingested Constraint ──────────────────────────────────────────────────────

/**
 * Raw extraction result from a science document.
 * Represents a single constraint or measurement before normalization.
 */
export interface IngestedConstraint {
  /** Source dimension Token ID this constraint refers to. */
  dimension_id: number;
  /** Raw numeric value as read from the document. */
  raw_value: number;
  /** Textual provenance (e.g. paper section, equation label). */
  source?: string;
  /** Confidence score in [0, 1] for this extraction. */
  confidence?: number;
}

// ─── Gene Descriptor ─────────────────────────────────────────────────────────

/**
 * Describes a single gene (data block) within an EGG binary file.
 * Each gene maps to one dimension or feature vector.
 */
export interface GeneDescriptor {
  /** Token ID of the dimension this gene encodes. */
  dimension_id: number;
  /** Byte offset within the EGG payload (8-byte aligned). */
  byte_offset: number;
  /** Number of float32 values stored (== DimensionSchema.channels). */
  value_count: number;
  /** Normalization kind used when encoding. */
  kind: DimensionKind;
}

// ─── EGG Binary File Header ───────────────────────────────────────────────────

/**
 * Layout specification for the `.egg` binary file header.
 *
 * Binary layout (all fields little-endian):
 * - Offset 0x00: magic      uint16  = 0xE660
 * - Offset 0x02: version    uint16  (e.g. 0x0001)
 * - Offset 0x04: gene_count uint32  (number of GeneDescriptors)
 * - Offset 0x08: payload_size uint32 (total byte length of gene payload)
 * - Offset 0x0C: reserved   uint32  = 0x00000000
 * Total header size: 16 bytes (8-byte aligned)
 */
export interface EGGHeader {
  /** Magic number: always 0xE660. */
  magic: 0xe660;
  /** Format version. Current: 1. */
  version: number;
  /** Total number of genes in the file. */
  gene_count: number;
  /** Total byte length of the gene payload section. */
  payload_size: number;
  /** Reserved for future use. Must be 0. */
  reserved: 0;
}

/** Current EGG format version. */
export const EGG_VERSION = 1 as const;

/** EGG magic number. */
export const EGG_MAGIC = 0xe660 as const;

/** Header byte size (8-byte aligned). */
export const EGG_HEADER_SIZE = 16 as const;
