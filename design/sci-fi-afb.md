## Sci-FI: Agent Frame Buffer (AFB)

Agent Frame Buffer (AFB) adalah varian data stream dan representasi *memory layout* khusus untuk **Sci-LM (Energen/EGG)**.

---

### Struktur Memory Layout (Biner)

AFB disusun sebagai **Flat Binary Packet** di memori. Untuk menjaga keselarasan memori 32-bit (*32-bit alignment*) dan menekan *overhead* ukuran paket, setiap paket AFB diawali oleh 4-byte Header sebelum payload:

```
┌──────────────────────────────────────────────────────────────┐
│                       AFB Packet Block                       │
├──────────────────────┬───────────────────────────────────────┤
│   Header (4 bytes)   │          Payload (N x 8 bytes)        │
├──────────┬───────────┼───────────────────┬───────────────────┤
│  Magic   │     N     │    Sci-Token 1    │    Sci-Token 2    │...
│ (0xAFB1) │ (Uint16)  │ ───┬───────────   │ ───┬───────────   │
│ (2 bytes)│ (2 bytes) │ ID │   Value   │ ID │   Value   │
└──────────┴───────────┴────┴───────────┴────┴───────────┴─
```

#### Spesifikasi Struktur:

##### A. Header (4 bytes)
* **Magic Number (2 bytes, Uint16)**: Tanda tangan identitas sekaligus versi protokol, diset kaku ke **`0xAFB1`** (merepresentasikan **"AFB Version 1"**). Digunakan untuk mendeteksi keselarasan aliran (*frame alignment*).
* **N (2 bytes, Uint16)**: Jumlah dimensi aktif unik dalam payload (mendukung hingga 65.535 dimensi aktif).

##### B. Payload (N x 8 bytes)
Setiap slot data merepresentasikan satu **sci-token** dengan format:
* **Token ID (4 bytes, Uint32)**: Menunjukkan Identitas Dimensi yang bersifat dinamis menggunakan struktur **Hierarchical Namespace**:
  * **Gene Prefix (2 bytes, Uint16 - Bit 16-31)**: Menunjukkan identifikasi modul gen asal (misal `0x000A` untuk `sar_arm`).
  * **Dimension Index (2 bytes, Uint16 - Bit 0-15)**: Menunjukkan indeks dimensi lokal di dalam gen tersebut.
  * *Contoh*: Token ID `0x000A0010` merepresentasikan dimensi `0xMASS` lokal gen `sar_arm`.
* **Value (4 bytes, Float32)**: Nilai fisis kontinu dari dimensi tersebut dalam rentang `[0.0, 1.0]`.

> **Konvensi Notasi Laten:** Untuk membedakan data diskrit dengan data kontinu di dokumen spesifikasi dan komputasi graf:
> * **`0x[NAMA_DIMENSI]`** (misal `0xDIGEST_STATUS`): Menunjukkan **Token ID** (alamat biner Hexadecimal diskrit).
> * **`0e[NAMA_DIMENSI]`** (misal `0eDIGEST_STATUS`): Menunjukkan **Vektor Embedding** (koordinat representasi kontinu di ruang laten).



* **Ukuran Total Paket**: $4 + (N \times 8)$ bytes. Karena header berukuran 4 bytes and setiap token berukuran 8 bytes, seluruh nilai 32-bit (Int32 & Float32) dalam payload akan dimulai pada alamat memori kelipatan 4 (*perfect 32-bit memory alignment*), tanpa butuh byte padding tambahan.

##### C. Format Output Segment (Egress Payload - 8 bytes per slot)
Untuk menjaga keseragaman struktur data biner, segmen output AFB menggunakan format **8 bytes per slot** (sama dengan format input) dengan struktur:

* **Token_ID (4 bytes, Uint32)**: Identitas Dimensi aksi motor (misal ID motor `0x000A0020`).
* **Action_Decision (4 bytes, Float32)**: Berupa **Tagged Float Union** (representasi IEEE 754) yang bernilai salah satu dari tiga kondisi fisis berikut:
  1. **Aksi (Action Target)**: Nilai kontinu fisis $[0.0, 1.0]$ untuk target gerakan motor.
  2. **Min Reached**: Bernilai **`-infinity`** (`0xFF800000`) untuk menandakan gerakan motor sudah menabrak batas minimum mekanis kaku.
  3. **Max Reached**: Bernilai **`+infinity`** (`0x7F800000`) untuk menandakan gerakan motor sudah menabrak batas maksimum mekanis kaku.

