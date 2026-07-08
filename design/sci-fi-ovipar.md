## Sci-FI: Ovipar & Ovipositor

**Ovipar** adalah sub-sistem kompilasi model di dalam Sci-FI. Tugasnya bukan sebagai parser teks, melainkan sebagai **compiler driver (Wire-man)** — ia mendelegasikan tugas "membaca & memahami" dokumen sains ke **HLM** (via `mt-infer`), lalu menerima hasil ekstraksi terstruktur dan merakitnya menjadi biner `.egg`.

**Ovipositor** adalah perangkat fisik (compiler CLI/tool) yang menulis layout biner `.egg` ke disk.

---

### Filosofi Arsitektur: Kognitif vs. Deterministik

Pemisahan tugas kaku antara dua komponen:

| Komponen | Sifat | Tugas |
|---|---|---|
| **HLM (`mt-infer`)** | Kognitif & Probabilistik | "Membaca" paper, mengekstrak dimensi & relasi rumus, output JSON terstruktur |
| **Ovipar** | Deterministik & Compiler | Menerima JSON dari HLM, validasi tipe, wiring Yolk, produksi biner `.egg` |

Ovipar **tidak pernah** membaca dokumen sains secara langsung. Ia hanya memproses **output terstruktur dari HLM**. Ini berarti:
- Paper baru dengan rumus baru → tidak perlu ubah satu baris kode Ovipar
- Cukup feed paper ke pipeline → HLM ekstrak → Ovipar compile otomatis

---

### Notasi & Sistem Prefix (Textual Representation)

Untuk mempermudah pemahaman kognitif di level spesifikasi dan DSL sebelum dikompilasi, HLM dan manusia menggunakan sistem notasi prefix:
*   **`0x`** (Runtime Sensor): Input sensor fisis dinamis (misal `0xTEMPERATURE` atau `0xWIND_DIR`).
*   **`0e`** (Runtime Latent Coordinate): Sumbu koordinat laten aktif di dalam VM.
*   **`0v`** (Compile Static Value): Nilai batas/konstanta fisis kaku yang ditanam di biner (misal `0vMAX_LIMIT`).

---

### Alur Pipeline Kompilasi

```
[Paper Sains Baru (PDF/Teks)]
            │
            ▼ (Ovipar membaca file mentah)
     ┌──────────────┐
     │   OVIPAR     │ ──(Kirim Teks)──► [ HLM via mt-infer ]
     │  (Pipeline   │                   * Menebak dimensi fisis & prefix (0x/0e/0v)
     │   Driver)    │ ◄──(Hasil JSON)─── * Mengekstrak relasi rumus & silsilah jangkar
     └──────┬───────┘
            │
            ▼ (Validasi Tipe + Yolk Wiring + Biner Assembly)
     [ .egg Binary ]
```

**Output JSON dari HLM** berisi pemetaan silsilah dimensi (tidak ada metadata kaku `Kind`, melainkan relasi graf eksplisit ke jangkar fisis `0xCIRCULAR` atau `0xCONSENSUS`):

```json
{
  "dimensions": [
    { "name": "Power", "localId": "0x000F", "derives_from": ["0x0002", "0x0003"], "op": "multiply" },
    { "name": "Joint_Angle", "localId": "0x0010", "derives_from": ["0xCIRCULAR"] }
  ],
  "causal_wires": [
    { "name": "Joule Power Law", "tokens": ["0x0002", "0x0003"], "exponents": [1, 1] }
  ]
}
```

---

### Mekanisme Wiring Yolk (Penyolderan Dimensi)

Ovipar berperan sebagai **"Wire-man" (tukang solder)** yang mengikuti instruksi JSON dari HLM:

#### Langkah 1: Cek Komponen yang Sudah Ada
Ovipar cek daftar dimensi stabil yang sudah terdaftar:
- `Voltage` (`0x0002`) sudah ada? **Ada** → pakai langsung.
- `Current` (`0x0003`) sudah ada? **Ada** → pakai langsung.

#### Langkah 2: Penyolderan Bobot di Yolk (Wiring)
Dimensi baru `Power` (`0x000F`) **tidak dapat sumbu koordinat baru yang acak**. Ovipar langsung menyolder hubungan kausal di matriks Yolk:
$$\mathbf{e}_{\text{POWER}} = s_{\text{VOLTAGE}} \cdot s_{\text{CURRENT}} \cdot \mathbf{e}_{\text{base\_power}}$$
Instruksi biner Yolk: `0x000F = Multiply(0x0002, 0x0003)`.

#### Langkah 3: Deklarasi Primitif Baru (jika komponen belum ada)
Kalau `what`-nya belum terdaftar → Ovipar deklarasikan sebagai sumbu basis primitif baru lebih dulu, baru di-wiring.

---

### Keunggulan Arsitektur

| Properti | Dampak |
|---|---|
| **Konservasi Ruang Laten** | Dimensi turunan tidak buang slot baru — numpang di atas dimensi stabil |
| **Keterlacakan Silsilah** | `0xPOWER` → dependensi fisis ke `0xVOLTAGE` + `0xCURRENT` bisa di-trace |
| **Kompilasi Sekali Jalan** | Pemetaan indeks `0x000F = Multiply(0x0002, 0x0003)` → instruksi biner Yolk langsung |
| **Extensible tanpa Recompile** | Paper baru → HLM ekstrak → Ovipar compile, zero code change |

---

### Pipeline Kompilasi Detail (5 Tahapan)

#### 1. Ingesti & Delegasi ke HLM
* Ovipar membaca file sains mentah (`docs`: teks markdown, PDF, database).
* **Mendelegasikan** konten teks ke HLM via `mt-infer` untuk ekstraksi kognitif.
* HLM output: JSON berisi dimensi fisis, relasi rumus, dan tipe kausalitas.

#### 2. Atomisasi (Validasi Dimensi Primitif)
* Ovipar menerima JSON dari HLM → validasi token ID dimensi terhadap registry.
* Dimensi yang belum ada → deklarasikan sebagai **Atom** primitif baru di Shell.
* Tanam nilai `unit_scale` dari output HLM ke Shell biner: `latent = sensor / unit_scale`.
  - `unit_scale` bukan batas keras — hanya referensi skala agar nilai laten berkisar [0.0, 1.0].
  - Nilai boleh negatif dan boleh melebihi 1.0. Tidak ada clamping.

#### 3. Molekularisasi (Causal DAG Wiring)
* Bangun grafik kausalitas satu arah (Causal DAG) dari relasi `derives_from` di JSON.
* Menyatukan $M \cdot L \cdot T^{-2}$ → molekul `0xFORCE` via instruksi Yolk.
* Isi matriks **Membrane** (causal mask DAG).

#### 4. Sintesis & Penyuntikan Gen
* Kelompokkan dimensi ke dalam **GENE** spesifik perangkat (misal `sar_arm`, `singer_core`).
* Ovipositor inject gen-gen ini ke segmen biner EGG terpisah.

#### 5. Produksi EGG (Egg Laying)
* Ovipositor tulis semua segmen (Shell, Albumin, Membrane, Yolk, Chalaza) ke berkas biner tunggal `.egg` dengan layout 8-byte aligned untuk `mmap` instan oleh **Energen**.
