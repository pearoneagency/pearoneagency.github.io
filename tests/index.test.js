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
});
