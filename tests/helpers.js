// ABOUTME: Test helper that creates a jsdom window with scripts loaded like a real browser.
// ABOUTME: Uses JSDOM runScripts to properly execute browser JS with correct scoping.

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

function createPageWithScripts(htmlBody, scriptPaths, options = {}) {
    // Polyfill script runs before any page scripts to provide missing browser APIs
    const polyfill = `<script>
        if (typeof IntersectionObserver === 'undefined') {
            window.IntersectionObserver = class {
                constructor(cb) { this.cb = cb; }
                observe() {}
                unobserve() {}
                disconnect() {}
            };
        }
    </script>`;

    const scriptTags = scriptPaths.map(p => {
        const code = fs.readFileSync(path.resolve(p), 'utf-8');
        return `<script>${code}</script>`;
    }).join('\n');

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head></head>
        <body>
            ${htmlBody}
            ${polyfill}
            ${scriptTags}
        </body>
        </html>
    `;

    const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost' });
    return dom.window;
}

module.exports = { createPageWithScripts };
