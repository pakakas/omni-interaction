## ░ DESIGN FINAL: OMNI INTERACTION

**"Hapus Sekat Doktrin Ilmu, Satukan dalam Satu Matriks Koordinat Laten"**

Arsitektur ini mendefinisikan cetak biru **Ovipar** (Trainer) dan **Runtime Execution** yang memproses dokumen sains murni (`docs`), memeras esensi fisisnya, lalu melelehkan seluruh aturan main alam semesta ke dalam **1 Unified Latent Space Framework** via tokenisasi biner kaku `[Index_Int, Value_Float]` (**Agent IR / ADN**).

### Sci-FI (Science-Flow Interaction)
Interaksi dinamis dari berbagai aliran fisis (data, energi, uang, dan kode) yang mengalir sepanjang sumbu waktu di dalam ruang laten.

---

### 0. Pipeline Arsitektur

```
agent-input → brain-agent → hlm-agent → brain-agent → sci-agent → energen → sci-agent → brain-agent → agent-output
  (senses)                                                                                                   (HI)
```

| Node | Peran |
| --- | --- |
| **agent-input** | Senses: camera, mikrofon, IO reader, sensor, dll |
| **brain-agent** | Koordinator sentral — wrap output HLM (tebakan) → sci-token, routing ke sci-agent |
| **hlm-agent** | Wrap HLM (renamed standard LLM): string → output mentah (tebakan) |
| **sci-agent** | Wrap Sci-LM: delegasi ke Energen, terima hasil |
| **energen** | EGG runtime — eksekusi model |
| **agent-output** | Human Interface (HI): chat, monitor, speaker, actuator |

#### Protokol & Format Pertukaran Data

Untuk mengoptimalkan throughput dan efisiensi, batasan format data dipisahkan secara kaku berdasarkan jaraknya ke mesin eksekusi:

```
[Human / HI] ──────────── (JSON, MD, HTML, Audio) ─────────── [Agent / HI]
                                                                    │
[HLM / Agent] ─────────── (ADN - Agent Data Notation) ─────── [Agent / HLM]
                                                                    │
[Sci-LM / Energen] ────── (Direct Memory Layout / Pointer) ── [Agent / Sci]
```

| Tingkat Interaksi | Format Data | Alasan & Karakteristik |
| --- | --- | --- |
| **Human Interface (HI)** | `JSON`, `Markdown (MD)`, `HTML`, dll | Abstraksi tinggi, kaya semantik, mudah dibaca manusia dan browser web. |
| **HLM / Agent** | `ADN` (Agent Data Notation) | Format serialisasi biner terstruktur buatan `pakakas/markzero` yang compact untuk LLM. |
| **Sci-LM / Energen** | `Memory Layout` (Direct Pointer, Struct, `mmap`) | Zero-copy, zero-serialization, zero-parsing. Komputasi murni di level RAM menggunakan offset memori. |


```
brain-agent
  ├── delegate → hlm-agent       (proses string)
  │               ↓
  │            hlm output        (tebakan mentah)
  │               ↓
  ├── receive + wrap → sci-token (brain-agent validasi)
  │
  ├── delegate → sci-agent
  │               ↓
  │            energen           (run EGG)
  │               ↓
  ├── receive ← sci-agent
  │
  ├── [output: chat / monitor / speaker]
  │     ↓
  │   hlm-agent                  (sci-token → string)
  │     ↓
  │   agent-output (HI)
  │
  └── [output: actuator]
        ↓
      agent-output (langsung, tanpa hlm-agent)
```


---

### 0a. Hierarki Representasi Data Laten (Formalisasi Fisis & Matematis)

Untuk menyatukan fisika, kimia, biologi, dan sistem formal ke dalam satu kesatuan arsitektur, data direpresentasikan dalam hierarki berlapis yang dijangkar langsung pada hukum fisika dan analisis dimensi:

```
[ ATOM ] (Basis Ortogonal SI)
   │
   ▼ (Proyeksi Tensor / Teorema Pi Buckingham)
[ MOLECULE ] (Dimensi Turunan / Komposit)
   │
   ▼ (Sistem Persamaan Diferensial / ODE-PDE)
[ GENE ] (Spesifikasi Keadaan / Kemampuan)
   │
   ▼ (Diskritisasi & Kompilasi Numerik)
[ EGG ] (Compiled State-Space Model)
```

1. **ATOM (Basis Ortogonal SI / Fundamental Orthogonal Basis)**:
   * **Definisi Fisis**: Mewakili dimensi dasar Sistem Satuan Internasional (SI) $[M, L, T, I, \Theta, N, J]$ ditambah dimensi informasi $[B]$.
   * **Formulasi Matematis**: Setiap atom $A_i$ direpresentasikan sebagai sumbu koordinat basis ortogonal independen dalam ruang laten $\mathcal{X}$:
     $$A_i \in [0, 1] \subset \mathbb{R}, \quad \langle A_i, A_j \rangle = 0 \quad (\text{untuk } i \neq j)$$
     Contoh: `0xMASS` $[M]$, `0xMETER` $[L]$, `0xTIME` $[T]$, `0xBIT` $[B]$.

