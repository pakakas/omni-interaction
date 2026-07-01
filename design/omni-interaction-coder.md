## Omni-Interaction: Agent Coder

Usecase agent coder dalam pipeline Omni-Interaction.

---

### Pipeline

```
agent-input → brain-agent → hlm-agent → brain-agent → sci-agent → brain-agent → agent-output
  (senses)                  (generate)    (wrap)       (validasi)   (iterasi?)      (HI / file)
```

Brain-agent memutuskan iterasi atau output tergantung hasil validasi sci-agent.

---

### Peran Per Node

| Node | Peran di Coder |
| --- | --- |
| **agent-input** | Source code, prompt, file IO, stdin |
| **brain-agent** | Koordinator — routing generate → validasi → iterasi |
| **hlm-agent** | Generate code: requirement → source code (string) |
| **sci-agent** | Validasi code terhadap hukum formal CS via EGG |
| **energen** | EGG runtime — eksekusi validasi |
| **agent-output** | File writer, terminal, monitor |

---

### Dimensi Sci-LM untuk Code Validation

Linter rules bukan opini — berbasis hukum formal yang terukur, dinormalisasi ke `[0, 1]`:

| ID | Dimensi | `kind` | Min | Max | Hukum |
| --- | --- | --- | --- | --- | --- |
| `0x20` | **`0xCOMPLEXITY`** | linear | 0 | 50 | Cyclomatic complexity (McCabe) |
| `0x21` | **`0xDEPTH`** | linear | 0 | 10 | Nesting depth (graph theory) |
| `0x22` | **`0xCOUPLING`** | linear | 0 | 1 | Afferent/efferent coupling |
| `0x23` | **`0xCOHESION`** | linear | 0 | 1 | LCOM (Lack of Cohesion) |
| `0x24` | **`0xENTROPY`** | linear | 0 | 8 | Shannon entropy per token |
| `0x25` | **`0xLOC`** | linear | 0 | 500 | Lines of code per unit |
| `0x26` | **`0xTYPE`** | linear | 0 | 1 | Type correctness (0=error, 1=valid) |
| `0x27` | **`0xTIME_COMPLEXITY`** | linear | 0 | 4 | Asymptotic Time Complexity ($O(1)$ s/d $O(N^2)$) |
| `0x28` | **`0xALLOCS`** | linear | 0 | 100 | Jumlah alokasi memori di heap per unit |
| `0x29` | **`0xSANITY`** | linear | 0 | 1 | Rasio sanitasi input / dataflow security |
| `0x1C` | **`0xCRYPTO`** | linear | 0 | 1 | Kekuatan algoritma kriptografi (MD5=0.0, Argon2=1.0) |
| `0x2A` | **`0xAUTH_CHECK`** | linear | 0 | 1 | Adanya pemeriksaan otentikasi pada alur data sensitif |

---

### Loop Iterasi

```
brain-agent
  ├── delegate → hlm-agent        (generate code dari requirement)
  │               ↓
  │            raw code (string)
  │               ↓
  ├── wrap → sci-token
  │
  ├── delegate → sci-agent
  │               ↓
  │            energen             (validasi dimensi: complexity, coupling, dll)
  │               ↓
  ├── receive ← sci-agent
  │
  ├── [VALID] → agent-output       (tulis file / tampilkan)
  │
  └── [INVALID] → hlm-agent       (iterasi: generate ulang dengan constraint)
        ↑___________________________________|
```

---

### Contoh Validasi

Input ke sci-agent (AFB):

```
→ 0xCOMPLEXITY ¦ 0.86   ← terlalu tinggi (raw=43, max=50)
→ 0xDEPTH      ¦ 0.90   ← terlalu tinggi (raw=9, max=10)
→ 0xCOUPLING   ¦ 0.20   ← aman
→ 0xTYPE       ¦ 1.00   ← valid
```

Sci-agent output: `INVALID` pada `0xCOMPLEXITY` dan `0xDEPTH`.
Brain-agent delegate kembali ke hlm-agent dengan feedback dimensi yang dilanggar.

---

### Perbedaan dengan Agent Coding Konvensional

