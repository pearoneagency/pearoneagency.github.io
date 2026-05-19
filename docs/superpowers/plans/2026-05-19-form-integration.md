# Form Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Make.com webhook with a Google Apps Script backend that writes to Google Sheets, sends email to paloma@pearone.co, and validates/sanitizes all inputs on both frontend and backend.

**Architecture:** Dual-layer validation. The browser validates for instant UX feedback, then the Apps Script re-validates and sanitizes before writing to Sheets or sending email. Neither layer trusts the other.

**Tech Stack:** Vanilla JS (frontend), Google Apps Script (backend), Jest + JSDOM (tests)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `js/index.js` | Modify | Add `containsInjection()`, `validateForm()`, `checkSubmitRateLimit()`, `recordSubmission()`. Update submit handler. Replace webhook URL. |
| `tests/index.test.js` | Modify | Add test suites for validation, injection detection, and rate limiting |
| `apps-script/Code.gs` | Create | Google Apps Script: validate, sanitize, write to Sheets, send email |

---

### Task 1: Injection Detection Utility

**Files:**
- Modify: `tests/index.test.js`
- Modify: `js/index.js`

- [ ] **Step 1: Write failing tests for `containsInjection()`**

Add this describe block to `tests/index.test.js` inside the top-level `describe('index.js', ...)`:

```javascript
describe('containsInjection', () => {
    test('returns true for script tags', () => {
        expect(win.containsInjection('<script>alert(1)</script>')).toBe(true);
    });

    test('returns true for script tags case-insensitive', () => {
        expect(win.containsInjection('<SCRIPT>alert(1)</SCRIPT>')).toBe(true);
    });

    test('returns true for javascript: protocol', () => {
        expect(win.containsInjection('javascript:alert(1)')).toBe(true);
    });

    test('returns true for onerror attribute', () => {
        expect(win.containsInjection('x onerror=alert(1)')).toBe(true);
    });

    test('returns true for onload attribute', () => {
        expect(win.containsInjection('x onload=alert(1)')).toBe(true);
    });

    test('returns true for iframe tags', () => {
        expect(win.containsInjection('<iframe src="x">')).toBe(true);
    });

    test('returns true for img tags', () => {
        expect(win.containsInjection('<img src=x onerror=alert(1)>')).toBe(true);
    });

    test('returns false for normal text', () => {
        expect(win.containsInjection('Hello, this is a normal message.')).toBe(false);
    });

    test('returns false for text with angle brackets in conversation', () => {
        expect(win.containsInjection('Our budget is > 10k and < 50k')).toBe(false);
    });

    test('returns false for empty string', () => {
        expect(win.containsInjection('')).toBe(false);
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- index.test.js`
Expected: FAIL — `win.containsInjection is not a function`

- [ ] **Step 3: Implement `containsInjection()` in `index.js`**

Add this block in `js/index.js` right above the `// --- Contact Form ---` comment (before the webhook URL line):

```javascript
// --- Form Validation ---

var INJECTION_PATTERNS = [
    /<script/i,
    /javascript:/i,
    /onerror\s*=/i,
    /onload\s*=/i,
    /<iframe/i,
    /<img/i
];

function containsInjection(text) {
    for (var i = 0; i < INJECTION_PATTERNS.length; i++) {
        if (INJECTION_PATTERNS[i].test(text)) return true;
    }
    return false;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- index.test.js`
Expected: All `containsInjection` tests PASS

- [ ] **Step 5: Commit**

```bash
git add js/index.js tests/index.test.js
git commit -m "feat: add injection detection utility for form validation"
```

---

### Task 2: Form Validation Function

**Files:**
- Modify: `tests/index.test.js`
- Modify: `js/index.js`

- [ ] **Step 1: Write failing tests for `validateForm()`**

Add this describe block to `tests/index.test.js` inside the top-level `describe('index.js', ...)`:

```javascript
describe('validateForm', () => {
    var validData;

    beforeEach(() => {
        validData = {
            name: 'João Silva',
            email: 'joao@example.com',
            organization: 'Empresa XYZ',
            interest: 'crm',
            message: 'I would like to learn more about your CRM services.',
            newsletter: false,
            language: 'en'
        };
    });

    test('returns null for valid data', () => {
        expect(win.validateForm(validData, 'en')).toBe(null);
    });

    test('returns error when name is empty', () => {
        validData.name = '';
        expect(win.validateForm(validData, 'en')).not.toBe(null);
    });

    test('returns error when name is too short', () => {
        validData.name = 'A';
        expect(win.validateForm(validData, 'en')).not.toBe(null);
    });

    test('returns error when name exceeds 100 characters', () => {
        validData.name = 'A'.repeat(101);
        expect(win.validateForm(validData, 'en')).not.toBe(null);
    });

    test('returns error when name contains injection', () => {
        validData.name = '<script>alert(1)</script>';
        expect(win.validateForm(validData, 'en')).not.toBe(null);
    });

    test('returns error when email is empty', () => {
        validData.email = '';
        expect(win.validateForm(validData, 'en')).not.toBe(null);
    });

    test('returns error when email format is invalid', () => {
        validData.email = 'not-an-email';
        expect(win.validateForm(validData, 'en')).not.toBe(null);
    });

    test('returns error when email exceeds 254 characters', () => {
        validData.email = 'a'.repeat(243) + '@example.com';
        expect(win.validateForm(validData, 'en')).not.toBe(null);
    });

    test('returns error when organization exceeds 200 characters', () => {
        validData.organization = 'A'.repeat(201);
        expect(win.validateForm(validData, 'en')).not.toBe(null);
    });

    test('returns error when organization contains injection', () => {
        validData.organization = '<iframe src="evil.com">';
        expect(win.validateForm(validData, 'en')).not.toBe(null);
    });

    test('allows empty organization', () => {
        validData.organization = '';
        expect(win.validateForm(validData, 'en')).toBe(null);
    });

    test('returns error when interest is not a known value', () => {
        validData.interest = 'hacking';
        expect(win.validateForm(validData, 'en')).not.toBe(null);
    });

    test('allows empty interest (no selection)', () => {
        validData.interest = '';
        expect(win.validateForm(validData, 'en')).toBe(null);
    });

    test('returns error when message is empty', () => {
        validData.message = '';
        expect(win.validateForm(validData, 'en')).not.toBe(null);
    });

    test('returns error when message is too short', () => {
        validData.message = 'Hi';
        expect(win.validateForm(validData, 'en')).not.toBe(null);
    });

    test('returns error when message exceeds 2000 characters', () => {
        validData.message = 'A'.repeat(2001);
        expect(win.validateForm(validData, 'en')).not.toBe(null);
    });

    test('returns error when message contains injection', () => {
        validData.message = 'Check this <script>alert("xss")</script>';
        expect(win.validateForm(validData, 'en')).not.toBe(null);
    });

    test('returns Portuguese error messages when lang is pt', () => {
        validData.name = '';
        var error = win.validateForm(validData, 'pt');
        expect(error).not.toBe(null);
        expect(error).not.toMatch(/required/i);
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- index.test.js`
Expected: FAIL — `win.validateForm is not a function`

- [ ] **Step 3: Implement `validateForm()` in `index.js`**

Add this code in `js/index.js` right after the `containsInjection()` function:

```javascript
var VALID_INTERESTS = ['', 'email-marketing', 'automation', 'crm', 'optimization', 'consultation'];
var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(data, lang) {
    var pt = lang === 'pt';

    if (!data.name || data.name.trim().length < 2) {
        return pt ? 'Nome deve ter pelo menos 2 caracteres.' : 'Name must be at least 2 characters.';
    }
    if (data.name.length > 100) {
        return pt ? 'Nome não pode exceder 100 caracteres.' : 'Name cannot exceed 100 characters.';
    }
    if (containsInjection(data.name)) {
        return pt ? 'Nome contém caracteres não permitidos.' : 'Name contains disallowed characters.';
    }

    if (!data.email || data.email.trim().length === 0) {
        return pt ? 'Email é obrigatório.' : 'Email is required.';
    }
    if (data.email.length > 254) {
        return pt ? 'Email não pode exceder 254 caracteres.' : 'Email cannot exceed 254 characters.';
    }
    if (!EMAIL_REGEX.test(data.email)) {
        return pt ? 'Formato de email inválido.' : 'Invalid email format.';
    }

    if (data.organization && data.organization.length > 200) {
        return pt ? 'Organização não pode exceder 200 caracteres.' : 'Organization cannot exceed 200 characters.';
    }
    if (data.organization && containsInjection(data.organization)) {
        return pt ? 'Organização contém caracteres não permitidos.' : 'Organization contains disallowed characters.';
    }

    if (VALID_INTERESTS.indexOf(data.interest) === -1) {
        return pt ? 'Selecione um serviço válido.' : 'Please select a valid service.';
    }

    if (!data.message || data.message.trim().length < 10) {
        return pt ? 'Mensagem deve ter pelo menos 10 caracteres.' : 'Message must be at least 10 characters.';
    }
    if (data.message.length > 2000) {
        return pt ? 'Mensagem não pode exceder 2000 caracteres.' : 'Message cannot exceed 2000 characters.';
    }
    if (containsInjection(data.message)) {
        return pt ? 'Mensagem contém conteúdo não permitido.' : 'Message contains disallowed content.';
    }

    return null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- index.test.js`