2. **MOLECULE (Dimensi Turunan / Buckingham $\pi$ Dimensional Analysis)**:
   * **Definisi Fisis**: Sumbu komposit (dimensi turunan) yang terbentuk melalui perkalian pangkat dari dimensi-dimensi dasar (analisis dimensi).
   * **Formulasi Matematis**: Mengikuti **Teorema $\pi$ Buckingham**, setiap molekul $M_k$ diturunkan secara kaku dari eksponen dimensi dasar:
     $$[M_k] = \prod_{i=1}^{d} [A_i]^{\alpha_i}, \quad \alpha_i \in \mathbb{Q}$$
     Di dalam ruang laten, fitur molekul $\mathbf{z}_{M_k}$ diperoleh melalui proyeksi non-linear (Attention/Feed-Forward) atas hasil kali tensor atom-atom basis:
     $$\mathbf{z}_{M_k} = \sigma \left( \mathbf{W} \bigotimes_{i} \mathbf{z}_{A_i}^{\alpha_i} \right)$$
     Contoh: Gaya `0xFORCE` ($[F] = [M][L][T]^{-2}$) direpresentasikan sebagai koordinat hasil interaksi kausalitas attention antara atom Massa ($M$), Panjang ($L$), dan kuadrat invers Waktu ($T^{-2}$).

3. **GENE (Spesifikasi Keadaan / ODE-PDE State Modules)**:
   * **Definisi Fisis**: Hukum dinamika atau kinematika yang mengatur evolusi dan interaksi antara molekul dan atom dalam suatu fungsi atau perangkat robot fisik.
   * **Formulasi Matematis**: Modul fungsional yang merepresentasikan sistem persamaan diferensial biasa/parsial (ODE/PDE) pada ruang keadaan (*state-space*):
     $$\frac{d\mathbf{z}}{dt} = \mathbf{f}(\mathbf{z}, \mathbf{u}; \theta)$$
     Di mana $\mathbf{z}$ adalah vektor keadaan terintegrasi (gabungan atom dan molekul aktif), $\mathbf{u}$ adalah input sensorik (real-time data stream), dan $\theta$ adalah matriks parameter fisis yang dikunci (*baked-in constraints*).

4. **EGG (Compiled State-Space Model)**:
   * **Definisi Fisis**: Kontainer biner terkompilasi dari operator transisi keadaan yang siap dieksekusi secara numerik.
   * **Formulasi Matematis**: Matriks transisi keadaan diskrit hasil kompilasi **Ovipositor** yang siap diintegrasikan secara numerik pada runtime **Energen** (misalnya menggunakan skema integrasi Runge-Kutta Run-Time):
     $$\mathbf{z}_{k+1} = \mathbf{z}_k + h \cdot \mathbf{\Phi}(\mathbf{z}_k, \mathbf{u}_k)$$
     Di mana $h$ adalah step-size yang dinormalisasi di level API/runtime.


---

### 0b. Spesifikasi Fisis & Kimia Sistem (Physical & Chemical System Specifications)

Untuk menjamin Sci-LM tidak melakukan halusinasi fisis, seluruh perhitungan keadaan pada tingkat **Molecule** dan **Gene** divalidasi secara kaku menggunakan spesifikasi fisis dan kimia dasar berikut:

#### 1. Parameter Fisis Atom & Ikatan (Atom & Bond Parameters)
Setiap properti fisis atom dan ikatan kimia dipetakan langsung ke sumbu dimensi kaku dasar di tingkat **Atom**:
* **Parameter Atom**:
  * Nomor Atom / Jumlah Proton $[Z]$ $\rightarrow$ `0xPROTON_COUNT` (ID `0x17`)
  * Massa Atom $[Da]$ $\rightarrow$ `0xMASS` (ID `0x12`)
  * Muatan Elektron $[e]$ $\rightarrow$ `0xCHARGE` (ID `0x14`)
  * Valensi / Kapasitas Ikatan $\rightarrow$ `0xVALENCE` (ID `0x18`)
  * Keadaan Oksidasi Redoks $\rightarrow$ `0xOXIDATION` (ID `0x1B`)
  * Energi Ionisasi Pertama $[eV]$ $\rightarrow$ `0xAMPLITUDE` (ID `0x14`)
  * Jari-jari Van der Waals $[\text{Å}]$ $\rightarrow$ `0xNM` (ID `0x11`)
* **Parameter Ikatan**:
  * Energi Disosiasi Ikatan $[kJ/mol]$ $\rightarrow$ `0xAMPLITUDE` (ID `0x14`)
  * Panjang Ikatan Ekuilibrium $[\text{Å}]$ $\rightarrow$ `0xNM` (ID `0x11`)

