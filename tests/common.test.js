// ABOUTME: Unit tests for js/common.js shared language toggle functionality.
// ABOUTME: Tests bilingual initialization, language switching, callbacks, and skip behaviour.

const { createPageWithScripts } = require('./helpers');

let win;

function setup(htmlBody) {
    win = createPageWithScripts(htmlBody || '', ['js/common.js']);
}

afterEach(() => {
    if (win) win.close();
});

describe('common.js', () => {
    describe('initial state', () => {
        test('sets default language to English', () => {
            setup();
            expect(win.document.documentElement.lang).toBe('en');
        });
    });

    describe('initializeLanguage', () => {
        test('sets element text to English translation', () => {
            setup('<span data-en="Hello" data-pt="Ola">placeholder</span>');
            win.initializeLanguage();
            expect(win.document.querySelector('span').textContent).toBe('Hello');
        });

        test('sets innerHTML when translation contains HTML tags', () => {
            setup('<li data-en="<strong>Bold</strong> text" data-pt="<strong>Negrito</strong> texto">placeholder</li>');
            win.initializeLanguage();
            expect(win.document.querySelector('li').innerHTML).toBe('<strong>Bold</strong> text');
        });

        test('sets placeholder for input elements', () => {
            setup('<input data-en="Enter email" data-pt="Digite email">');
            win.initializeLanguage();
            expect(win.document.querySelector('input').placeholder).toBe('Enter email');
        });

        test('handles data-en-placeholder attributes', () => {
            setup('<input data-en-placeholder="Enter email" data-pt-placeholder="Digite email">');
            win.initializeLanguage();
            expect(win.document.querySelector('input').placeholder).toBe('Enter email');
        });

        test('skips elements registered via addSkipElementId', () => {
            setup('<span id="skip-me" data-en="English" data-pt="Portugues">English</span>');
            win.addSkipElementId('skip-me');
            win.initializeLanguage();
            expect(win.document.querySelector('#skip-me').textContent).toBe('English');
        });
    });

    describe('toggleLanguage', () => {
        test('switches from English to Portuguese', () => {
            setup('<span data-en="Hello" data-pt="Ola">Hello</span>');
            win.toggleLanguage();
            expect(win.document.documentElement.lang).toBe('pt');
            expect(win.document.querySelector('span').textContent).toBe('Ola');
        });

        test('switches back to English on second toggle', () => {
            setup('<span data-en="Hello" data-pt="Ola">Hello</span>');
            win.toggleLanguage();
            win.toggleLanguage();
            expect(win.document.documentElement.lang).toBe('en');
            expect(win.document.querySelector('span').textContent).toBe('Hello');
        });

        test('updates document lang attribute', () => {
            setup();
            win.toggleLanguage();
            expect(win.document.documentElement.lang).toBe('pt');
            win.toggleLanguage();
            expect(win.document.documentElement.lang).toBe('en');
        });

        test('calls registered language change callbacks', () => {
            setup();
            let calledWith = null;
            win.addLanguageChangeCallback(function(lang) { calledWith = lang; });
            win.toggleLanguage();
            expect(calledWith).toBe('pt');
        });

        test('skips elements registered via addSkipElementId', () => {
            setup('<span id="skip-me" data-en="English" data-pt="Portugues">Original</span>');
            win.addSkipElementId('skip-me');
            win.toggleLanguage();
            expect(win.document.querySelector('#skip-me').textContent).toBe('Original');
        });
    });

    describe('addLanguageChangeCallback', () => {
        test('supports multiple callbacks', () => {
            setup();
            let count = 0;
            win.addLanguageChangeCallback(function() { count++; });
            win.addLanguageChangeCallback(function() { count++; });
            win.toggleLanguage();
            expect(count).toBe(2);
        });
    });
});