Expected: All `validateForm` tests PASS

- [ ] **Step 5: Commit**

```bash
git add js/index.js tests/index.test.js
git commit -m "feat: add form validation with bilingual error messages"
```

---

### Task 3: Rate Limiting

**Files:**
- Modify: `tests/index.test.js`
- Modify: `js/index.js`

- [ ] **Step 1: Write failing tests for rate limiting**

Add this describe block to `tests/index.test.js` inside the top-level `describe('index.js', ...)`:

```javascript
describe('rate limiting', () => {
    beforeEach(() => {
        win.localStorage.clear();
    });

    test('checkSubmitRateLimit returns false when no submissions yet', () => {
        expect(win.checkSubmitRateLimit()).toBe(false);
    });

    test('checkSubmitRateLimit returns false after 1 submission', () => {
        win.recordSubmission();
        expect(win.checkSubmitRateLimit()).toBe(false);
    });

    test('checkSubmitRateLimit returns false after 2 submissions', () => {
        win.recordSubmission();
        win.recordSubmission();
        expect(win.checkSubmitRateLimit()).toBe(false);
    });

    test('checkSubmitRateLimit returns true after 3 submissions (limit reached)', () => {
        win.recordSubmission();
        win.recordSubmission();
        win.recordSubmission();
        expect(win.checkSubmitRateLimit()).toBe(true);
    });

    test('old submissions outside the window are ignored', () => {
        var oldTimestamp = Date.now() - (61 * 60 * 1000);
        win.localStorage.setItem('pearone_submissions', JSON.stringify([oldTimestamp, oldTimestamp, oldTimestamp, oldTimestamp]));
        expect(win.checkSubmitRateLimit()).toBe(false);
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- index.test.js`
Expected: FAIL — `win.checkSubmitRateLimit is not a function`

- [ ] **Step 3: Implement rate limiting in `index.js`**

Add this code in `js/index.js` right after the `validateForm()` function:

```javascript
var RATE_LIMIT_KEY = 'pearone_submissions';
var RATE_LIMIT_MAX = 3;
var RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function getRecentSubmissions() {
    var raw = localStorage.getItem(RATE_LIMIT_KEY);
    if (!raw) return [];
    try {
        var timestamps = JSON.parse(raw);
        var cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
        return timestamps.filter(function(t) { return t > cutoff; });
    } catch (e) {
        return [];
    }
}

function checkSubmitRateLimit() {
    return getRecentSubmissions().length >= RATE_LIMIT_MAX;
}

function recordSubmission() {
    var recent = getRecentSubmissions();
    recent.push(Date.now());
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(recent));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- index.test.js`
Expected: All rate limiting tests PASS

- [ ] **Step 5: Commit**

```bash
git add js/index.js tests/index.test.js
git commit -m "feat: add client-side rate limiting for form submissions"
```

---

### Task 4: Integrate Validation Into Submit Handler

**Files:**
- Modify: `js/index.js`
- Modify: `tests/index.test.js`

- [ ] **Step 1: Write test for submit handler validation integration**

Add this describe block to `tests/index.test.js` inside the top-level `describe('index.js', ...)`:

