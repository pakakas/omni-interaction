## Sci-FI: Energen

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
[Step 1: InputScaler (Shell / Ingress)]
  - Skala input dengan pembagian unit_scale:
      latent = sensor_value / unit_scale
    Nilai mengalir bebas — boleh negatif, boleh melebihi 1.0. Tidak ada clamping.
    Target kisaran [0.0, 1.0] hanya untuk stabilitas numerik matriks, bukan batas keras.
  - Jika input berelasi dengan 0xCIRCULAR, expand 1-channel angle fisis (radian)
    menjadi 2-channel latent coordinates [sin_ch, cos_ch] secara mulus.
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
[Step 4: CausalAttentionCore (Yolk - Core Execution Loop)]
  - Jalankan operasi dot-product attention yang sudah di-bake (tanpa branch/if-else).
  - Untuk Dimensi Circular:
    * Rotasi/Update Sudut: Dihitung via matriks rotasi 2D linear:
      x_new = x*cos(dθ) - y*sin(dθ), y_new = x*sin(dθ) + y*cos(dθ).
    * Proyeksi Gaya: Cukup mengalikan gaya total (F) dengan sumbu x/y (misal Fx = F * x).
    * Beda/Selisih Sudut: Dihitung menggunakan dot product vektor (x1*x2 + y1*y2).
  - Untuk Batas Konsensus:
    * Pelanggaran dihitung secara branchless di ujung sirkuit via ReLU (max(0.0, actual - limit)).
        │
        ▼
[Step 5: Output Router (Egress)]
  - Gabungkan kembali 2-channel latent coordinates circular [sin, cos] menjadi 1-channel
    sudut fisis tunggal menggunakan atan2(sin, cos) jika dikirim ke actuator fisik.
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

---

## 4. Spesifikasi Teknis Implementasi VM (Zig)

Berikut adalah pendetilan arsitektur internal Energen VM di tingkat bahasa Zig.

