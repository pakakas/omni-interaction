/**
 * Sci-FI / Ovipar — Science Document Parser
 *
 * Atomization: extracts primitive physical quantities and maps them to
 * 9 primitive dimension Token IDs.
 *
 * Molecularization: analyzes causal correlations between atoms to
 * assemble derived dimensions (Molecules) and builds a causal DAG
 * for the Membrane EGG configuration.
 */

import type { IngestedConstraint } from "./types.ts";

// ─── Primitive Dimension Token IDs ───────────────────────────────────────────

export const PRIMITIVE_DIMS = {
  MASS:        0x01,
  LENGTH:      0x02,
  TIME:        0x03,
  TEMPERATURE: 0x04,
  CURRENT:     0x05,
  AMOUNT:      0x06,
  LUMINOSITY:  0x07,
  CHARGE:      0x08,
  ANGLE:       0x09,
} as const;

export type PrimitiveDimKey = keyof typeof PRIMITIVE_DIMS;

// ─── Derived (Molecule) Dimension Token IDs ───────────────────────────────────

export const MOLECULE_DIMS = {
  FORCE:    0x10,   // MASS × LENGTH / TIME²
  ENERGY:   0x11,   // MASS × LENGTH² / TIME²
  VELOCITY: 0x12,   // LENGTH / TIME
  PRESSURE: 0x13,   // MASS / (LENGTH × TIME²)
} as const;

// ─── Causal DAG ───────────────────────────────────────────────────────────────

/** A directed edge in the causal DAG: `from` causes/influences `to`. */
export interface CausalEdge {
  from: number;  // source dimension Token ID
  to:   number;  // target dimension Token ID
  weight?: number;  // optional edge weight in [0, 1]
}

/** A Causal DAG for Membrane EGG configuration. */
export interface CausalDAG {
  nodes: number[];       // all dimension Token IDs in this graph
  edges: CausalEdge[];   // directed causal edges
}

// ─── Molecule derivation rules ────────────────────────────────────────────────

const MOLECULE_RULES: Array<{ id: number; parents: number[] }> = [
  { id: MOLECULE_DIMS.VELOCITY, parents: [PRIMITIVE_DIMS.LENGTH, PRIMITIVE_DIMS.TIME] },
  { id: MOLECULE_DIMS.FORCE,    parents: [PRIMITIVE_DIMS.MASS, PRIMITIVE_DIMS.LENGTH, PRIMITIVE_DIMS.TIME] },
  { id: MOLECULE_DIMS.PRESSURE, parents: [PRIMITIVE_DIMS.MASS, PRIMITIVE_DIMS.LENGTH, PRIMITIVE_DIMS.TIME] },
  { id: MOLECULE_DIMS.ENERGY,   parents: [PRIMITIVE_DIMS.MASS, PRIMITIVE_DIMS.LENGTH, PRIMITIVE_DIMS.TIME] },
];

// ─── Atomizer ─────────────────────────────────────────────────────────────────

/** Regex patterns to extract physical quantities from science text. */
const ATOM_PATTERNS: Array<{ dim: number; pattern: RegExp; unit_scale?: number }> = [
  { dim: PRIMITIVE_DIMS.MASS,        pattern: /(\d+\.?\d*)\s*(kg|g|gram|kilogram)/gi, unit_scale: 1 },
  { dim: PRIMITIVE_DIMS.LENGTH,      pattern: /(\d+\.?\d*)\s*(m|cm|mm|km|meter|metre)/gi, unit_scale: 1 },
  { dim: PRIMITIVE_DIMS.TIME,        pattern: /(\d+\.?\d*)\s*(s|sec|second|ms|min|hour)/gi, unit_scale: 1 },
  { dim: PRIMITIVE_DIMS.TEMPERATURE, pattern: /(\d+\.?\d*)\s*(K|°C|°F|kelvin|celsius)/gi, unit_scale: 1 },
  { dim: PRIMITIVE_DIMS.CURRENT,     pattern: /(\d+\.?\d*)\s*(A|amp|ampere)/gi, unit_scale: 1 },
  { dim: PRIMITIVE_DIMS.AMOUNT,      pattern: /(\d+\.?\d*)\s*(mol|mole)/gi, unit_scale: 1 },
  { dim: PRIMITIVE_DIMS.LUMINOSITY,  pattern: /(\d+\.?\d*)\s*(cd|candela|lumen)/gi, unit_scale: 1 },
  { dim: PRIMITIVE_DIMS.CHARGE,      pattern: /(\d+\.?\d*)\s*(C|coulomb)/gi, unit_scale: 1 },
  { dim: PRIMITIVE_DIMS.ANGLE,       pattern: /(\d+\.?\d*)\s*(rad|radian|deg|degree)/gi, unit_scale: 1 },
];

/**
 * Atomize: extract primitive physical quantities from raw science text.
 * Returns one IngestedConstraint per matched measurement.
 */
export function atomize(text: string): IngestedConstraint[] {
  const results: IngestedConstraint[] = [];
  for (const { dim, pattern } of ATOM_PATTERNS) {
    let match: RegExpExecArray | null;
    const re = new RegExp(pattern.source, pattern.flags);
    while ((match = re.exec(text)) !== null) {
      results.push({
        dimension_id: dim,
        raw_value: parseFloat(match[1]),
        source: match[0],
        confidence: 0.8,
      });
    }
  }
  return results;
}

// ─── Molecularizer ────────────────────────────────────────────────────────────

/**
 * Molecularize: given a set of atom dimension IDs, derive higher-level
 * molecule dimensions and build a causal DAG for the Membrane EGG config.
 */
export function molecularize(atoms: IngestedConstraint[]): CausalDAG {
  const presentDims = new Set(atoms.map(a => a.dimension_id));
  const nodes = new Set<number>(presentDims);
  const edges: CausalEdge[] = [];

  for (const rule of MOLECULE_RULES) {
    const allParentsPresent = rule.parents.every(p => presentDims.has(p));
    if (allParentsPresent) {
      nodes.add(rule.id);
      for (const parent of rule.parents) {
        edges.push({ from: parent, to: rule.id, weight: 1.0 });
      }
    }
  }

  return { nodes: [...nodes], edges };
}

// ─── Top-level parse ──────────────────────────────────────────────────────────

export interface ParseResult {
  atoms: IngestedConstraint[];
  dag:   CausalDAG;
}

/**
 * Parse a raw science document string.
 * Returns extracted atoms and the derived causal DAG.
 */
export function parseScience(doc: string): ParseResult {
  const atoms = atomize(doc);
  const dag = molecularize(atoms);
  return { atoms, dag };
}
