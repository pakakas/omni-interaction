## Executable Graph Geometry (EGG)

**Executable Graph Geometry (EGG)** adalah format berkas biner terkompresi yang menampung model hukum sains hasil kompilasi **Ovipar**. Berkas `.egg` dirancang agar selaras dengan memori (*memory aligned*) sehingga dapat dipetakan langsung menggunakan `mmap` ke ruang alamat memori **Energen VM** tanpa overhead parsing atau alokasi heap dinamis saat runtime.

Secara anatomi logis, struktur internal berkas ini dimodelkan seperti anatomi telur fisis:

```
               ,---------------,
             ./   SHELL         \.     ← Hard bounds: dimension min/max/kind
            /   ,------------,   \
           /   /  ALBUMIN     \   \    ← Embedding layer: AFB → vector
          /   /   ,--------,   \   \
         /   /   / MEMBRANE \   \   \  ← Causal mask: DAG enforcement
        |   |   |   ,----,   |   |   |
        |   |   |   |YOLK|===|===|===| ← CHALAZA (Anchor: keeps yolk to laws)
        |   |   |   '----'   |   |   |
         \   \   \          /   /   /
          \   \   '--------'   /   /
           \   '--------------'   /
            '\                   /'
              '-----------------'
```

### Anatomi Logis EGG

1.  **Shell**: Cangkang luar keras (*ingestion-time validator*). Bertugas memvalidasi bahwa batas fisis dan konfigurasi dimensi EGG cocok dengan spesifikasi fisik robot sebelum diserap oleh VM.
2.  **Albumin**: Lapisan putih telur (*embedding layer*). Bertugas menerjemahkan data fisis kasar AFB menjadi representasi vektor laten internal saat runtime.
3.  **Membrane**: Selaput kuning telur (*causal mask layer*). Bertugas membungkus Yolk dan menegakkan hukum kausalitas DAG pada sirkuit attention.
4.  **Yolk**: Kuning telur (*core attention weights*). Di sinilah matriks bobot attention (*self-attention* & *cross-attention*) disimpan sebagai logika fisis.
5.  **Chalaza**: Tali kuning telur (*regularization anchor*). Menambatkan Yolk agar tidak bergeser (*drift*) dari struktur kausal saat fine-tuning lokal.

---

### 1. Struktur Biner Kontainer EGG (Layout v1)

Berkas `.egg` disusun sebagai blok biner linier tunggal dengan tiga segmen utama:

```
+-------------------------------------------------------+
|  Header (16 bytes)                                    |
+-------------------------------------------------------+
|  Gene Register Table (gene_count x 16 bytes)          |
|  - Aligned to 8 bytes                                 |
+-------------------------------------------------------+
|  Gene Payload (Float32 arrays)                        |
|  - Aligned to 8 bytes per gene                        |
+-------------------------------------------------------+
```

---

### 2. Spesifikasi Segmen Biner

#### A. Header Utama (Offset `0x00` - `0x0F`)
Header berukuran **16 bytes** (selaras 8-byte) yang mengidentifikasi tipe berkas, versi kontainer, dan batas ukuran payload:

| Range Byte | Tipe Data | Nama Field | Deskripsi |
| --- | --- | --- | --- |
| `0x00` - `0x01` | `uint16` | `MAGIC` | Identitas tanda tangan berkas (big-endian), diset kaku ke **`0xE661`**. |
| `0x02` - `0x03` | `uint16` | `VERSION` | Versi format biner kontainer (little-endian), diset kaku ke **`1`**. |
| `0x04` - `0x07` | `uint32` | `GENE_COUNT` | Jumlah total entri gen yang terdaftar di dalam Tabel Registri (little-endian). |
| `0x08` - `0x0B` | `uint32` | `PAYLOAD_SIZE` | Total ukuran byte dari seluruh segmen payload gen (little-endian). |
| `0x0C` - `0x0F` | `uint32` | `RESERVED` | Cadangan untuk penyelarasan memori, diset kaku ke **`0`**. |

---

#### B. Tabel Registri Gen (`GENE_REGISTER_TABLE`)
Tabel ini bertugas memetakan alokasi masing-masing gen di dalam blok memori payload. Tabel dimulai tepat pada offset **`0x10`**, dengan ukuran **16 bytes per entri** (little-endian):

| Offset Relatif | Tipe Data | Nama Field | Deskripsi |
| --- | --- | --- | --- |
| `+0` (4 bytes) | `uint32` | `Dimension_ID` | Token ID dimensi fisis unik (misal: `0x0004` untuk `CURRENT`). |
| `+4` (4 bytes) | `uint32` | `Byte_Offset` | Offset awal data gen ini dihitung dari awal segmen Payload (harus kelipatan 8). |
| `+8` (4 bytes) | `uint32` | `Value_Count` | Jumlah nilai float32 yang disimpan. `1` untuk linear, `2` untuk circular. |
| `+12` (4 bytes) | `float32` | `Unit_Scale` | Skala normalisasi lembut (*soft-scaling*) untuk sumbu laten fisis ini. |

