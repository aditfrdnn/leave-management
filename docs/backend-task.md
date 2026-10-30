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

## P0 — Keamanan dan alur yang sudah ada di UI

### 1. `GET /api/me`

Belum ada. Frontend mem-bootstrap identitas lewat `GET /api/me` (pola `next-prm`); karena tidak
ada, user hasil login disimpan di cookie httpOnly kedua dan dikembalikan oleh route handler
Next.js. Dampak: perubahan nama/departemen/nomor HP di server tidak terlihat sampai login ulang.

Dibutuhkan: `GET /api/me` (auth:sanctum) → `sendResponse(user->load('department'))`, bentuk sama
dengan `data` di `POST /api/auth/login` minus `token`. Setelah ada, frontend mengganti route
handler dan menghapus `setUserCookie`.

### 2. Bentuk error validasi: `errors`, bukan `data`

`Controller::sendError($msg, 422, $e->errors())` menaruh peta field di `data`, dan pesan tampil
`validation.required` (kunci `lang/id` belum ada karena `APP_LOCALE=id` tanpa file bahasa).
Frontend sudah menerima `data` maupun `errors`, tetapi:

- pindahkan peta field ke kunci `errors` (standar Laravel dan `next-prm`), `data` tetap `null`;
- tambahkan `lang/id` + `lang/en` (`php artisan lang:publish`) supaya pesan terbaca;
- `withExceptions` di `bootstrap/app.php` masih kosong: 401 `Unauthenticated.` dan 404 model
  memakai bentuk bawaan tanpa `success`. Render semuanya ke `{ success:false, message, errors? }`.

### 3. `POST /api/leave-request` belum punya FormRequest

Hanya `leave_date` yang dicek (parse `d-m-Y`), plus larangan approver = diri sendiri (400). Field
lain (`subject`, `leave_type`, `approval_user`, `reason`, `location_during_leave`,
`return_to_office`, `ongoing_task`, `temporary_replacement`, `phone_number`) masuk tanpa validasi;
`return_to_office` yang kosong akan meledak di `Carbon::createFromFormat` → 500.

Buat `StoreLeaveRequest` dengan aturan: wajib semua, `leave_type` `exists:leave_types,id`,
`approval_user` `exists:users,id` dan `!= auth id`, `leave_date.*` `date_format:d-m-Y|after_or_equal:today`,
bukan akhir pekan / `holidays`, tidak tumpang tindih `leave_request_days` user yang statusnya
bukan ditolak/dibatalkan, `reason` 10–200, `phone_number` ≥10 digit. Nama field harus persis
seperti di atas agar `toApiErrorState` menempelkan pesan ke field yang benar.

### 4. Route re-trigger WhatsApp tanpa autentikasi

`GET /api/leave-request/whatapproval-reminder/{leave_request}/{approval_id}` ada di luar grup
`auth:sanctum`. Siapa pun yang tahu id bisa mengirim WA ke approver berulang kali. Pindahkan ke
dalam `auth:sanctum`, batasi ke pemilik pengajuan, dan beri `throttle`.

### 5. Callback WhatsApp tidak memverifikasi kode unik

`WhatsappServiceController@leaveRequestApproval` menerima `leave_request_id` + `approver_email`
dan langsung mengubah status. `uniqueCode` hanya hidup di memori WA service dan hilang saat
restart. Simpan kode (hash) di `approval_flows` saat dispatch, dan minta WA service mengirimnya
balik untuk dicocokkan; tolak bila status sudah final (sekarang approve ulang menimpa
`approved_at`/`rejected_at`).

### 6. Hard-code yang perlu jadi konfigurasi

- Pengecualian `doni.hardian → asep.saepudin` di `@store` (tidak kirim WA/email).
- CC `anisa.pertiwi@ptcs.co.id` dan pengirim `fauzi.habibi@ptcs.co.id` di controller WA.
- Dua nomor operator yang di-bypass di `leave-management-wa/index.js` (`chatId === '62…@c.us'`).
- `Pak {nama}` di template pesan (asumsi gender).

Pindahkan ke `config/leave.php` / `.env`, dan template pesan ke view/`lang`.

---

## P1 — Endpoint untuk fitur berikutnya

### 7. Detail, pembatalan, dan paginasi pengajuan

`show`, `update`, `destroy` di `LeaveRequestController` masih kosong, dan `index` memakai `get()`
tanpa paginasi.

- `GET /api/leave-request/{id}` → detail + `approvals` (level, approver, aksi, catatan, waktu).
- `PATCH /api/leave-request/{id}/cancel` → status `-1` selama masih `0`.
- `index` memakai `sendPaginated()` yang sudah ada di `Controller.php` (`meta.pagination`), plus
  sort/filter — lihat §10. Frontend sudah memakai `DataTable` yang siap untuk itu.

### 8. Sisi approver di web

Persetujuan hanya lewat balasan WhatsApp (dan HRIS). Untuk halaman approver:

- `GET /api/leave-request/approvals?status=` — pengajuan yang `approval_flows.approval_by` = user ini.
- `PATCH /api/leave-request/{id}/approve` dan `/reject` (`notes?`) → logika yang sama dengan
  callback WA (pindahkan ke satu service class agar tidak dobel).
- `role`/`is_approver` pada `UserResource` supaya frontend bisa menampilkan menu approver
  (`constants/permission-constant.ts` + `lib/permission.ts` seperti `next-pdi`).

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
