// ABOUTME: Unit tests for js/index.js homepage functionality.
// ABOUTME: Tests typewriter animation logic and mobile menu toggle.

const { createPageWithScripts } = require('./helpers');

const indexHtml = `
    <span class="highlight typewriter" id="typewriter">your business</span>
    <ul id="navLinks" class="nav-links"></ul>
    <div id="hamburger" class="hamburger"></div>
    <form id="contactForm">
        <input id="name" name="name" value="Test User">
        <input id="email" name="email" value="test@example.com">
        <input id="organization" name="organization" value="TestCo">
        <select id="interest" name="interest"><option value="crm">CRM</option></select>
        <textarea id="message" name="message">Hello</textarea>
        <input type="checkbox" id="newsletter" name="newsletter">
        <button type="submit">Send</button>
    </form>
    <p id="contactFormStatus" style="display: none;"></p>
    <section>Test section</section>
`;

let win;

beforeEach(() => {
    win = createPageWithScripts(indexHtml, ['js/common.js', 'js/index.js']);
});

afterEach(() => {
    if (win) win.close();
});

describe('index.js', () => {
    describe('typewriter configuration', () => {
        test('registers typewriter element as skipped for language toggle', () => {
            expect(win._skipElementIds.has('typewriter')).toBe(true);
        });

        test('has word lists for both languages', () => {
            expect(win.words.en).toBeDefined();
            expect(win.words.pt).toBeDefined();
            expect(win.words.en.length).toBeGreaterThan(0);
            expect(win.words.pt.length).toBeGreaterThan(0);
        });

        test('word lists have matching lengths for both languages', () => {
            expect(win.words.en.length).toBe(win.words.pt.length);
        });
    });

    describe('typewriter animation state', () => {
        test('resetTypewriter resets animation variables', () => {
            win.wordIndex = 3;
            win.charIndex = 5;
            win.isDeleting = true;
            win.isPaused = true;

            win.resetTypewriter();

            expect(win.wordIndex).toBe(0);
            expect(win.charIndex).toBe(0);
            expect(win.isDeleting).toBe(false);
            expect(win.isPaused).toBe(false);
        });

        test('typeWriter types first character of current word', () => {
            win.typewriterElement = win.document.getElementById('typewriter');
            win.typewriterElement.textContent = '';
            win.charIndex = 0;
            win.wordIndex = 0;
            win.isDeleting = false;
            win.isPaused = false;

            win.typeWriter();

            expect(win.typewriterElement.textContent).toBe('y');
            expect(win.charIndex).toBe(1);
        });
    });

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

    describe('mobile menu', () => {
        test('toggleMobileMenu toggles active class on nav and hamburger', () => {
            const navLinks = win.document.getElementById('navLinks');
            const hamburger = win.document.getElementById('hamburger');

            expect(navLinks.classList.contains('active')).toBe(false);
            expect(hamburger.classList.contains('active')).toBe(false);

            win.toggleMobileMenu();

            expect(navLinks.classList.contains('active')).toBe(true);
            expect(hamburger.classList.contains('active')).toBe(true);

            win.toggleMobileMenu();

            expect(navLinks.classList.contains('active')).toBe(false);
            expect(hamburger.classList.contains('active')).toBe(false);
        });
    });

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
});
