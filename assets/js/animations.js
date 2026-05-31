/* ============================================================
   ANIMATIONS.JS - Intersection Observer Scroll Animations
   ============================================================ */

(function() {
  'use strict';

  function initScrollAnimations() {
    const animateElements = document.querySelectorAll('.scroll-animate');
    
    if (!animateElements.length) return;

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    animateElements.forEach(function(el) {
      observer.observe(el);
    });
  }

  function initCountUp() {
    const counters = document.querySelectorAll('.stat-number');
    
    if (!counters.length) return;

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          const target = entry.target;
          const finalValue = parseInt(target.dataset.count) || 0;
          const duration = parseInt(target.dataset.duration) || 2000;
          const frame = 16;
          const totalFrames = duration / frame;
          let currentFrame = 0;

          target.classList.add('show');

          function update() {
            currentFrame++;
            const progress = Math.min(currentFrame / totalFrames, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.round(eased * finalValue);
            
            if (finalValue >= 1000000) {
              target.textContent = (currentValue / 1000000).toFixed(1) + 'M+';
            } else if (finalValue >= 1000) {
              target.textContent = (currentValue / 1000).toFixed(0) + 'K+';
            } else {
              target.textContent = currentValue + '+';
            }

            if (progress < 1) {
              requestAnimationFrame(update);
            } else {
              if (finalValue >= 1000000) {
                target.textContent = (finalValue / 1000000).toFixed(1) + 'M+';
              } else if (finalValue >= 1000) {
                target.textContent = (finalValue / 1000).toFixed(0) + 'K+';
              } else {
                target.textContent = finalValue + '+';
              }
            }
          }

          requestAnimationFrame(update);
          observer.unobserve(target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function(counter) {
      observer.observe(counter);
    });
  }

  function initSkillBars() {
    const bars = document.querySelectorAll('.skill-bar-fill');
    if (!bars.length) return;

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          const bar = entry.target;
          const width = bar.dataset.width || '0%';
          bar.style.width = width;
          bar.classList.add('animated');
          observer.unobserve(bar);
        }
      });
    }, { threshold: 0.3 });

    bars.forEach(function(bar) {
      bar.style.width = '0%';
      observer.observe(bar);
    });
  }

  function initParallax() {
    const parallaxElements = document.querySelectorAll('.parallax-bg');
    if (!parallaxElements.length) return;

    window.addEventListener('scroll', function() {
      const scrollY = window.pageYOffset;
      parallaxElements.forEach(function(el) {
        const speed = parseFloat(el.dataset.speed) || 0.3;
        el.style.transform = 'translateY(' + (scrollY * speed * -0.3) + 'px)';
      });
    }, { passive: true });
  }

  function initHeroParticles() {
    const container = document.querySelector('.hero-particles');
    if (!container) return;

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'hero-particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = (70 + Math.random() * 30) + '%';
      particle.style.width = (3 + Math.random() * 6) + 'px';
      particle.style.height = particle.style.width;
      particle.style.animationDelay = (Math.random() * 6) + 's';
      particle.style.animationDuration = (4 + Math.random() * 4) + 's';
      container.appendChild(particle);
    }
  }

  function initMobileMenuClose() {
    document.addEventListener('click', function(e) {
      const mobileNav = document.getElementById('mobileNav');
      const hamburger = document.getElementById('hamburgerToggle');
      if (mobileNav && mobileNav.classList.contains('open')) {
        if (!mobileNav.contains(e.target) && !hamburger.contains(e.target)) {
          mobileNav.classList.remove('open');
          hamburger.classList.remove('active');
        }
      }
    });
  }

  function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const item = this.closest('.faq-item');
        if (item) {
          item.classList.toggle('active');
        }
      });
    });
  }

  // Initialize everything
  document.addEventListener('DOMContentLoaded', function() {
    initScrollAnimations();
    initCountUp();
    initSkillBars();
    initParallax();
    initHeroParticles();
    initMobileMenuClose();
    initFAQ();

    // Re-run for dynamically loaded content
    const observer = new MutationObserver(function() {
      initScrollAnimations();
      initFAQ();
    });
    
    const footer = document.getElementById('footer');
    if (footer) {
      observer.observe(footer, { childList: true, subtree: true });
    }
    const header = document.getElementById('header');
    if (header) {
      observer.observe(header, { childList: true, subtree: true });
    }
  });

  // Expose init for dynamic content
  window.AlToolsAnimations = {
    initScrollAnimations: initScrollAnimations,
    initCountUp: initCountUp,
    initFAQ: initFAQ
  };

})();