```javascript
describe('contact form submission', () => {
    beforeEach(() => {
        win.localStorage.clear();
    });

    test('shows validation error when name is empty', () => {
        win.document.getElementById('name').value = '';
        win.document.getElementById('email').value = 'test@example.com';
        win.document.getElementById('message').value = 'This is a test message for validation.';

        var form = win.document.getElementById('contactForm');
        form.dispatchEvent(new win.Event('submit', { cancelable: true }));

        var status = win.document.getElementById('contactFormStatus');
        expect(status.style.display).toBe('block');
        expect(status.style.color).toContain('dc3545');
    });

    test('shows rate limit error after too many submissions', () => {
        win.localStorage.setItem('pearone_submissions', JSON.stringify([
            Date.now(), Date.now(), Date.now()
        ]));

        win.document.getElementById('name').value = 'Test User';
        win.document.getElementById('email').value = 'test@example.com';
        win.document.getElementById('message').value = 'This is a test message for validation.';

        var form = win.document.getElementById('contactForm');
        form.dispatchEvent(new win.Event('submit', { cancelable: true }));

        var status = win.document.getElementById('contactFormStatus');
        expect(status.style.display).toBe('block');
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- index.test.js`
Expected: FAIL — status element display not set as expected (current handler has no validation)

- [ ] **Step 3: Replace the submit handler in `index.js`**

Replace the entire `// --- Contact Form ---` section (from the `WEBHOOK_URL` line through the closing `});` of the submit handler) with:

```javascript
// --- Contact Form ---

var APPS_SCRIPT_URL = 'PLACEHOLDER_APPS_SCRIPT_URL';

document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    var submitBtn = this.querySelector('button[type="submit"]');
    var statusEl = document.getElementById('contactFormStatus');
    var originalBtnText = submitBtn.textContent;

    statusEl.style.display = 'none';

    var formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        organization: document.getElementById('organization').value,
        interest: document.getElementById('interest').value,
        message: document.getElementById('message').value,
        newsletter: document.getElementById('newsletter').checked,
        language: currentLang
    };

    if (checkSubmitRateLimit()) {
        statusEl.textContent = currentLang === 'en'
            ? 'Too many submissions. Please wait before trying again.'
            : 'Muitos envios. Aguarde antes de tentar novamente.';
        statusEl.style.color = 'var(--red, #dc3545)';
        statusEl.style.display = 'block';
        return;
    }

    var validationError = validateForm(formData, currentLang);
    if (validationError) {
        statusEl.textContent = validationError;
        statusEl.style.color = 'var(--red, #dc3545)';
        statusEl.style.display = 'block';
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = currentLang === 'en' ? 'Sending...' : 'Enviando...';

    try {
        var response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        var result = await response.json();

        if (result.status !== 'ok') {
            throw new Error(result.message || 'Request failed');
        }

        recordSubmission();

        statusEl.textContent = currentLang === 'en'
            ? 'Thank you! We\'ll get back to you within 24 hours.'
            : 'Obrigada! Entraremos em contato em até 24 horas.';
        statusEl.style.color = 'var(--green, #28a745)';
        statusEl.style.display = 'block';
        this.reset();
    } catch (error) {
        statusEl.textContent = currentLang === 'en'
            ? 'Something went wrong. Please try again or email us directly.'
            : 'Algo deu errado. Tente novamente ou envie um email diretamente.';
        statusEl.style.color = 'var(--red, #dc3545)';
        statusEl.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- index.test.js`
Expected: All tests PASS (validation and rate limiting tests now work with the integrated handler)

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: All tests across all files PASS — no regressions

- [ ] **Step 6: Commit**

```bash
git add js/index.js tests/index.test.js
git commit -m "feat: integrate validation and rate limiting into contact form handler"
```

---

### Task 5: Google Apps Script Backend

**Files:**
- Create: `apps-script/Code.gs`

- [ ] **Step 1: Create the `apps-script` directory**

```bash
mkdir -p apps-script
```

- [ ] **Step 2: Create `apps-script/Code.gs`**

