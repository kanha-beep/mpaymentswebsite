(() => {
  const onReady = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  };

  const parseSettings = (value) => {
    if (!value) return null;
    try {
      return JSON.parse(value.replace(/&quot;/g, '"'));
    } catch {
      return null;
    }
  };

  const initStickyHeader = () => {
    const header = document.querySelector('#site-header');
    if (!header) return;

    const update = () => {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
  };

  const initReveals = () => {
    const candidates = document.querySelectorAll('.elementor-invisible, .elementor-widget, .e-con, .elementor-column');
    const seen = new Set();

    candidates.forEach((el) => {
      if (el.closest('#site-header')) return;
      if (seen.has(el)) return;
      seen.add(el);
      el.classList.add('reveal-pending');
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          entry.target.classList.remove('elementor-invisible', 'reveal-pending');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    seen.forEach((el) => observer.observe(el));
  };

  const initMobileMenus = () => {
    document.querySelectorAll('.wpr-mobile-nav-menu-container').forEach((menu) => {
      const toggle = menu.querySelector('.wpr-mobile-toggle');
      if (toggle) {
        toggle.addEventListener('click', () => {
          menu.classList.toggle('is-open');
        });
      }

      menu.querySelectorAll('.menu-item-has-children > a').forEach((link) => {
        link.addEventListener('click', (event) => {
          const parent = link.parentElement;
          if (!parent) return;
          if (window.innerWidth > 1024) return;
          event.preventDefault();
          parent.classList.toggle('is-open');
        });
      });
    });
  };

  const initBackToTop = () => {
    const button = document.querySelector('.wpr-stt-btn');
    if (!button) return;

    const update = () => button.classList.toggle('is-visible', window.scrollY > 320);
    update();

    window.addEventListener('scroll', update, { passive: true });
    button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const initPhoneButton = () => {
    document.querySelectorAll('.wpr-pc-btn[href="tel:123456789"]').forEach((link) => {
      link.setAttribute('href', 'tel:+919876543210');
    });
  };

  const initBackgroundVideos = () => {
    document.querySelectorAll('.elementor-section[data-settings], .e-con[data-settings]').forEach((section) => {
      const video = section.querySelector('video.elementor-background-video-hosted');
      if (!video || video.querySelector('source')) return;
      const settings = parseSettings(section.getAttribute('data-settings'));
      const sourceUrl = settings?.background_video_link;
      if (!sourceUrl) return;
      video.src = sourceUrl;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.autoplay = true;
      video.play().catch(() => {});
    });
  };

  const initAnimatedText = () => {
    document.querySelectorAll('.wpr-anim-text').forEach((wrapper) => {
      const inner = wrapper.querySelector('.wpr-anim-text-inner');
      if (!inner) return;
      const items = [...inner.querySelectorAll('b')].map((node) => node.textContent.trim()).filter(Boolean);
      if (!items.length) return;

      const target = document.createElement('span');
      target.className = 'wpr-anim-text-static';
      wrapper.insertBefore(target, inner);
      inner.style.display = 'none';

      let itemIndex = 0;
      let charIndex = 0;
      let deleting = false;

      const tick = () => {
        const word = items[itemIndex];
        if (!deleting) {
          charIndex += 1;
          target.textContent = word.slice(0, charIndex);
          if (charIndex === word.length) {
            deleting = true;
            return window.setTimeout(tick, 1500);
          }
          return window.setTimeout(tick, 75);
        }

        charIndex -= 1;
        target.textContent = word.slice(0, Math.max(charIndex, 0));
        if (charIndex <= 0) {
          deleting = false;
          itemIndex = (itemIndex + 1) % items.length;
          return window.setTimeout(tick, 250);
        }
        return window.setTimeout(tick, 42);
      };

      tick();
    });
  };

  const initImageLoaders = () => {
    document.querySelectorAll('.hero-image-loader').forEach((wrapper) => {
      const image = wrapper.querySelector('.hero-image-loader__img');
      if (!image) return;

      const markLoaded = () => {
        wrapper.classList.remove('is-loading');
        wrapper.classList.add('is-loaded');
      };

      if (image.complete) {
        markLoaded();
        return;
      }

      image.addEventListener('load', markLoaded, { once: true });
      image.addEventListener('error', markLoaded, { once: true });
    });
  };

  const initForms = () => {
    document.querySelectorAll('.wpr-form').forEach((form) => {
      const status = document.createElement('div');
      status.className = 'wpr-form-status';
      form.appendChild(status);

      const fields = [...form.querySelectorAll('input[type="text"], input[type="email"], textarea')];

      const setStatus = (kind, message) => {
        status.className = `wpr-form-status is-visible ${kind}`;
        status.textContent = message;
      };

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        let valid = true;

        fields.forEach((field) => {
          const required = field.hasAttribute('required') || /email/i.test(field.type);
          const value = field.value.trim();
          const isEmail = field.type === 'email';
          const emailValid = !isEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          const fieldValid = (!required || value) && emailValid;
          field.setAttribute('aria-invalid', fieldValid ? 'false' : 'true');
          if (!fieldValid) valid = false;
        });

        if (!valid) {
          setStatus('is-error', 'Please fill in the required details correctly.');
          return;
        }

        form.classList.add('is-submitting');

        const name = form.querySelector('input[type="text"]')?.value.trim() || '';
        const email = form.querySelector('input[type="email"]')?.value.trim() || '';
        const message = form.querySelector('textarea')?.value.trim() || '';
        const subject = encodeURIComponent('Website enquiry from M Payments clone');
        const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);

        window.setTimeout(() => {
          form.classList.remove('is-submitting');
          setStatus('is-success', 'Your message is ready. Your email app will open now.');
          window.location.href = `mailto:info@mpaymentsprocessing.com?subject=${subject}&body=${body}`;
        }, 400);
      });
    });
  };

  onReady(() => {
    initStickyHeader();
    initReveals();
    initMobileMenus();
    initBackToTop();
    initPhoneButton();
    initBackgroundVideos();
    initAnimatedText();
    initImageLoaders();
    initForms();
  });
})();