| Aspek | Konvensional | Omni-Coder |
| --- | --- | --- |
| **Validasi** | Pencocokan string aturan linter (heuristik/teks) | Evaluasi hukum formal CS via koordinat laten Sci-LM |
| **Feedback Loop** | Iterasi heuristik dengan menyuapkan log error mentah (unstructured text) ke LLM | Iterasi terarah menggunakan kalkulasi kemudi vektor deviasi fisis ($\mathbf{d}$) |
| **Metrik Koreksi** | Tebakan instruksi teks bebas | Nilai numerik batas kaku yang dilanggar secara eksplisit |
| **Multi-Domain** | Terbatas pada kode pemrograman | Dapat memvalidasi kode sains (fisika/kimia) secara simultan |

---

### Anatomi EGG dalam Sci-Coder

Bagaimana struktur internal EGG memproses validasi kode:

#### 1. Shell (Hard Bounds)
Menjaga parameter kualitas kode dalam batas aman. Nilai di luar batas ini akan langsung memicu penolakan (invalid):
* `0xCOMPLEXITY`: `max=50` (McCabe complexity limit).
* `0xDEPTH`: `max=10` (Nesting limit).
* `0xLOC`: `max=500` (Max lines per unit).
* `0xTYPE`: `min=0, max=1` (Binary/bool validity).

#### 2. Albumin (Embedding)
Menerjemahkan input status kode yang diekstrak oleh parser linter menjadi representasi vektor kontinu. Token `[0xCOMPLEXITY, 0.86]` diubah menjadi koordinat laten untuk diproses oleh sirkuit attention.

#### 3. Membrane (Causal Mask)
Menegakkan hukum kausalitas formal dari teori graf dan rekayasa perangkat lunak:
* `0xLOC` (Lines of Code) $\rightarrow$ `0xCOMPLEXITY` (Complexity) $\rightarrow$ `0xENTROPY` (Shannon entropy).
* `0xCOUPLING` (Coupling) $\rightarrow$ `0xCOHESION` (Cohesion) $\rightarrow$ Kestabilan struktural.
* Kausalitas satu arah: bertambahnya nested loops (`0xDEPTH`) pasti memengaruhi complexity, namun tingginya complexity tidak mengubah depth secara langsung. Arah balik diblokir oleh causal mask.

#### 4. Yolk (Causal Attention)
Matriks attention yang menyimpan korelasi fisis antara dimensi kualitas kode. Saat data `0xCOMPLEXITY` bertabrakan dengan `0xDEPTH` di sirkuit attention, Yolk menghitung derajat degradasi kualitas kode secara kontinu tanpa rumus heuristik if-else.

#### 5. Chalaza (Anchor)
Menjaga Yolk agar relasi antar dimensi CS tidak bergeser saat ada pembaruan versi linter/spesifikasi bahasa baru. Peningkatan kompleksitas struktural harus selalu berkorelasi positif dengan peningkatan entropi kode.

---

### Contoh Aliran Usecase: `0xCOMPLEXITY`

Berikut adalah simulasi bagaimana EGG memproses dan memvalidasi Cyclomatic Complexity dari sebuah unit kode:

#### 1. Input Source Code (Melalui `agent-input`)
Kode dengan banyak nested `if-else` bercabang masuk:
```typescript
function processPayment(user, amount) {
    if (user.active) {
        if (amount > 0) {
            if (user.balance >= amount) {
                // ... total percabangan menghasilkan McCabe Complexity = 43
            }
        }
    }
}
```

#### 2. Pre-processing & Normalisasi (Ke `AFB`)
Parser statis menghitung nilai absolut/raw dan mengirimkannya bersama parameter kebijakan dari proyek:
* **McCabe Complexity**: 43 (dari batas absolut `0xMAX = 50`).
* **Normalisasi Input**: $43 / 50 = 0.86$ untuk token `0xCOMPLEXITY`.
* **Kebijakan Proyek**: Diwakili oleh `0xCONSENSUS = 0.30` (artinya kita hanya menoleransi maksimum 30% dari batas absolut industri).
* **Hasil**: Token `[0xCOMPLEXITY, 0.86]`, `[0xMAX, 1.00]`, dan `[0xCONSENSUS, 0.30]` dikirim bersamaan dalam AFB stream.

