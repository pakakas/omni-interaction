## Omni-Interaction: Energen

Energen adalah runtime eksekusi untuk **Executable Graph Geometry (EGG)**.

---

### Peran Utama

Energen bertindak sebagai execution engine yang menerima input data stream berupa **Agent Frame Buffer (AFB)**, mengeksekusi graf komputasi di dalam **EGG**, dan meneruskan hasilnya ke agent penerima.

```
                  ┌──────────────────────┐
                  │       EGG File       │
                  │ (.egg binary format) │
                  └──────────┬───────────┘
                             │ (mmap)
                             ▼
[AFB Stream (sci-token)] ───→ [  ENERGEN RUNTIME  ] ───→ [AFB Stream (sci-token)]
 (memory layout)               (EGG Execution)                (memory layout)
```

---

### Arsitektur Runtime & Memory Management

Untuk mencapai performa maksimal (zero-copy dan zero-serialization), Energen mematuhi aturan strict memory layout berikut:

#### 1. Zero-Copy via Memory Mapping (`mmap`)
* Energen tidak melakukan alokasi memori berulang atau parsing teks untuk membaca pustaka `.egg`.
* File biner `.egg` langsung dipetakan ke virtual memory address space menggunakan `mmap`. Pointer internal langsung menunjuk ke offset bobot matriks (`CausalAttentionCore`) dan aturan batas (`ConstraintValidator`).

#### 2. Double-Buffering AFB
* Input dan output stream menggunakan struktur data buffer linier tetap (Flat Float Array) yang merepresentasikan kumpulan **sci-token** `[Index_Int, Value_Float]`.
* Menggunakan teknik *double-buffering*: selagi satu buffer dibaca oleh execution loop, buffer kedua ditulis oleh sensor/agent input baru secara asinkron.

---

### Pipeline Eksekusi Energen

Setiap kali frame baru tiba di AFB memory layout:

```
[AFB Memory Buffer]
        │
        ▼
[Step 1: ConstraintValidator (Shell)]
  - Cek nilai bounds min/max dari static config.
  - Normalisasi input ke [0.0, 1.0].
        │
        ▼
[Step 2: InputEmbedder (Albumin)]
  - Proyeksi linier index & float value ke representasi vektor internal.
        │
        ▼
[Step 3: CausalAttentionMask (Membrane)]
  - Terapkan matriks mask (M) untuk meniadakan koneksi non-kausal (softmax score -> 0).
        │
        ▼
[Step 4: CausalAttentionCore (Yolk)]
  - Jalankan operasi dot-product attention yang sudah di-bake.
  - Hitung status kelayakan (VALID/INVALID atau target aksi fisis).
        │
        ▼
[Step 5: Output Router]
  - Map memori output langsung ke buffer output yang berisi kumpulan **sci-token** `[Index_Int, Value_Float]` di AFB stream.
```

---

### Target Karakteristik Performance

* **Latensi Rendah**: Waktu pemrosesan per frame ditargetkan di bawah 100ms.
* **Constant Memory Footprint**: Alokasi RAM stabil tanpa memicu Garbage Collector (GC) di Bun environment karena memori tensor dan buffer dibagikan secara statis.

---

### Mekanisme Constant Memory Lazy Loading

Untuk menghindari alokasi memori dinamis di heap (yang memicu fragmentasi RAM dan lag GC), Energen menerapkan teknik **Pre-allocated Active Workspace**:

1. **Workspace Pra-alokasi**: Saat startup, Energen memesan blok RAM berukuran tetap yang sanggup menampung hingga jumlah dimensi maksimum (misal: kapasitas maksimal $S_{max} = 128$ active tokens/dimensions).
2. **Dynamic Slot Mapping**: 
   * Saat bot menyala, hanya $4$ slot pertama (gen `singer_core`) yang ditandai aktif (`active_count = 4`). Pointer hitung hanya berputar di area memori ini.
   * Saat modul `sar_arm` (misal berisi 4 dimensi tambahan) dipasang, Energen **tidak membuat array baru**. Ia hanya menunjuk pointer `mmap` gen baru tersebut ke slot $5$ s/d $8$ di dalam workspace yang sudah dipesan sebelumnya, lalu memperbarui pointer limit (`active_count = 8`).
