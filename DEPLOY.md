# Deploy — leave-management (frontend HR Lite)

Rilis ini mengganti "LVR System" lama dengan HR Lite: rebrand, dashboard, halaman approver,
detail/batal cuti, riwayat berpaginasi, dan modul Setup (karyawan, departemen, user, role, permission).

## Urutan deploy ketiga project

1. **leave-management-wa** (bridge WhatsApp) — `DEPLOY.md` di repo itu.
2. **leave-service** (API) — `DEPLOY.md` di repo itu, termasuk menunjuk Administrator pertama.
3. **leave-management** (dokumen ini) — **langsung setelah API selesai**. Frontend baru tidak bisa
   jalan dengan API lama, dan sebaliknya.
   Sejak perubahan ID ke UUID (2026-11-02) hal ini wajib: frontend lama mengirim ID angka yang ditolak API
   baru.

Hosting: Firebase App Hosting (`apphosting.yaml`), build dari branch `main`.

---

## Langkah

**1. Cek environment variable di Firebase App Hosting**

Firebase console → App Hosting → backend `leave-management` → Settings → Environment.

| Variable | Isi |
| --- | --- |
| `NEXT_PUBLIC_PROD_SERVER_URL` | `https://lvr-api.pdi-ptcs.com` |
| `TOKEN_KEY` | `auth_token` |
| `NEXT_PUBLIC_DEV_SERVER_URL` | **tidak boleh ada / kosong** — kalau terisi, production akan memanggil URL dev |

**2. Pastikan `main` berisi versi yang sudah diuji**

```bash
git checkout main
git pull origin main
npm ci
npm run build
```

Build harus sukses tanpa error.

**3. Rollout**

Firebase console → App Hosting → `leave-management` → **Rollouts** → *Create rollout* dari branch
`main` (atau tunggu rollout otomatis kalau fitur itu aktif). Tunggu sampai statusnya **Succeeded**.

Catat rollout yang sedang live **sebelum** membuat yang baru, untuk rollback.

**4. Cek cepat di browser** (jendela incognito)

- [ ] `https://lvr.pdi-ptcs.com/` membuka halaman login HR Lite (logo H biru).
- [ ] `https://lvr.pdi-ptcs.com/login` diarahkan ke `/sign-in` (bookmark lama tetap jalan).
- [ ] Login sebagai Administrator → Beranda menampilkan profil; **Cuti → Beranda** menampilkan bagian **Organisasi**.
- [ ] Menu **Setup → Users** tampil; atur role user lain (mis. HR) bila perlu.
- [ ] Login sebagai karyawan biasa → hanya modul Beranda, Cuti dan Appraisal (Appraisal Saya) yang tampil.
- [ ] Ajukan satu cuti uji → muncul di **Cuti Saya**; approver-nya melihatnya di tab **Perlu persetujuan saya** → setujui → status berubah.
- [ ] Batalkan / hapus data uji itu setelahnya.
- [ ] **Appraisal:** HR/Lead/Division Manager membuka periode di **Appraisal → Periode**; karyawan uji mengisi dan mengirim, atasan menyelesaikan penilaian (tanpa konfirmasi karyawan), HR mengunduh PDF di **Appraisal → Laporan**. PDF berlogo Control Systems dan memuat tanda tangan.
- [ ] **Beranda → Tanda tangan:** unggah gambar tanda tangan, pratinjau muncul.
- [ ] Tab PDF dan tab aplikasi memakai ikon HR Lite (bukan logo lama). Kalau masih lama, kosongkan cache browser.
- [ ] **Appraisal → Template Appraisal** menampilkan F-HR-10 Rev.2 (aktif).

Kalau setelah login muncul sesi lama yang aneh, logout lalu login lagi (cookie lama dari LVR System).

---

## Kalau ada masalah (rollback)

Firebase console → App Hosting → Rollouts → pilih rollout lama yang tadi dicatat → **Roll back**.

Rollback frontend saja tidak cukup kalau API sudah versi baru: kembalikan leave-service juga
(lihat `DEPLOY.md` di repo itu).