#### 3. Pemrosesan di EGG
* **Shell & Albumin**: Memvalidasi bounds dan melakukan embedding ke representasi vektor masing-masing token.
* **Membrane (Causal Mask)**: 
  * Mengizinkan `0xCONSENSUS` dan `0xMAX` memengaruhi `0xMAX_COMPLEXITY`.
  * Mengizinkan `0xCOMPLEXITY` dan `0xMAX_COMPLEXITY` membandingkan nilai via attention.
* **Yolk (Attention Core)**:
  1. **Kalkulasi Batas Dinamis**:
     $$\text{Value}(0xMAX\_COMPLEXITY) = \text{Attention}(Q_{max\_complexity}, K_{consensus} \cdot K_{max})$$
     EGG menghitung target toleransi riil berdasarkan relasi hukum/kebijakan: $0.30 \times 1.00 = 0.30$ ($15$ dalam skala McCabe).
  2. **Evaluasi Kesesuaian**:
     Yolk membandingkan data aktual `[0xCOMPLEXITY, 0.86]` dengan batas dinamis hasil kalkulasi `[0xMAX_COMPLEXITY, 0.30]`.
     Karena $0.86 > 0.30$, sirkuit attention memproyeksikan status penolakan (`INVALID`) ke output head.

#### 4. Keputusan & Feedback (`brain-agent`)
1. `brain-agent` menerima output status `INVALID` dari `sci-agent`.
2. `brain-agent` menolak kode tersebut dan mengirimkan kembali instruksi perbaikan ke `hlm-agent`:
   > *"Sederhanakan percabangan. Kurangi 0xCOMPLEXITY dari 0.86 agar berada di bawah batas dinamis 0xMAX_COMPLEXITY (0.30)."*

---

### Contoh Aliran Usecase: `0xMIN` (Test Coverage)

Berikut adalah simulasi bagaimana EGG memproses dan memvalidasi batas bawah menggunakan Test Coverage (`0xCOVERAGE`):

#### 1. Input Status Pengujian (Melalui `agent-input`)
Unit testing framework melaporkan bahwa coverage kode saat ini berada di angka **65%** (`0.65`).

#### 2. Pre-processing & Normalisasi (Ke `AFB`)
* **Test Coverage**: 65% (`0.65`).
* **Batas Minimum Dasar Industri**: Diwakili oleh `0xMIN = 0.80` (80% target dasar).
* **Kebijakan Proyek**: Diwakili oleh `0xCONSENSUS = 0.90` (Kepatuhan strict 90% dari batas minimum industri).
* **Hasil**: Token `[0xCOVERAGE, 0.65]`, `[0xMIN, 0.80]`, dan `[0xCONSENSUS, 0.90]` dikirim bersamaan dalam AFB stream.

#### 3. Pemrosesan di EGG
* **Shell & Albumin**: Memvalidasi bounds dan melakukan embedding ke representasi vektor.
* **Membrane (Causal Mask)**: 
  * Mengizinkan `0xCONSENSUS` dan `0xMIN` memengaruhi `0xMIN_COVERAGE`.
  * Mengizinkan `0xCOVERAGE` dan `0xMIN_COVERAGE` berinteraksi via attention.
* **Yolk (Attention Core)**:
  1. **Kalkulasi Batas Dinamis**:
     $$\text{Value}(0xMIN\_COVERAGE) = \text{Attention}(Q_{min\_coverage}, K_{consensus} \cdot K_{min})$$
     EGG menghitung target batas bawah riil: $0.90 \times 0.80 = 0.72$ (Min 72% coverage).
  2. **Evaluasi Kesesuaian**:
     Yolk membandingkan data aktual `[0xCOVERAGE, 0.65]` dengan batas dinamis hasil kalkulasi `[0xMIN_COVERAGE, 0.72]`.
     Karena $0.65 < 0.72$ (berada di bawah batas minimum dinamis), sirkuit attention memproyeksikan status penolakan (`INVALID`) ke output head.

