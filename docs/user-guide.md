# Panduan Penggunaan Aplikasi Cuti Karyawan

Aplikasi ini dirancang untuk mempermudah proses pengajuan dan pengelolaan cuti karyawan.

## Daftar Isi
1.  [Memulai](#1-memulai)
    -   [Mendaftar Akun Baru](#mendaftar-akun-baru)
    -   [Masuk ke Akun](#masuk-ke-akun)
2.  [Halaman Utama (Dashboard)](#2-halaman-utama-dashboard)
3.  [Fitur-Fitur Aplikasi](#3-fitur-fitur-aplikasi)
    -   [Mengajukan Cuti Baru](#mengajukan-cuti-baru)
    -   [Mengelola Data Approver](#mengelola-data-approver)
    -   [Melihat Riwayat Cuti](#melihat-riwayat-cuti)
    -   [Proses Persetujuan](#proses-persetujuan)
    -   [Notifikasi](#notifikasi)

---

### 1. Memulai

#### Mendaftar Akun Baru
Jika Anda belum memiliki akun, Anda harus mendaftar terlebih dahulu.
1.  Buka halaman aplikasi. Anda akan diarahkan ke halaman Login.
2.  Klik tautan **"Sign up"**.
3.  Masukkan alamat email dan kata sandi yang valid.
4.  Klik tombol **"Sign Up"**. Anda akan diarahkan ke halaman Login setelah berhasil mendaftar.

#### Masuk ke Akun
1.  Buka halaman aplikasi.
2.  Masukkan email dan kata sandi yang telah Anda daftarkan.
3.  Klik tombol **"Login"**. Anda akan diarahkan ke halaman utama (dashboard) setelah berhasil masuk.

### 2. Halaman Utama (Dashboard)

Setelah login, Anda akan melihat halaman utama yang terbagi menjadi dua bagian utama:
-   **Kiri**: Formulir untuk mengajukan cuti baru.
-   **Kanan**: Daftar riwayat pengajuan cuti yang pernah Anda buat.

Di bagian kanan atas, terdapat ikon lonceng untuk notifikasi dan menu pengguna untuk logout.

### 3. Fitur-Fitur Aplikasi

#### Mengajukan Cuti Baru
1.  Gunakan formulir di sisi kiri halaman.
2.  **Leave Dates**: Pilih rentang tanggal cuti Anda. Tanggal kembali ke kantor akan otomatis ditampilkan.
3.  **Send to (Approver)**: Pilih kepada siapa pengajuan cuti ini akan dikirim. Anda bisa mengelola daftar approver dengan menekan tombol **"Manage"**.
4.  **Reason for Leave**: Jelaskan alasan Anda mengajukan cuti.
5.  **Location During Leave**: Isi lokasi Anda selama masa cuti.
6.  **Ongoing Tasks**: Sebutkan tugas-tugas yang sedang berjalan dan akan Anda tinggalkan.
7.  **Temporary Replacement**: Tentukan siapa yang akan menggantikan Anda sementara.
8.  **Phone Number**: Masukkan nomor telepon yang bisa dihubungi selama cuti.
9.  Klik tombol **"Submit Request"** untuk mengirim pengajuan. Permintaan Anda akan dikirim ke approver yang dipilih untuk ditinjau.

#### Mengelola Data Approver
Anda dapat menambah atau menghapus data orang yang dapat menyetujui cuti Anda.
1.  Di formulir pengajuan cuti, klik tombol **"Manage"** di sebelah label "Send to".
2.  **Untuk Menambah**: Isi nama dan email approver baru, lalu klik **"Add Approver"**.
3.  **Untuk Menghapus**: Klik ikon tempat sampah di sebelah data approver yang ingin Anda hapus.
4.  Klik **"Done"** jika sudah selesai.

#### Melihat Riwayat Cuti
Di sisi kanan dashboard, Anda dapat melihat semua riwayat pengajuan cuti Anda dalam bentuk tabel.
-   **Dates**: Rentang tanggal cuti.
-   **Reason**: Alasan cuti.
-   **Status**: Status pengajuan (misalnya, `Pending Review`, `Approved`, `Rejected`).
-   **Actions**: Jika statusnya `Approved`, akan muncul tombol untuk mengunduh file `.ics` yang bisa ditambahkan ke kalender Anda.

#### Proses Persetujuan
Setiap kali Anda mengirim pengajuan, permintaan akan dikirimkan ke approver yang Anda pilih. Status awal akan menjadi **"Pending Review"**. Approver akan menerima notifikasi (saat ini belum diimplementasikan) dan dapat menyetujui atau menolak permintaan Anda. Anda akan melihat perubahan status di riwayat cuti Anda.

#### Notifikasi
Klik ikon lonceng di kanan atas untuk melihat notifikasi terkait status pengajuan cuti Anda.