#### 2. Kinetika & Persamaan Fisis Fundamental (Fundamental Physical & Kinetic Equations)
Fungsi-fungsi dinamika sistem di level **Gene** mengacu pada hukum-hukum fisis berikut:
* **Termodinamika & Laju Reaksi**: Laju reaksi $k = A \exp(-E_a / RT)$ dan potensial sel elektrokimia $E = E^\circ - \frac{RT}{nF} \ln(Q)$ memetakan sumbu `0xHZ` (laju $k$), `0xKELVIN` (suhu $T$), dan `0xAMPLITUDE` (energi aktivasi $E_a$ / potensial $E$).
* **Hukum Gas Riil (Persamaan Van der Waals)**: Tekanan gas non-ideal $P = \frac{nRT}{V - nb} - \frac{an^2}{V^2}$ memetakan sumbu `0xMASS` (jumlah zat $n$), `0xMETER` (volume $V$), `0xKELVIN` (suhu $T$), dan `0xAMPLITUDE` (tekanan $P$).
* **Fisika Plasma & Radiasi**:
  * Fraksi ionisasi Saha memetakan sumbu `0xKELVIN` (suhu $T$), `0xAMPLITUDE` (energi ionisasi $E_i$), dan `0xION` (fraksi ionisasi).
  * Gaya Lorentz elektromagnetik $\mathbf{F} = q(\mathbf{E} + \mathbf{v} \times \mathbf{B})$ memetakan sumbu `0xCHARGE` (muatan $q$), `0xAMPLITUDE` (medan magnet/listrik), dan `0xFORCE_X/Y/Z` (vektor gaya).
  * Daya pancar radiasi termal Stefan-Boltzmann $P = \epsilon\sigma A T^4$ dan panjang gelombang emisi puncak Wien $\lambda_{\max} = b / T$ memetakan sumbu `0xKELVIN` (suhu $T$), `0xMETER` (luas $A$), `0xAMPLITUDE` (daya $P$), dan `0xNM` (panjang gelombang $\lambda_{\max}$).
* **Transisi Fase (Clausius-Clapeyron)**: Titik didih gas $\ln(P_2 / P_1) = \frac{\Delta H_{\text{vap}}}{R} (\frac{1}{T_1} - \frac{1}{T_2})$ memetakan sumbu `0xAMPLITUDE` (tekanan $P$) dan `0xKELVIN` (suhu $T$).

#### 3. Kinetika Biokimia & Enzimatis (Biochemical & Enzymatic Kinetics)
Pemodelan tingkat **Molecule** komposit dan kinetika enzimatis diselesaikan melalui:
* **Laju Michaelis-Menten Efektif**: Laju konstanta $K_m = \frac{\text{baseKm}}{\text{fit}} \times (1 + \text{branchCount} \times \text{penalty})$ di mana `fit` ditentukan oleh kemiripan sidik jari struktural.
  * *Dimensi Terkait*: `0xNM` ($K_m$ / steric radius), `0xVALENCE` (cabang penghalang sterik / branchCount), dan `0xION` (indeks kecocokan structural fingerprint).
* **Thermal Drift Reaksi**: Pergeseran suhu akibat disosiasi/pembentukan ikatan fisis $\Delta T$.
  * *Dimensi Terkait*: `0xMASS` (massa pelarut), `0xAMPLITUDE` (energi disosiasi/entalpi), dan `0xCelsius`/`0xKELVIN` (suhu bejana $\Delta T$).

#### 4. Dinamika Reaktor Seluler & Gen (Cellular Reactor & Genetic Dynamics)
Proses seluler dan homeostasis di level **Gene** dipetakan ke:
* **Homeostasis Seluler**: Laju difusi pasif menembus membran lipid semi-permeabel dan reaktor digesti simultan.
  * *Dimensi Terkait*: `0xLOGP` (permeabilitas membran), `0xMASS` (hukum kekekalan massa molekul), dan `0xHZ` (langkah simulasi waktu).
* **Translasi & Polimerisasi Asam Nukleat**: Pembacaan untaian template nukleotida dan sintesis rantai asam amino (peptida) oleh ribosome/polymerase.
  * *Dimensi Terkait*: `0xPROTON_COUNT` (identitas codon/nukleotida), `0xCHEMICAL_BOND` (ikatan fosfodiester/peptida).

#### 5. Kinetika Farmakologi (Pharmacological Kinetics)
Pemodelan absorbsi, metabolisme, dan eliminasi obat (ADME) tingkat **Gene** menggunakan:
* **Klirens Orde-Satu & Afinitas**: Konstanta disosiasi kompleks target ($K_d$) dan laju metabolisme klirens.
  * *Dimensi Terkait*: `0xNM` (jarak afinitas $K_d$ dalam $nM$), `0xHZ` (clearance rate dalam $min^{-1}$).
---

### 0c. Filosofi Dual-Engine: HLM (Generatif/Probabilistik) vs Sci-LM (Deterministik/Fisis)

Arsitektur Omni-Interaction (OI) didirikan di atas pemisahan tugas kaku antara dua jenis mesin kecerdasan yang memiliki sifat komplementer:

```
[ Input Preferensi / Bahasa Semantik ]
                  │
                  ▼
         [ HLM (Mesin Penebak) ]  ───(Aksi/Rekomendasi Semantik)───┐
                  ▲                                                │
                  │                                                ▼
     (Feedback Vektor Deviasi d) ◄──(Validasi Hukum Fisis)── [ Sci-LM (Mesin Kaku) ]
                                                                   │
                                                                   ▼
                                                          [ Realitas Fisik ]
```

