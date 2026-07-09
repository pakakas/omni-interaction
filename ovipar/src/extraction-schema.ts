// ─── Notasi Dimensi (Textual Representation) ──────────────────────────────────
// Semua dimensi (baik sensor fisik, koordinat laten, maupun dimensi spesial)
// menggunakan notasi prefix "0x" (misal: 0xTEMPERATURE, 0xANGLE, 0xCIRCULAR).
// Pada runtime VM, notasi "0x" ini merujuk ke indeks numerik (32-bit token ID).

// ─── Dimensi Sistem Global ────────────────────────────────────────────────────
// Token dimensi bawaan sistem yang selalu tersedia.
export const CIRCULAR  = "0xCIRCULAR";  // Circularity → dual-channel sin/cos di Energen
export const CONSENSUS = "0xCONSENSUS"; // Safety consensus bound [0.0, 1.0]

// ─── DeriveOp ─────────────────────────────────────────────────────────────────
export type DeriveOp =
  | "multiply"   // e_NEW = e_A * e_B  (contoh: Power = Voltage * Current)
  | "divide"     // e_NEW = e_A / e_B
  | "add"        // e_NEW = e_A + e_B
  | "power"      // e_NEW = e_A ^ exponent
  | "special"    // dimensi spesial global (0xCIRCULAR, 0xCONSENSUS)
  | "primitive"; // dimensi basis independen, tidak di-derive dari yang lain

// ─── ExtractedDimension ───────────────────────────────────────────────────────
// TIDAK ADA field `kind` — klasifikasi (circular/consensus) dinyatakan
// melalui relasi `derives_from: ["0xCIRCULAR"]` ke token jangkar.
export interface ExtractedDimension {
  /** Nama dimensi, contoh: "Power", "Force", "Joint_Angle" */
  name: string;
  /** Token ID yang diusulkan HLM (hex string, contoh: "0x000F") */
  proposed_id: string;
  /** Operasi turunan — "primitive" jika basis independen, "special" jika dimensi spesial */
  op: DeriveOp;
  /**
   * Token ID dimensi sumber (jika op !== "primitive").
   * Untuk circular: ["0xCIRCULAR"].
   * Untuk consensus bound: ["0xCONSENSUS"].
   */
  derives_from?: string[];
  /** Eksponen per derives_from (untuk op "power" atau multi-token) */
  exponents?: number[];
  /**
   * Referensi skala untuk normalisasi lunak: latent = sensor / unit_scale.
   * Target kisaran [0.0, 1.0] tapi TIDAK dikunci — nilai boleh negatif atau > 1.0.
   * Contoh: suhu → unit_scale = 100 (50°C → 0.5, -20°C → -0.2, 150°C → 1.5).
   * Jika null — HLM tidak bisa menentukan skala yang wajar, pakai 1.0 sebagai default.
   */
  unit_scale?: number | null;
  // TIDAK ADA: min, max, kind — gunakan derives_from anchor untuk circularity
}

// ─── ExtractedCausalWire ──────────────────────────────────────────────────────
export interface ExtractedCausalWire {
  /** Nama hukum, contoh: "Newton Second Law" */
  name: string;
  /** Ekspresi kausal dalam notasi dimensi, contoh: "F = M * L * T^-2" */
  relation: string;
  /** Token ID sebagai string hex array, contoh: ["0x0002", "0x0003"] */
  token_ids: string[];
  /** Koefisien eksponen dimensi per token, bersesuaian dengan token_ids[] */
  exponents: number[];
}

// ─── ExtractionResult ─────────────────────────────────────────────────────────
export interface ExtractionResult {
  source: {
    title: string;
    domain: "physics" | "chem" | "bio" | "econ" | "unknown";
    confidence: number; // [0.0, 1.0]
  };
  dimensions: ExtractedDimension[];
  causal_wires: ExtractedCausalWire[];
}

// ─── Validator ────────────────────────────────────────────────────────────────

const KNOWN_SPECIALS = new Set([CIRCULAR, CONSENSUS]);

export function validateExtractionResult(result: ExtractionResult): void {
  if (result.source.confidence < 0 || result.source.confidence > 1)
    throw new Error("confidence harus di [0.0, 1.0]");

  for (const dim of result.dimensions) {
    if (dim.op === "special") {
      if (!dim.derives_from?.every((id) => KNOWN_SPECIALS.has(id)))
        throw new Error(`Dimensi spesial "${dim.name}" derives_from bukan dimensi spesial yang dikenal`);
    } else if (dim.op !== "primitive" && (!dim.derives_from || dim.derives_from.length === 0)) {
      throw new Error(`Dimensi "${dim.name}" op="${dim.op}" harus punya derives_from`);
    }
    // Guard: field kind tidak boleh ada
    if ("kind" in dim)
      throw new Error(`Dimensi "${dim.name}" tidak boleh punya field "kind" — gunakan derives_from dimensi spesial`);
  }

  for (const wire of result.causal_wires) {
    if (wire.token_ids.length !== wire.exponents.length)
      throw new Error(`CausalWire "${wire.name}": token_ids.length !== exponents.length`);
  }
}