#### 4. Keputusan & Feedback (`brain-agent`)
1. `brain-agent` menerima status `INVALID` pada `0xCOVERAGE`.
2. `brain-agent` menolak release dan mendelegasikan perbaikan kode/test ke `hlm-agent`:
   > *"Tingkatkan cakupan test. Naikkan 0xCOVERAGE dari 0.65 agar berada di atas batas minimum dinamis 0xMIN_COVERAGE (0.72)."*

---

### Proses Ekstraksi Kode ke AFB (Level Senses)

Bagaimana file source code mentah diubah menjadi data numerik kaku di AFB stream secara otomatis:

```
[ Source Code (.ts/.go) ]
          │
          ▼ (AST Parser: tree-sitter / oxc)
[ Raw Metrics Extraction ]
  - Branches Count      -> McCabe Complexity
  - Max Nesting Depth   -> Nest Depth
  - Import/Export Graph -> Coupling / Cohesion
          │
          ▼ (brain-agent normalization)
[ AFB Stream Payload ]
  [ 0xCOMPLEXITY, 0.86 ]
  [ 0xDEPTH, 0.90 ]
```

1. **AST Parsing (Fast Static Analysis)**:
   Di tingkat `agent-input` (senses), parser statis ultra-cepat (seperti `oxc` atau `tree-sitter` bindings) membaca kode setiap kali ada perubahan file.
2. **Kalkulasi Metrik Numerik**:
   * **`0xCOMPLEXITY`**: Dihitung berdasarkan jumlah titik keputusan (`if`, `else`, `switch case`, `catch`, operator logika `&&`/`||`) plus 1.
   * **`0xDEPTH`**: Dihitung dari kedalaman nested block terdalam di dalam AST.
   * **`0xCOUPLING`**: Dihitung dari rasio dependensi eksternal terhadap total modul dalam dependency graph.
3. **Penyusunan AFB**:
   `brain-agent` memetakan metrik mentah tersebut terhadap bounds di **Shell** untuk menghasilkan float `[0.0, 1.0]` dan menulisnya ke layout memori AFB.

---

### Mekanisme Feedback Loop & Parameter Refactoring

Siklus perbaikan otomatis ketika kode dinyatakan `INVALID` oleh Sci-LM:

```
[ sci-agent (INVALID) ] ──→ [ brain-agent (Assemble Instruction) ] ──→ [ hlm-agent (Refactor) ]
                                                                             │
                                                                             ▼
                                                                  [ Generate Clean Code ]
```

1. **Evaluasi Penyimpangan**:
   `brain-agent` menerima data output dari `sci-agent`. Ia tidak hanya mendeteksi flag `INVALID`, tapi menghitung selisih numerik ($\Delta$) dari target:
   $$\Delta = \text{Input} - \text{Threshold}$$
   *Contoh*: $0.86 - 0.30 = +0.56$ (melebihi batas toleransi sebesar 56%).
2. **Perakitan Instruksi Batas (Prompt Assembly)**:
   `brain-agent` menyusun instruksi perbaikan untuk `hlm-agent` dengan batasan target kaku berbasis angka riil:
   * *"Refactor code. McCabe Complexity must be reduced by at least 50% (Current: 43 paths, Target: < 15 paths). Reduce nesting levels."*
3. **Refactoring Bertarget**:
   `hlm-agent` (LLM) membaca instruksi numerik ini. Dibandingkan dengan umpan balik teks linter biasa yang membingungkan, instruksi berbasis batas fisis-formal ini memandu LLM untuk langsung membongkar fungsi besar menjadi sub-fungsi kecil untuk menekan angka kompleksitas jalur eksekusi secara deterministik.


---

### Mekanisme Penanganan Diff dan Validasi Inkremental (Incremental Diff Validation)

Mengirimkan seluruh berkas kode sumber mentah untuk ditulis ulang setiap kali terjadi pelanggaran batas kualitas sangatlah tidak efisien (memakan konteks token besar dan lambat). Oleh karena itu, Omni-Coder menerapkan skema **perbaikan berbasis diff inkremental**:

