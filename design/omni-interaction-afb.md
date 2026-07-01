## Omni-Interaction: Agent Frame Buffer (AFB)

Agent Frame Buffer (AFB) adalah varian data stream dan representasi *memory layout* khusus untuk **Sci-LM (Energen/EGG)**.

---

### Struktur Memory Layout (Biner)

AFB disusun sebagai **Flat Binary Array** di memori tanpa overhead struktur objek high-level. Setiap slot data merepresentasikan satu **sci-token**:

```
┌─────────────────────────────────────────────────────────────┐
│                       AFB Memory Block                      │
├──────────────────┬──────────────────┬──────────────────┬────┤
│   Sci-Token 1    │   Sci-Token 2    │   Sci-Token 3    │... │
├────────┬─────────┼────────┬─────────┼────────┬─────────┼────┤
│ Index  │  Value  │ Index  │  Value  │ Index  │  Value  │    │
│ (Int32)│(Float32)│ (Int32)│(Float32)│ (Int32)│(Float32)│    │
│ 4 bytes│ 4 bytes │ 4 bytes│ 4 bytes │ 4 bytes│ 4 bytes │    │
└────────┴─────────┴────────┴─────────┴────────┴─────────┴────┘
```

#### Spesifikasi Struktur:
* **Index (4 bytes, Int32)**: Menunjukkan Token ID atau Indeks Dimensi (misal `0x10` untuk `0xLOGP`, `0x13` untuk `0xHZ`).
* **Value (4 bytes, Float32)**: Nilai kontinu dari dimensi tersebut yang sudah dinormalisasi kaku ke rentang `[0.0, 1.0]` (untuk linear) atau dual channel `[0.0, 1.0]` (untuk circular).
* **Ukuran Tetap**: Ukuran buffer total adalah $N \times 8$ bytes, di mana $N$ adalah jumlah dimensi aktif maksimum yang disepakati saat inisialisasi stream.

---

### Dimensi Primitif (Primitive Dimensions)

Untuk menjaga minimalitas kosakata laten, AFB mendefinisikan 9 dimensi primitif utama. Seluruh dimensi turunan/kompleks lainnya direpresentasikan sebagai interaksi kausal dari primitif ini:

#### 1. Primitif Fisik (SI Base Quantities)
* **`0xMASS`** ($M$) — Besaran massa materi murni.
* **`0xLENGTH`** ($L$) — Ukuran spasial/jarak (nano hingga makro).
* **`0xTIME`** ($T$) — Durasi waktu (termasuk frekuensi/periodisitas $1/T$).
* **`0xTEMP`** ($\Theta$) — Suhu termodinamika.
* **`0xCURRENT`** ($I$) — Arus listrik dan muatan elektromagnetik.
* **`0xAMOUNT`** ($N$) — Jumlah zat kimia / konsentrasi partikel.
* **`0xLUMINOUS`** ($J$) — Intensitas cahaya / kekuatan emisi energi optik.

#### 2. Primitif Sistem Formal (Information & Computation)
* **`0xBIT`** (Information) — Kuantitas informasi, entropi Shannon, atau kapasitas data.
* **`0xSTATE`** (Boolean State) — Status keadaan biner diskrit (0 atau 1).

#### 3. Primitif Kebijakan & Ambang Batas (Policy & Threshold Primitives)
* **`0xMAX`** (Maximum Limit) — Batas atas absolut atau nilai maksimum toleransi standar.
* **`0xMIN`** (Minimum Limit) — Batas bawah absolut atau nilai minimum kelayakan standar.
* **`0xCONSENSUS`** (Consensus Scale) — Skala/kebijakan keketatan yang ditentukan oleh sistem (rentang `[0.0, 1.0]`).

#### 4. Dimensi Cadangan (Reserved Meta-Dimensions)
* **`0xKIND`** (Reserved) — Indikasi tipe data dimensi (`linear` / `circular`).
* **`0xUNIT`** (Reserved) — Indikasi konversi unit/satuan fisik.

#### 5. Pemetaan Hukum Kimia & Biologi (Derived Laws Mapping)
Konsep dan hukum dalam kimia serta biologi diekspresikan sebagai hubungan kausal antar dimensi primitif ini di dalam EGG:

##### Kimia (Chemistry)
* **Stoikiometri & Massa Molar**: Hubungan kausal antara `0xMASS` (massa) $\leftrightarrow$ `0xAMOUNT` (jumlah zat/mol).
* **Kinetika Kimia (Laju Reaksi)**: Hubungan dinamis antara `0xTIME` (kecepatan reaksi) $\leftrightarrow$ `0xAMOUNT` (konsentrasi reaktan) $\leftrightarrow$ `0xTEMP` (energi aktivasi suhu via hukum Arrhenius).
* **Termokimia**: Hubungan pelepasan/penyerapan energi `0xLUMINOUS` / `0xTEMP` $\leftrightarrow$ `0xAMOUNT` (zat bereaksi).
* **Elektrokimia (Hukum Nernst)**: Interaksi antara `0xCURRENT` (transfer elektron/potensial) $\leftrightarrow$ `0xTEMP` $\leftrightarrow$ `0xAMOUNT` (konsentrasi ion).

##### Biologi (Biology)
* **Transpor Membran (Difusi/Osmosis)**: Hambatan spasial `0xLENGTH` (ketebalan membran/radius molekul) $\leftrightarrow$ `0xCURRENT` (gradien muatan) $\leftrightarrow$ `0xAMOUNT` (gradien konsentrasi / LogP kelarutan).
* **Kinetika Enzim (Michaelis-Menten)**: Hubungan `0xTIME` (laju katalisis) $\leftrightarrow$ `0xAMOUNT` (konsentrasi substrat & enzim).
* **Dinamika Populasi & Viabilitas**: Laju pertumbuhan `0xAMOUNT` (jumlah sel/organisme) $\leftrightarrow$ `0xTIME` $\leftrightarrow$ `0xAMOUNT` (daya dukung nutrisi/sumber daya).

---

### Mekanisme Swap Double-Buffering

Untuk menghindari hambatan I/O (*read-write race condition*) saat sensor menulis data dan Energen membaca data secara bersamaan, AFB menggunakan sistem **Double-Buffering**:

```
[ Sensor / Input ] ───(Tulis)───→ [ Back Buffer ] 
                                        │
                                  (Pointer Swap)  ← Instan O(1)
                                        │
[ Energen / Yolk ] ───(Baca)────→ [ Front Buffer ]
```

1. **Front Buffer**: Pointer memori yang sedang dibaca oleh **Energen** untuk melakukan kalkulasi attention. Berstatus *Read-Only* bagi pengirim data.
2. **Back Buffer**: Pointer memori yang sedang ditulis oleh **agent-input** atau **brain-agent** dengan data sensor terbaru. Berstatus *Write-Only* bagi runtime.
3. **Swap Trigger**: Begitu Energen selesai memproses satu frame dan Back Buffer selesai diisi penuh oleh input baru, pointer memori ditukar (*swapped*) secara instan ($O(1)$) tanpa penyalinan data fisik di RAM.

---

### Keunggulan Desain AFB

1. **Zero Heap Allocation**: Alokasi memori dilakukan sekali di awal (*pre-allocated*). Selama execution loop berjalan, tidak ada objek baru yang dibuat di heap, membebaskan sistem dari latensi Garbage Collection.
2. **Hardware-Friendly**: Layout linear $N \times 8$ bytes ini sangat mudah disalin langsung ke memori GPU/NPU menggunakan perintah `memcpy` standar untuk akselerasi perangkat keras.
