const tocLinks = [...document.querySelectorAll('#toc-nav a[href^="#"]')];
const sections = new Map(tocLinks.map(link => [document.querySelector(link.hash), link]));
const visibleSections = new Set();
const observer = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
        if (isIntersecting) visibleSections.add(target);
        else visibleSections.delete(target);
    }

    const current = [...sections.keys()].find(section => visibleSections.has(section));
    for (const [section, link] of sections) {
        link.classList.toggle('active', section === current);
        if (section === current) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
    }
}, { rootMargin: '-80px 0px -40% 0px' });

for (const section of sections.keys()) observer.observe(section);

const slider = document.getElementById('slider-wrapper');
const slides = [...slider.querySelectorAll('.slider-slide')];
const dots = document.querySelectorAll('.slider-dot');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightbox-img');
let currentSlide = 0;

function goToSlide(index) {
    currentSlide = (index + slides.length) % slides.length;
    slider.style.transform = `translateX(-${currentSlide * 100}%)`;
    slides.forEach((slide, i) => { slide.inert = i !== currentSlide; });
    dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
}

document.getElementById('slider-prev').addEventListener('click', () => goToSlide(currentSlide - 1));
document.getElementById('slider-next').addEventListener('click', () => goToSlide(currentSlide + 1));
dots.forEach((dot, index) => dot.addEventListener('click', () => goToSlide(index)));

for (const slide of slides) {
    slide.addEventListener('click', () => {
        const image = slide.querySelector('img');
        lightboxImage.src = image.currentSrc || image.src;
        lightboxImage.alt = image.alt;
        lightbox.showModal();
    });
}

lightbox.addEventListener('click', ({ target }) => {
    if (target === lightbox) lightbox.close();
});

goToSlide(0);
