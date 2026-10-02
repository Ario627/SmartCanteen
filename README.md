# SmartCanteen

Prototype antrean virtual kantin sekolah. Memindahkan proses antre dari antrean fisik menjadi antrean digital: pesan dari kelas, bayar, lalu ambil pesanan saat nomor dipanggil.

Dibangun sebagai halaman statis tanpa build step, tanpa backend, dan tanpa dependency framework. Seluruh angka kepadatan, pembayaran, dan nomor antrean adalah simulasi di sisi peramban.

## Menjalankan

Buka `index.html` langsung di peramban, atau sajikan lewat server statis lokal:

```bash
python3 -m http.server 8000
```

Lalu buka `http://localhost:8000`.

Untuk pengujian data dari nol, bersihkan penyimpanan lokal:

```js
localStorage.clear();
```

## Status pengembangan

### Sudah berjalan

- Beranda dengan status kepadatan kantin, estimasi tunggu, dan langkah alur pemesanan
- Katalog menu: pencarian, filter kategori, dan pengurutan harga maupun penjualan
- Halaman detail menu dengan pengatur jumlah porsi dan catatan untuk dapur
- Keranjang: ubah jumlah, hapus item, kosongkan dengan konfirmasi dua langkah, tersimpan di peramban
- Checkout: data pemesan dengan validasi, pilihan metode QRIS atau tunai
- QR simulasi yang mengarah ke tautan Instagram, dapat dipindai Google Lens
- Pembuatan nomor antrean otomatis dan struk konfirmasi
- Riwayat pesanan tersimpan di penyimpanan lokal

### Menyusul

- `/queue` layar antrean untuk monitor kantin
- `/admin` dashboard pengelola: kelola pesanan, ubah status, riwayat transaksi
- `/order/:id` pelacakan status pesanan dengan simulasi perubahan status
- Penghitungan kepadatan dari kamera, backend, dan basis data

## Rute

| Rute | Halaman |
| --- | --- |
| `#/` | Beranda dan status kepadatan |
| `#/menu` | Katalog menu |
| `#/menu/:id` | Detail menu |
| `#/cart` | Keranjang |
| `#/checkout` | Checkout dan struk |
| `#/queue` | Layar antrean (belum tersedia) |
| `#/admin` | Dashboard kantin (belum tersedia) |

Navigasi memakai hash router buatan sendiri, sehingga seluruh halaman dapat dibuka langsung dari `file://` tanpa server.

## Struktur berkas

```
.
├── index.html
└── assets
    ├── css
    │   ├── tokens.css         variabel warna, tipografi, jarak
    │   ├── base.css           reset, tata letak, kepala, kaki, tab bar
    │   ├── components.css     tombol, kartu, chip, stepper, komposisi gambar
    │   ├── views.css          gaya per halaman
    │   └── checkout.css       gaya checkout dan struk
    └── js
        ├── config.js          tautan Instagram, prefiks nomor antrean
        ├── format.js          rupiah, angka, waktu, hash, pembatas
        ├── dom.js             escape HTML, pembuat elemen, delegasi event
        ├── data.js            katalog produk, kategori, pengurutan
        ├── crowd.js           model kepadatan kantin
        ├── cart.js            keadaan keranjang dan penyimpanan lokal
        ├── orders.js          pembuatan dan penyimpanan pesanan
        ├── qr.js              QR ke SVG
        ├── router.js          pencocokan rute dan siklus hidup view
        ├── ui.js              potongan markup bersama
        ├── layout.js          kerangka halaman, navigasi, notifikasi
        ├── views
        │   ├── home.js
        │   ├── menu.js
        │   ├── product.js
        │   ├── cart.js
        │   ├── checkout.js
        │   └── fallback.js
        └── app.js             pendaftaran rute dan delegasi global
```

## Arsitektur

Seluruh modul berbagi satu namespace global `window.SC`. Tidak ada bundler dan tidak ada modul ES, sehingga berkas dapat dimuat berurutan lewat tag `script`.

Setiap view adalah fungsi yang menerima konteks rute dan mengembalikan objek dengan bentuk berikut:

```js
{
  title: "Judul dokumen",
  announce: "Teks untuk pembaca layar",
  el: HTMLElement,
  mount(el),   // opsional, dipanggil setelah elemen masuk ke DOM
  destroy()    // opsional, dipanggil sebelum rute berganti
}
```

Satu view wajib mengembalikan satu elemen root nyata. Delegasi event dipasang pada elemen tersebut, jadi mengembalikan potongan dokumen akan memutus seluruh interaksi.

### Model data

```js
Product  { id, name, category, price, sold, available, description }
CartLine { key, productId, note, qty }
Order    { id, queueNumber, customer, items, units, total,
           paymentMethod, paymentStatus, status, createdAt }
Crowd    { people, capacity, occupancy, status, queue, eta, updatedAt }
```

Status pesanan mengikuti rantai `PENDING` → `PAID` → `PROCESSING` → `READY` → `COMPLETED`. Pesanan QRIS dibuat langsung berstatus `PAID`, pesanan tunai berstatus `PENDING` hingga dibayar di kasir.

### Simulasi kepadatan

Kepadatan dihitung dari dua puncak jam istirahat dengan kurva lonceng, bukan angka acak, sehingga nilainya bergerak wajar sepanjang hari:

$$\text{load}(t) = \sum_{i} w_i \exp\!\left(-\frac{(t - \mu_i)^2}{2\sigma_i^2}\right)$$

Ambang status: 0–40 persen sepi, 41–70 normal, 71–90 ramai, di atas 90 penuh. Estimasi tunggu diturunkan dari jumlah antrean dikali waktu rata-rata per pesanan.

## Konfigurasi

Seluruh nilai yang dapat disesuaikan ada di `assets/js/config.js`:

```js
SC.config = {
  instagramUrl: "https://www.instagram.com/ariooln/",
  instagramHandle: "@ariooln",
  orderPrefix: "A",
};
```

Mengubah `instagramUrl` akan sekaligus memperbarui isi QR, teks pada panel pembayaran, dan tautan ikon di kaki halaman.

## Data tersimpan

| Kunci | Isi |
| --- | --- |
| `smartcanteen.cart.v1` | Baris keranjang aktif |
| `smartcanteen.orders.v1` | Riwayat pesanan, maksimum 80 entri |
| `smartcanteen.queue.v1` | Penghitung nomor antrean per hari |

Semua data hanya berada di peramban. Tidak ada permintaan jaringan selain pemuatan fon dan pustaka QR dari CDN.

## Pihak ketiga

- `qrcode-generator` 1.4.4 dari jsDelivr, untuk membuat QR. Bila gagal dimuat, panel pembayaran menampilkan tautan langsung sebagai gantinya.
- Bricolage Grotesque, Inter Tight, dan JetBrains Mono dari Google Fonts.

## Catatan

Prototype ini tidak memproses uang, tidak menyimpan identitas, dan tidak terhubung ke sistem pembayaran mana pun. QR yang ditampilkan bukan QRIS asli, melainkan tautan contoh untuk keperluan demonstrasi.