### A. Integrasi Data Stream AFB
Aliran data sensor input dan keputusan aksi output antara Host TS (Bun) dan VM Zig bertukar secara asinkron menggunakan buffer memori **Agent Frame Buffer (AFB)**. Format biner paket, hierarki Token ID, dan mekanisme double-buffering dijelaskan secara rinci di dalam dokumen [sci-fi-afb.md](file:///F:/work/00-oss/maintenis/pakakas/sci-fi/design/sci-fi-afb.md).


### B. Pre-allocated Active Workspace
Untuk menghindari lag Garbage Collector (GC) dan alokasi dinamis saat runtime, VM mengalokasikan satu blok RAM statis berukuran tetap sejak startup:

```
+-------------------------------------------------------+
|  Active State Vector (S_max = 128 x [f32, f32])       |
+-------------------------------------------------------+
|  Active Count (u32)                                   |
+-------------------------------------------------------+
```

Setiap slot dimensi menampung **2 float32 values** (representasi $[x, y]$ atau $[\cos\theta, \sin\theta]$ untuk dimensi sirkular; dimensi linear hanya mengisi elemen pertama).

### C. Dynamic Gene Prefix Translation (MMU Style)
Mendukung eksekusi paralel dari gen template yang sama (misal `left_arm` dan `right_arm` berbagi model biner `arm.egg` yang sama) dengan melakukan translasi offset secara runtime:

```
+---------------------+-------------------+
|  Gene Prefix (16B)  | Base Offset (16B) |
+---------------------+-------------------+
| 0x000A (left_arm)   |       0x04        |
| 0x000B (right_arm)  |       0x0C        |
+---------------------+-------------------+
```

Setiap kali instruksi Yolk merujuk ke Local ID `0x0002` (misal arus motor), VM menghitung koordinat fisik di memori aktif menggunakan formula:
$$\text{Physical\_Slot} = \text{Base\_Offset} + \text{Local\_ID}$$

### D. Akselerasi SIMD Attention via Zig `@Vector`
Operasi dot-product attention dieksekusi secara branchless menggunakan register hardware CPU:

```zig
pub fn dot_product_simd(a: [4]f32, b: [4]f32) f32 {
    const va: @Vector(4, f32) = a;
    const vb: @Vector(4, f32) = b;
    const mul = va * vb;
    return @reduce(.Add, mul);
}
```

Kompilator Zig secara otomatis mereduksi ekspresi `@Vector` di atas menjadi instruksi vektor CPU target (e.g. `VFMADD` di AVX2 / AVX-512 atau `FMLA` di ARM NEON).

### E. C-ABI FFI Protocol
Fungsi-fungsi yang diekspor dari library dinamis Energen (`.dll` / `.so`) untuk dipanggil oleh TS Host:

```zig
// Alokasikan memori workspace statis
export fn init_vm() ?*anyopaque;

// Load file .egg biner ke slot base offset tertentu
export fn load_gene(
    vm: *anyopaque,
    prefix: u16,
    base_offset: u16,
    egg_ptr: [*]const u8,
    egg_len: usize
) i32;

// Jalankan satu frame step kalkulasi attention & constraint
export fn execute_step(
    vm: *anyopaque,
    inputs_afb: [*]const f32,
    inputs_count: u32,
    outputs_afb: [*]f32,
    outputs_count: u32
) void;

// Bebaskan memori workspace
export fn deinit_vm(vm: *anyopaque) void;
```

### F. Guardrail Keamanan & Validasi mmap
Untuk menjamin stabilitas VM dan mencegah crash akibat file `.egg` yang rusak atau dimanipulasi secara jahat (*malicious binary injection*), Energen menerapkan protokol validasi 3 lapis saat fase pemuatan memori:

1. **Validasi Integritas Header (Size Check)**:
   Segera setelah file dipetakan menggunakan `mmap` (dengan akses hanya-baca `PROT_READ`), VM memverifikasi keselarasan ukuran byte fisik file terhadap metadata header:
   $$\text{Ukuran\_Fisik\_File} \ge 16 + (\text{GENE\_COUNT} \times 16) + \text{PAYLOAD\_SIZE}$$
   Jika ukuran file lebih kecil dari batas minimum teoretis ini, file `.egg` langsung ditolak dan *unmapped* untuk mencegah pembacaan memori ilegal.

2. **Validasi Batas Pointer Registri (OOB Guard)**:
   Sebelum mengakses data nilai di dalam payload, VM melakukan iterasi ke seluruh daftar gen di dalam tabel registri untuk memvalidasi batas memori relatif:
   $$\text{Byte\_Offset} + (\text{Value\_Count} \times 4) \le \text{PAYLOAD\_SIZE}$$
   Jika ada satu pun entri gen yang memiliki offset data melebihi total ukuran payload, VM akan mendeteksi ini sebagai pelanggaran batas (*Out-of-Bounds*) dan langsung menghentikan proses ingesti secara aman tanpa memicu *Segmentation Fault*.

3. **Sistem Fallback Loader**:
   Jika pemanggilan `mmap` sistem operasi gagal karena masalah perizinan (*permission*), pembatasan lingkungan sandbox, atau penyimpanan jaringan yang tidak mendukung mapping, Energen secara otomatis beralih ke mode konvensional: membaca seluruh byte file langsung ke buffer RAM internal yang aman menggunakan `std.fs.File.readAll`, lalu menjalankan prosedur validasi yang sama.

4. **Proteksi Lintas-Proses (MAP_PRIVATE & File Locking)**:
   Untuk melindungi alamat memori VM dari manipulasi dinamis atau pemotongan file oleh proses luar yang berjalan di sistem operasi:
   - **Isolasi Memori (`MAP_PRIVATE`)**: VM dipetakan menggunakan flag `MAP_PRIVATE` (Copy-on-Write) agar perubahan apa pun yang ditulis oleh proses lain ke file asli di disk setelah pemetaan selesai tidak akan menembus atau memengaruhi ruang memori virtual VM.
   - **Kunci File Bersama (`File Locking`)**: Sebelum melakukan pemetaan, VM meminta kunci file bersama (Shared Lock: `flock` dengan `LOCK_SH` di POSIX/Unix, atau shared locking otomatis di Windows) untuk memblokir proses lain dari membuka berkas `.egg` dengan izin tulis (`write/truncate`) selama proses VM masih aktif.



