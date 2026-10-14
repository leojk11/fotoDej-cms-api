# FotoDej CMS API

REST API behind the FotoDej photographer CMS and client portal. Photographers (admins) manage clients, albums, images, schedules and the public site configuration; clients log in to view the albums assigned to them and select their favourite images.

**Stack:** Node.js 24 · Express 5 · MongoDB (Mongoose 9) · Cloudflare R2 (S3 API) for image storage · Nodemailer (Gmail) for e-mails · JWT + bcrypt for auth.

| | |
|---|---|
| API URL | https://api.photodej.com |
| Postman documentation | https://documenter.getpostman.com/view/14487622/VUjTmPW7 |

## Table of contents

1. [Getting started](#getting-started)
2. [Project structure](#project-structure)
3. [Conventions](#conventions) (auth, pagination, responses, errors, dates)
4. [Domain overview](#domain-overview)
5. [Endpoints](#endpoints)
   - [Auth](#auth) · [Admins](#admins) · [Users](#users) · [Clients](#clients) · [Albums](#albums) · [Images](#images)
   - [Schedules & locations](#schedules--locations) · [Configuration](#configuration) · [Requests](#requests) · [Invites](#invites)
   - [Notifications](#notifications) · [Client logs](#client-logs) · [Modifications](#modifications) · [Logger](#logger) · [Organizations](#organizations) · [Dashboard](#dashboard) · [Visit counters](#visit-counters)
6. [Enums](#enums)
7. [Known issues](#known-issues)
8. [Notes](#notes)

---

## Getting started

Requirements: Node.js `>=24` (see `.nvmrc`), a MongoDB Atlas cluster, a Cloudflare R2 bucket and a Gmail account with an app password.

```bash
npm install
npm run dev     # nodemon app.js
npm start       # node app.js
```

Create a `.env` file in the project root (it is git-ignored):

| Variable | Description |
|---|---|
| `PORT` | HTTP port. Defaults to `5000`. |
| `SECRET` | Secret used to sign JWTs and the express-session cookie. |
| `DB_USERNAME`, `DB_PASSWORD`, `DB_CLUSTER` | Build the connection string `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/`. |
| `EMAIL`, `EMAIL_PASSWORD` | Gmail account (and app password) used to send client invites and new-request notifications. |
| `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Cloudflare R2 credentials used by `helpers/storage.js`. |

On startup the app connects to MongoDB, starts listening, and **creates a default site configuration** if none exists (`helpers/initializeConfiguration.js`).

There is no endpoint that creates the first `SUPER_ADMIN`: `POST /admin` requires a `SUPER_ADMIN` token and always creates an `ADMIN`. Insert the first super admin straight into the `admins` collection (with a bcrypt-hashed `password`).

### Migrating local images to R2

`scripts/migrate-images-to-r2.js` uploads everything in `./images` to the bucket (`./images/<file>` → `general/<file>`, `./images/<albumId>/<file>` → `albums/<albumId>/<file>`) and fills in `Image.key` on old records.

```bash
node scripts/migrate-images-to-r2.js --dry-run   # only print what would happen
node scripts/migrate-images-to-r2.js
```

## Project structure

```
app.js                 Express setup (session, CORS, JSON, file upload) + DB connection
main-router/           Mounts every route file under its prefix
routes/                One file per resource: path -> controller (+ verifyToken)
controllers/           Request handlers
db/models/             Mongoose schemas
db/mongo.js            Mongo connection
helpers/               Response/model mappers, messages, logger, R2 storage, e-mails, time helpers
enums/                 Constant values (roles, statuses, log actions, ...)
middlewares/common.js  verifyToken, parseJwt, errorHandler
scripts/               One-off maintenance scripts
images/DEF_*.png       Default logo and e-mail icons (see Notes)
```

## Conventions

### Base URL and content types

All routes below are relative to the API URL (for local development `http://localhost:5000`). Request bodies are JSON (`Content-Type: application/json`) except for file uploads, which are `multipart/form-data`. CORS is open (`*`).

### Authentication

Log in with [`POST /auth/admin`](#post-authadmin) or [`POST /auth/client`](#post-authclient) and send the returned token on every protected route:

```
Authorization: Bearer <token>
```

Tokens are JWTs signed with `SECRET` and expire after **1 hour**. The payload is the "clean model" of the logged-in account:

```json
{
  "id": "665f1c2e9b1e8a0012a4c111",
  "firstname": "Ana",
  "lastname": "Petrova",
  "fullname": "Ana Petrova",
  "email": "ana@example.com",
  "username": "ana",
  "profile_image": "665f..._avatar.png",
  "role": "SUPER_ADMIN"
}
```

Notes:

- Every route marked **Auth: token** only checks that the token is valid. Admin and client tokens are both accepted; the only role checks are the `SUPER_ADMIN` ones called out per endpoint.
- Routes marked **Auth: none** have no `verifyToken` middleware. Several of them (`POST /requests`, `PATCH /client/reset/first_password/:id` and most image routes) still decode the `Authorization` header inside the handler without verifying it, and answer `500` when the header is missing entirely — see [Known issues](#known-issues).
- Missing or invalid token → `401`:

  ```json
  { "message": "You are not authorized. Plase login!" }
  ```

### Pagination

List endpoints take `page` (1-based) and `take` (page size) query parameters and answer with:

```json
{
  "page": 1,
  "total": 42,
  "list": [ ]
}
```

`total` is the number of documents matching the filters (not the page size). Some endpoints add extra keys (e.g. `not_read` for notifications).

### Responses and errors

Most endpoints answer with a translation key in `message` (for the front-end i18n) and the human-readable English text in `actual_message`:

```json
{
  "message": "success.albumCreated",
  "actual_message": "Album has been created.",
  "album": { }
}
```

Errors use the same shape:

```json
{
  "message": "errors.required.title",
  "actual_message": "[Field: Title] is mandatory."
}
```

| Status | Meaning |
|---|---|
| `200` | Success |
| `400` | Validation error, unknown id, wrong state, or missing permission |
| `401` | Missing/invalid token |
| `404` | Not found (only a few schedule/location/client-log endpoints; most "not found" cases are `400`) |
| `500` | Unexpected error. Body: `{ "message": "errors.internal", "actual_message": "Internal server error!", "error": { } }` |

The older **users**, **organizations**, **modifications** and **logger** controllers return only an English `message` (no `actual_message`).

An invalid MongoDB id answers `400` with `errors.invalidId` / `[ID: <id>] is not valid.`.

### Dates and times

Dates are strings `YYYY-MM-DD` and times are strings `HH:mm:ss`, generated from the server clock (`helpers/timeDate.js`). Most documents have `*_date` / `*_time` pairs instead of real `Date` fields. Schedule and notification `timestamp` values are real instants.

### Logging

Admin/client login, the client controller and the dashboard also write rows to the `Logger` collection (request URL, method, status, user, date, time). Read them with [`GET /logger`](#logger).

---

## Domain overview

| Entity | Collection | What it is |
|---|---|---|
| **Admin** | `admins` | Photographer account. Roles `SUPER_ADMIN` / `ADMIN`. Logs in at `/auth/admin`. |
| **User** | `users` | Older staff-account model (role `USER`), soft-deletable. |
| **Client** | `clients` | A photographer's customer. Gets an invite e-mail with a first password, then logs in at `/auth/client`. Soft-deletable. |
| **Album** | `albums` | A photo shoot. Has a title, a date, images, selected images, and can be assigned to a client. Soft-deletable via `active`. |
| **Image** | `images` | One uploaded file. Stored in R2 under `albums/<albumId>/<name>` (album images) or `general/<name>` (logo, promo images, ...). `disabled` hides it. |
| **SelectedImages** | `selectedimages` | The images a client picked for an album. |
| **Schedule / Location** | `schedules`, `locations` | A calendar entry of the logged-in user and the places belonging to it. |
| **FeConfiguration** | `feconfigurations` | Single document with the public site texts, contact info, logos and invite e-mail wording. |
| **Request** | `requests` | Contact request submitted from the public site. `PENDING` -> `CONTACTED`. |
| **Invite** | `invites` | History of invite e-mails sent to clients. |
| **Notification** | `notifications` | Admin-facing events (new request, accepted invitation, selected images, event reminder). |
| **ClientLog** | `clientlogs` | Audit trail of client actions (login, activate account, ...). |
| **Modification** | `modifications` | Audit trail of edits (currently written by the user endpoints). |
| **Logger** | `loggers` | Request log. |
| **VisitCounter** | `visitcounters` | One row per site visit, used on the dashboard. |
| **Organization** | `organizations` | Organization an admin belongs to (read-only endpoints). |

---

# Endpoints

Legend: **Auth: token** = needs `Authorization: Bearer <token>`; **Auth: none** = public; **SUPER_ADMIN** = token of a super admin.

Examples use `curl`; replace `$API` with the API URL and `$TOKEN` with a token from login.

```bash
API=https://api.photodej.com
TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Auth

### `POST /auth/admin`
**Auth: none.** Log an admin in.

Body:

| Field | Type | Required |
|---|---|---|
| `email` | string | yes |
| `password` | string | yes |

```bash
curl -X POST $API/auth/admin \
  -H "Content-Type: application/json" \
  -d '{ "email": "ana@example.com", "password": "secret123" }'
```

`200`:

```json
{
  "message": "success.loggedIn",
  "actual_message": "Logged in successfully.",
  "token": "eyJhbGciOi...",
  "user": {
    "id": "665f1c2e9b1e8a0012a4c111",
    "firstname": "Ana",
    "lastname": "Petrova",
    "fullname": "Ana Petrova",
    "email": "ana@example.com",
    "username": null,
    "profile_image": null,
    "role": "SUPER_ADMIN"
  }
}
```

`400` when the email/password is missing (`errors.enterEmail`, `errors.enterPassword`), the admin does not exist (`errors.userNotExist`) or the password is wrong (`errors.passwordNotCorrect`).

### `POST /auth/client`
**Auth: none.** Log a client in. Same body as above.

- Account unknown or soft-deleted → `400` `errors.userNotExist`.
- Client still has a `first_password` (never activated) and the entered password equals it → `200` with a command instead of a token:

  ```json
  {
    "command": "RESET_REQUIRED",
    "user_info": { "id": "665f2a0b9b1e8a0012a4c222", "first_password": "Tmp-4821" }
  }
  ```

  The front-end must then call [`PATCH /client/reset/first_password/:id`](#patch-clientresetfirst_passwordid).
- Otherwise a normal login (same response as the admin login) and a `LOGIN` entry in the client logs.

## Admins

Admins are scoped to who created them: `GET /admin` only lists the admins **added by the logged-in admin**.

### `GET /admin`
**Auth: token.** Paginated list (`page`, `take`) of the admins added by the caller, newest first. Returns raw admin documents (including the password hash).

### `GET /admin/:id`
**Auth: token.** One admin.

### `POST /admin`
**Auth: SUPER_ADMIN.** Create an admin (role is always `ADMIN`).

| Field | Type | Required |
|---|---|---|
| `firstname`, `lastname`, `email`, `phone_number`, `password` | string | yes |
| `profile_image`, `organization`, `organization_id` | string / object | no |

```bash
curl -X POST $API/admin \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "firstname": "Marko", "lastname": "Ilic",
    "email": "marko@example.com", "phone_number": "+38970111222",
    "password": "secret123"
  }'
```

`200`: `{ "message": "success.adminCreated", "actual_message": "Admin has been created." }`.
`400`: `errors.required.<field>`, `errors.adminExistEmail` (email taken) or `errors.noPermission` (caller is not a super admin).

### `PATCH /admin/:id`
**Auth: SUPER_ADMIN.** Update any admin field. The body is applied as-is (send only the fields to change); `modified_by*` / `modified_date` / `modified_time` are filled in.
`200`: `{ "message": "User has been updated.", "user": { ...admin } }`.

### `DELETE /admin/:id`
**Auth: SUPER_ADMIN.** Hard delete. See [Known issues](#known-issues).

## Users

Staff accounts with soft-delete and an audit trail (every edit / soft delete / recover writes a [modification](#modifications)). Responses use the English-only `{ "message": ... }` shape.

User object returned by the endpoints:

```json
{
  "id": "665f3b3c9b1e8a0012a4c333",
  "firstname": "Ivan", "lastname": "Stojanov", "fullname": "Ivan Stojanov",
  "username": "ivan",
  "email": "ivan@example.com",
  "role": "USER",
  "account_status": "ACTIVE",
  "online_status": "OFFLINE",
  "number_of_created_albums": 0,
  "number_of_schedules": 0,
  "number_of_completed_schedules": 0,
  "created_date": "2026-10-14", "created_time": "09:30:12", "created_by": null,
  "modified_date": null, "modified_by_id": null,
  "active": true
}
```

### `GET /users`
**Auth: token.** Paginated list of **active** users (`page`, `take`), oldest first. (List items are raw documents.)

### `GET /users/:id`
**Auth: token.** One active user (mapped object above).

### `POST /users`
**Auth: token.** Create a user (`role: USER`, `account_status: ACTIVE`, `active: true`).

| Field | Type | Required |
|---|---|---|
| `firstname`, `lastname`, `username`, `email` | string | yes |
| `password` | string | yes (hashed with bcrypt) |

`200`: `{ "message": "New user has been added." }`. `400` if a field is missing or the email is already used by a user or an admin.

### `PUT /users/:id`
**Auth: token.** Update fields (body applied as-is). Writes an `EDITED_USER` modification.
`200`: `{ "message": "User Ivan Stojanov has been updated.", "user": { }, "modification": { } }`.

### `DELETE /users/:id`
**Auth: token.** Soft delete (`active: false`, `deleted_by*` set, `SOFT_DELETED_ALBUM` modification type is recorded — see [Known issues](#known-issues)).
`200`: `{ "message": "User Ivan Stojanov has been deleted.", "modification": { } }`.

### `PATCH /users/recover/:id`
**Auth: token.** Re-activate a soft-deleted user. `400` if already active.
`200`: `{ "message": "User Ivan Stojanov has been recovered.", "user": { }, "modification": { } }`.

### `DELETE /users/delete/:id`
**Auth: token.** Permanently delete. `200`: `{ "message": "User has been deleted permanently." }`.

## Clients

Client object (`generateClient`):

```json
{
  "id": "665f2a0b9b1e8a0012a4c222",
  "firstname": "Elena", "lastname": "Kostova", "fullname": "Elena Kostova",
  "phone_number": "+38970123456",
  "email": "elena@example.com",
  "username": "elena",
  "profile_image": "665f2a0b9b1e8a0012a4c222_me.png",
  "number_of_albums": 0,
  "created_date": "2026-10-14", "created_time": "10:02:44",
  "created_by": { "id": "665f1c2e9b1e8a0012a4c111", "fullname": "Ana Petrova", "role": "SUPER_ADMIN" },
  "created_by_id": "665f1c2e9b1e8a0012a4c111",
  "modified_date": null, "modified_time": null, "modified_by": null, "modified_by_id": null,
  "deleted_by": null,
  "account_status": "ACTIVE",
  "active": true
}
```

Client lifecycle: **create** → **invite** (e-mail with the first password) → client logs in with the first password and gets `RESET_REQUIRED` → client **sets a new password** → normal logins.

### `GET /client`
**Auth: token.** Paginated list. Only `SUPER_ADMIN` sees soft-deleted clients; everybody else gets active ones only.

Query filters (all optional, case-insensitive substring match unless noted):

| Param | Matches |
|---|---|
| `page`, `take` | pagination |
| `name` | first name **or** last name |
| `phone_number`, `username`, `email` | the respective field |
| `status` | exact `ACTIVE` or `SUSPENDED` (otherwise `400` `errors.invalidAccountStatus`) |

```bash
curl "$API/client?page=1&take=10&name=ele&status=ACTIVE" -H "Authorization: Bearer $TOKEN"
```

### `GET /client/deleted`
**Auth: SUPER_ADMIN.** Paginated list of soft-deleted clients.

### `GET /client/:id`
**Auth: token.** One **active** client (mapped object above).

### `POST /client`
**Auth: token.** Create a client.

| Field | Type | Required |
|---|---|---|
| `firstname`, `lastname`, `username`, `phone_number`, `email`, `password` | string | yes |

The password is stored hashed and the plain value is kept as `first_password` until the client activates the account (it is what the invite e-mail contains).

```bash
curl -X POST $API/client \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "firstname": "Elena", "lastname": "Kostova", "username": "elena",
    "phone_number": "+38970123456", "email": "elena@example.com",
    "password": "Tmp-4821"
  }'
```

`200`:

```json
{
  "message": "success.clientCreated",
  "actual_message": "Client has been created.",
  "client": { }
}
```

`400`: `errors.required.<field>` or `errors.clientExistEmail`.

### `POST /client/:id`
**Auth: token.** Send the invite e-mail to a client (credentials + login link, built from the [configuration](#configuration) `invite_*` fields and the logo/icons).

| Field | Type | Required |
|---|---|---|
| `email` | string | no — overrides the client's own e-mail as the recipient |

`200`: `{ "message": "success.emailSent", "actual_message": "Email has been sent successfully." }`. `500` `errors.emailSend` if sending fails. See [Known issues](#known-issues) about first invites.

### `PUT /client/:id`
**Auth: token.** Update an active client (any field in the body). `200` returns `{ message: "success.clientUpdated", actual_message, client }`. See [Known issues](#known-issues).

### `PATCH /client/profile_image/change/:id`
**Auth: token.** Upload a profile image as `multipart/form-data` with the file in the field **`image`**. The file is saved on the server disk (`./images/profile_images/<clientId>_<filename>`), the old one is removed.

```bash
curl -X PATCH $API/client/profile_image/change/665f2a0b9b1e8a0012a4c222 \
  -H "Authorization: Bearer $TOKEN" -F "image=@/path/to/me.png"
```

`200`: `{ "message": "success.clientProfileImageChanged", "actual_message": "Profile image has been updated.", "client": { id, firstname, ..., profile_image } }`.

### `PATCH /client/account_status/:id/:status`
**Auth: token.** Set the account status to `ACTIVE` or `SUSPENDED` (path segment). Setting the status it already has → `400`.
`200`: `{ "message": "Account status has been updated to SUSPENDED", "client": { clean model } }`.

### `PATCH /client/reset/first_password/:id`
**Auth: none.** Set the real password after the first login (`RESET_REQUIRED`).

| Field | Type | Required |
|---|---|---|
| `first_password` | string | yes — must equal the stored first password |
| `password` | string | yes |
| `repeat_password` | string | yes — must equal `password` |

```bash
curl -X PATCH $API/client/reset/first_password/665f2a0b9b1e8a0012a4c222 \
  -H "Content-Type: application/json" \
  -d '{ "first_password": "Tmp-4821", "password": "MyNewPass1", "repeat_password": "MyNewPass1" }'
```

`200` logs the client in:

```json
{
  "message": "success.loggedIn",
  "actual_message": "Logged in successfully",
  "token": "eyJhbGciOi...",
  "user": { "id": "665f2a0b9b1e8a0012a4c222", "fullname": "Elena Kostova", "email": "elena@example.com", "role": null }
}
```

Side effects: `first_password` is cleared, an `ACTIVATE_ACCOUNT` client log is written and an `ACCEPTED_INVITATION` [notification](#notifications) is created.
`400`: `errors.passwordNotCorrect` (wrong first password), `errors.passwordsNotMatch`.

### `PATCH /client/recover/:id`
**Auth: token.** Re-activate a soft-deleted client. `400` `errors.clientAlreadyActive` if already active.
`200`: `{ "message": "success.clientRecovered", "actual_message": "...", "user": { client } }`.

### `DELETE /client/:id`
**Auth: token.** Soft delete (`active: false`, `deleted_by` = caller).
`200`: `{ "message": "success.clientDeleted", "actual_message": "Document [<id>] has been updated." }`.

### `DELETE /client/delete/:id`
**Auth: SUPER_ADMIN.** Permanently delete a client.
`200`: `{ "message": "success.clientDeletedPermanently", "actual_message": "Document [<id>] has been deleted." }`.

## Albums

Album object (`generateAlbum`):

```json
{
  "id": "6660a1d29b1e8a0012a4c444",
  "title": "Kostovi wedding",
  "date": "2026-09-20",
  "images_count": 3,
  "images": ["IMG_001.jpg", "IMG_002.jpg", "IMG_003.jpg"],
  "selected_images": "IMG_001.jpg,IMG_003.jpg",
  "selected_images_count": 2,
  "assigned_date": null,
  "assigned_to": { "id": "665f2a0b9b1e8a0012a4c222", "fullname": "Elena Kostova", "email": "elena@example.com" },
  "assigned_to_id": "665f2a0b9b1e8a0012a4c222",
  "assigned_by_id": null,
  "created_date": "2026-10-14",
  "created_by": { "id": "665f1c2e9b1e8a0012a4c111", "fullname": "Ana Petrova" },
  "created_by_id": "665f1c2e9b1e8a0012a4c111",
  "modified_date": null, "modified_by": null, "modified_by_id": null,
  "active": true,
  "deleted_by": null, "deleted_by_id": null
}
```

`images` and `selected_images` are stored as comma-separated strings of file names; `images` is returned as an array.

### `GET /albums`
**Auth: token.** Paginated list, newest first. Only `SUPER_ADMIN` sees inactive (soft-deleted) albums.

| Query | Meaning |
|---|---|
| `page`, `take` | pagination |
| `date` | exact `YYYY-MM-DD` |
| `title` | case-insensitive substring |

### `GET /albums/deleted`
**Auth: token.** Paginated list of inactive albums.

### `GET /albums/assigned/:userId`
**Auth: token.** Paginated list of active albums assigned to a client.

### `GET /albums/assigned_by/:id`, `GET /albums/created_by/:id`
**Auth: token.** Intended to list albums by who assigned/created them (paginated). See [Known issues](#known-issues).

### `GET /albums/:id`
**Auth: token.** One album (non-super-admins only get active albums). `400` `errors.albumNotExist`.

### `POST /albums`
**Auth: token.** Create an album. `images_count`/`selected_images_count` start at 0, `created_by` is the caller.

| Field | Type | Required |
|---|---|---|
| `title` | string | yes |
| `date` | string `YYYY-MM-DD` | yes |
| `assigned_to_id` | string (client id) | no — must exist if sent |

```bash
curl -X POST $API/albums \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{ "title": "Kostovi wedding", "date": "2026-09-20", "assigned_to_id": "665f2a0b9b1e8a0012a4c222" }'
```

`200`: `{ "message": "success.albumCreated", "actual_message": "Album has been created.", "album": { } }`.

### `PATCH /albums/:id`
**Auth: token.** Update an active album; send any album fields (e.g. `title`, `date`, `assigned_to_id`). `modified_*` fields are filled in.
`200`: `{ "message": "success.albumUpdated", "actual_message": "Album has been updated.", "album": { } }`.

### `PATCH /albums/:id/:status`
**Auth: token.** Set `active` to the path value (`true` / `false`) — use `false` to soft-delete and `true` to recover.
`200`: `{ "message": "success.albumStatusUpdated", "actual_message": "Album status has been updated.", "album": { } }`.

### `PATCH /albums/:id/images`
**Auth: token.** Replace the album's image list.

```json
{ "images": "IMG_001.jpg,IMG_002.jpg,IMG_003.jpg" }
```

Sets `images` and `images_count`. `200`: `success.albumImagesUpdated` + `album`. `400` `errors.selectImages` if empty. (Currently shadowed by `PATCH /albums/:id/:status` — see [Known issues](#known-issues).)

### `PATCH /albums/:id/selected_images`
**Auth: token.** Store the client's selection on the album.

```json
{ "selected_images": "IMG_001.jpg,IMG_003.jpg" }
```

`200`: `success.albumImagesSelected` + `album`.

### `PATCH /albums/:id/assign`
**Auth: token.** Assign the album to a client.

```json
{ "user": "665f2a0b9b1e8a0012a4c222" }
```

`200`: `{ "message": "User has been assigned.", "album": { } }`. `400` `errors.required.newUser` / `errors.clientNoExist`.

### `DELETE /albums/:id`
**Auth: token.** Permanently delete the album and its `Image` records (the files in R2 are not removed).
`200`: `{ "message": "success.albumDeleted", "actual_message": "..." }`.

## Images

Files live in the R2 bucket:

| Key | Used for |
|---|---|
| `albums/<albumId>/<fileName>` | album images |
| `general/<fileName>` | logo, main image, promo images, e-mail icons, ... |

Uploads are `multipart/form-data` with one or several files in the field **`images`**. Uploading a file with an existing name replaces it.

Image record: `{ "id", "name", "album_id", "disabled" }`.

> Most image routes currently have **no token check** (see the Auth line of each one).

### `GET /images/:img`
**Auth: none.** Streams `general/<img>` (used by the front-end and e-mail templates). Sends `ETag` / `Cache-Control: public, max-age=3600` and honours `If-None-Match` (`304`). Unknown file → `400` `errors.imageNotExist`.

### `GET /images/album_image/:id/:img`
**Auth: none.** Streams `albums/<id>/<img>` (same caching behaviour).

```html
<img src="https://api.photodej.com/images/album_image/6660a1d29b1e8a0012a4c444/IMG_001.jpg">
```

### `GET /images/album/:id`
**Auth: none.** Image records of an album. Optional query `image` filters by name (case-insensitive substring).

```json
{
  "images": [
    { "id": "6660b2e49b1e8a0012a4c555", "name": "IMG_001.jpg", "album_id": "6660a1d29b1e8a0012a4c444", "disabled": false }
  ],
  "imagesCount": 1
}
```

### `GET /images/album/:id/selected`
**Auth: none.** The client's saved selection for an album: `{ "id", "album_id", "images": [ ... ] }` (empty response if nothing was selected yet).

### `POST /images/:albumId`
**Auth: none.** Upload "general" images (logo, main image, promo images, ...) to `general/<name>`; the `Image` record is tagged with the given `albumId` value. Field: `images`.

`200`: `{ "message": "success.uploadSuccess", "actual_message": "Upload has been successfull." }`. `400` `errors.mustSelectImage` when no file is sent.

### `POST /images/album/:id`
**Auth: token.** Upload files into an album (`albums/<id>/<name>`). Field: `images`.

```bash
curl -X POST $API/images/album/6660a1d29b1e8a0012a4c444 \
  -H "Authorization: Bearer $TOKEN" \
  -F "images=@IMG_001.jpg" -F "images=@IMG_002.jpg"
```

`200`: `success.uploadSuccess`. `400`: `errors.albumNotExist`, `errors.mustSelectImage`.

### `POST /images/album/:id/select`
**Auth: none** (no `verifyToken`, but the handler reads the client from the `Authorization` header payload). Save the client's picked images for an album.

```json
{ "images": ["IMG_001.jpg", "IMG_003.jpg"] }
```

First selection: creates the record → `success.imagesSelected`. Later selections: updates it, writes a client log and creates a `SELECTED_IMAGES` [notification](#notifications) → `success.selectedImagesUpdated`. `400` `errors.enterImageName` when `images` is empty.

### `PATCH /images/:id/disable`, `PATCH /images/:id/enable`
**Auth: none.** `:id` is the **album id**. Hide/show images.

```json
{ "images": ["IMG_002.jpg"] }
```

`200`: `success.imagesDisabled` / `success.imagesEnabled`.

### `DELETE /images/:image`
**Auth: none.** Delete one general image by file name (`:image`). `200`: `success.imageDeleted`. See [Known issues](#known-issues).

### `DELETE /images/:id/images`
**Auth: none.** `:id` is the **album id**. Delete several album images (files and records).

```json
{ "images": ["IMG_001.jpg", "IMG_002.jpg"] }
```

`200`: `success.imageDeleted`.

## Schedules & locations

A schedule is a calendar entry owned by the logged-in user (`user_id` comes from the token). A schedule can have any number of locations.

Schedule object:

```json
{
  "id": "6661c3f59b1e8a0012a4c666",
  "title": "Wedding shoot",
  "description": "Church + restaurant",
  "date": "2026-10-20",
  "time": "14:00",
  "user_id": "665f1c2e9b1e8a0012a4c111",
  "location_1": "St. Clement church",
  "location_2": "Restaurant Vodno",
  "contact_number_1": "+38970111222",
  "contact_number_2": null
}
```

Location object: `{ id, title, place, date, time, location_n, schedule_id, schedule, user_id, created_by, created_by_id, created_date, created_time, modified_by, modified_by_id, modified_date, modified_time }`.

### `GET /schedules?from=YYYY-MM-DD&to=YYYY-MM-DD`
**Auth: token.** All schedules in the date range, **grouped by date**. `from` and `to` are required (`400` `errors.datesNeedToBeProvided`).

```json
[
  { "date": "2026-10-20", "schedules": [ { "id": "6661c3f5...", "title": "Wedding shoot", "...": "..." } ] }
]
```

### `GET /schedules/:id`
**Auth: token.** One schedule.

### `GET /schedules/for/user?from=...&to=...[&title=...]`
**Auth: token.** The caller's schedules in a date range (array). `title` is an exact match.

### `GET /schedules/for/user/upcoming?limit=5`
**Auth: token.** The caller's schedules, limited to `limit` items (`400` `errors.limitRequired` if missing).

### `POST /schedules`
**Auth: token.**

| Field | Type | Required |
|---|---|---|
| `title` | string | yes |
| `date` | string `YYYY-MM-DD` | yes |
| `description`, `time`, `location_1`, `location_2`, `contact_number_1`, `contact_number_2` | string | no |

```bash
curl -X POST $API/schedules \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{ "title": "Wedding shoot", "date": "2026-10-20", "time": "14:00", "location_1": "St. Clement church" }'
```

`200`: `{ "message": "success.scheduleCreated", "actual_message": "New schedule has been crated.", "schedule": { } }`.

### `PATCH /schedules/:id`
**Auth: token.** Update schedule fields. `200`: `success.scheduleUpdated` + `schedule`.

### `DELETE /schedules/:id`
**Auth: token.** `200`: `success.scheduleDeleted`.

### `GET /schedules/locations/all`
**Auth: token.** All locations (array).

### `GET /schedules/:id/locations`
**Auth: token.** Locations of one schedule (array).

### `POST /schedules/:id/locations`
**Auth: token.** Add a location to a schedule; the location's `date` is copied from the schedule.

| Field | Type | Required |
|---|---|---|
| `title` | string | yes (schema) |
| `place`, `time` | string | no |

`200`: `{ "message": "success.locationCreated", "actual_message": "New location has been created.", "location": { } }`. `400` `errors.scheduleNotExist`.

### `PATCH /schedules/:id/locations/:location_id`
**Auth: token.** Update a location (body applied as-is). `200`: `success.locationUpdated`. `404` `errors.scheduleNotExist` / `errors.locationNotExist`.

### `DELETE /schedules/:id/locations/:location_id`
**Auth: token.** `200`: `success.locationDeleted`.

## Configuration

A single document that drives the public site and the invite e-mail. It is created automatically on first start from `helpers/initializeConfiguration.js`.

Configuration object (`GET /conf`):

```json
{
  "id": "6659e0a79b1e8a0012a4c001",
  "logo": "DEF_black_camera_logo.png",
  "logo_white": "DEF_black_camera_logo.png",
  "logo_icon": "DEF_black_camera_logo.png",
  "main_image": "",
  "main_title": "", "main_title_tr": "",
  "second_title": "", "second_title_tr": "",
  "promo_images": ["promo1.jpg", "promo2.jpg"],
  "promo_videos": [],
  "contact_form_label": null,
  "phone_number": "", "email": "", "address": "",
  "facebook_link": "", "insta_link": "",
  "emails_for_notifications": ["owner@example.com"],

  "invite_from": "New user",
  "invite_subject": "Invite!",
  "invite_credentials_message": "This are your login credentials",
  "invite_credentials_email_label": "Email",
  "invite_credentials_password_label": "Password",
  "invite_login_message": "Click on the next button to get redirected to login",
  "invite_thank_you_message": "Thank you for using us!",
  "invite_phone_number_icon": "DEF_phone_email_icon.png",
  "invite_email_icon": "DEF_mail_email_icon.png",
  "invite_location_icon": "DEF_location_email_icon.png"
}
```

Image fields hold **file names** that are served by [`GET /images/:img`](#get-imagesimg). `emails_for_notifications` are the recipients of the "new contact request" e-mail.

### `GET /conf`
**Auth: none.** The configuration (`contact_form_label` is always `null`).

### `POST /conf`
**Auth: token.** Insert an additional configuration document. Required: `logo`, `main_image`, `main_title`, `second_title`, `contact_form_label`, `phone_number`, `email`, `address` (`400` `errors.required.<field>`). `200`: `success.configurationCreated` + `configuration`.

### `PATCH /conf`
**Auth: token.** Update any configuration fields.

```bash
curl -X PATCH $API/conf \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "main_title": "Capturing your moments",
    "phone_number": "+38970111222",
    "emails_for_notifications": ["owner@example.com", "studio@example.com"]
  }'
```

`200`: `{ "message": "success.configurationUpdated", "actual_message": "Configuration has been updated.", "configuration": { } }`. `400` `errors.configurationNotPresent`.

### `PATCH /conf/images/promo`
**Auth: token.** Update the promo image list. Body: `{ "images": ["promo1.jpg", "promo2.jpg"] }` (upload the files first with `POST /images/:albumId`). `promo_images` is stored as a JSON string and returned as an array. `200`: `success.promoImagesUpdated` + `configuration`.

### `PATCH /conf/images/promo/clear`
**Auth: token.** Delete every promo image (records and R2 files) and clear the list. `200`: `success.promoImagesUpdated` + `configuration`.

### `DELETE /conf`
**Auth: token.** Not implemented (the handler is empty and never answers).

## Requests

Contact requests submitted from the public website.

Request object: `{ id, firstname, lastname, phone_number, email, status, date, time }`.

### `POST /requests`
**Auth: none.** Submit a contact request. Creates a `PENDING` request, an `REQUEST_SENT` [notification](#notifications) and e-mails `emails_for_notifications`.

| Field | Type | Required |
|---|---|---|
| `firstname`, `lastname`, `phone_number` | string | yes |
| `email` | string | no |

```bash
curl -X POST $API/requests \
  -H "Content-Type: application/json" \
  -d '{ "firstname": "Nina", "lastname": "Trajkova", "phone_number": "+38975123123", "email": "nina@example.com" }'
```

`200`: `{ "message": "success.requestCreated", "actual_message": "New request has been created." }`.

### `GET /requests`
**Auth: token.** Paginated list, newest first.

| Query | Meaning |
|---|---|
| `page`, `take` | pagination |
| `firstname`, `lastname`, `email`, `date` | case-insensitive substring |
| `phone` | substring of `phone_number` |
| `status` | `PENDING` or `CONTACTED` (otherwise `400` `errors.invalidRequestStatus`) |

### `GET /requests/pending`
**Auth: token.** Paginated list of `PENDING` requests.

### `GET /requests/:id`
**Auth: token.** One request.

### `PATCH /requests/:id/contacted`
**Auth: token.** Mark a request as `CONTACTED`. `200`: `{ "message": "success.requestContacted", "actual_message": "Request has been marked as CONTACTED." }`.

## Invites

History of the invite e-mails sent with `POST /client/:id`.

Invite object: `{ id, invited_client: {clean model}, invited_client_id, invited_by: {clean model}, invited_by_id, status, date, time }`.

### `GET /invites`
**Auth: token.** Paginated list, newest first.

| Query | Meaning |
|---|---|
| `page`, `take` | pagination |
| `client` | first or last name of the invited client (substring) |
| `date` | exact `YYYY-MM-DD` |
| `status` | `SUCCESSFULL` or `FAILED` (otherwise `400` `errors.ivalidInviteStatus`) |

### `GET /invites/:id`
**Auth: token.** One invite. `400` `errors.inviteNotExist`.

## Notifications

Notification object:

```json
{
  "id": "6662d4a69b1e8a0012a4c777",
  "type": "ACCEPTED_INVITATION",
  "message": "notMessages.acceptedInvitation",
  "client": { "id": "665f2a0b9b1e8a0012a4c222", "fullname": "Elena Kostova" },
  "client_id": "665f2a0b9b1e8a0012a4c222",
  "event_info": null,
  "album_id": null,
  "date": "2026-10-14",
  "time": "11:20:05",
  "time_passed": 12,
  "time_passed_type": "types.minutes",
  "read": false
}
```

`time_passed_type` is `types.minutes` (< 1h), `types.hours` (≤ 24h) or `types.days`. The `message` is an i18n key.

### `GET /notifications`
**Auth: token.** Paginated list, newest first. The response also contains `not_read`, the number of unread notifications **in the returned page**.

### `PATCH /notifications/read/all`
**Auth: token.** Mark every notification as read. `200`: `success.allNotificationsMarkedRead`.

### `PATCH /notifications/read/:id`
**Auth: token.** Mark one as read. `200`: `{ "message": "success.notificationMarkedRead", "actual_message": "...", "notification": { } }`.

## Client logs

Audit trail of client actions. Log object: `{ id, action, client: {clean model}, client_id, date, time }`.

### `GET /client_logs`
**Auth: token.** Paginated list, newest first.

| Query | Meaning |
|---|---|
| `page`, `take` | pagination |
| `client` | client first/last name (substring) |
| `date` | substring of `YYYY-MM-DD` |
| `action` | one of `LOGIN`, `LOGOUT`, `ACTIVATE_ACCOUNT`, `SELECTED_IMAGES`, `UPDATED_PROFILE` (otherwise `400` `errors.invalidLogAction`) |

### `GET /client_logs/client/:id`
**Auth: token.** All logs of one client (array). `404` `errors.clientNoExist`.

### `GET /client_logs/client/latest/:id`
**Auth: token.** The 5 most recent logs of one client (array).

### `POST /client_logs`
**Auth: token.** Internal testing helper — inserts the body as a log document and answers the plain text `ok`.

```json
{
  "action": "LOGIN",
  "client_id": "665f2a0b9b1e8a0012a4c222",
  "client": { "id": "665f2a0b9b1e8a0012a4c222", "fullname": "Elena Kostova" },
  "date": "2026-10-14",
  "time": "11:20:05"
}
```

## Modifications

### `GET /modifications`
**Auth: token.** Paginated list (`page`, `take`), oldest first.

```json
{
  "page": 1,
  "total": 1,
  "list": [
    {
      "id": "6663e5b79b1e8a0012a4c888",
      "cluster": "User",
      "modification": "EDITED_USER",
      "modified_element_id": "665f3b3c9b1e8a0012a4c333",
      "modified_date": "2026-10-14",
      "modified_time": "11:45:30",
      "modified_by": { "id": "665f1c2e9b1e8a0012a4c111", "fullname": "Ana Petrova" },
      "modified_by_id": "665f1c2e9b1e8a0012a4c111"
    }
  ]
}
```

## Logger

### `GET /logger`
**Auth: token.** Paginated request log (`page`, `take`), newest first. Each item:

```json
{
  "_id": "6664f6c89b1e8a0012a4c999",
  "log_type": "SUCCESS",
  "log_status": "200",
  "url": "/client?page=1&take=10",
  "method": "GET",
  "user": { "id": "665f1c2e9b1e8a0012a4c111", "fullname": "Ana Petrova" },
  "message": null,
  "error": null,
  "date": "2026-10-14",
  "time": "11:50:01"
}
```

`log_type` is `SUCCESS`, `ERROR` or `CUSTOM_MESSAGE`; `user` is `"NO_USER"` for unauthenticated calls.

## Organizations

### `GET /organizations`
**Auth: token.** Paginated list (`page`, `take`).

### `GET /organizations/:id`
**Auth: token.** One organization: `{ _id, name, owner, owner_id, number_of_members, created_date, created_time, created_by, created_by_id }`.

There is no endpoint for creating organizations yet.

## Dashboard

### `GET /dashboard`
**Auth: token.** Counters for the dashboard. `visitCounters` is today's visit count; the others are totals.

```json
{ "albums": 24, "clients": 18, "requests": 9, "invites": 15, "visitCounters": 57 }
```

## Visit counters

### `POST /visit_counters`
**Auth: none.** Register one site visit (stores today's date). Answers the plain text `ok`.

### `GET /visit_counters`
**Auth: none.** Paginated list (`page`, `take`), newest first: `{ "page": 1, "total": 120, "list": [ { "id": "...", "date": "2026-10-14" } ] }`.

---

## Enums

| Enum | Values |
|---|---|
| `AdminRole` | `SUPER_ADMIN`, `ADMIN` |
| `UserRole` | `USER` |
| `AccountStatus` | `ACTIVE`, `SUSPENDED` |
| `OnlineStatus` | `ONLINE`, `OFFLINE` |
| `InviteStatus` | `SUCCESSFULL`, `FAILED`, `EXPIRED`, `ACCEPTED` (only `SUCCESSFULL`/`FAILED` are accepted by the invites filter) |
| `RequestStatus` | `PENDING`, `CONTACTED` |
| `NotificationType` | `EVENT_REMINDER`, `REQUEST_SENT`, `ACCEPTED_INVITATION`, `SELECTED_IMAGES` |
| `ClientLogAction` | `LOGIN`, `LOGOUT`, `ACTIVATE_ACCOUNT`, `SELECTED_IMAGES`, `UPDATED_PROFILE` |
| `ModificationType` | `ADDED_IMAGES`, `SELECTED_IMAGES`, `ASSIGNED_ALBUM`, `EDITED_ALBUM`, `SOFT_DELETED_ALBUM`, `RECOVERED_ALBUM`, `EDITED_CLIENT`, `SOFT_DELETED_CLIENT`, `RECOVERED_CLIENT`, `EDITED_USER`, `SOFT_DELETED_USER`, `RECOVERED_USER` |
| `LogType` | `ERROR`, `SUCCESS`, `CUSTOM_MESSAGE` |
| Login command | `RESET_REQUIRED` |

## Known issues

Observed while documenting the code; the behaviour above describes what the routes are meant to do, these are where the implementation currently differs. None of them are fixed by this documentation.

- **Shadowed album routes.** `PATCH /albums/:id/:status` is registered before `PATCH /albums/:id/images`, `/selected_images` and `/assign`, so Express hands those requests to the status handler (`images`, `selected_images`, `assign` are treated as the status). Register the specific routes first to fix it.
- **`GET /albums/assigned_by/:id` and `/albums/created_by/:id`** read `req.params.userId`, but the route parameter is named `id`, so they always answer `400` (missing id). `created_by` also filters on a misspelled field (`crated_by_id`).
- **`PUT /client/:id`** calls `Client.updateOne({ _id: id, data })`, i.e. the update data is inside the filter, so the client is not actually modified.
- **`POST /client/:id` (invite)** only saves the invite and answers when the client already has a previous invite record; for a first invite the e-mail is sent but the request never gets a response and no invite row is created.
- **`DELETE /admin/:id`** answers with `res.status(statusCodes)` (an object, not a number), which throws instead of returning `200`. `GET /admin/:id` and some error branches reference an undefined `id` variable.
- **`DELETE /images/:image`** looks the image up with `Image.find` (returns an array) and then reads `.key` / `._id` from it, so the record and R2 object are not matched correctly.
- **Image routes without auth.** `POST /images/:albumId`, `POST /images/album/:id/select`, `PATCH /images/:id/enable|disable` and both `DELETE` routes do not use `verifyToken`; the album image/selection read routes are public too.
- **Public routes that decode the `Authorization` header.** `POST /requests`, `PATCH /client/reset/first_password/:id` and all image routes except the two streaming `GET`s (`/images/:img`, `/images/album_image/:id/:img`) call `parseJwt(req.headers.authorization)` at the top of the handler. `parseJwt` only base64-decodes the payload (no verification) and throws when the header is absent, so a request without any `Authorization` header ends in the `500` error handler instead of reaching the logic.
- **`DELETE /conf`** has an empty handler and never answers.
- **Pagination in `GET /requests` and `GET /invites`** computes `skip = take` for every page above 1, so only pages 1 and 2 are correct.
- **`GET /organizations`** filters by `added_by_id`, a field the organization schema does not have, so it always returns an empty list.
- **`DELETE /users/:id`** records the modification type `SOFT_DELETED_ALBUM` (the `SOFT_DELETED_USER` enum value is mistakenly set to that string).
- **Plain-text first password.** A client's `first_password` is stored unhashed until the account is activated (needed for the invite e-mail).
- **Tokens are not role-scoped.** A client token is accepted by every `verifyToken` route that does not check `SUPER_ADMIN`.

## Notes

- Never delete files that contain `DEF` in their name (`images/DEF_*.png`), those files are used to autogenerate configuration when the project is initialized.
- The default configuration points at `DEF_*.png` file names, which are served from `general/<name>` in the R2 bucket — run the migration script (or upload them with `POST /images/:albumId`) on a fresh bucket so the logo and e-mail icons resolve.
- Invite and new-request e-mails build image URLs from the incoming request host (`http` on `localhost`, `https` otherwise).
- `email.html` in the project root is a static HTML sample of the invite e-mail.