```javascript
// ABOUTME: Google Apps Script backend for PearONE contact form.
// ABOUTME: Validates, sanitizes, writes to Google Sheets, and sends email notification.

var SPREADSHEET_ID = ''; // paste the spreadsheet ID from the Google Sheet URL
var NOTIFICATION_EMAIL = 'paloma@pearone.co';
var RATE_LIMIT_MAX = 5;
var RATE_LIMIT_WINDOW_SECONDS = 3600;

var VALID_INTERESTS = ['', 'email-marketing', 'automation', 'crm', 'optimization', 'consultation'];
var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var INJECTION_PATTERNS = [
    /<script/i,
    /javascript:/i,
    /onerror\s*=/i,
    /onload\s*=/i,
    /<iframe/i,
    /<img/i
];

function doPost(e) {
    try {
        var data = JSON.parse(e.postData.contents);
    } catch (err) {
        return jsonResponse({ status: 'error', message: 'Invalid request body' });
    }

    var ip = e.parameter._ip || 'unknown';
    if (isRateLimited(ip)) {
        return jsonResponse({ status: 'error', message: 'Too many submissions. Please wait.' });
    }

    var error = validateSubmission(data);
    if (error) {
        return jsonResponse({ status: 'error', message: error });
    }

    data.name = stripHtml(data.name);
    data.organization = stripHtml(data.organization || '');
    data.message = stripHtml(data.message);

    try {
        appendToSheet(data);
    } catch (err) {
        Logger.log('Sheet write failed: ' + err.message);
        return jsonResponse({ status: 'error', message: 'Failed to save submission.' });
    }

    try {
        sendNotification(data);
    } catch (err) {
        Logger.log('Email send failed: ' + err.message);
    }

    recordSubmissionByIp(ip);

    return jsonResponse({ status: 'ok' });
}

function doGet(e) {
    return jsonResponse({ status: 'ok', message: 'Form endpoint is running.' });
}

function jsonResponse(obj) {
    return ContentService
        .createTextOutput(JSON.stringify(obj))
        .setMimeType(ContentService.MimeType.JSON);
}

function containsInjection(text) {
    for (var i = 0; i < INJECTION_PATTERNS.length; i++) {
        if (INJECTION_PATTERNS[i].test(text)) return true;
    }
    return false;
}

function stripHtml(text) {
    return text.replace(/<[^>]*>/g, '');
}

function validateSubmission(data) {
    if (!data.name || String(data.name).trim().length < 2) return 'Name is required (min 2 chars).';
    if (String(data.name).length > 100) return 'Name too long.';
    if (containsInjection(data.name)) return 'Name contains disallowed content.';

    if (!data.email || String(data.email).trim().length === 0) return 'Email is required.';
    if (String(data.email).length > 254) return 'Email too long.';
    if (!EMAIL_REGEX.test(data.email)) return 'Invalid email format.';

    if (data.organization && String(data.organization).length > 200) return 'Organization too long.';
    if (data.organization && containsInjection(data.organization)) return 'Organization contains disallowed content.';

    if (VALID_INTERESTS.indexOf(data.interest) === -1) return 'Invalid interest value.';

    if (!data.message || String(data.message).trim().length < 10) return 'Message is required (min 10 chars).';
    if (String(data.message).length > 2000) return 'Message too long.';
    if (containsInjection(data.message)) return 'Message contains disallowed content.';

    return null;
}

function appendToSheet(data) {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Form Submissions') || ss.getSheets()[0];
    sheet.appendRow([
        new Date().toISOString(),
        data.name,
        data.email,
        data.organization || '',
        data.interest || '',
        data.message,
        data.newsletter ? 'TRUE' : 'FALSE',
        data.language || ''
    ]);
}

function sendNotification(data) {
    var subject = 'New contact form submission — ' + data.name;
    var body = 'New contact form submission received.\n\n'
        + 'Name: ' + data.name + '\n'
        + 'Email: ' + data.email + '\n'
        + 'Organization: ' + (data.organization || '(not provided)') + '\n'
        + 'Interest: ' + (data.interest || '(not selected)') + '\n'
        + 'Message: ' + data.message + '\n'
        + 'Newsletter: ' + (data.newsletter ? 'Yes' : 'No') + '\n'
        + 'Language: ' + (data.language === 'pt' ? 'Portuguese' : 'English') + '\n'
        + 'Submitted at: ' + new Date().toISOString() + '\n';

    MailApp.sendEmail(NOTIFICATION_EMAIL, subject, body);
}

function isRateLimited(ip) {
    var cache = CacheService.getScriptCache();
    var key = 'ratelimit_' + ip;
    var count = Number(cache.get(key)) || 0;
    return count >= RATE_LIMIT_MAX;
}

function recordSubmissionByIp(ip) {
    var cache = CacheService.getScriptCache();
    var key = 'ratelimit_' + ip;
    var count = Number(cache.get(key)) || 0;
    cache.put(key, String(count + 1), RATE_LIMIT_WINDOW_SECONDS);
}
```