#### 1. HLM (Human Language Model / ADN / Kosakata Semantik)
* **Sifat Dasar**: **Generatif & Probabilistik (Selalu Menebak)**.
* **Peran**: Menangani bahasa manusia, interpretasi preferensi, kode program generatif, dan interaksi sosial. HLM memprediksi token/keputusan berikutnya berdasarkan distribusi probabilitas semantik. HLM tidak memiliki insting hukum alam bawaan dan rentan mengalami halusinasi fisis.

#### 2. Sci-LM (Science Language Model / AFB / Sumbu Laten Kaku)
* **Sifat Dasar**: **Deterministik & Kaku (Tanpa Tebakan)**.
* **Peran**: Menegakkan hukum alam, fisika, kimia, dan batasan memori (seperti hukum Ohm, hukum Joule, dan batas aman termal). Hubungan fisis dikompilasi secara statis ke dalam biner EGG. Sci-LM bertindak sebagai katup pengaman (*governor*) yang memvalidasi bahwa setiap tebakan HLM berada dalam batas realitas fisik yang aman.

#### 3. Studi Kasus Integrasi: Transaksi Pasar Berbasis Saraf (Neuralink Marketplace)
Kolaborasi kedua mesin ini dapat digambarkan secara nyata pada skenario pembelian impulsif berbasis pembacaan sensor otak (Neuralink):
* **Fase Eksplorasi (HLM)**: HLM membaca sinyal dopamin Budi dari Neuralink (`0xAMPLITUDE`) untuk **menebak** produk rekomendasi berikutnya menggunakan gangguan acak (*random perturbation*) di ruang laten produk secara *real-time*.
* **Fase Katup Pengaman (Sci-LM)**: 
  * Di saat yang sama, aliran transaksi listrik Neuralink dibatasi oleh hukum Joule fisis ($P = I^2 R$). Jika hambatan transaksi ($R$, seperti keraguan beli) dibuat terlalu rendah untuk memperlancar arus transaksi ($I$), panas disipasi ($P$) di jaringan otak Budi dan tingkat penurunan saldo finansialnya akan melonjak naik.
  * Sci-LM secara analitis-statis memantau suhu elektroda (`0xTEMP`) dan batas saldo (`0xMIN`). Jika terdeteksi anomali panas/keuangan, Sci-LM langsung memotong arus stimulasi atau menaikkan hambatan transaksi ($R$) secara paksa di tingkat hardware tanpa campur tangan HLM.

---

### 1. Peta Topologi Data Datar (Universal Flattened Dimensions)

Model tidak lagi mengenal sekat kategori (Biologi, Kimia, Fluida, Kinetik). Seluruh fenomena alam dialirkan secara adil, setara, dan paralel ke dalam sumbu dimensi fundamental yang memiliki jangkar batas kaku (**Bound-Anchored**):

| Token ID (Index) | Nama Dimensi Laten | Representasi Objektif Alam Semesta | Domain Pembuktian / Use Case |
| --- | --- | --- | --- |
| `0x10` | **`0xLOGP`** | Koefisien partisi / permeabilitas membran | Kelarutan Lipofilik Senyawa Kimia / Obat |
| `0x11` | **`0xNM`** | Jarak spasial skala ultra-mikro (Nanometer) | Afinitas Ikatan ($K_d$), Steric Radius Sel |
| `0x12` | **`0xMASS`** | Besaran massa objek murni ($Da$, $kg$, $ton$) | Bobot Molekul Obat, Sasis Robot, Massa Magma |
| `0x13` | **`0xHZ`** | Frekuensi osilasi siklus per detik | Sinyal Akustik, Getaran Sesar, Detak Jantung |
| `0x14` | **`0xAMPLITUDE`** | Amplitudo / magnitudo energi puncak | Tinggi Ombak Laut, Tekanan Fluida, Voltage |
| `0x15` | **`0xVISCOSITY`** | Hambatan gesek internal fluida | Kekentalan Arus Magma, Darah, Aliran Air |
| `0x16` | **`0xMETER`** | Jarak spasial skala makroskopis | Trajektori Robot, Jarak Penghalang Spasial |
| `0x17` | **`0xPROTON_COUNT`** | Jumlah proton / Nomor atom murni ($Z$) | Identifikasi Unsur Kimia (C=6, H=1, O=8) |
| `0x18` | **`0xVALENCE`** | Elektron valensi luar atom | Kapasitas Ikatan Kovalen Atom |
| `0x19` | **`0xCHEMICAL_BOND`** | Nilai order / kekuatan tipe ikatan kimia | Struktur Konektivitas Molekul (Single, Double, Triple) |
| `0x1A` | **`0xION`** | Muatan netto total ion (Kation/Anion) | Status Ionik Atom/Senyawa (Na+, Cl-) |
| `0x1B` | **`0xOXIDATION`** | Bilangan oksidasi atom dalam senyawa | Keadaan Redoks Kimia (Fe2+, Fe3+) |
| `0x1C` | **`0xCRYPTO`** | Indeks kekuatan enkripsi / bukti kriptografis | Zero-Knowledge Proofs, Enkripsi Kunci Publik |

