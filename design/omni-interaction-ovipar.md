## Omni-Interaction: Ovipar & Ovipositor

**Ovipar** adalah sub-sistem pelatihan dan kompilasi model di dalam Omni-Interaction, sedangkan **Ovipositor** adalah perangkat fisik (compiler CLI/tool) yang memproses data sains dan menghasilkan berkas `.egg`.

---

### Peran Utama

Ovipar bertugas memeras hukum sains dari dokumen mentah (`docs`), menstrukturkannya ke dalam tingkatan fisik-formal (Atom $\rightarrow$ Molekul), menyuntikkannya ke dalam **GENE** (Gen), dan menelurkan (menulis) berkas **EGG** siap pakai melalui Ovipositor.

```
[ Teks Sains / Docs ]
          │
          ▼ (Ovipar Ingestion)
[ Ekstraksi Atom & Molekul ]
          │
          ▼ (Gene Synthesis)
[ OVIPOSITOR COMPILER ] ───(Gene Injection)───→ [ EGG File ]
```

---

### Pipeline Kompilasi (Ovipar ke Ovipositor)

Proses pembuatan EGG melalui lima tahapan terstruktur:

#### 1. Ingesti Dokumen (Ingestion)
* Ovipar membaca file sains mentah (`docs` teks markdown, database, atau waveform).
* Melakukan parsing teks untuk menemukan variabel numerik kontinu, batas rentang nilai, dan pola interaksi fisis.

#### 2. Atomisasi (Atomization)
* Menangkap besaran dasar fisik dan memetakkannya ke dimensi primitif (**Atom**), seperti `0xMASS`, `0xLENGTH`, `0xTIME`, `0xTEMP`, dll.
* Menentukan nilai `min` dan `max` riil untuk konfigurasi **Shell** EGG.

#### 3. Molekularisasi (Molecularization)
* Menganalisis korelasi kausalitas antar-atom untuk merangkai dimensi turunan (**Molekul**).
* Membangun grafik kausalitas satu arah (Causal DAG) untuk mengisi matriks **Membrane** EGG.
* *Contoh*: Menyatukan $M \cdot L \cdot T^{-2}$ menjadi molekul `0xFORCE`.

#### 4. Sintesis & Penyuntikan Gen (Gene Synthesis & Splicing)
* Mengelompokkan molekul dan atom ke dalam kesatuan fungsi organ/perangkat keras tertentu (**GENE**), seperti `sar_arm` atau `singer_core`.
* Ovipositor bertugas menyuntikkan (*inject*) gen-gen ini ke segmen biner EGG yang terpisah.

#### 5. Produksi EGG (Egg Laying)
* Ovipositor menulis seluruh data (Shell, Albumin, Membrane, Yolk, Chalaza) dari semua gen yang disuntikkan ke dalam berkas biner tunggal `.egg` dengan layout memory-aligned agar siap di-`mmap` secara asinkron oleh **Energen**.