```
[ hlm-agent (Generate Diff) ] ──→ [ brain-agent (Apply Patch) ] ──→ [ AST Incremental Parser ]
                                                                             │
                                                                             ▼
[ sci-agent (INVALID) ] ◄── (Kalkulasi Target Hunk) ◄── [ Target Lines Mapping (d) ]
```

#### 1. Generasi Diff Terkompresi
Dibanding menulis ulang file utuh, `hlm-agent` diinstruksikan untuk hanya menghasilkan perubahan kode dalam format **Unified Diff (atau Patch)**.

#### 2. Penerapan Patch & Incremental AST Parsing
* `brain-agent` menerima file diff, lalu menerapkannya pada berkas kode sumber asli secara lokal untuk menghasilkan representasi kode sementara (*patched source code*).
* Parser AST (`oxc` / `tree-sitter`) tidak menganalisis seluruh file dari awal. Parser melakukan **Incremental Parsing** murni pada node-node AST yang mengalami modifikasi berdasarkan rentang baris (*line range*) di dalam blok diff (**diff hunks**).

#### 3. Pemetaan Deviasi $\mathbf{d}$ Tertarget ke Baris Diff
Jika status kode hasil patch dinyatakan `INVALID` oleh `sci-agent` (misalnya penambahan perulangan bersarang baru di dalam diff melanggar batas `0xDEPTH`):
* `brain-agent` menghitung nilai deviasi $\mathbf{d}$.
* Berbeda dengan agen konvensional yang menyuapkan kembali log teks linter penuh secara acak, `brain-agent` memetakan parameter pelanggaran langsung ke **baris spesifik dalam hunk diff yang bersangkutan**.
* Vektor instruksi dirakit secara presisi:
  ```
  Pelanggaran Hukum Fisis pada Diff Terpasang:
  - Hunk 2 pada Baris 45-50 melanggar batas 0xDEPTH (Depth aktual: 11, Batas: 10).
  - Harap sederhanakan loop bersarang di area diff tersebut saja.
  ```
* `hlm-agent` menerima instruksi terlokalisasi ini dan membetulkan baris diff yang bermasalah secara langsung. Ini memutus iterasi tebakan tak terarah dan menghemat token pemrosesan hingga 80%.

---

### Validasi Arsitektur Lanjutan (Non-Linter)

Sci-LM di Coder melampaui linter teks biasa dengan memvalidasi hukum-hukum deterministik ilmu komputer berikut:

#### 1. Validasi Kompleksitas Asimtotik (Big-O)
* **Konsep**: Menghindari degradasi performa akibat algoritma yang tidak efisien.
* **Proses**: 
  1. `agent-input` membedah struktur perulangan (loop) di AST.
  2. Menentukan skala `0xTIME_COMPLEXITY` (0.0 = $O(1)$, 0.25 = $O(\log N)$, 0.50 = $O(N)$, 0.75 = $O(N \log N)$, 1.00 = $O(N^2)$).
  3. EGG mencocokkan nilai ini dengan `0xMAX_TIME_COMPLEXITY` yang ditentukan oleh target performance budget. Algoritma kuadratik ($O(N^2)$) pada fungsi kritis akan otomatis memicu status `INVALID`.

#### 2. Kontrol Alokasi Heap (Zero-Heap Policy di Zig/Rust)
* **Konsep**: Menjamin performa real-time bebas latency lag di level hardware edge computing.
* **Proses**:
  1. Parser memindai penggunaan keyword allocator (seperti `alloc`, `malloc`, `new`) di dalam scope kode.
  2. Mengisi dimensi `0xALLOCS` di AFB.
  3. Pada gen sensitif hardware, `0xMAX_ALLOCS` di-set ke `0.0` (kebijakan zero-allocation). Adanya instruksi alokasi memori dinamis di dalam loop utama akan langsung memicu penolakan EGG.

