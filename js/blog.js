// ABOUTME: Blog listing page JavaScript for PearONE (blog.html).
// ABOUTME: Handles category filtering and newsletter form submission.

// Initialize language
initializeLanguage();

// --- Category Filters ---

document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(function(b) {
            b.classList.remove('active');
        });
        this.classList.add('active');

        var category = this.getAttribute('data-category');

        document.querySelectorAll('.blog-card').forEach(function(card) {
            if (category === 'all' || card.getAttribute('data-category') === category) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
});

// --- Newsletter Form ---

var WEBHOOK_URL = 'https://hook.us2.make.com/4tkgg6hm4rh3c8mfe8dfyih3sl5cnac9';

document.getElementById('newsletterForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    var submitBtn = this.querySelector('button[type="submit"]');
    var statusEl = document.getElementById('newsletterFormStatus');
    var originalBtnText = submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.textContent = currentLang === 'en' ? 'Sending...' : 'Enviando...';
    statusEl.style.display = 'none';

    var formData = {
        form_type: 'newsletter',
        email: this.querySelector('input[type="email"]').value,
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
            ? 'Thank you for subscribing! You\'ll receive our best content soon.'
            : 'Obrigada por assinar! Você receberá nosso melhor conteúdo em breve.';
        statusEl.style.color = '#28a745';
        statusEl.style.display = 'block';
        this.reset();
    } catch (error) {
        statusEl.textContent = currentLang === 'en'
            ? 'Something went wrong. Please try again.'
            : 'Algo deu errado. Tente novamente.';
        statusEl.style.color = '#dc3545';
        statusEl.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
});
