/**
 * Sci-FI / Ovipar — Core Types & Schema
 *
 * Defines the type system for the EGG binary model format,
 * dimension normalization, and stateful link-tracking tokens.
 */

// ─── Dimension Schema ─────────────────────────────────────────────────────────

/**
 * Describes a single latent dimension in the sci-fi state space.
 */
export interface DimensionSchema {
  /** Token ID (unique numeric identifier for this dimension). */
  id: number;
  /** Human-readable name. */
  name: string;
  /** Soft-scaling factor. Value is divided by unit_scale to get latent coordinate. */
  unit_scale: number;
  /** Physical or semantic unit name (informational only). */
  unit: string;
  /**
   * Causal relations to special anchors or other dimensions.
   * If contains "0xCIRCULAR", it represents a circular dimension.
   */
  derives_from?: string[];
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

// ─── Metacompiler: ovipar.egg Self-Bootstrapping Guards ───────────────────────

/**
 * Token IDs for ovipar.egg compiler self-guard dimensions.
 * Detects and signals compiler-level anomalies.
 */
export const OVIPAR_GUARD_IDS = {
  /** 0xD0 — Input entropy signal ingested into the compiler pipeline. */
  INGEST_ENTROPY:     0xd0,
  /** 0xD1 — Causal cycle count detected in the Membrane DAG (> 0 → abort compile). */
  CAUSAL_CYCLE:       0xd1,
  /** 0xD2 — Float32 memory alignment drift (> 0 → reject write). */
  ALIGN_DRIFT:        0xd2,
  /** 0xD3 — Secret/env-var exposure count detected in metadata (> 0 → abort + quarantine). */
  SECRET_EXPOSURE:    0xd3,
  /** 0xD4 — Overall compiler validity signal [0=invalid, 1=valid]. */
  COMPILER_VALIDITY:  0xd4,
} as const;

// ─── Metacompiler: energen.egg VM Runtime Guards ──────────────────────────────

/**
 * Token IDs for energen.egg VM runtime self-guard dimensions.
 */
export const ENERGEN_GUARD_IDS = {
  /** 0xE0 — VM memory usage ratio (heap / limit). */
  VM_MEMORY:          0xe0,
  /** 0xE1 — VM CPU utilization ratio. */
  VM_CPU:             0xe1,
  /** 0xE2 — Call stack depth (normalized by max). */
  STACK_DEPTH:        0xe2,
  /** 0xE3 — Out-of-bounds access count in current execution frame. */
  OUT_OF_BOUNDS:      0xe3,
  /** 0xE4 — VM panic state [0=normal, 1=panic]. */
  VM_PANIC:           0xe4,
} as const;

// ─── Metacompiler: egg-digester.egg Ingestion Guards ─────────────────────────

/**
 * Token IDs for egg-digester.egg binary ingestion self-guard dimensions.
 */
export const EGG_DIGESTER_GUARD_IDS = {
  /** 0xC0 — Causal DAG validity of ingested .egg (0=invalid, 1=valid). */
  DIGEST_CAUSAL_VALIDITY:   0xc0,
  /** 0xC1 — Ed25519 signature verification result [0=fail, 1=pass]. */
  SIGNATURE_ED25519:        0xc1,
  /** 0xC2 — Digest size exceeded limit flag [0=ok, 1=exceeded]. */
  DIGEST_LIMIT_EXCEEDED:    0xc2,
  /** 0xC3 — Digest pipeline status code. */
  DIGEST_STATUS:            0xc3,
  /** 0xC4 — EGG magic number validity flag [0=bad, 1=good]. */
  INGEST_MAGIC:             0xc4,
} as const;

// ─── Metacompiler: afb.egg Input Stream Guards ────────────────────────────────

/**
 * Token IDs for afb.egg input stream self-guard dimensions.
 */
export const AFB_GUARD_IDS = {
  /** 0xF0 — Out-of-range input dimension count. */
  INPUT_OUT_OF_RANGE:       0xf0,
  /** 0xF1 — Input mutation rate (delta between consecutive frames). */
  INPUT_MUTATION_RATE:      0xf1,
  /** 0xF2 — Input format validity flag [0=invalid, 1=valid]. */
  INPUT_FORMAT_VALID:       0xf2,
  /** 0xF3 — Aggregated input safety status [0=unsafe, 1=safe]. */
  INPUT_SAFETY_STATUS:      0xf3,
  /** 0xF4 — Count of active dimension channels in current frame. */
  CURRENT_DIMENSIONS:       0xf4,
  /** 0xF5 — Maximum allowed dimension channel count. */
  MAX_DIMENSIONS:           0xf5,
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
  /** Number of float32 values stored. 1 for linear, 2 for circular. */
  value_count: number;
  /** Scaling factor used for soft normalization. */
  unit_scale: number;
  /** Whether the dimension is circular. */
  is_circular: boolean;
}

// ─── EGG Binary File Header ───────────────────────────────────────────────────

/**
 * Layout specification for the `.egg` binary file header.
 *
 * Binary layout (all fields little-endian):
 * - Offset 0x00: magic      uint16  = 0xE661
 * - Offset 0x02: version    uint16  (e.g. 0x0001)
 * - Offset 0x04: gene_count uint32  (number of GeneDescriptors)
 * - Offset 0x08: payload_size uint32 (total byte length of gene payload)
 * - Offset 0x0C: reserved   uint32  = 0x00000000
 * Total header size: 16 bytes (8-byte aligned)
 */
export interface EGGHeader {
  /** Magic number: always 0xE661. */
  magic: 0xe661;
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
export const EGG_MAGIC = 0xe661 as const;

/** Header byte size (8-byte aligned). */
export const EGG_HEADER_SIZE = 16 as const;
