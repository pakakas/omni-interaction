## Executable Graph Geometry (EGG)

Trained model. Struktur internalnya beranatomi seperti telur:

```
┌─────────────────────────────────┐
│            SHELL                │  ← Hard bounds: dimension min/max/kind
│  ┌───────────────────────────┐  │
│  │        ALBUMIN            │  │  ← Embedding layer: AFB → vector
│  │  ┌─────────────────────┐  │  │
│  │  │   MEMBRANE          │  │  │  ← Causal mask: DAG enforcement
│  │  │  ┌───────────────┐  │  │  │
│  │  │  │    YOLK       │  │  │  │  ← Core: causal attention weights
│  │  │  │               │  │  │  │
│  │  │  │   CHALAZA ────┼──┼──┼──┤  ← Anchor: keeps yolk ke laws
│  │  │  └───────────────┘  │  │  │
│  │  └─────────────────────┘  │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Shell
Hard constraint layer. Berisi definisi semua dimensi — `kind`, `min`, `max`, `max_type`. Tidak bisa dimodifikasi saat runtime. Energen baca Shell sebagai config pertama sebelum eksekusi.

### Albumin
Embedding layer. Mengkonversi AFB payload `[Index_Int, Value_Float]` ke vector representasi internal.

### Membrane
Causal mask layer. DAG hukum sains yang di-apply sebelum softmax. Menentukan arah attention yang valid — memblok relasi yang tidak punya dasar hukum sains.

### Yolk
Core attention weights. Di sinilah hukum sains ter-bake-in sebagai relasi kausal antar dimensi. Output utama dari **Ovipar**.

### Chalaza
Regularization anchor. Menjaga Yolk tidak drift dari struktur kausal saat fine-tuning atau incremental learning.

```
Shell     (validasi bounds)
   ↓
Albumin   (embed ke vector)
   ↓
Membrane  (apply causal mask)
   ↓
Yolk      (attention computation)
   ↓
output
```

---

### Spesifikasi Layout File Biner EGG (`.egg`)

Berkas `.egg` disimpan sebagai file biner linier tunggal dengan spesifikasi header dan alignment byte sebagai berikut untuk mendukung `mmap` instan:

```
┌─────────────────────────────────────────────────────────────────┐
│                       EGG FILE CONTAINER                        │
├─────────────────────────────────────────────────────────────────┤
│ MAGIC BYTES: 'E', 'G', 'G', 0x01 (Version)          [4 bytes]   │
├─────────────────────────────────────────────────────────────────┤
│ INDEX HEADER TABLE:                                             │
│  - Shell Offset & Length                            [8 bytes]   │
│  - Albumin Offset & Length                          [8 bytes]   │
│  - Membrane Offset & Length                         [8 bytes]   │
│  - Yolk Offset & Length                             [8 bytes]   │
│  - Chalaza Offset & Length                          [8 bytes]   │
├─────────────────────────────────────────────────────────────────┤
│ GENE REGISTER TABLE:                                            │
│  - Number of Injected Genes (uint16)                [2 bytes]   │
│  - Array of Gene descriptors:                                   │
│     [Gene_ID (4B), Offset (4B), Length (4B)]        [12B * G]   │
├─────────────────────────────────────────────────────────────────┤
│ MEMORY-ALIGNMENT PADDING (Zeros to align to 8-byte boundary)    │
├─────────────────────────────────────────────────────────────────┤
│ SEGMENT DATA (GENE 1, GENE 2, ...)                              │
└─────────────────────────────────────────────────────────────────┘
```

#### Aturan Kompilasi Biner:
1. **Memory Alignment**: Semua array data numerik (bobot matriks Float32) harus di-pad agar offset memorinya dimulai pada kelipatan 8-byte. Hal ini krusial agar CPU/NPU dapat melakukan instruksi SIMD langsung di atas pointer memori terpetakan.
2. **Independent Gene Blocks**: Setiap data **GENE** yang diinjeksikan memiliki blok sub-Shell, sub-Membrane, dan sub-Yolk sendiri yang terkelompokkan di dalam segmen datanya.

---

### Pemetaan Penamaan Runtime (Energen Engine)

Saat pustaka `.egg` dibaca di memori oleh **Energen**, nama-nama metafora biologis ini digantikan dengan representasi data biner murni (Zero-Copy) untuk performa maksimal:

| Nama Pustaka (.egg) | Nama Runtime (Energen) | Representasi Data Biner |
| --- | --- | --- |
| **Shell** | **`ConstraintValidator`** / `BoundsConfig` | Flat Binary Struct (Static Bounds Array) |
| **Albumin** | **`InputEmbedder`** / `TensorProjector` | Float Array (Linear Projection Weights) |
| **Membrane** | **`CausalAttentionMask`** | Boolean/Int Adjacency Matrix Mask ($0$ / $-\infty$) |
| **Yolk** | **`CausalAttentionCore`** | Softmax Weight Tensor (Causal Attention Graph) |
| **Chalaza** | **`AnchorRegularizer`** / `WeightConstraints` | Float Vector (Anchor Constraints) |

> **Zero JSON / Zero Text Parsing:** Seluruh komponen di atas dieksekusi secara asinkron di memori sebagai pointer memori langsung (`mmap` dari berkas `.egg` biner).

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

Untuk menggambarkan bagaimana sistem memperoleh kemampuan baru secara dinamis saat runtime, kita menggunakan metafora **asimilasi genetik** (catatan: telur di sini adalah pembawa informasi/gen untuk kemampuan baru, bukan sumber energi/fuel—energi fisik robot tetap disuplai sepenuhnya oleh baterai):

```
[ Host / Bot ] ──(Makan .egg)──→ [ Asimilasi (Energen) ] ──→ [ Splicing DNA (ADN) ] ──→ [ Ekspresi Kemampuan Baru ]
```

1. **Bot "Makan" Telur (Ingestion - Download via `egg.hub`)**:
   Saat robot mendeteksi modul fisik baru dipasang, `brain-agent` secara otomatis mencari, mengunduh, dan mendatangkan file `.egg` yang sesuai dari registry pusat **`egg.hub`** untuk diumpankan ke sistem.
2. **Asimilasi & Validasi (Digestion)**:
   **Energen** memverifikasi cangkang (**Shell**), memastikan muatan genetik (batas fisik) aman dan tidak merusak integritas operasional robot.
3. **Splicing DNA**:
   Gen `sar_arm` diserap dan di-splice ke dalam untai **DNA (ADN)** host robot yang sedang berjalan.
4. **Ekspresi Gen (Expression)**:
   Kapasitas memori di workspace aktif bertambah, dan robot secara instan mengekspresikan kemampuan dari gen baru tersebut di tingkat sirkuit attention.



