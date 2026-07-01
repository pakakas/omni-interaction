## Omni-Interaction: Agent Data Stream (ADS)

Agent Data Stream (ADS) adalah protokol transportasi data terpadu (Unified Transport Layer) yang menghubungkan seluruh agent dan runtime di dalam ekosistem Omni-Interaction.

---

### Arsitektur Transport Layer

ADS bertanggung jawab untuk menyalurkan informasi tanpa overhead parsing, menggunakan tiga mode transportasi tergantung pada lokasi eksekusi node:

1. **Shared Memory (`SharedArrayBuffer`)**
   * Digunakan jika node-node berjalan dalam satu proses Bun (multi-threading via worker threads).
   * Pengiriman data terjadi secara instan tanpa penyalinan memori (zero-copy pointer sharing).
2. **UNIX Domain Sockets / IPC Pipes**
   * Digunakan untuk interaksi antar-proses yang berjalan di mesin yang sama (misal, `brain-agent` memanggil proses binary `energen` eksternal).
   * Data dialirkan sebagai raw byte stream (`stdin`/`stdout`).
3. **TCP/WebSockets**
   * Digunakan hanya untuk node terdistribusi (remote agents).

---

### Klasifikasi Varian Aliran (Stream Classification)

ADS bercabang menjadi dua spesifikasi stream yang dioptimalkan untuk target penerima yang berbeda:

```
                  ┌───────────────────────────┐
                  │  Agent Data Stream (ADS)  │
                  └─────────────┬─────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
┌──────────────────────────────┐                ┌──────────────────────────────┐
│  Agent Data Notation (ADN)   │                │  Agent Frame Buffer (AFB)    │
│  - Target: HLM               │                │  - Target: Sci-LM (Energen)  │
│  - Format: Biner Terstruktur │                │  - Format: Flat Memory Layout│
│    (marker HLM tokens)       │                │  - Ukuran: Statis (Fixed)    │
│  - Ukuran: Dinamis (Packet)  │                │                              │
└──────────────────────────────┘                └──────────────────────────────┘
```

#### Detail Format ADN (Agent Data Notation)
ADN menggunakan **marker HLM tokens** sebagai pembatas (delimiter) biner kaku untuk mengisolasi teks bahasa manusia dari parameter instruksi terstruktur. Token penanda ini memberi tahu parser internal `brain-agent` di mana segmen string bahasa alami yang dinamis dimulai dan diakhiri dalam payload biner.


---

### Siklus Hidup Aliran (Stream Life Cycle)

Setiap sesi komunikasi ADS melalui tiga fase:

1. **Fase Handshake (Inisialisasi)**
   * Pengirim dan penerima menyepakati tipe stream (`ADN` atau `AFB`).
   * Jika tipe stream adalah `AFB`, ukuran frame statis (jumlah slot dimensi) ditentukan di awal.
2. **Fase Streaming (Transmisi)**
   * Data dialirkan secara kontinu.
   * Pada stream `AFB`, pengiriman dipicu oleh event sensor/input (event-driven).
   * Pada stream `ADN`, data mengalir sebagai token-by-token sequence.
3. **Fase Termination (Penutupan)**
   * Sesi dihentikan, memori buffer yang dialokasikan di-free (pada native runtime) atau di-garbage collect.
