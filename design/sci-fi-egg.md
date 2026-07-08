## Executable Graph Geometry (EGG)

Trained model. Struktur internalnya beranatomi seperti telur:

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

### Shell
Cangkang luar keras (*ingestion-time validator*). Berada di lapisan terluar kontainer EGG. Hanya digunakan **satu kali** saat Agent pertama kali memproses ("makan") berkas EGG untuk memvalidasi bahwa batas fisis dan konfigurasi dimensi EGG cocok dengan spesifikasi fisik robot. Setelah EGG tervalidasi dan gen di-splice ke Energen, Shell dilepas/dibuang dari memori RAM.

### Albumin
Lapisan putih telur (*embedding layer*). Saat runtime, data aktif **AFB** mengalir masuk langsung ke sini. Albumin bertugas menerjemahkan data fisis kasar AFB menjadi representasi vektor laten internal.

### Membrane
Selaput kuning telur (*causal mask layer*). Berada di dalam Albumin, bertugas membungkus secara khusus hanya **Yolk** dan **Blastodisc (GENE)**. Berfungsi menegakkan hukum kausalitas DAG pada sirkuit attention dengan memblokir relasi yang tidak logis secara fisis.

### Yolk
Kuning telur (*core attention weights*). Berada di dalam lindungan Membrane bersama Blastodisc (GENE). Di sinilah matriks bobot attention (*self-attention* & *cross-attention*) disimpan sebagai nutrisi logika fisis.

### Chalaza
Tali kuning telur (*regularization anchor*). Menambatkan Yolk agar tidak bergeser (*drift*) dari struktur kausal saat fine-tuning lokal.

---

### Alur Kerja Sistem (Ingestion vs. Runtime)

#### A. Fase Makan Telur (Ingestion-Time - Pake Shell)
```
[ Berkas .egg ] ──► [ Baca Shell ] ──► (Validasi Batas Fisik Robot?)
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼ YA                                            ▼ TIDAK
         [ Splicing GENE ke Energen ]                           [ Tolak & Buang EGG ]
         (Buang Shell/Kontainer EGG)
```

#### B. Fase Jalan (Active Runtime - AFB Langsung Masuk)
```
[ Data Aktif AFB ] 
        │
        ▼ (Tanpa lewat Shell)
     Albumin      (Proyeksi ke Vektor Laten)
        │
        ▼ (Masuk ke Selaput Membran)
  ========================================= [ Selaput MEMBRANE ]
    [ Blastodisc/GENE ] ──(Membaca & Ngatur)
         │                                 
         ▼ (Proses & Asimilasi)             
      [ Yolk ]       (Kalkulasi Causal Attention)
  =========================================
         │
         ▼
   [ Sinyal Aksi ]
```



---

### Spesifikasi Layout File Biner EGG (`.egg`)

Berkas `.egg` disimpan sebagai file biner linier tunggal dengan spesifikasi header dan alignment byte sebagai berikut untuk mendukung `mmap` instan:

#### 1. Header Container Utama (Offset 0x00 - 0x47)
Header ini menempati **72 bytes** pertama berkas untuk mengidentifikasi berkas dan menunjukkan lokasi tabel registri gen, lokasi segmen global (Shell, Albumin, Membrane, Yolk, Chalaza), serta tanda tangan keamanan:

| Byte Range | Tipe Data | Nama Field | Deskripsi |
| --- | --- | --- | --- |
| `0x00` - `0x01` | `uint16` | `MAGIC` | Identitas berkas sekaligus versi, diset kaku ke **`0xE661`** (EGG v1). |
| `0x02` - `0x03` | `uint16` | `GENE_COUNT` | Jumlah gen aktif yang terdaftar di dalam `GENE_REGISTER_TABLE`. |
| `0x04` - `0x07` | `uint32` | `PADDING` | Byte kosong penyelarasan memori ke batas 8-byte. |
| `0x08` - `0x0F` | `uint64` | `REGISTRY_OFFSET` | Alamat awal (offset byte) tabel `GENE_REGISTER_TABLE`. |
| `0x10` - `0x17` | `uint64` | `GLOBAL_SHELL_OFFSET` | Alamat awal segmen **Shell global** (kumpulan semua batas dimensi). |
| `0x18` - `0x1F` | `uint64` | `GLOBAL_ALBUMIN_OFFSET` | Alamat awal segmen **Albumin global** (matriks proyeksi input). |
| `0x20` - `0x27` | `uint64` | `GLOBAL_MEMBRANE_OFFSET` | Alamat awal segmen **Membrane global** (matriks causal mask DAG). |
| `0x28` - `0x2F` | `uint64` | `GLOBAL_YOLK_OFFSET` | Alamat awal segmen **Yolk global** (tensor bobot causal attention). |
| `0x30` - `0x37` | `uint64` | `GLOBAL_CHALAZA_OFFSET` | Alamat awal segmen **Chalaza global** (vektor anchor). |
| `0x38` - `0x3F` | `uint64` | `SIGNATURE_OFFSET` | Alamat awal (offset byte) tanda tangan keamanan di ekor berkas. |
| `0x40` - `0x47` | `uint64` | `SIGNATURE_LENGTH` | Ukuran tanda tangan Ed25519 (selalu 64 bytes / `0x40`). |

---

