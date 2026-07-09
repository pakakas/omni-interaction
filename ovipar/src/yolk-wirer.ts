import type { ExtractionResult, ExtractedDimension, DeriveOp } from "./extraction-schema";

// ─── DimRegistry ──────────────────────────────────────────────────────────────
/** Mapping token_id (hex string) → nama dimensi */
export type DimRegistry = Map<string, string>;

// ─── DimWireInstruction ───────────────────────────────────────────────────────
//   declare_primitive — sumbu float tunggal baru (linear, unbounded)
//   derive           — sumbu diturunkan dari operasi antar dimensi existing
//   special          — dimensi spesial global (0xCIRCULAR → sin/cos, 0xCONSENSUS → [0,1])
// Tidak ada normKind, min, max — semuanya float32 bebas skala.
export type DimWireInstruction =
  | { kind: "declare_primitive"; id: string; name: string; unit_scale?: number }
  | { kind: "derive";           id: string; name: string; op: Exclude<DeriveOp, "primitive" | "special">; from: string[]; exponents: number[]; unit_scale?: number }
  | { kind: "special";          id: string; name: string; specialRef: string };

/**
 * Wire-man logic:
 * 1. Cek komponen yang sudah ada di registry
 * 2. Declare primitif baru jika belum ada
 * 3. Generate derive instruction untuk dimensi turunan
 * Tidak pernah buat sumbu random baru untuk dimensi yang bisa di-derive.
 */
export function wireYolk(
  result: ExtractionResult,
  registry: DimRegistry
): DimWireInstruction[] {
  const instructions: DimWireInstruction[] = [];

  for (const dim of result.dimensions) {
    if (registry.has(dim.proposed_id)) {
      // Sudah ada — skip (reuse yang existing)
      continue;
    }

    if (dim.op === "primitive") {
      // Deklarasi basis primitif baru — linear float, unbounded
      instructions.push({
        kind: "declare_primitive",
        id: dim.proposed_id,
        name: dim.name,
        ...(dim.unit_scale != null ? { unit_scale: dim.unit_scale } : {}),
      });
      registry.set(dim.proposed_id, dim.name);
    } else if (dim.op === "special") {
      // Dimensi spesial global (0xCIRCULAR atau 0xCONSENSUS)
      const specialRef = (dim.derives_from ?? [])[0] ?? dim.proposed_id;
      instructions.push({ kind: "special", id: dim.proposed_id, name: dim.name, specialRef });
      registry.set(dim.proposed_id, dim.name);
    } else {
      // Pastikan semua derives_from sudah ada di registry
      const missing = (dim.derives_from ?? []).filter((id) => !registry.has(id));
      if (missing.length > 0) {
        throw new Error(
          `Dimensi "${dim.name}" derives_from ${missing.join(", ")} yang belum terdaftar di registry`
        );
      }
      instructions.push({
        kind: "derive",
        id: dim.proposed_id,
        name: dim.name,
        op: dim.op as Exclude<DeriveOp, "primitive" | "special">,
        from: dim.derives_from!,
        exponents: dim.exponents ?? dim.derives_from!.map(() => 1),
        ...(dim.unit_scale != null ? { unit_scale: dim.unit_scale } : {}),
      });
      registry.set(dim.proposed_id, dim.name);
    }
  }

  return instructions;
}
