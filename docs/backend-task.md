# Catatan Tugas Backend — leave-service

Daftar pekerjaan di repositori `leave-service` (Laravel 12, Sanctum, MySQL) yang dibutuhkan
frontend `leave-management` setelah disamakan dengan konvensi `next-prm` / `next-pdi`. Ditulis
per 30 Oktober 2026 dari pembacaan kode `leave-service` (`routes/api.php`,
`app/Http/Controllers/Api/*`, `app/Http/Controllers/Controller.php`, `app/Jobs/SendWhatsappApproval.php`,
`app/Models/*`, `database/migrations`, `database/seeders`) dan `leave-management-wa/index.js`.
Peta alur ketiga repo ada di `docs/integration.md`.

Urutan prioritas: **P0** keamanan / memblokir alur yang sudah ada di UI, **P1** dibutuhkan fitur
berikutnya, **P2** penyamaan kontrak dengan `next-prm` / `laravel-tailwind`, **P3** kebersihan.

Kontrak yang dipakai frontend saat ini: `src/constants/endpoint-constant.ts`,
`src/services/*.service.ts`, `src/types/api.d.ts`, `src/types/leave.d.ts`, `src/lib/api-error.ts`.

---

## P0 — Keamanan dan alur yang sudah ada di UI — **selesai 30 Okt 2026**

Semua butir di bawah sudah masuk `leave-service` (dan `leave-management-wa` untuk yang menyangkut
bridge). Catatan dipertahankan sebagai riwayat keputusan; kontrak hasilnya ada di
`docs/integration.md`.

### 1. `GET /api/me` — selesai

`AuthController@me` (auth:sanctum) mengembalikan user + `department` + `permissions[]`, bentuk
sama dengan `data` login minus `token`. Frontend mem-bootstrap identitas dari sini; cookie user
dihapus, hanya cookie token yang tersisa. `logout` kini mencabut token yang dipakai saja.

### 2. Bentuk error — selesai

`sendError` menaruh peta field di `errors` (tidak pernah di `data`) dan memaksa kode non-HTTP ke
500. `bootstrap/app.php` merender 401/403/404/405/422/429/500 ke `{ success:false, message, errors? }`.
`lang/id` + `lang/en` dipublikasikan; `validation.php` berisi atribut dan pesan khusus HR Lite.

### 3. `StoreLeaveRequestRequest` — selesai

Semua field wajib; `leave_date.*` `d-m-Y`, tidak sebelum hari ini, bukan Sabtu/Minggu, tidak
tumpang tindih `leave_request_days` user yang statusnya bukan -1/2; `approval_user` ≠ diri sendiri;
`return_to_office` setelah tanggal cuti terakhir. Error per tanggal berkunci `leave_date.0`, dst.
Belum: tabel `holidays` (tidak ada di skema) dan batas panjang `reason`.

### 4. Route re-trigger WhatsApp — selesai

Dipindah ke dalam `auth:sanctum`, hanya pemilik pengajuan (403), `throttle:5,1` (429).

### 5. Verifikasi kode unik di callback WA — selesai

`LeaveApprovalNotifier` menyimpan `sha256(kode)` + `approval_code_sent_at` di `approval_flows`
(migrasi `2026_10_30_000000`). Callback wajib membawa `unique_code` (kecuali
`LEAVE_REQUIRE_UNIQUE_CODE=false`): salah → 403, status sudah final → 409. Bridge mengirim
`unique_code` balik dan memperlakukan 403 (sesi tetap) / 409 (sesi dihapus) berbeda; `POST /send-approval`
di bridge kini memverifikasi `X-API-WHATSAPP`.

### 6. Konfigurasi — selesai

`config/leave.php`: `frontend_url`, `require_unique_code`, `manager_email`, `approved_cc`,
`noreply_email/name`, `greeting_title`, `notification_exceptions`. Bridge: `WA_BYPASS_NUMBERS`.
Sisa: template `leave-approval-request-approved.blade.php` masih menyapa "Pak Asep" secara
hard-code; `X-Locale` (P2) belum dibaca.

---

## P1 — Endpoint untuk fitur berikutnya

### 7. Detail, pembatalan, dan paginasi pengajuan — **selesai 30 Okt 2026**

- `GET /api/leave-request/{id}` → detail + `approvals[]` (pemilik atau approver-nya; lainnya 403).
- `PATCH /api/leave-request/{id}/cancel` → status `-1` selama masih `0` (409 setelah diputuskan).
- `index` memakai `sendPaginated()` dengan `page`, `per_page`, `search`, `status` (daftar koma),
  `sort_by`, `sort_dir`. `update`/`destroy` dilepas dari resource.
- Belum: `facets` di respons list (frontend memakai daftar status statis), filter `leave_type`.

### 8. Sisi approver di web — **selesai 30 Okt 2026**

