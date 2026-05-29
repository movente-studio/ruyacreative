/* ============================================================
   main.js — Rüya Creative Ajans
   Custom cursor · Cinematic bokeh background · Reveal animations
   ============================================================ */

(function () {
  'use strict';

  /* =============================================
     1. CUSTOM CURSOR
     Cursor elements stay direct children of <body>
     with no transform-ancestor interference.
  ============================================= */
  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');

  if (dot && ring && window.innerWidth > 480) {
    let mouseX = -200, mouseY = -200;
    let ringX  = -200, ringY  = -200;
    const ringEase = 0.12;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    // Park cursor off-screen when mouse exits window
    document.addEventListener('mouseleave', () => { mouseX = -200; mouseY = -200; });

    (function tick() {
      dot.style.transform  = `translate(${mouseX}px, ${mouseY}px) translate(-50%,-50%)`;
      ringX += (mouseX - ringX) * ringEase;
      ringY += (mouseY - ringY) * ringEase;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%,-50%)`;
      requestAnimationFrame(tick);
    })();

    document.querySelectorAll('[data-cursor="link"], a, button, input, textarea').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-link'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-link'));
    });
  }

  /* =============================================
     2. CINEMATIC BOKEH BACKGROUND
     Floating soft-light bokeh circles in gold,
     warm white, and cool silver — slow upward
     drift with sinusoidal oscillation and gentle
     opacity pulsing. No aperture / wheel shapes.
  ============================================= */
  const canvas = document.getElementById('lensCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H;

    const BOKEH_COUNT = 65;
    const particles  = [];

    function mkParticle(randY) {
      const r   = 12 + Math.random() * 108;
      const rnd = Math.random();
      // 62 % gold  |  20 % warm ivory  |  18 % cool silver
      const colorRGB = rnd < 0.62 ? '212,175,55' :
                       rnd < 0.82 ? '245,238,210' : '185,205,232';
      return {
        x:         Math.random() * W,
        y:         randY ? Math.random() * H * 1.1 : H + r + Math.random() * 160,
        r,
        vy:        0.04 + Math.random() * 0.22,
        vxAmp:     0.06 + Math.random() * 0.18,
        phase:     Math.random() * Math.PI * 2,
        phaseSpd:  0.00025 + Math.random() * 0.00055,
        baseAlpha: 0.04 + Math.random() * 0.09,
        pulseAmp:  0.15 + Math.random() * 0.28,
        pulseSpd:  0.00040 + Math.random() * 0.00090,
        colorRGB,
      };
    }

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    resize();

    window.addEventListener('resize', () => {
      resize();
      particles.forEach(p => { p.x = Math.random() * W; });
    }, { passive: true });

    for (let i = 0; i < BOKEH_COUNT; i++) particles.push(mkParticle(true));

    function drawFrame(ts) {
      ctx.clearRect(0, 0, W, H);

      // Slow-shifting warm ambient glow underneath particles
      const ax = W * (0.44 + 0.14 * Math.sin(ts * 0.000175));
      const ay = H * (0.40 + 0.11 * Math.cos(ts * 0.000118));
      const ag = ctx.createRadialGradient(ax, ay, 0, ax, ay, Math.max(W, H) * 0.68);
      ag.addColorStop(0,    'rgba(28,20,3,0.52)');
      ag.addColorStop(0.55, 'rgba(9,7,1,0.28)');
      ag.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.fillStyle = ag;
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Drift upward with lateral sway
        p.y -= p.vy;
        p.x += Math.sin(ts * p.phaseSpd + p.phase) * p.vxAmp;

        // Alpha: base × pulse, faded in at bottom and out at top
        let a = p.baseAlpha * (1 + p.pulseAmp * Math.sin(ts * p.pulseSpd + p.phase));
        if (p.y > H * 0.88) a *= (H - p.y) / (H * 0.12);
        if (p.y < p.r * 3)  a *= Math.max(0, p.y / (p.r * 3));
        a = Math.max(0, Math.min(0.98, a));

        if (a > 0.001) {
          // Soft bokeh circle via radial gradient
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          g.addColorStop(0,    `rgba(${p.colorRGB},${Math.min(0.98, a * 2.1)})`);
          g.addColorStop(0.28, `rgba(${p.colorRGB},${a})`);
          g.addColorStop(0.70, `rgba(${p.colorRGB},${a * 0.28})`);
          g.addColorStop(1,    `rgba(${p.colorRGB},0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        }

        // Recycle particle from bottom when off-screen at top
        if (p.y < -p.r * 2) Object.assign(p, mkParticle(false));
      }

      requestAnimationFrame(drawFrame);
    }
    requestAnimationFrame(drawFrame);
  }

  /* =============================================
     3. NAV SCROLL STATE
  ============================================= */
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  /* =============================================
     4. INTERSECTION OBSERVER — REVEAL ANIMATIONS
     Fires CSS transitions as elements enter the
     viewport; never locks or interrupts scroll.
  ============================================= */
  function createObserver(threshold) {
    return new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      });
    }, { threshold, rootMargin: '0px 0px -60px 0px' });
  }

  const revealObs = createObserver(0.1);
  const cardObs   = createObserver(0.05);

  document.querySelectorAll('.reveal-line, .reveal-word, .reveal-fade, .split-line')
    .forEach(el => revealObs.observe(el));

  document.querySelectorAll('.service-card').forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.08}s`;
    cardObs.observe(card);
  });

  // Hero animations fire immediately on load
  setTimeout(() => {
    document.querySelectorAll(
      '.hero-content .split-line, .hero-content .reveal-word, .hero-content .reveal-fade'
    ).forEach(el => el.classList.add('is-visible'));
  }, 200);

  /* =============================================
     5. ANCHOR SMOOTH SCROLL
  ============================================= */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* =============================================
     6. SERVICE CARD 3D TILT
  ============================================= */
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 4}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) translateY(0)';
    });
  });

  /* =============================================
     7. CONTACT FORM (AJAX for Netlify Forms)
  ============================================= */
  const form    = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('.btn-submit');
      btn.disabled = true;
      btn.querySelector('.btn-submit-text').textContent = 'Gönderiliyor...';
      try {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString(),
        });
        if (res.ok) {
          form.querySelectorAll('input, textarea').forEach(f => { f.value = ''; });
          success.classList.add('visible');
          btn.style.display = 'none';
        } else {
          throw new Error('Submit failed');
        }
      } catch {
        btn.disabled = false;
        btn.querySelector('.btn-submit-text').textContent = 'Tekrar Deneyin';
      }
    });
  }

  /* =============================================
     8. PARALLAX — hero content fade on scroll
  ============================================= */
  const heroContent = document.getElementById('heroContent');
  if (heroContent) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      heroContent.style.transform = `translateY(${y * 0.28}px)`;
      heroContent.style.opacity   = String(Math.max(0, 1 - y / (window.innerHeight * 0.68)));
    }, { passive: true });
  }

})();