#### 3. Keamanan Aliran Data (Security Dataflow Sanitization)
* **Konsep**: Mencegah kebocoran informasi sensitif (seperti kredensial) atau serangan injeksi.
* **Proses**:
  1. Pelacak aliran data (taint analysis) memetakan variabel sensitif dari source (input) ke sink (output/logging).
  2. Jika data sensitif mengalir ke output tanpa disanitasi/di-masking, tingkat `0xSANITY` akan jatuh ke `0.0`.
  3. EGG mendeteksi deviasi keamanan ini dan memaksa `hlm-agent` melakukan generator ulang untuk menyisipkan fungsi sanitasi/enkripsi.

#### 4. Penegakan Hukum Keamanan Kode (Coding Security)
* **Konsep**: Memaksa penggunaan algoritma kriptografi yang kuat dan memastikan otentikasi kaku pada gerbang API sensitif.
* **Proses**:
  * **Analisis Kriptografi**: Parser mendeteksi algoritma cipher/hash yang digunakan. EGG memetakan ke `0xCRYPTO` (MD5/SHA1 = $0.0$, SHA256 = $0.7$, Argon2id = $1.0$). Jika kebijakan proyek mewajibkan standar tinggi (`0xMIN_CRYPTO = 0.70`), penggunaan MD5 akan langsung di-reject.
  * **Kausalitas Otentikasi (Membrane Enforcement)**: Hukum keamanan *"Semua pembacaan database sensitif harus didahului pemeriksaan otentikasi"* ditegakkan di **Membrane** melalui Causal Mask:
    `0xAUTH_CHECK` $\rightarrow$ `0xDATABASE_ACCESS`
    Jika terdapat alur data di mana pembacaan database diakses tanpa ada node pemeriksaan otentikasi sebelumnya, Causal Mask di Membrane akan memutus aliran attention vektor, memaksa status keluaran Yolk menjadi `INVALID` (Security Violation).

---

### 5. Algoritma Ekstraksi AST Formal (Formal AST Extraction Algorithms)

Proses pemetaan berkas kode mentah menjadi koordinat dimensi di AFB dilakukan melalui penelusuran pohon sintaks abstrak (Abstract Syntax Tree / AST) menggunakan linter statik ultra-cepat (misalnya `tree-sitter` atau parser `oxc` di level sensori). Berikut adalah formulasi ekstraksi metriknya:

#### A. Kompleksitas Siklomatis (`0xCOMPLEXITY`)
Dihitung menggunakan modifikasi rumus McCabe dari jumlah titik keputusan pada AST graf aliran kontrol (Control Flow Graph):
$$\text{McCabe} = 1 + \sum_{n \in \text{AST}} \text{IsDecisionNode}(n)$$
Di mana $\text{IsDecisionNode}(n)$ bernilai `1` jika tipe node AST adalah:
* `IfStatement` (`if-else`)
* `ForStatement`, `ForInStatement`, `ForOfStatement` (`for` loops)
* `WhileStatement`, `DoWhileStatement` (`while` loops)
* `CatchClause` (`try-catch`)
* `ConditionalExpression` (operator ternary `? :`)
* `LogicalExpression` dengan operator `&&` atau `||`

#### B. Kedalaman Nesting Maksimum (`0xDEPTH`)
Mengukur tingkat kebersarangan terdalam dengan menelusuri kedalaman hierarki node kontainer:
$$\text{Depth}(n) = \begin{cases} 
0, & \text{jika } n \text{ adalah root} \\
1 + \max_{c \in \text{Children}(n)} \text{Depth}(c), & \text{jika } n \text{ bertipe BlockStatement/Loop/Branch} \\
\max_{c \in \text{Children}(n)} \text{Depth}(c), & \text{lainnya}
\end{cases}$$

#### C. Estimasi Kompleksitas Waktu Asimtotik (`0xTIME_COMPLEXITY`)
Menentukan nilai asimtotik Big-O secara statik melalui perkalian kedalaman loop yang bersarang secara spasial di dalam satu fungsi:
* **$O(1)$** $\rightarrow$ `0.00`: Tidak ada perulangan (`LoopStatement`).
* **$O(\log N)$** $\rightarrow$ `0.25`: Loop dengan pembagian indeks (misal pergeseran bit / pembagian biner).
* **$O(N)$** $\rightarrow$ `0.50`: Satu tingkatan loop tunggal.
* **$O(N \log N)$** $\rightarrow$ `0.75`: Satu loop yang membungkus loop logaritmik.
* **$O(N^2)$** atau lebih $\rightarrow$ `1.00`: Dua atau lebih tingkatan loop bersarang (`nested loops`).