---

### 1a. Taksonomi Kind Dimensi

Setiap dimensi memiliki properti **`kind`** yang menentukan cara normalisasi dan encoding ke `[0, 1]`:

#### Kind 1 — `linear`
Dimensi berskala linear di mana nilai dinormalisasi menggunakan rentang batas bawah (`min`) dan batas atas (`max`). Untuk besaran yang batas bawah alaminya adalah 0 (tidak bisa negatif), nilai `min` cukup di-set ke `0`.

Di runtime Energen (Zig), normalisasi ini dilakukan tanpa percabangan (`branchless`):
```
normalized = (value - min) * reciprocal_range
```
Di mana `reciprocal_range = 1.0 / (max - min)`.

| Dimensi | `min` | Alasan |
| --- | --- | --- |
| `0xMASS` | `0` | Tidak ada massa negatif (fisika klasik) |
| `0xKELVIN` | `0` | Absolute zero = batas bawah mutlak |
| `0xHZ` | `0` | Frekuensi tidak bisa negatif |
| `0xVISCOSITY` | `0` | Hambatan gesek selalu positif |
| `0xAMPLITUDE` | `0` | Magnitudo selalu positif |
| `0xPROTON_COUNT` | `0` | Jumlah proton selalu bilangan bulat non-negatif |
| `0xVALENCE` | `0` | Elektron valensi selalu bilangan bulat non-negatif |
| `0xCHEMICAL_BOND` | `0` | Order ikatan kimia (Single=1.0, Double=2.0, dll.) selalu positif |
| `0xCelsius` | `-273.15` | Absolute zero dalam satuan Celsius |
| `0xLOGP` | `-5` | Senyawa sangat hidrofilik bisa negatif |
| `0xCHARGE` | `-max` | Muatan elektron negatif |
| `0xFORCE_X/Y/Z` | `-max` | Vektor gaya punya arah ± |
| `0xALTITUDE` | `-11000` | Mariana Trench di bawah permukaan laut |
| `0xION` | `-max` | Anion bermuatan negatif (misal Cl⁻ = -1) |
| `0xOXIDATION` | `-max` | Keadaan oksidasi dapat bernilai negatif (misal O = -2) |
| `0xCRYPTO` | `0` | Skala kekuatan kriptografi/privasi [0.0, 1.0] |

#### Kind 2 — `circular`
Nilai siklik — nilai tertinggi dan terendah secara semantik berdekatan. **Tidak bisa dinormalisasi linear** karena `359°` dan `1°` sebenarnya berjarak 2°, bukan 358°.

Encoding: **sin/cos dual-channel** agar model memahami kontinuitas siklik.

```
channel_a = (sin(value_rad) + 1) / 2   → [0, 1]
channel_b = (cos(value_rad) + 1) / 2   → [0, 1]
```

| Dimensi | Rentang | Contoh Use Case |
| --- | --- | --- |
| `0xANGLE` | `[0°, 360°)` | Orientasi sendi robot, arah angin |
| `0xPHASE` | `[0, 2π)` | Phase gelombang, siklus kimia |
| `0xDAY_OF_YEAR` | `[0, 365)` | Musim, ritme biologis |

> **Catatan:** Dimensi `circular` menghasilkan **2 nilai float** (sin + cos), bukan 1. Schema ADN harus mengalokasikan 2 slot per dimensi circular.

---

### 1b. Schema Dimensi (ADN Metadata)

Format definisi dimensi yang lengkap:

```yaml
dimension:
  id: 0x10
  name: 0xLOGP
  kind: linear          # linear | circular
  min: -5               # batas bawah linear
  max: 10
  max_type: consensus   # absolute | consensus | learnable
  unit: logP
  domain: [chemistry, pharmacology]

dimension:
  id: 0x13
  name: 0xHZ
  kind: linear
  min: 0
  max: 20000
  max_type: consensus   # bisa di-override per context (audio vs tektonik)
  unit: hertz

dimension:
  id: 0x1A
  name: 0xANGLE
  kind: circular
  min: 0
  max: 360
  max_type: absolute
  unit: degree
  channels: 2           # sin + cos
```

**`max_type`** menentukan apakah batas atas boleh di-override:
- `absolute` → hardcode permanen (konstanta fisika fundamental)
- `consensus` → default ilmiah, overridable per deployment context
- `learnable` → ditentukan dari data, untuk dimensi baru yang belum punya batas mapan

---

### 2. Arsitektur Aliran Injeksi Mesin (Zero-Hardcode Pipeline)

#### Langkah 1: Phase Ingesti & Ekstraksi (Ovipositor)

* **Input:** Lembaran dokumen sains mentah (`docs` murni dari teks markdown, waveform, tabel data).
* **Proses:** Ovipositor mengekstrak nilai kontinu, mengenali indikator dimensinya, lalu menarik batas ekstrem konseptual (`min` dan `max`).
* **Output:** Bobot *embedding* model dikunci secara kaku (**Baked-In Constraints**). Rumus-rumus dilarutkan menjadi koordinat ruang keadaan. Tidak ada kode `if-else` manual atau konstanta matematika yang diketik di baris kode TypeScript/Bun server.