- `GET /api/leave-request/approvals?status=pending|approved|rejected|all` + `search`, paginasi.
- `PATCH /api/leave-request/{id}/approve` dan `/reject` (`notes`, wajib saat reject) lewat
  `App\Services\LeaveDecisionService`, dipakai juga oleh callback WA.
- `permissions[]` di `/api/me` dan login: `leave.request` untuk semua, `leave.approve` untuk approver
  (aturan di `AuthController`). Belum ada tabel role; bila HRIS punya jabatan, ganti aturannya di
  satu tempat itu.

### 9. Notifikasi dan saldo cuti

- `GET /api/notifications` + `PATCH /api/notifications/{id}/read` (dulu dummy di header frontend).
- `GET /api/leave-balances` — tabel `leave_balances` sudah ada tetapi belum pernah diisi/dibaca;
  UI bisa menampilkan sisa kuota per jenis cuti di atas form.
- `holidays` sudah ada tabelnya: ekspos `GET /api/holidays?year=` supaya kalender di form
  menonaktifkan hari libur, bukan hanya akhir pekan.

---

## P2 — Samakan kontrak dengan next-prm / laravel-tailwind

10. **Sort, filter, facets** (`docs/data-table.md`): port `App\Support\Table\TableQuery` +
    `TableFilter` dari `laravel-tailwind`; param `sort`, `direction`, `columns[key][]`; respons
    `facets`. Whitelist untuk leave-request: sort `subject, start_date, submitted_at`; filter
    `leave_type_id, status`.
11. **Tanggal ISO**: terima/kembalikan `YYYY-MM-DD` alih-alih `d-m-Y` (frontend mengubah
    `LEAVE_DATE_FORMAT` di satu tempat).
12. **`X-Locale`**: frontend mengirim header ini di tiap request; pasang middleware `setLocale`
    dan pindahkan pesan di controller ke `lang/*` (acuan `next-prm/docs/i18n-backend-task.md`).
13. **Dropdown seragam**: `/dropdown/users` memakai `{ id, name, email }`, `/leave-types`
    memakai `{ id, text }`. Pilih satu (`{ id, text, ...extra }`), dan batasi `/dropdown/users`
    ke user yang boleh menjadi approver (sekarang semua user).
14. **CORS**: tidak ada `config/cors.php` (pakai bawaan framework: `api/*`, semua origin,
    `supports_credentials=false`). Karena frontend memanggil API dari server (Server Actions)
    ini tidak menghambat; bila nanti ada panggilan dari browser, daftarkan origin
    `https://lvr.pdi-ptcs.com` dan `http://localhost:9002`.

---

## P3 — Kebersihan

15. `TestingController` + route `api/test/*` (kirim email ke alamat pribadi) jangan ikut
    produksi: bungkus `if (app()->isLocal())` atau hapus.
16. `.env.example` memuat dua blok `MAIL_*`; sisakan satu. Tambahkan `WA_SERVICE_BASE_URL`
    (dipakai `config/services.php`) yang belum ada di contoh.
17. `shortCode8()` dan template pesan diduplikasi di `@store` dan `@triggerWhatsAppApproval`;
    pindahkan ke `App\Services\LeaveApprovalNotifier`.
18. `users.status` enum dan `hired_at` ada di migrasi tetapi tidak dipakai di API; putuskan dipakai
    (blokir login user `inactive`) atau dibuang.
19. Migrasi `leave_requests.status` default `-2` (Draft) tetapi `@store` selalu menulis `0`; tidak
    ada alur draft. Samakan default dengan kenyataan atau buat alur draft.
20. `README` menyebut `others/waweb-service`; service-nya sekarang repo terpisah
    `leave-management-wa`. Perbarui, dan tulis `docs/api-contract.md` yang menjadi sumber
    kebenaran untuk `src/types/*.d.ts` di frontend.

---

## Ringkasan kontrak yang diasumsikan frontend hari ini

| Hal | Bentuk sekarang (dipakai frontend) | Target |
| --- | --- | --- |
| Sukses | `{ success:true, message, data }` | sama |
| List | `data` = array penuh | `data: Item[]`, `meta.pagination`, `facets?` |
| Error controller | `{ success:false, message }` | sama, juga untuk error framework |
| 422 | `{ success:false, message, data:{field:[]} }` | `{ success:false, message, errors:{field:[]} }` |
| Login | `data: { ...user, token, department }` | sama |
| Me | tidak ada (cookie user di frontend) | `GET /api/me` |
| Logout | `DELETE /api/auth/logout` | sama |
| Tanggal | `dd-MM-yyyy` | `YYYY-MM-DD` |
| Bahasa | pesan Indonesia hard-code, `validation.*` mentah | mengikuti `X-Locale`, `lang/*` |