#### 2. Tabel Registri Gen (`GENE_REGISTER_TABLE`)
Tabel ini bertugas memetakan fungsionalitas **GENE** (DNA) ke dalam potongan (*slices*) segmen global di atas. Tabel ini berupa **Pure Array** berisi descriptor gen kustom berukuran **16 bytes per entry** (sangat hemat memori & selaras 64-bit):

*   **Array Gene Descriptors (16 bytes per entry)**:
    *   `Gene_Prefix` (`2 bytes`, `uint16`): Awalan namespace gen (misal `0x000A` untuk `sar_arm`).
    *   `Dim_Start` (`2 bytes`, `uint16`): Indeks awal dimensi gen ini di dalam Shell/AFB global.
    *   `Dim_Count` (`2 bytes`, `uint16`): Jumlah dimensi aktif yang dimiliki oleh gen ini.
    *   `Padding` (`2 bytes`, `uint16`): Byte kosong penyelarasan memori 32-bit (selalu `0x00`).
    *   `Yolk_Slice_Offset` (`4 bytes`, `uint32`): Offset relatif lokasi bobot attention gen ini di dalam Yolk global.
    *   `Yolk_Slice_Length` (`4 bytes`, `uint32`): Panjang ukuran bobot attention gen ini di dalam Yolk global.

---

#### 3. Struktur Segmen Data Global EGG
Setiap segmen data global yang ditunjuk oleh Header Utama harus selaras 8-byte dan memiliki struktur biner sebagai berikut:

##### A. Segmen Shell Global (Constraint Validator)
Merupakan array dari seluruh konfigurasi dimensi aktif dalam EGG. Setiap entri dimensi berukuran **16 bytes** (8-byte aligned):
*   `Dimension_ID` (`4 bytes`, `uint32`): Kombinasi `Gene_Prefix (2B) | Local_Index (2B)`.
*   `Min_Limit` (`4 bytes`, `float32`): Batas bawah koordinat fisis.
*   `Max_Limit` (`4 bytes`, `float32`): Batas atas koordinat fisis.
*   `Padding` (`4 bytes`, `uint32`): Padding penyelarasan memori (statis `0x00000000`).

> [!NOTE]
> Klasifikasi dimensi (seperti circular vs. linear) tidak disimpan sebagai metadata kaku (`Kind`) di dalam biner, melainkan didefinisikan murni sebagai hubungan ketetanggaan (relasi graf) di segmen **Membrane** ke Dimensi Jangkar khusus (`0xCIRCULAR` untuk circularity, dan `0xCONSENSUS` untuk batas pengawasan). Hal ini meminimalkan bloat memori dan menjaga format biner tetap terpadu.

##### B. Segmen Albumin Global (Input Projector)
Matriks bobot proyeksi linear ($D \times E$ Float32) untuk mengubah seluruh payload input AFB mentah menjadi embedding vektor laten.

##### C. Segmen Membrane Global (Causal Mask)
Matriks ketetanggaan (*adjacency matrix*) global berukuran $D \times D$ Float32. Berisi nilai `0.0` (diizinkan) atau `-infinity` (`0xFF800000` - memblokir total sirkuit attention).

##### D. Segmen Yolk Global (Causal Attention Core)
Kumpulan seluruh tensor bobot attention Float32 (Query, Key, Value) milik semua gen yang digabungkan secara linier di dalam berkas.

##### E. Segmen Chalaza Global (Anchor Constraints)
Vektor Float32 berisi batasan deviasi regulasi (*anchor constraints*) untuk seluruh dimensi aktif.

---

#### 4. Tanda Tangan Keamanan (Ed25519 Signature)
Terletak pada offset yang ditunjuk oleh `SIGNATURE_OFFSET` (biasanya berada di 64 bytes terakhir berkas). Berisi tanda tangan digital Ed25519 untuk memvalidasi integritas seluruh data biner kontainer dari bytes `0x00` hingga `SIGNATURE_OFFSET - 1`.

---

#### Aturan Kompilasi Biner:
1. **Memory Alignment**: Semua array data numerik (terutama bobot tensor Float32) wajib di-pad dengan byte kosong (`0x00`) agar alamat offset awalnya dimulai pada kelipatan 8-byte. Hal ini krusial agar CPU/NPU dapat melakukan instruksi pemrosesan paralel SIMD langsung di atas pointer memori terpetakan.
2. **Modular Slicing**: EGG disusun dengan memusatkan data ke level global, sedangkan tabel registri menyimpan irisan (*slices*) indeksnya. Hal ini mempermudah Energen melakukan pemuatan modular saat runtime.



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
* **Satu Agent Bisa Makan Banyak `.egg`**: Agent dapat memproses beberapa berkas EGG sekaligus (misal `pisik.egg`, `chem.egg`, `ekonomi.egg`) untuk memperluas kemampuannya.
* **Kontainer Sekali Pakai (*Single-Use Container*)**: Data pembungkus EGG (Shell, Albumin, Membrane, Yolk, Chalaza) bersifat transien/sekali pakai. Setelah gen diekstrak dan divalidasi, sisa data kontainer ini langsung dibuang (*unmapped*) dari memori RAM atau ditidurkan (*sleep*) untuk menghemat sumber daya.
* **Gen Hidup Berulang (*Reusable Genes*)**: Hanya segmen **GENE** (DNA aktif) yang tetap hidup menetap di dalam mesin **Energen** secara permanen dan dieksekusi berulang-ulang tiapkali ada aliran data AFB baru masuk.

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




