// Language switching functionality
let currentLanguage = 'en';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if user has a saved language preference
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
        currentLanguage = savedLanguage;
        updateLanguage();
    }
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
        'locationTravel3Text'
    ]);
    
    // Update each element with the translated text
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
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

// Add fade-in animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all sections for fade-in effect
document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
    
    // Initialize countdown
    initializeCountdown();
});

// Countdown timer functionality
function initializeCountdown() {
    const weddingDate = new Date('October 24, 2026 16:00:00').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const timeRemaining = weddingDate - now;
        
        if (timeRemaining > 0) {
            const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
            
            document.getElementById('days').textContent = days;
            document.getElementById('hours').textContent = String(hours).padStart(2, '0');
            document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
            document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
        } else {
            document.getElementById('days').textContent = '0';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
        }
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}