> **Penyelesaian Konsekuensi Fisis:** Batas limit (`min`/`max`) sudah didefinisikan secara deklaratif di dalam berkas **`motor.egg`** (pada bagian Shell-nya). Saat runtime, Energen VM akan mencocokkan hasil perhitungan GENE dengan limit Shell. Jika batas terlewati, Energen akan menulis `-infinity` atau `+infinity` ke dalam `Action_Decision`. Agent kemudian membaca sentinel status tersebut dan meneruskannya (*pass*) ke **Human Language Model (HLM)** untuk dilaporkan ke user.


---



### Dimensi Primitif (Primitive Dimensions)

Untuk menjaga minimalitas kosakata laten, AFB mendefinisikan 9 dimensi primitif utama. Seluruh dimensi turunan/kompleks lainnya direpresentasikan sebagai interaksi kausal dari primitif ini:

#### 1. Primitif Fisik (SI Base Quantities)
* **`0xMASS`** ($M$) — Besaran massa materi murni.
* **`0xLENGTH`** ($L$) — Ukuran spasial/jarak (nano hingga makro).
* **`0xTIME`** ($T$) — Durasi waktu (termasuk frekuensi/periodisitas $1/T$).
* **`0xTEMPERATURE`** ($\Theta$) — Suhu termodinamika.
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
* **`0xUNIT`** (Reserved) — Indikasi konversi unit/satuan fisis.

#### 5. Dimensi Telemetri & Sandbox Sistem (System Telemetry & Sandbox Dimensions)
Untuk mendukung pengawasan mandiri (*self-monitoring*), AFB mendaftarkan token telemetri VM, compiler, dan status input stream secara native di ruang AFB:

##### A. Telemetri Virtual Machine (Energen VM Guard)
* **`0xVM_MEMORY`** (`0xE0`) — Penggunaan memori VM relatif terhadap batas aman.
* **`0xVM_CPU`** (`0xE1`) — Konsumsi siklus CPU per transisi state.
* **`0xSTACK_DEPTH`** (`0xE2`) — Tingkat kedalaman rekursi tumpukan fungsi.
* **`0xOUT_OF_BOUNDS`** (`0xE3`) — Sinyal pelanggaran penulisan batas alamat memori.
* **`0xVM_PANIC`** (`0xE4`) — Output Head: Pemicu mematikan VM secara darurat (halt).

##### B. Telemetri Compiler (Ovipar Guard)
* **`0xINGEST_ENTROPY`** (`0xD0`) — Kerumitan/entropi bahasa dari dokumen input.
* **`0xCAUSAL_CYCLE`** (`0xD1`) — Adanya siklus kausalitas melingkar di DAG.
* **`0xALIGN_DRIFT`** (`0xD2`) — Deviasi perataan memori biner EGG.
* **`0xSECRET_EXPOSURE`** (`0xD3`) — Rasio kebocoran data rahasia/token dari env.
* **`0xCOMPILER_VALIDITY`** (`0xD4`) — Output Head: Status kelayakan kompilasi biner EGG.

##### C. Telemetri Input Stream (AFB Guard)
* **`0xINPUT_OUT_OF_RANGE`** (`0xF0`) — Adanya input koordinat di luar batas fisis `[0, 1]`.
* **`0xINPUT_MUTATION_RATE`** (`0xF1`) — Rasio kebisingan / kecepatan perubahan ekstrim data input.
* **`0xINPUT_FORMAT_VALID`** (`0xF2`) — Validitas format biner ADN dan checksum.
* **`0xINPUT_SAFETY_STATUS`** (`0xF3`) — Output Head: Status izin teruskan data ke runtime.

#### 6. Pemetaan Hukum Kimia & Biologi (Derived Laws Mapping)

Konsep dan hukum dalam kimia serta biologi diekspresikan sebagai hubungan kausal antar dimensi primitif ini di dalam EGG:

##### Kimia (Chemistry)
* **Stoikiometri & Massa Molar**: Hubungan kausal antara `0xMASS` (massa) $\leftrightarrow$ `0xAMOUNT` (jumlah zat/mol).
* **Kinetika Kimia (Laju Reaksi)**: Hubungan dinamis antara `0xTIME` (kecepatan reaksi) $\leftrightarrow$ `0xAMOUNT` (konsentrasi reaktan) $\leftrightarrow$ `0xTEMPERATURE` (energi aktivasi suhu via hukum Arrhenius).
* **Termokimia**: Hubungan pelepasan/penyerapan energi `0xLUMINOUS` / `0xTEMPERATURE` $\leftrightarrow$ `0xAMOUNT` (zat bereaksi).
* **Elektrokimia (Hukum Nernst)**: Interaksi antara `0xCURRENT` (transfer elektron/potensial) $\leftrightarrow$ `0xTEMPERATURE` $\leftrightarrow$ `0xAMOUNT` (konsentrasi ion).

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
