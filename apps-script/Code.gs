// ABOUTME: Google Apps Script backend for PearONE contact form.
// ABOUTME: Validates, sanitizes, writes to Google Sheets, and sends email notification.

var SPREADSHEET_ID = '1dRIaKMFPcBpsRrYEPP9etDwpizWzyxhMsPkJ6qSKNqc'; // paste the spreadsheet ID from the Google Sheet URL
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
    if (containsInjection(data.email)) return 'Email contains disallowed content.';

    if (data.organization && String(data.organization).length > 200) return 'Organization too long.';
    if (data.organization && containsInjection(data.organization)) return 'Organization contains disallowed content.';

    if (VALID_INTERESTS.indexOf(data.interest) === -1) return 'Invalid interest value.';

    if (!data.message || String(data.message).trim().length < 10) return 'Message is required (min 10 chars).';
    if (String(data.message).length > 2000) return 'Message too long.';
    if (containsInjection(data.message)) return 'Message contains disallowed content.';

    return null;
}

function formatBrazilTimestamp() {
    return Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');
}

function appendToSheet(data) {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Form Submissions') || ss.getSheets()[0];
    sheet.appendRow([
        formatBrazilTimestamp(),
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
        + 'Submitted at: ' + formatBrazilTimestamp() + ' (Brasilia)\n';

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
