## Omni-Interaction: Technology Stacks

Dokumen ini mendefinisikan pembagian teknologi, konfigurasi kompilasi, dan integrasi antar-bahasa menggunakan **Bun (TypeScript)** dan **Zig**.

---

### Tech Stack Mapping

Arsitektur dibagi secara kaku menjadi dua zona performa: **Zona Orkestrasi & Teks** (diperintah oleh Bun) dan **Zona Komputasi Numerik** (diperintah oleh Zig).

```
                      ZONA BANYAK ALOKASI MEMORI (BUN)
 ┌──────────────────────┐        ┌──────────────────────┐
 │     Agent Input      ├───────→│     Brain-Agent      │
 │ (Senses/Linter/Text) │        │ (Orchestrator/State) │
 └──────────────────────┘        └──────────┬───────────┘
                                            │
                             (Bun FFI /     │ (ADN Protocol)
                             mmap sharing)  ▼
                                      ┌───────────┐
                                      │ hlm-agent │
                                      └───────────┘
 ─────────────────────────────────────────────────────────────
                      ZONA COMPUTE DETERMINISTIK (ZIG)
                                            │
                                            ▼
                                     ┌─────────────┐
                                     │   Energen   │
                                     │ (EGG Engine)│
                                     └─────────────┘
```

| Komponen | Bahasa / Runtime | Format Output / Kerja |
| --- | --- | --- |
| **Ovipar** | Bun / TypeScript | Ingesti & Normalisasi data |
| **Ovipositor** | Bun / TypeScript | Merakit & Menulis berkas biner `.egg` |
| **Brain-Agent** | Bun / TypeScript | Sockets, IPC, Orkestrasi, FFI |
| **hlm-agent** | Bun / TypeScript | Mengintegrasikan/wrap LLM standar (untuk prompt assembly & output parsing) |
| **sci-agent** | Bun / TypeScript | Wrapper untuk FFI Energen |
| **Energen** | Zig | Mesin hitung biner (EGG Execution) |

---

### Spesifikasi Implementasi

#### 1. Bun Stack (TypeScript)
* **API Utama**: `Bun.FFI` (untuk memanggil library Zig secara langsung di kecepatan native), `Bun.serve` (untuk websocket/TCP distributed agents), dan `Bun.spawn` (untuk IPC fallback).
* **Memory Sharing**: Menggunakan `Uint8Array` / `Float32Array` dari JavaScript untuk dialirkan langsung sebagai pointer ke memori C/Zig tanpa proses penyalinan (*zero-copy*).

#### 2. Zig Stack
* **Fitur Utama**: Manual Memory Allocator (`std.heap.page_allocator` atau `std.heap.ArenaAllocator`), SIMD Vectorization (`@Vector` di Zig untuk komputasi dot-product paralel), dan native memory mapping (`std.os.mmap`).
* **Kompilasi**: Dikompilasi menjadi Shared Library (`.dll` di Windows, `.so` di Linux) dengan C ABI (`export` functions).

---

### Spesifikasi Integrasi (Bun FFI ↔ Zig)

Berikut adalah cetak biru integrasi memori antara orkestrator Bun dan runtime Zig:

#### Sisi Zig (`energen.zig`)
```zig
const std = @import("std");

// Ekspor fungsi menggunakan C ABI agar bisa dibaca Bun FFI
export fn execute_egg(egg_ptr: [*]const u8, afb_input_ptr: [*]const f32, afb_output_ptr: [*]f32, size: u32) callconv(.C) void {
    // 1. egg_ptr dipetakan langsung ke struktur EGG (ConstraintValidator, CausalAttentionCore, dll)
    // 2. Baca afb_input_ptr (Front Buffer)
    // 3. Hitung attention loop
    // 4. Tulis hasil ke afb_output_ptr
}
```

#### Sisi TypeScript/Bun (`sci-agent.ts`)
```typescript
import { dlopen, FFIType, ptr } from "bun:ffi";

// Load library kompilasi Zig secara dinamis
const { symbols } = dlopen("libenergen.dll", {
  execute_egg: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32],
    returns: FFIType.void,
  },
});

// Alokasikan buffer data di memori
const eggBuffer = new Uint8Array(eggFileBytes);
const afbInput = new Float32Array(12 * 2); // N = 12 (Index, Value)
const afbOutput = new Float32Array(12 * 2);

// Jalankan fungsi Zig dengan kecepatan native C (Zero-Copy)
symbols.execute_egg(
  ptr(eggBuffer),
  ptr(afbInput),
  ptr(afbOutput),
  12
);
```