#### D. Alokasi Heap Dinamis (`0xALLOCS`)
Menghitung frekuensi instansiasi objek dinamis di dalam ruang memori heap:
$$\text{AllocCount} = \sum_{n \in \text{AST}} \text{IsAllocationNode}(n)$$
Di mana $\text{IsAllocationNode}(n)$ bernilai `1` jika node adalah `NewExpression` (di JS/TS), `CallExpression` yang memanggil `malloc`/`allocator` (di C/Zig/Rust), atau alokasi array dinamis.

---

### 6. Skema Kompilasi EGG untuk Validasi Kode (EGG Coder Compilation)

Aturan kualitas kode dikompilasi oleh compiler **Ovipar** menjadi format biner `.egg` yang dibaca secara *zero-copy* oleh runtime **Energen**. Struktur internal EGG untuk Coder adalah sebagai berikut:

```
┌────────────────────────────────────────────────────────┐
│                        SHELL                           │
│  [0xCOMPLEXITY Bounds: 0.0 - 1.0] [0xDEPTH Bounds]     │
├────────────────────────────────────────────────────────┤
│                       MEMBRANE                         │
│  Causal Mask Matrix:                                   │
│  - 0xDEPTH -> 0xCOMPLEXITY (Allowed: Yes)              │
│  - 0xAUTH_CHECK -> 0xDATABASE_ACCESS (Enforced)        │
├────────────────────────────────────────────────────────┤
│                        YOLK                            │
│  Attention Weight Matrix (W_q, W_k, W_v)               │
│  - Mengalkulasi deviasi fisis terhadap batas           │
└────────────────────────────────────────────────────────┘
```

Saat validasi berjalan, Energen memuat berkas biner `.egg` tersebut langsung ke memori. Berkas AFB berisi metrik AST yang dialirkan lewat `stdin` akan langsung dikalikan dengan matriks Yolk untuk menghasilkan output evaluasi dalam waktu kurang dari **1 milidetik**.

---

### 7. Formulasi Matematis Feedback Loop (Mathematical Feedback Steering)

Jika hasil evaluasi EGG menyatakan status kode `INVALID`, coordinator `brain-agent` menghitung vektor deviasi $\mathbf{d}$ untuk mengarahkan refactoring otomatis oleh `hlm-agent`:

#### 1. Perhitungan Jarak Deviasi (Loss Calculation)
Untuk setiap dimensi yang dilanggar, dihitung selisih absolut terhadap ambang batas dinamis:
$$d_i = \max(0, \text{Actual}_i - \text{MaxThreshold}_i) + \max(0, \text{MinThreshold}_i - \text{Actual}_i)$$

#### 2. Kemudi Instruksi Refactoring (Feedback Vector Assembly)
Vektor deviasi $\mathbf{d}$ diterjemahkan secara otomatis menjadi prompt instruksi numerik kaku:
$$\text{Instruction} = \bigcup_{d_i > 0} \text{GeneratePrompt}(\text{Dimensi}_i, d_i)$$
*Contoh*: Jika $\text{Actual}_{\text{complexity}} = 0.86$ dan $\text{MaxThreshold} = 0.30$, maka deviasi $d_{\text{complexity}} = +0.56$.
Instruksi yang dihasilkan:
```
Constraint Kaku Kualitas Kode yang Wajib Dipenuhi:
- 0xCOMPLEXITY harus diturunkan minimal sebesar 56% (McCabe saat ini: 43, Target: < 15).
- Pecah fungsi 'processPayment' menjadi 3 sub-fungsi independen untuk memotong jalur percabangan AST.
```
Dengan instruksi berbasis metrik numerik ini, `hlm-agent` (LLM) dapat melakukan penulisan ulang kode secara presisi dan deterministik tanpa tebakan heuristik.