- [ ] **Step 3: Commit**

```bash
git add apps-script/Code.gs
git commit -m "feat: add Google Apps Script backend for form submissions"
```

---

### Task 6: Google Sheet Setup & Deployment

This task is **manual** — follow the steps in order.

- [ ] **Step 1: Create the Google Sheet**

1. Go to [sheets.google.com](https://sheets.google.com) (logged in as `felipe@pearone.co`)
2. Create a new blank spreadsheet
3. Rename it to `PearONE Form Submissions`
4. Rename the first sheet tab to `Form Submissions`
5. Add headers in row 1: `Timestamp | Name | Email | Organization | Interest | Message | Newsletter | Language`
6. Copy the spreadsheet ID from the URL — it's the long string between `/d/` and `/edit` (e.g., `1aBcDeFgHiJkLmNoPqRsTuVwXyZ`)

- [ ] **Step 2: Create the Apps Script project**

1. Go to [script.google.com](https://script.google.com) (logged in as `felipe@pearone.co`)
2. Click **New project**
3. Rename the project to `PearONE Contact Form`
4. Delete the default `myFunction` code
5. Paste the entire contents of `apps-script/Code.gs`
6. Set the `SPREADSHEET_ID` constant to the ID you copied in Step 1
7. Click **Save** (Ctrl+S)

- [ ] **Step 3: Deploy as Web App**

1. Click **Deploy** → **New deployment**
2. Click the gear icon → select **Web app**
3. Set **Description** to `Contact form handler v1`
4. Set **Execute as** to `Me (felipe@pearone.co)`
5. Set **Who has access** to `Anyone`
6. Click **Deploy**
7. Authorize the script when prompted (review permissions: Sheets, Gmail)
8. Copy the **Web app URL** (looks like `https://script.google.com/macros/s/.../exec`)

- [ ] **Step 4: Update the frontend URL**

In `js/index.js`, replace `PLACEHOLDER_APPS_SCRIPT_URL` with the actual Web app URL from Step 3.

- [ ] **Step 5: Commit**

```bash
git add js/index.js
git commit -m "feat: set Apps Script deployment URL in contact form"
```

---

### Task 7: End-to-End Verification

- [ ] **Step 1: Start local server**

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` in a browser.

- [ ] **Step 2: Test validation errors**

1. Submit the form with all fields empty → verify error message appears in red
2. Enter a 1-character name → verify name length error
3. Enter an invalid email like `notanemail` → verify email format error
4. Enter a short message (less than 10 chars) → verify message length error
5. Enter `<script>alert(1)</script>` in the name field → verify injection error
6. Verify error messages switch language when toggling EN/PT

- [ ] **Step 3: Test successful submission**

1. Fill the form with valid data:
   - Name: `Test User`
   - Email: `felipe@pearone.co`
   - Organization: `PearONE`
   - Interest: `Email Marketing & Campaigns`
   - Message: `This is a test submission to verify the form integration works correctly.`
2. Submit → verify green success message appears
3. Check the Google Sheet → verify a new row was added with all fields
4. Check `paloma@pearone.co`'s inbox → verify notification email arrived

- [ ] **Step 4: Test rate limiting**

1. Submit the form 3 more times with valid data (4 total within an hour)
2. On the 5th attempt → verify rate limit error message appears
3. Verify the form did not make a network request (check browser DevTools Network tab)

- [ ] **Step 5: Test Portuguese language**

1. Toggle to Portuguese
2. Submit with invalid data → verify error messages are in Portuguese
3. Submit with valid data → verify success message is in Portuguese

- [ ] **Step 6: Run the full test suite one final time**

Run: `npm test`
Expected: All tests PASS