> [!NOTE]
> Panjang tabel adalah `GENE_COUNT * 16` bytes. Jika panjang tabel tidak kelipatan 8, padding kosong (`0x00`) akan ditambahkan di akhir tabel untuk memastikan segmen payload berikutnya tetap selaras pada batas 8-byte (*8-byte boundary*).

---

#### C. Payload Gen (`Gene Payload`)
Segmen payload menampung nilai numerik awal (*initial states*) dari dimensi-dimensi aktif dalam bentuk **Float32 array** linier:
*   Setiap gen menempati ruang memori sebesar `Value_Count * 4` bytes.
*   Penyelarasan **8-byte alignment** wajib diterapkan pada akhir data masing-masing gen. Jika `Value_Count` ganjil (seperti sumbu linear dengan `Value_Count = 1` yang memakan 4 bytes), ditambahkan padding kosong sebesar 4 bytes sebelum data gen berikutnya ditulis.

---

### 3. Keunggulan Desain Penyederhanaan EGG v1

1.  **Zero-Heap & Fast Boot**: VM Energen dapat langsung memetakan berkas `.egg` menggunakan `mmap` dan membaca data dari pointer memori fisik secara langsung tanpa melakukan alokasi memori heap baru atau *copying* data.
2.  **Akselerasi SIMD Ramah CPU/NPU**: Penyelarasan memori kaku 8-byte memastikan pointer Float32 array dapat dimuat langsung ke dalam register CPU vector (`@Vector` di Zig / AVX2 / ARM NEON) secara branchless tanpa penalti *unaligned memory access*.
3.  **Bebas Metadata Kind & Limit**: Klasifikasi tipe dimensi (circular vs linear) tidak membutuhkan *type flags* atau batas limit keras fisis di level biner EGG. Karakteristik circular dan batas consensus diidentifikasi murni lewat relasi graf (Causal DAG / ADN) yang disolder ke instruksi sirkuit Yolk.

---

### Pemetaan Transisi: Kontainer EGG vs. Hatched Runtime (Energen)

Saat berkas `.egg` selesai dicerna ("menetas"), seluruh metafora biologis dilepas. Di dalam memori aktif **Energen**, setiap elemen EGG beralih fungsi menjadi modul sistem komputer berkinerja tinggi:

| Struktur EGG (Sebelum Menetas) | Komponen Hatched (Setelah Menetas) | Tipe Data & Representasi Memori | Fungsi Operasional Runtime |
| --- | --- | --- | --- |
| **Shell** | **`BoundsGuard`** | `const struct[]` (Static Struct Array) | **Validasi & Clamping Fisis**: Melakukan pengecekan batas keras (*hard bounds check*) pada input AFB sebelum dialokasikan, dan menjamin output motor fisis tidak melampaui limit fisik mesin. |
| **Albumin** | **`LinearProjector`** | `float32*` (Continuous Weight Tensor) | **Laten Projection**: Bertindak sebagai matriks bobot proyeksi linear untuk merubah data fisis mentah $[0, 1]$ menjadi representasi vektor laten internal. |
| **Membrane** | **`CausalAttentionMask`** | `float32*` (Packed Boolean Mask: $0$ / $-\infty$) | **Gating Softmax**: Matriks filter kausalitas yang dipasang langsung pada sirkuit softmax untuk mengeblokir total (`-inf` / `0xFF800000`) jalur perhatian yang melanggar hukum alam. |
| **Yolk** | **`AttentionCore`** | `float32*` (Query, Key, Value Weight Matrices) | **Evolusi Causal Graph**: Tensor bobot utama yang mengeksekusi operasi perkalian *dot-product attention* untuk memproses kausalitas dinamis antar-dimensi. |
| **Chalaza** | **`ConstraintAnchor`** | `float32*` (Boundary Penalty Vector) | **Pencegah Drifting**: Vektor batasan penalti regulasi (*weight decay penalties*) yang membatasi pergeseran bobot sirkuit attention saat sistem melakukan *local fine-tuning*. |
| **Gene** | **`RuntimeModule`** | `struct` (Executable Computational Graph Module) | **Unit Eksekusi Aktif**: Modul mandiri yang menampung seluruh fungsionalitas di atas. `RuntimeModule` adalah komponen yang *reusable* (tetap hidup di memori) untuk terus-menerus mengeksekusi data input AFB. |

```
┌─────────────────────────────────┐
│     EGG FILE (Sebelum Menetas)  │
├─────────────────────────────────┤
│ [Shell] [Albumin] [Membrane]    │
│ [Yolk]  [Chalaza] [GENE Block]  │
└────────────────┬────────────────┘
                 │
                 ▼ (Proses Ingesti / Menetas)
┌────────────────────────────────────────────────────────┐
│             ENERGEN RUNTIME (Setelah Menetas)          │
├────────────────────────────────────────────────────────┤
│  [BoundsGuard] ──────(Proteksi Batas Input-Output)     │
│       │                                                │
│  [LinearProjector] ──(Normalisasi & Proyeksi Laten)    │
│       │                                                │
│  [RuntimeModule] ────(GENE yang Hidup Menetap & Reusable)│
│       ├─► [CausalAttentionMask] (Masking Softmax)      │
│       └─► [AttentionCore]       (Kalkulasi Kausalitas) │
│       └─► [ConstraintAnchor]    (Proteksi Fine-Tuning) │
└────────────────────────────────────────────────────────┘
```

