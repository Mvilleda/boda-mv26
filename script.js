// Language switching functionality
let currentLanguage = 'en';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if user has a saved language preference
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
        currentLanguage = savedLanguage;
    }

    // Always apply translations on first load so fallback HTML text stays in sync
    updateLanguage();
});

function toggleLanguage() {
    // Switch between English and Spanish
    currentLanguage = currentLanguage === 'en' ? 'es' : 'en';
    
    // Save preference to localStorage
    localStorage.setItem('preferredLanguage', currentLanguage);
    
    // Update all text on the page
    updateLanguage();
}

function updateLanguage() {
    // Get all elements with data-translate attribute
    const elements = document.querySelectorAll('[data-translate]');
    const htmlTranslationKeys = new Set([
        'locationIntro',
        'locationLeftTitle',
        'locationTravel1Title',
        'locationTravel1Text',
        'locationTravel2Title',
        'locationTravel2Text',
        'locationTravel3Title',
        'locationTravel3Text',
        'pueblaAtlixco',
        'pueblaCholula',
        'stayPlannerNote',
        'timelineVenueNote',
        'stayTitle',
        'faqQ1', 'faqQ2', 'faqQ3', 'faqQ4', 'faqQ5', 'faqQ6', 'faqQ7', 'faqQ8'
    ]);
    
    // Update each element with the translated text
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLanguage] && Object.prototype.hasOwnProperty.call(translations[currentLanguage], key)) {
            if (htmlTranslationKeys.has(key)) {
                element.innerHTML = translations[currentLanguage][key];
            } else {
                element.textContent = translations[currentLanguage][key];
            }
        }
    });
    
    // Update the language toggle button
    updateLanguageButton();
    
    // Update the HTML lang attribute
    document.documentElement.lang = currentLanguage;
}

function updateLanguageButton() {
    const langIcon = document.getElementById('langIcon');
    const langText = document.getElementById('langText');
    
    if (currentLanguage === 'en') {
        // Show Spanish option (to switch TO Spanish)
        langIcon.textContent = '🇲🇽';
        langText.textContent = 'Español';
    } else {
        // Show English option (to switch TO English)
        langIcon.textContent = '🇬🇧';
        langText.textContent = 'English';
    }
}

// Smooth scrolling for any anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Section reveal animations on scroll
function markRevealItems() {
    const staggerStep = 90;

    function addReveal(selector, effect = 'up', stagger = false) {
        const nodes = document.querySelectorAll(selector);
        nodes.forEach((node, index) => {
            node.classList.add('reveal-item', `reveal-${effect}`);
            if (stagger) {
                node.style.setProperty('--reveal-delay', `${index * staggerStep}ms`);
            }
        });
    }

    function addAlternatingReveal(selector, stagger = true) {
        const nodes = document.querySelectorAll(selector);
        nodes.forEach((node, index) => {
            node.classList.add('reveal-item', index % 2 === 0 ? 'reveal-left' : 'reveal-right');
            if (stagger) {
                node.style.setProperty('--reveal-delay', `${index * staggerStep}ms`);
            }
        });
    }

    addReveal('.hero .hero-decoration-top, .hero .hero-text', 'up');
    addReveal('.hero .hero-photo-section', 'zoom');

    addReveal('.details-section .celebrate-title', 'up');
    addAlternatingReveal('.details-section .event-column');

    addReveal('.welcome-section h2', 'up');
    addReveal('.welcome-section .couple-image', 'zoom');
    addReveal('.welcome-section .welcome-text p', 'up', true);

    addReveal('.counter-section .counter-title', 'up');
    addReveal('.counter-section .countdown-item', 'up', true);
    addReveal('.counter-section .counter-subtitle, .counter-section .rsvp-note, .counter-section .rsvp-button-container', 'up');

    addReveal('.timeline-section h2', 'up');
    addAlternatingReveal('.timeline-section .timeline-item');

    addReveal('.location-section .location-title, .location-section .location-intro', 'up');
    addReveal('.location-section .location-map', 'zoom');
    addReveal('.location-section .location-left .location-subtitle, .location-section .location-left .location-copy', 'up');
    addAlternatingReveal('.location-section .travel-item');
    addReveal('.location-section .location-footer-note', 'up');

    addReveal('.stay-section .stay-title, .stay-section .stay-intro', 'up');
    addAlternatingReveal('.stay-section .stay-card');
    addReveal('.stay-section .stay-note', 'up');

    addReveal('.contribute-section .contribute-title, .contribute-section .contribute-intro, .contribute-section .contribute-thanks, .contribute-section .contribute-accounts-title', 'up');
    addAlternatingReveal('.contribute-section .bank-card');

    addReveal('.faq-section .faq-title, .faq-section .faq-intro, .faq-section .faq-subtitle, .faq-section .faq-puebla', 'up');
    addReveal('.faq-section .faq-item', 'up', true);

    addReveal('.footer p, .footer .footer-signature, .footer .footer-date', 'up', true);
}

function initializeScrollReveal() {
    markRevealItems();

    const observerOptions = {
        threshold: 0.14,
        rootMargin: '0px 0px -8% 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal-item').forEach((item) => observer.observe(item));
}

document.addEventListener('DOMContentLoaded', function() {
    initializeScrollReveal();
    initializeCountdown();
});

// Countdown timer functionality
function initializeCountdown() {
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) {
        return;
    }

    const weddingDate = new Date('October 24, 2026 16:00:00').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const timeRemaining = weddingDate - now;
        
        if (timeRemaining > 0) {
            const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
            
            daysEl.textContent = days;
            hoursEl.textContent = String(hours).padStart(2, '0');
            minutesEl.textContent = String(minutes).padStart(2, '0');
            secondsEl.textContent = String(seconds).padStart(2, '0');
        } else {
            daysEl.textContent = '0';
            hoursEl.textContent = '00';
            minutesEl.textContent = '00';
            secondsEl.textContent = '00';
        }
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// ── Attire Inspo Modal ──
(function () {
    const btn = document.getElementById('inspoBtn');
    const modal = document.getElementById('inspoModal');
    const closeBtn = document.getElementById('inspoClose');
    if (!btn || !modal) return;

    btn.addEventListener('click', function () {
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    });

    function closeModal() {
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeModal();
    });
}());

// ── General Modal Functions ──
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
    }
}

// Close modal when clicking outside the content
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.is-open').forEach(modal => {
                closeModal(modal.id);
            });
        }
    });
});