#### Langkah 2: Transmisi Vektor Padat (Agent IR Payload)

Ketika runtime berjalan, perantara biner diatur penuh oleh format **ADN** tanpa polusi delimiters teks manusia (JSON/String parsing):

```adn
░OmniState§ID¦Value
→10¦0.370     · // 0xLOGP diredam ke rentang aman [0, 1]
→11¦0.050     · // 0xNM   (skala afinitas ikatan molekuler)
→12¦0.822     · // 0xMASS (massa murni Da / sasis robot)
→13¦0.400     · // 0xHZ   (osilasi waveform gelombang laut / tektonik)
→14¦0.080     · // 0xAMPLITUDE (magnitudo puncak isyarat alam)

```

#### Langkah 3: Eksekusi Tabrakan di Self-Attention Loop

Begitu muatan byte biner masuk via stream pipe (`stdin`), matriks Query ($Q$), Key ($K$), dan Value ($V$) langsung melakukan operasi *dot-product* secara paralel di satu ruangan yang sama:

$$\text{Omni\_Attention}(Q,K,V) = \text{softmax}\left(\frac{Q \cdot K^T}{\sqrt{d_k}}\right)V$$

---

### 3. Matriks Simulasi Tabrakan Lintas Fenomena (Omni-Interaction)

Karena seluruh aturan main dialirkan pada dimensi datar $[0, 1]$ yang seragam, model menyelesaikan evolusi keadaan alam secara kontinu tanpa perlu memanggil fungsi *library* eksternal terpisah:

#### Use Case A: Biokimia & Mikro-Spasial (Sample AtomikaLab Lama)

* **Query ($Q_{\text{0xLOGP}}$):** Karakteristik kelarutan lipofilik molekul senyawa obat.
* **Key ($K_{\text{0xNM}}$):** Jarak steric radius reseptor protein target bakteri/sel.
* **Mekanisme Otomatis:** Perkalian matriks attention mendeteksi kecocokan spasial latent. Nilai kemunduran viabilitas sel target langsung terhitung di baris output Value ($V$) tanpa rumatan baris kode if-else prosedural.

#### Use Case B: Geo-Fluida & Getaran (Fluida / Geologi)

* **Query ($Q_{\text{0xAMPLITUDE}}$):** Lonjakan tekanan energi dalam saluran gunung api.
* **Key ($K_{\text{0xVISCOSITY}}$):** Hambatan gesek kekentalan fluida magma.
* **Mekanisme Otomatis:** Model langsung mengalkulasi prediksi retakan mekanis struktural karena sumbu `0xVISCOSITY` dan `0xAMPLITUDE` bertubrukan langsung pada ruang representasi yang sama.

#### Use Case C: Cuaca & Gelombang Ombak (Meteorologi / Waveform)

* **Query ($Q_{\text{0xHZ}}$):** Siklus osilasi periodik hembusan angin badai kontinu.
* **Key ($K_{\text{0xAMPLITUDE}}$):** Ketinggian puncak gelombang air laut makro.
* **Mekanisme Otomatis:** Melalui *Self-Attention Loop*, pergeseran trajektori gelombang laut dan dampak kerusakan pesisir diramalkan secara simultan dalam satu *Attention Window*.

#### Use Case D: Akustik & Harmoni Musik (Do-Re-Mi)

* **Query ($Q_{\text{0xHZ}}$):** Osilasi frekuensi fundamental nada (misal: C4 / Do = 261.63 Hz).
* **Key ($K_{\text{0xHZ}}$):** Kelipatan harmonik rasio bilangan bulat (misal: G4 / Sol = 392.00 Hz, rasio 3:2).
* **Mekanisme Otomatis:** Melalui *Self-Attention Loop*, keselarasan kord (konsonansi) dan amplop amplitudo (`0xAMPLITUDE`) terhitung secara fisis di ruang laten tanpa melibatkan modul audio/MIDI eksternal.

#### Use Case E: Perambatan Gelombang & Prediksi Masa Depan (Tsunami)

* **Query ($Q_{\text{0xTIME}}$):** Jarak waktu prediksi masa depan ($\Delta t$) sebagai sumbu integrasi temporal.
* **Key ($K_{\text{0xMETER, 0xAMPLITUDE, 0xACCEL}}$):** Keadaan spasial gelombang dangkal saat ini (kedalaman laut $d$, tinggi ombak $\eta$, dan gravitasi $g$).
* **Mekanisme Otomatis:** Untuk meramalkan keadaan tsunami di masa depan, sirkuit attention mengevaluasi turunan waktu dari sistem persamaan gelombang ($\frac{\partial^2 \eta}{\partial t^2} = g \cdot d \frac{\partial^2 \eta}{\partial x^2}$) dan melakukan integrasi Runge-Kutta kontinu:
  $$\mathbf{z}(t + \Delta t) = \mathbf{z}(t) + \int_{t}^{t + \Delta t} \mathbf{f}(\mathbf{z}(s), \mathbf{u}(s)) \, ds$$
  Model secara langsung memproyeksikan perambatan spasial dan kenaikan amplitudo gelombang saat menghantam pantai pada waktu $\Delta t$ di masa depan.

