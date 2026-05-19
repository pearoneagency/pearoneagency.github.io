// ABOUTME: Homepage-specific JavaScript for PearONE (index.html).
// ABOUTME: Handles typewriter animation, mobile menu, contact form, and scroll effects.

// Configure common.js to skip the typewriter element during language toggle
addSkipElementId('typewriter');
addLanguageChangeCallback(resetTypewriter);

// Initialize language after configuration
initializeLanguage();

// --- Typewriter Animation ---

var typewriterElement;
var words = {
    en: ['your process', 'your marketing', 'customer experience', 'your sales', 'your business', 'your efficiency'],
    pt: ['seu processo', 'seu marketing', 'a experiência do cliente', 'suas vendas', 'seu negócio', 'sua eficiência']
};
var wordIndex = 0;
var charIndex = 0;
var isDeleting = false;
var isPaused = false;
var typewriterTimeout;

function typeWriter() {
    if (!typewriterElement) return;

    var currentWords = words[currentLang];
    var currentWord = currentWords[wordIndex];

    if (isPaused) {
        typewriterTimeout = setTimeout(typeWriter, 1500);
        isPaused = false;
        return;
    }

    if (isDeleting) {
        typewriterElement.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;

        if (charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % currentWords.length;
            typewriterTimeout = setTimeout(typeWriter, 300);
            return;
        }
    } else {
        typewriterElement.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;

        if (charIndex === currentWord.length) {
            isPaused = true;
            isDeleting = true;
        }
    }

    var typingSpeed = isDeleting ? 40 : 80;
    typewriterTimeout = setTimeout(typeWriter, typingSpeed);
}

function resetTypewriter() {
    if (typewriterTimeout) {
        clearTimeout(typewriterTimeout);
    }
    charIndex = 0;
    isDeleting = false;
    isPaused = false;
    wordIndex = 0;

    if (typewriterElement) {
        typewriterTimeout = setTimeout(typeWriter, 300);
    }
}

function initTypewriter() {
    typewriterElement = document.getElementById('typewriter');
    if (typewriterElement) {
        setTimeout(typeWriter, 1000);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTypewriter);
} else {
    initTypewriter();
}

// --- Mobile Menu ---

function toggleMobileMenu() {
    var navLinks = document.getElementById('navLinks');
    var hamburger = document.getElementById('hamburger');

    navLinks.classList.toggle('active');
    hamburger.classList.toggle('active');
}

// Close mobile menu when clicking on a link
document.addEventListener('DOMContentLoaded', function() {
    var navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(function(link) {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                toggleMobileMenu();
            }
        });
    });
});

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

// --- Contact Form ---

var WEBHOOK_URL = 'https://hook.us2.make.com/4tkgg6hm4rh3c8mfe8dfyih3sl5cnac9';

document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    var submitBtn = this.querySelector('button[type="submit"]');
    var statusEl = document.getElementById('contactFormStatus');
    var originalBtnText = submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.textContent = currentLang === 'en' ? 'Sending...' : 'Enviando...';
    statusEl.style.display = 'none';

    var formData = {
        form_type: 'contact',
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        organization: document.getElementById('organization').value,
        interest: document.getElementById('interest').value,
        message: document.getElementById('message').value,
        newsletter: document.getElementById('newsletter').checked,
        submitted_at: new Date().toISOString(),
        language: currentLang
    };

    try {
        var response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Request failed');

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

// --- Smooth Scroll ---

document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// --- Scroll Animation ---

var observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('section').forEach(function(section) {
    section.style.opacity = 0;
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});
