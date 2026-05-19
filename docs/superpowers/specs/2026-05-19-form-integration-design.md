# Form Integration Design: Google Sheets + Email Notification + Validation

**Date:** 2026-05-19
**Author:** Felipe (felipe@pearone.co)
**Status:** Approved

---

## Overview

Replace the existing Make.com webhook with a Google Apps Script web app that:
1. Validates and sanitizes form submissions (dual-layer: frontend + backend)
2. Appends each submission as a row in a new Google Sheet
3. Sends an email notification to paloma@pearone.co

No changes to the form HTML. No new external SaaS dependencies.

---

## Architecture

```
Browser (index.html + index.js)
  │  User fills form → frontend validates → POST JSON
  ▼
Google Apps Script Web App (doPost)
  │  Re-validates + sanitizes → writes row → sends email
  ├──▶ Google Sheets (new spreadsheet, one row per submission)
  └──▶ Gmail → paloma@pearone.co
```

**Files changed:**
- `js/index.js` — replace `WEBHOOK_URL`, add `validateForm()`, add rate limiting
- `apps-script/Code.gs` — new file (version-controlled copy of the deployed script)

**Files unchanged:**
- `index.html` — form HTML is not modified
- `js/common.js` — bilingual system is not modified
- All CSS files

---

## Frontend Validation (`js/index.js`)

A `validateForm(data)` function runs before the `fetch` call. Returns an error string or `null` (valid). On error, the message is shown in `contactFormStatus` and no network request is made.

### Validation Rules

| Field        | Rules                                                                 |
|--------------|-----------------------------------------------------------------------|
| `name`       | Required, 2–100 chars, no HTML/script patterns                        |
| `email`      | Required, valid format, max 254 chars                                 |
| `organization` | Optional, max 200 chars, no HTML/script patterns                   |
| `interest`   | Must match one of the known select values                             |
| `message`    | Required, 10–2000 chars, no script injection patterns                 |
| `newsletter` | Boolean only (no validation needed)                                   |

### Injection Patterns Blocked
Checked case-insensitively across all text fields:
- `<script`
- `javascript:`
- `onerror=`
- `onload=`
- `<iframe`
- `<img`

### Rate Limiting
- Uses `localStorage` to track submission timestamps
- Max **3 submissions per 60-minute window** per browser
- On breach: show error message, abort without network request
- Error messages are bilingual (EN/PT)

### Upgrade Path to Strict
Add to `validateForm()`:
- Honeypot field check (hidden field must be empty)
- Disposable email domain blocklist check

---

## Backend: Google Apps Script (`apps-script/Code.gs`)

Deployed as a **Web App** with access set to **"Anyone, even anonymous"** (unauthenticated POST — required so visitors without a Google account can submit the form).

### `doPost(e)` Flow

1. Parse JSON body from request
2. Re-validate all fields (same rules as frontend — backend trusts nothing)
3. Sanitize text fields: strip all HTML tags
4. Append row to Google Sheet
5. Send email notification to paloma@pearone.co
6. Return `{"status": "ok"}` or `{"status": "error", "message": "..."}`

### Rate Limiting (Backend)
- Uses Apps Script `CacheService` to count submissions per IP
- Max **5 submissions per IP per hour**
- Returns error response if exceeded

### Configuration Constants (top of `Code.gs`)
```javascript
var SPREADSHEET_ID = ''; // paste from Google Sheet URL
var NOTIFICATION_EMAIL = 'paloma@pearone.co';
```

### CORS
The script returns `Access-Control-Allow-Origin: *` headers on every response so the browser doesn't block the cross-domain reply. A `doGet()` stub also handles preflight OPTIONS requests.

### Security
- Script never logs sensitive data (no email addresses or message content in logs)
- Sanitization runs even if validation passes (defense in depth)

### Upgrade Path to Strict
Add between steps 2 and 3:
- Disposable email domain check
- Honeypot field validation

---

## Google Sheet Structure

**Created manually** by Felipe in Google Drive under `felipe@pearone.co`.
**Sheet name:** `Form Submissions`

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Timestamp | Name | Email | Organization | Interest | Message | Newsletter | Language |

- **Timestamp:** ISO format, set by Apps Script at write time (client timestamp is ignored)
- **Newsletter:** `TRUE` or `FALSE`
- **Language:** `en` or `pt`

Paloma can be added as a viewer if she wants direct access to the sheet.

---

## Email Notification

Sent via `MailApp.sendEmail()` from `felipe@pearone.co`.

- **To:** paloma@pearone.co
- **Subject:** `New contact form submission — [Name]`
- **Body:** Plain text, all fields listed with values + timestamp

Example:
```
New contact form submission received.

Name: João Silva
Email: joao@example.com
Organization: Empresa XYZ
Interest: Email Marketing
Message: Hi, I'd like to learn more about your services.
Newsletter: Yes
Language: Portuguese
Submitted at: 2026-05-19T14:32:00Z
```

---

## Error Handling

### Frontend
| Scenario | Behavior |
|---|---|
| Validation failure | Specific bilingual error shown in `contactFormStatus` |
| Rate limit hit | Bilingual "too many submissions" error, no request sent |
| Network error | Existing "Something went wrong" message |
| Apps Script returns error | Display returned message or fallback generic message |

### Backend
| Scenario | Behavior |
|---|---|
| Validation failure | Return `{"status": "error", "message": "..."}` |
| Sheet write failure | Log error silently, return generic error to frontend |
| Email failure | **Does not block sheet write** — submission is saved regardless |

The sheet write always takes priority. A missed email is recoverable; a lost submission is not.

---

## Deployment Steps (for implementation plan)

1. Create `apps-script/Code.gs` in the repo
2. Go to [script.google.com](https://script.google.com), create a new project
3. Paste `Code.gs` content, set `SPREADSHEET_ID`
4. Deploy as Web App → access: Anyone → copy deployment URL
5. Replace `WEBHOOK_URL` in `js/index.js` with the deployment URL
6. Test end-to-end: submit form → verify sheet row → verify email

---

## Out of Scope (strict tier — future)

- Honeypot hidden field in form HTML
- Disposable email domain blocklist
- CAPTCHA integration