#### Use Case F: Genetika Molekuler & Sintesis Protein (DNA/RNA)

* **Query ($Q_{\text{0xPROTON_COUNT, 0xCHEMICAL_BOND}}$):** Urutan sekuens nukleotida (A, T, C, G) pada untai cetakan DNA template.
* **Key ($K_{\text{0xNM, 0xHZ, 0xKELVIN}}$):** Jarak ikatan hidrogen pasangan basa ($\approx 0.34\text{ nm}$), laju reaksi polimerase/ribosom ($min^{-1}$), dan kestabilan termal heliks.
* **Mekanisme Otomatis:** Melalui *Self-Attention Loop*, model mencocokkan basa komplementer (A-T/C-G) berdasarkan struktur fisis dan muatan lokal, lalu memicu reaksi penambahan ikatan fosfodiester/peptida secara otomatis tanpa memerlukan parser teks codon eksternal.

#### Use Case G: Infeksi Virus & Penempelan Reseptor Sel (Virologi)

* **Query ($Q_{\text{0xNM, 0xCHARGE}}$):** Geometri protein selubung/Spike virus dan muatan elektrostatik permukaan pada titik kontak.
* **Key ($K_{\text{0xNM, 0xLOGP}}$):** Struktur protein reseptor inang pada membran lipid semi-permeabel sel.
* **Mekanisme Otomatis:** Melalui *Self-Attention Loop*, model menghitung afinitas pengikatan (*binding energy*) dan probabilitas fusi membran menggunakan koordinat spasial nano (`0xNM`) dan kelarutan lipid (`0xLOGP`). Begitu ambang batas fisis terlampaui, modul **Gene** dipicu untuk menyuntikkan dan mereplikasi materi genetik virus di dalam sel inang.

#### Use Case H: Distribusi Anggaran & Kebijakan Logistik Publik (Pemerintahan)

* **Query ($Q_{\text{0xAMPLITUDE, 0xVISCOSITY}}$):** Alokasi dana pembangunan daerah (amplitudo) dan indeks hambatan administrasi/birokrasi lokal (viskositas).
* **Key ($K_{\text{0xMETER, 0xHZ}}$):** Jarak jangkauan geografis ke daerah penerima (meter) dan frekuensi putaran pasokan komoditas logistik (Hz).
* **Mekanisme Otomatis:** Melalui *Self-Attention Loop*, model mensimulasikan efisiensi distribusi anggaran pembangunan layaknya dinamika fluida dalam jaringan pipa berhambatan. Kecepatan penyerapan anggaran dan tingkat kerawanan ekonomi daerah langsung terproyeksikan di output Value ($V$) secara kontinu tanpa membutuhkan model sosiologis kualitatif.

#### Use Case I: Deteksi Kebocoran Aliran & Anomali Transaksi (Anti-Korupsi)

* **Query ($Q_{\text{0xAMPLITUDE, 0xMASS}}$):** Laporan mutasi transaksi keuangan pejabat (amplitudo) dan realisasi volume fisik proyek infrastruktur yang diselesaikan (massa).
* **Key ($K_{\text{0xVISCOSITY, 0xTIME}}$):** Koefisien hambatan durasi birokrasi (viskositas) dan jeda waktu pelaksanaan proyek (waktu).
* **Mekanisme Otomatis:** Berdasarkan hukum kekekalan massa/energi (divergensi aliran), model menghitung kehilangan fisis $\text{Divergensi} = \text{Anggaran Masuk} - (\text{Output Fisik} + \text{Biaya Transaksi Resmi})$. Jika terdeteksi divergensi $> 0$ (ada energi/massa yang hilang tanpa penjelasan fisis), sirkuit attention akan langsung menandai titik transaksi tersebut sebagai "kebocoran latent" secara otomatis.

#### Use Case J: Konversi Biomassa & Produktivitas Hayati (Pertanian & Peternakan)

* **Query ($Q_{\text{0xMASS, 0xAMPLITUDE}}$):** Jumlah input pakan ternak / pupuk NPK (massa) dan intensitas penyinaran matahari / suhu kandang (amplitudo).
* **Key ($K_{\text{0xKELVIN, 0xTIME}}$):** Batas suhu optimum pertumbuhan biologis (Kelvin) dan siklus waktu irigasi/pemberian pakan (waktu).
* **Mekanisme Otomatis:** Melalui *Self-Attention Loop*, model memproyeksikan akumulasi berat bersih daging hewan ternak (menghitung Feed Conversion Ratio / FCR) atau yield panen tanaman secara kontinu berdasarkan hukum kekekalan massa (konversi input nutrisi menjadi biomassa) tanpa memerlukan simulasi laboratorium empiris yang lambat.

#### Use Case K: Dinamika Harga & Optimasi Distribusi Logistik (Marketplace)

