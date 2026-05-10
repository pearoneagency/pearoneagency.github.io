// ABOUTME: Unit tests for js/blog.js blog listing page functionality.
// ABOUTME: Tests category filtering logic.

const { createPageWithScripts } = require('./helpers');

const blogHtml = `
    <button class="filter-btn active" data-category="all">All</button>
    <button class="filter-btn" data-category="crm">CRM</button>
    <button class="filter-btn" data-category="email">Email</button>

    <article class="blog-card" data-category="crm">CRM Post</article>
    <article class="blog-card" data-category="email">Email Post</article>
    <article class="blog-card" data-category="crm">Another CRM Post</article>

    <form id="newsletterForm">
        <input type="email" name="email" value="test@example.com">
        <button type="submit">Subscribe</button>
    </form>
    <p id="newsletterFormStatus" style="display: none;"></p>
`;

let win;

beforeEach(() => {
    win = createPageWithScripts(blogHtml, ['js/common.js', 'js/blog.js']);
});

afterEach(() => {
    if (win) win.close();
});

describe('blog.js', () => {
    describe('category filters', () => {
        test('clicking "All" filter shows all cards', () => {
            win.document.querySelector('[data-category="all"]').click();

            win.document.querySelectorAll('.blog-card').forEach(card => {
                expect(card.style.display).not.toBe('none');
            });
        });

        test('clicking a category filter hides non-matching cards', () => {
            win.document.querySelector('[data-category="crm"]').click();

            win.document.querySelectorAll('.blog-card[data-category="crm"]').forEach(card => {
                expect(card.style.display).toBe('block');
            });

            win.document.querySelectorAll('.blog-card[data-category="email"]').forEach(card => {
                expect(card.style.display).toBe('none');
            });
        });

        test('clicking a filter sets it as active and removes active from others', () => {
            const crmBtn = win.document.querySelector('[data-category="crm"]');
            const allBtn = win.document.querySelector('[data-category="all"]');

            expect(allBtn.classList.contains('active')).toBe(true);

            crmBtn.click();

            expect(crmBtn.classList.contains('active')).toBe(true);
            expect(allBtn.classList.contains('active')).toBe(false);
        });

        test('switching between category filters updates visible cards', () => {
            win.document.querySelector('[data-category="crm"]').click();
            expect(win.document.querySelector('.blog-card[data-category="email"]').style.display).toBe('none');

            win.document.querySelector('[data-category="email"]').click();
            expect(win.document.querySelector('.blog-card[data-category="email"]').style.display).toBe('block');
            win.document.querySelectorAll('.blog-card[data-category="crm"]').forEach(card => {
                expect(card.style.display).toBe('none');
            });
        });
    });
});