---

### Komposisi EGG via Gene Injection & Lazy Loading

Untuk mendukung fleksibilitas perangkat keras yang dinamis—seperti memindahkan tangan/lengan fisik **SAR-bot** ke tubuh **Singer-bot**—EGG tetap mempertahankan layout anatomi terpadunya (Shell, Albumin, Membrane, Yolk, Chalaza), namun proses pembuatan dan eksekusinya menggunakan konsep **Gene Injection** dan **Lazy Loading**:

#### 1. Gene Injection (Fase Kompilasi EGG)
Saat kompilasi oleh **Ovipositor** (tool compiler), EGG dibangun dengan cara menyuntikkan satu atau beberapa **GENE** (modul hukum sains/perangkat keras spesifik, seperti `sar_arm` atau `singer_core`):

```
[ GENE: singer_core ] ───┐
                         ├──(Inject)──→ [ Unified EGG File ]
[ GENE: sar_arm ] ───────┘              (Berisi segmen terpisah per gen)
```

File `.egg` hasil kompilasi tetap berupa satu berkas biner terpadu yang terbagi menjadi segmen-segmen gen.

#### 2. Lazy Loading oleh Energen (Fase Runtime)
Saat robot menyala, Energen tidak me-load seluruh isi EGG ke memori untuk menghemat resource (RAM & startup time):

1. **Host Boot**: Energen hanya me-load segmen gen dasar (`singer_core`) ke memori aktif.
2. **On-Demand Activation (Lazy Load)**:
   Ketika sensor mendeteksi lengan fisik SAR-bot dipasang, `brain-agent` mengirimkan sinyal aktif. Energen langsung melakukan **lazy load** (`mmap` dinamis) pada segmen gen `sar_arm` yang ada di dalam EGG.
3. **Penyambungan Runtime**:
   * **Shell**: Batas parameter `sar_arm.0xMASS` diaktifkan dan diakumulasikan ke limit total.
   * **Membrane**: Jalur kausalitas dari gen `sar_arm` di-unmask secara dinamis di `CausalAttentionMask`.
   * **Yolk**: Sirkuit attention mulai mengalirkan data antar-segmen gen yang aktif.

---

### Metafora Operasional: Bot "Makan Telur"

Untuk menggambarkan bagaimana sistem memperoleh kemampuan baru secara dinamis, kita menggunakan metafora **asimilasi genetik** dengan aturan retensi memori sebagai berikut:
*   **Satu Agent Bisa Makan Banyak `.egg`**: Agent dapat memproses beberapa berkas EGG sekaligus (misal `pisik.egg`, `chem.egg`, `ekonomi.egg`) untuk memperluas kemampuannya.
*   **Kontainer Sekali Pakai (*Single-Use Container*)**: Data pembungkus EGG (Shell, Albumin, Membrane, Yolk, Chalaza) bersifat transien/sekali pakai. Setelah gen diekstrak dan divalidasi, sisa data kontainer ini langsung dibuang (*unmapped*) dari memori RAM atau ditidurkan (*sleep*) untuk menghemat sumber daya.
*   **Gen Hidup Berulang (*Reusable Genes*)**: Hanya segmen **GENE** (DNA aktif) yang tetap hidup menetap di dalam mesin **Energen** secara permanen dan dieksekusi berulang-ulang tiapkali ada aliran data AFB baru masuk.

```
[ Agent / Bot ] ──(Makan .egg)──→ [ Ingesti (Energen) ] 
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼ (Sekali Pakai)                            ▼ (Hidup Berulang)
        [ Cerna & Buang Kontainer ]                     [ Splicing GENE ke Energen ]
      (Shell, Albumin, Yolk, Membrane)                 (Hidup & Eksekusi Berulang)
```

1. **Bot "Makan" Telur (Ingestion)**:
   Agent mengunduh dan membaca berkas `.egg` (misal `pisik.egg` & `robot_arm.egg`).
2. **Pencernaan & Validasi (Digestion - Sekali Pakai)**:
   Energen memetakan berkas biner tersebut ke memori, membaca cangkang (**Shell**) untuk validasi batas fisik, mencocokkan tanda tangan Ed25519, lalu menyerap data **GENE** di dalemnya. Setelah proses asimilasi selesai, memori penampung kontainer EGG global langsung dibuang/dilepas.
3. **Splicing & Reaktivitas (Expression - Reusable)**:
   Segmen **GENE** yang berhasil diekstrak disambungkan secara permanen ke dalam untai runtime Energen. Gen ini terus hidup secara aktif dan mengeksekusi sirkuit logika fisisnya secara berulang-ulang pada setiap detik iterasi data AFB tanpa perlu memanggil berkas `.egg` aslinya lagi.
