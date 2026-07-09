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

### Pipeline Kompilasi Detail (4 Tahapan)

#### 1. Ingesti Dokumen Sains (LaTeX)
* Ovipar menerima dokumen sains mentah (Raw Paper) yang umumnya mengandung deskripsi teoritis dan notasi rumus matematis berformat **LaTeX/TeX** ($\text{\LaTeX}$).

#### 2. Ekstraksi HLM ke ADN
* Dokumen didelegasikan ke HLM (`mt-infer`) untuk mengekstrak rumus LaTeX dan memampatkan hubungan dimensi fisis tersebut menjadi struktur **ADN** (Agent Data Notation) berformat JSON terstruktur.

#### 3. Resolusi Dimensi & Yolk Wiring (Penyolderan Graf)
* Ovipar menerima ADN, memetakan token ID dimensi terhadap registri lokal, menghitung normalisasi `unit_scale` (linear/circular), dan menyolder silsilah ketergantungan (Causal DAG) menjadi instruksi sirkuit Yolk.

#### 4. Produksi EGG (Egg Laying)
* Ovipositor mengemas tabel registri gen dan nilai inisial data state vector dari ADN menjadi berkas biner tunggal `.egg` terkompresi dengan penyelarasan memori 8-byte untuk dieksekusi oleh VM. Detail format biner kontainer diatur di berkas spesifikasi [sci-fi-egg.md](file:///F:/work/00-oss/maintenis/pakakas/sci-fi/design/sci-fi-egg.md).


---

## 6. Mini Energen (Compile-Time Evaluator)

Mini Energen adalah simulator deterministik murni matematika yang ditulis dalam TypeScript langsung di dalam pustaka `ovipar`. Tugasnya adalah melakukan **dry-run** dan **simulasi fungsional** terhadap instruksi wiring Yolk hasil ekstraksi HLM sebelum dibakar ke berkas biner `.egg`.

### A. Alur Kerja Evaluasi
Mini Energen menerima daftar instruksi penyolderan (`DimWireInstruction[]`) dan set nilai sensor fisik kasar dari host (`inputs: Record<string, number>`), lalu mengevaluasi nilai laten satu-per-satu sesuai urutan ketergantungan DAG:

1. **Ingress Normalization**:
   - Dimensi primitif linear: `latent = raw / unit_scale`.
   - Dimensi sirkular (radian): Ditingkatkan dimensinya menjadi dual-channel koordinat unit circle $[sin, cos]$ di rentang $[0.0, 1.0]$:
     $$\text{sin\_ch} = \frac{\sin(\theta_{\text{rad}}) + 1}{2}, \quad \text{cos\_ch} = \frac{\cos(\theta_{\text{rad}}) + 1}{2}$$
2. **Yolk Execution Loop**:
   Mengevaluasi operasi aljabar linier pada sumbu laten sesuai operator:
   - **`multiply`**: 
     - Scalar-scalar: $a \cdot b$
     - Scalar-vector (proyeksi gaya circular): $s \cdot [x, y] = [s \cdot x, s \cdot y]$
   - **`divide`**: $\frac{a}{b}$
   - **`add`**: Penjumlahan linear atau penjumlahan vektor $[x_1 + x_2, y_1 + y_2]$
   - **`power`**: $a^x$
   - **`dot_product`**: Perkalian dot product untuk korelasi dua koordinat sirkular: $x_1 x_2 + y_1 y_2$
   - **`relu`**: Deteksi pelanggaran batas konsensus: $\max(0.0, \text{actual} - \text{limit})$
3. **Egress Reconstruction**:
   Menghitung kembali koordinat circular unit vector $[x, y]$ menjadi sudut radian fisik tunggal untuk aktuator menggunakan:
   $$\theta_{\text{rad}} = \text{atan2}(2 \cdot x - 1, 2 \cdot y - 1)$$

