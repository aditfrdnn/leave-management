# Catatan Tugas Backend — Leave API

Daftar pekerjaan di API cuti yang dibutuhkan frontend `leave-management` setelah disamakan
dengan konvensi `next-prm` / `next-pdi`. Ditulis per 30 Oktober 2026 dari sisi **kontrak yang
dipakai frontend** (`src/constants/endpoint-constant.ts`, `src/services/*.service.ts`,
`src/types/*.d.ts`); repositori API-nya tidak ada di workspace ini, jadi bagian "kondisi
sekarang" adalah apa yang terlihat dari frontend, bukan dari kode server.

Urutan prioritas: **P0** memblokir alur yang sudah ada di UI, **P1** dibutuhkan fitur
berikutnya, **P2** penyamaan kontrak dengan `next-prm` / `laravel-tailwind`.

> **Temuan 30 Okt 2026**: host API di `.env` saat ini membalas **404** untuk `POST /api/auth/login`,
> `GET /api/leave-request`, `GET /api/dropdown/leave-types` dan `GET /api/dropdown/users`.
> Entah host-nya sudah berubah atau rute-rutenya belum di-deploy — pastikan dulu URL yang benar
> sebelum mengerjakan daftar di bawah. Frontend menampilkan error state dengan tombol coba lagi
> selama kondisi ini.

Endpoint yang dipakai sekarang:

| Method | Path | Dipakai untuk | Bentuk yang diasumsikan |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | Sign in | `{ data: { ...user, token } }` |
| GET | `/api/leave-request` | Riwayat cuti user | `{ data: TLeave[] }` (array, tanpa paginasi) |
| POST | `/api/leave-request` | Pengajuan baru | body `TLeaveRequestPayload`, tanggal `dd-MM-yyyy` |
| GET | `/api/dropdown/leave-types` | Dropdown jenis cuti | `{ data: [{ id, text }] }` |
| GET | `/api/dropdown/users` | Dropdown approver | `{ data: [{ id, name, email? }] }` |

---

## P0 — Alur yang sudah ada di UI

### 1. `GET /api/me` dan `POST /api/auth/logout`

Frontend menyimpan token di cookie httpOnly dan mem-bootstrap identitas lewat `GET /api/me`
(pola yang sama dengan `next-prm`). Karena endpoint itu belum ada, user hasil login disimpan di
cookie kedua dan dikembalikan oleh route handler `src/app/api/me/route.ts`. Dampaknya: perubahan
profil/role di server tidak terlihat sampai login ulang, dan logout hanya menghapus cookie
(token tetap hidup di server).

Dibutuhkan:

- `GET /api/me` → `{ success, data: UserResource }` dengan `id, name, email, phone_number,
  department{id,name,alias}`, plus `role`/`permissions` bila ada (lihat §3).
- `POST /api/auth/logout` → mencabut token saat ini.

Setelah ada, frontend mengganti route handler (meneruskan Bearer ke `/api/me`) dan menghapus
`setUserCookie` di `src/lib/cookies.ts`.

### 2. Validasi 422 per field

Form mengirim `subject, leave_type, leave_date[], approval_user, reason, location_during_leave,
return_to_office, ongoing_task, temporary_replacement, phone_number`. Pastikan kegagalan
validasi dikembalikan sebagai 422 `{ message, errors: { field: [msg] } }` dengan nama field
**persis** seperti di atas, supaya `toApiErrorState` bisa menempelkan pesan ke field yang benar.
Aturan yang sebaiknya ada di server (frontend sudah memvalidasi, server adalah trust boundary):
tanggal tidak di masa lalu dan bukan akhir pekan, tidak tumpang tindih dengan pengajuan lain
yang belum ditolak, `approval_user` harus user yang berhak menyetujui.

### 3. Peran dan hak akses

Tidak ada informasi role di respons login, sehingga menu di sidebar tidak bisa dibedakan antara
pemohon dan approver. Tambahkan `role` (mis. `employee | approver | admin`) atau daftar
`permissions` pada `UserResource`; frontend memakai pola `constants/permission-constant.ts` +
`lib/permission.ts` seperti `next-pdi`.

---

## P1 — Fitur berikutnya

### 4. Daftar cuti dengan paginasi, sort dan filter

`GET /api/leave-request` mengembalikan seluruh riwayat. Untuk user lama ini membesar; UI
sudah siap menerima paginasi (komponen `DataTable` yang sama dengan `next-prm`). Target
kontrak (`docs/data-table.md`):

- Param: `page, per_page, search, sort=<key>&direction=asc|desc, columns[<key>][]=<value>`.
- Response: `{ success, message, data: TLeave[], meta: { current_page, per_page, total,
  last_page }, facets: { leave_type: [...], status: [...] } }`.
- Whitelist sort: `subject, start_date, submitted_at`; filter: `leave_type, status`.

Acuan implementasi: `App\Support\Table\TableQuery` + `TableFilter` di repositori `laravel-tailwind`.

### 5. Sisi approver

README lama menjanjikan proses persetujuan dan notifikasi; keduanya belum punya endpoint.

- `GET /api/leave-request/approvals` — pengajuan yang menunggu user ini.
- `PATCH /api/leave-request/{id}/approve` dan `/reject` dengan `note?`.
- `GET /api/leave-request/{id}` — detail satu pengajuan (hari per hari, riwayat status).
- `GET /api/notifications` + `PATCH /api/notifications/{id}/read` — mengganti data dummy yang
  dulu ada di header.

### 6. Pembatalan dan revisi

Status hanya `0 pending / 1 approved / 2 rejected`. Alur "needs revision" dan "cancelled" yang
disebut di notifikasi dummy butuh status tambahan plus `PATCH /api/leave-request/{id}/cancel`
untuk pemohon selama status masih pending.

---

## P2 — Samakan kontrak dengan next-prm

7. **Envelope seragam**: setiap respons `{ success, message, data }`, termasuk error framework
   (401 `Unauthenticated`, 404, 422) lewat `withExceptions` di `bootstrap/app.php`.
8. **Tanggal**: terima dan kembalikan `YYYY-MM-DD` (ISO) alih-alih `dd-MM-yyyy`. Frontend
   mengubah `LEAVE_DATE_FORMAT` satu tempat.
9. **Lokalisasi**: frontend mengirim header `X-Locale: en|id` di setiap request; pasang
   middleware `setLocale` dan pindahkan pesan sukses/gagal ke `lang/en` + `lang/id`
   (lihat `next-prm/docs/i18n-backend-task.md`).
10. **Dropdown**: samakan bentuk `/api/dropdown/users` dengan `/leave-types` (`{ id, text }`),
    atau sebaliknya; sekarang satu memakai `text`, satu memakai `name`.
11. **CORS**: tambahkan origin frontend dev (`http://localhost:9002`) dan origin App Hosting
    produksi ke `config/cors.php`; auth tetap Bearer murni (tanpa `statefulApi()`).
12. **Dokumentasi kontrak**: satu `docs/api-contract.md` di repo API yang menjadi sumber
    kebenaran untuk `src/types/api.d.ts` dan `src/types/leave.d.ts` di frontend.
