// ABOUTME: Shared language toggle and initialization for all PearONE pages.
// ABOUTME: Handles bilingual content switching between Portuguese and English.

let currentLang = 'en';

var _languageChangeCallbacks = [];
var _skipElementIds = new Set();

function addLanguageChangeCallback(callback) {
    _languageChangeCallbacks.push(callback);
}

function addSkipElementId(id) {
    _skipElementIds.add(id);
}

function _updateElement(element, text) {
    if (!text) return;
    if (text.includes('<')) {
        element.innerHTML = text;
    } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.placeholder = text;
    } else {
        element.textContent = text;
    }
}

function initializeLanguage() {
    document.querySelectorAll('[data-en]').forEach(function(element) {
        if (_skipElementIds.has(element.id)) return;
        _updateElement(element, element.getAttribute('data-en'));
    });

    document.querySelectorAll('[data-en-placeholder]').forEach(function(element) {
        var placeholder = element.getAttribute('data-en-placeholder');
        if (placeholder) element.placeholder = placeholder;
    });
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'pt' : 'en';
    document.documentElement.lang = currentLang;

    document.querySelectorAll('[data-en]').forEach(function(element) {
        if (_skipElementIds.has(element.id)) return;
        var text = currentLang === 'en' ? element.getAttribute('data-en') : element.getAttribute('data-pt');
        _updateElement(element, text);
    });

    document.querySelectorAll('[data-en-placeholder]').forEach(function(element) {
        var placeholder = currentLang === 'en' ? element.getAttribute('data-en-placeholder') : element.getAttribute('data-pt-placeholder');
        if (placeholder) element.placeholder = placeholder;
    });

    _languageChangeCallbacks.forEach(function(cb) { cb(currentLang); });
}
