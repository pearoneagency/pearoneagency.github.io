# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static marketing website for PearONE, a marketing automation agency. Bilingual (English/Portuguese) single-page application with blog pages and job postings. Built with vanilla JavaScript, no framework dependencies.

## Commands

### Testing
```bash
npm test                    # Run all tests
npm test -- common.test.js  # Run specific test file
```

### Development
No build process required. Open HTML files directly in browser or use a local server:
```bash
python3 -m http.server 8000
```

## Architecture

### Multi-Page Structure
- `index.html` - Main marketing page with hero, about, services, portfolio, and contact sections
- `blog.html` - Blog listing page
- `blog-*.html` - Individual blog post pages
- `job-post-*.html` - Individual job posting pages

### JavaScript Architecture

**Three-file split pattern:**
1. **`js/common.js`** - Shared bilingual functionality loaded by all pages
   - Language toggle system with `data-en` and `data-pt` attributes
   - Callback registration for language change events
   - Element skip list for dynamic content that needs custom translation handling
2. **`js/index.js`** - Homepage-specific features (typewriter animation, contact form, scroll effects)
3. **`js/blog.js`** - Blog-specific features

**Key pattern:** Pages configure `common.js` behavior before calling `initializeLanguage()`:
```javascript
// Configure skipped elements and callbacks first
addSkipElementId('typewriter');
addLanguageChangeCallback(resetTypewriter);
// Then initialize
initializeLanguage();
```

### Bilingual Content System

All translatable content uses dual attributes in HTML:
```html
<span data-en="English text" data-pt="Portuguese text">English text</span>
```

The `common.js` language toggle automatically updates all elements with these attributes. Elements that need custom translation logic (like the typewriter animation) register themselves using `addSkipElementId()` and handle translation via callbacks.

### CSS Architecture

- `css/common.css` - Shared navigation, footer, form styles
- `css/index.css` - Homepage-specific styling
- `css/blog.css` - Blog listing page styling
- `css/blog-post.css` - Individual blog post styling
- `css/job-post.css` - Job posting styling

### Testing Strategy

Uses Jest with JSDOM to test vanilla JavaScript in a simulated browser environment. The test helper (`tests/helpers.js`) creates realistic browser windows with scripts loaded via `runScripts: 'dangerously'` to match real browser scoping behavior.

**Test polyfills:** Tests include IntersectionObserver polyfill since JSDOM doesn't provide it by default.

## Key Implementation Details

### Form Submission
Contact form posts to Make.com webhook (`WEBHOOK_URL` in `index.js`). Returns success/error messages in the current language.

### Typewriter Animation
Homepage hero uses a language-aware typewriter effect that switches word lists when language toggles. Animation resets cleanly on language change to avoid visual artifacts.

### Mobile Navigation
Hamburger menu with toggle functionality. Auto-closes when navigation links are clicked on mobile viewports.

## File Naming Convention

All code files include two-line ABOUTME comments at the top:
```javascript
// ABOUTME: Brief description of file purpose.
// ABOUTME: Additional context about what it does.
```

Use `grep "ABOUTME:"` to quickly understand file purposes across the codebase.