* **Query ($Q_{\text{0xMASS, 0xHZ}}$):** Ketersediaan stok komoditas barang di gudang terdistribusi (massa) dan frekuensi pesanan pembelian real-time (Hz).
* **Key ($K_{\text{0xMETER, 0xAMPLITUDE, 0xVISCOSITY}}$):** Jarak pengiriman logistik (meter), batas harga konsumen (amplitudo), dan efisiensi birokrasi / hambatan rantai pasok (viskositas).
* **Mekanisme Otomatis:** Melalui *Self-Attention Loop*, model memprediksi waktu tiba pengiriman dan melakukan kalkulasi harga keseimbangan dinamis (*dynamic pricing*) secara kontinu berdasarkan interaksi suplai-permintaan layaknya beda potensial tekanan fisis.

#### Use Case L: Kecerdasan Organoid & Antarmuka Sel Saraf Bio-Komputasi (Organoid Intelligence)

* **Query ($Q_{\text{0xAMPLITUDE, 0xION}}$):** Potensial aksi letupan kelistrikan saraf ($\mu\text{V}$) dan fluks kation ($\text{Na}^+/\text{K}^+$) pada sel neuron hidup hasil kultur laboratorium.
* **Key ($K_{\text{0xTIME, 0xCHEMICAL_BOND, 0xKELVIN}}$):** Jeda waktu beda spike untuk plastisitas sinapsis (hukum STDP), pelepasan neurotransmiter kimiawi, dan suhu inkubasi konstan ($37^\circ\text{C}$ / $310.15\text{ K}$).
* **Mekanisme Otomatis:** Melalui *Self-Attention Loop*, model memproyeksikan penguatan/pelemahan jalur sinapsis (proses belajar biologis) dan memprediksi respons impuls balik sel saraf bio-komputer secara kontinu tanpa membutuhkan pustaka simulasi neuro-kognitif konvensional yang berat.

#### Use Case M: Desentralisasi Finansial, Blockchain, & Kriptografi Privasi (Zero-Knowledge OI)

* **Query ($Q_{\text{0xSTATE, 0xCRYPTO}}$):** Status bukti matematika (ZKP state/proof) dan kekuatan protokol enkripsi privasi yang mengunci kerahasiaan identitas transaksi.
* **Key ($K_{\text{0xAMPLITUDE, 0xHZ, 0xVISCOSITY}}$):** Jumlah nominal aliran transfer (amplitude), frekuensi transaksi (Hz), dan tingkat hambatan regulasi privasi/audit (viscosity).
* **Mekanisme Otomatis:** Melalui *Self-Attention Loop*, model memverifikasi kepatuhan hukum kekekalan aliran dana ($\nabla \cdot \mathbf{J} + \frac{\partial \rho}{\partial t} = 0$) secara analitis-statis tanpa perlu membuka data privasi pengirim/penerima. Jika terdeteksi transaksi ilegal atau percobaan pencucian uang, viskositas regulasi otomatis melonjak ke tak terhingga (memblokir transaksi pada gerbang *Membrane*).

Karena seluruh aturan main dialirkan pada dimensi datar $[0, 1]$ yang seragam, model menyelesaikan evolusi keadaan alam secara kontinu tanpa perlu memanggil fungsi *library* eksternal terpisah.

---

### 4. Ringkasan Keunggulan Mekanis

1. **Imunitas Terhadap Infinite Loop & Gradien Meledak:** Karena gerbang input memaksa seluruh nilai dari lapangan bersandar pada jangkar dimensi kaku $[0, 1]$, *attention window* tidak akan pernah terdistorsi oleh angka liar (*attention drift*).
2. **Zero-Copy Stream Kernel:** Integrasi asinkron runtime Bun mengeksekusi biner Energen (Zig-native compute) murni lewat jalur memori sirkuit `stdin/stdout` byte mentah. Alokasi string teks dibuang 100%, mematikan konsumsi memori dan overhead parser di perangkat edge computing.

---

## Agent Data Stream (ADS)

Induk dari AFB dan ADN. → [omni-interaction-ads.md](omni-interaction-ads.md)

```
Agent Data Stream (ADS)
├── Agent Data Notation (ADN)   ← HLM
└── Agent Frame Buffer (AFB)    ← Sci-LM
```

---

### Agent Data Notation (ADN)

Existing ADN di `pakakas/markzero`, untuk HLM.

---

### Agent Frame Buffer (AFB)

Varian data stream untuk Sci-LM. → [omni-interaction-afb.md](omni-interaction-afb.md)

---

## Executable Graph Geometry (EGG)

Trained model. → [omni-interaction-egg.md](omni-interaction-egg.md)

---

## Ovipar

Sub-sistem/engine pelatihan Sci-LM. → [omni-interaction-ovipar.md](omni-interaction-ovipar.md)

---

## Energen

EGG runtime. → [omni-interaction-energen.md](omni-interaction-energen.md)

---

## Technology Stacks

Spesifikasi integrasi Bun (TypeScript) + Zig. → [omni-interaction-stacks.md](omni-interaction-stacks.md)

---

## Coder Validation

Dimensi dan mekanisme validasi kaku non-linter. → [omni-interaction-coder.md](omni-interaction-coder.md)