3. **Hasil**: Footprint memori tetap datar (flat line) dari awal hingga akhir siklus hidup robot, tidak peduli seberapa sering gen dilepas-pasang.

---

### Optimasi Hardware: SIMD Vectorization di Zig

Operasi perkalian matriks attention di sirkuit Yolk diakselerasi secara native menggunakan instruksi vektor hardware (SIMD) melalui fitur bawaan `@Vector` dari kompilator Zig:

```zig
const std = @import("std");

// Contoh optimasi dot-product untuk vektor embedding ukuran 4
pub fn dot_product_simd(a: [4]f32, b: [4]f32) f32 {
    const va: @Vector(4, f32) = a;
    const vb: @Vector(4, f32) = b;
    
    // Operasi perkalian vektor paralel di level register CPU
    const mul = va * vb; 
    
    return @reduce(.Add, mul);
}
```

Zig secara otomatis menerjemahkan kode di atas menjadi instruksi instruksi khusus CPU yang sangat cepat (seperti AVX2/AVX-512 di x86_64, atau NEON di ARM/Apple Silicon), memotong latensi attention loop Energen hingga ke tingkat sub-milidetik.

---

### Topologi Deployment: Agent-Energen Client-Server

Pemisahan antara `Agent` (Client) dan `Energen` (Server) memiliki usecase yang sangat kuat, terutama dalam skenario **Distributed & Edge Computing**:

```
[ Edge Drone / Client ] ───(AFB Stream via TCP/WS)───→ [ Base Station / Server ]
 (Hanya kirim raw data)                                 (Energen mengeksekusi EGG)
         ▲                                                          │
         └─────────────(AFB Stream balik)───────────────────────────┘
                    (Kirim instruksi aksi/sains)
```

#### Usecase 1: Thin-Client Edge Robotics (Robot Rendah Daya)
* **Masalah**: Robot fisik kecil (seperti mikro-drone atau rover mini) tidak memiliki kapasitas CPU/NPU untuk melakukan kalkulasi attention EGG yang berat, dan baterainya terbatas.
* **Solusi**: Robot hanya menjalankan `brain-agent` ringan (Client) untuk mengumpulkan data sensor, mengemasnya menjadi AFB stream kecil, lalu mengirimkannya lewat Wi-Fi/5G (WebSockets/TCP) ke base station server yang menjalankan **Energen** (Server). Server memproses data, dan mengembalikan AFB aksi fisis dalam hitungan milidetik.

#### Usecase 2: Swarm Coordination (Otak Terpusat untuk Multi-Robot)
* **Masalah**: Mengoordinasikan sekelompok robot penyelamat (SAR-bots) secara sinkron agar tidak saling tabrakan dan bekerja efisien.
* **Solusi**: Semua robot (Clients) mengirimkan AFB stream mereka ke satu server Energen terpusat. Server menjalankan satu EGG besar yang memiliki *Cross-Attention* lintas robot untuk merencanakan aksi kolektif terkoordinasi, lalu mengembalikan AFB perintah ke masing-masing robot secara paralel.

#### Usecase 3: Hardware-in-the-Loop Simulation (HIL)
* Simulator fisik (seperti Gazebo/Webots) berjalan di satu komputer sebagai Client yang memompa data sensor AFB.
* Sistem kendali Energen berjalan di komputer terpisah (atau SBC target seperti Raspberry Pi/Jetson) sebagai Server untuk memvalidasi performa kendali real-time terhadap model EGG sebelum diterjunkan ke robot asli.


