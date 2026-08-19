/* Hanabira 主题前端脚本（原创） */
(function () {
  'use strict';

  /* ============ 主题切换 ============ */
  const root = document.documentElement;
  const STORAGE_KEY = 'hanabira-theme';

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.classList.toggle('is-dark', theme === 'dark');
      const icon = btn.querySelector('svg use');
      if (icon) icon.setAttribute('href', theme === 'dark' ? '#i-sun' : '#i-moon');
    });
  }

  function initTheme() {
    let saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      saved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme(saved);
  }

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.theme-toggle');
    if (!btn) return;
    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ============ 移动端菜单 ============ */
  document.addEventListener('click', function (e) {
    const toggle = e.target.closest('.nav-burger');
    if (toggle) {
      document.querySelector('.navbar').classList.toggle('menu-open');
      return;
    }
    if (e.target.closest('.navbar') === null) {
      document.querySelector('.navbar') && document.querySelector('.navbar').classList.remove('menu-open');
    }
  });

  /* ============ 顶部栏滚动效果 + 阅读进度条 ============ */
  const header = document.querySelector('.navbar');
  const progress = document.querySelector('.reading-progress');

  function onScroll() {
    const y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 10);
    if (progress) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? (y / h) * 100 : 0;
      progress.style.width = p + '%';
    }
    const backTop = document.querySelector('.back-to-top');
    if (backTop) backTop.classList.toggle('show', y > 400);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ============ 回到顶部 ============ */
  const backTop = document.querySelector('.back-to-top');
  if (backTop) {
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============ 代码块复制按钮 ============ */
  function addCopy(block) {
    if (block.querySelector(':scope > .code-copy')) return;
    const btn = document.createElement('button');
    btn.className = 'code-copy';
    btn.type = 'button';
    btn.setAttribute('aria-label', '复制代码');
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15"><use href="#i-copy"></use></svg>';
    btn.addEventListener('click', function () {
      const code = block.querySelector('td.code pre') || block.querySelector('code') || block.querySelector('pre') || block;
      const text = code.innerText;
      const done = function () {
        btn.classList.add('ok');
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15"><use href="#i-check"></use></svg>';
        setTimeout(function () {
          btn.classList.remove('ok');
          btn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15"><use href="#i-copy"></use></svg>';
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
      } else {
        fallbackCopy(text, done);
      }
    });
    block.appendChild(btn);
  }
  document.querySelectorAll('figure.highlight').forEach(addCopy);
  document.querySelectorAll('pre').forEach(function (p) {
    if (!p.closest('figure.highlight')) addCopy(p);
  });

  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    done();
  }

  /* ============ 目录滚动高亮 ============ */
  const tocLinks = document.querySelectorAll('.toc a');
  if (tocLinks.length) {
    const headings = [];
    tocLinks.forEach(function (a) {
      const id = decodeURIComponent(a.getAttribute('href').replace(/^#/, ''));
      const el = document.getElementById(id);
      if (el) headings.push({ el: el, link: a });
    });
    let ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        let current = null;
        const offset = 120;
        for (let i = 0; i < headings.length; i++) {
          if (headings[i].el.getBoundingClientRect().top <= offset) current = headings[i];
        }
        tocLinks.forEach(function (a) { a.classList.remove('active'); });
        if (current) current.link.classList.add('active');
        ticking = false;
      });
    }, { passive: true });
  }

  /* ============ 滚动进入动画 ============ */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('revealed'); });
  }

  /* ============ 打字机效果 ============ */
  const typer = document.querySelector('.typewriter');
  if (typer && typeof window.HANABIRA_WORDS !== 'undefined' && window.HANABIRA_WORDS.length) {
    const words = window.HANABIRA_WORDS;
    let wi = 0, ci = 0, deleting = false;
    function tick() {
      const word = words[wi];
      if (!deleting) {
        ci++;
        typer.textContent = word.slice(0, ci);
        if (ci === word.length) { deleting = true; setTimeout(tick, 1800); return; }
      } else {
        ci--;
        typer.textContent = word.slice(0, ci);
        if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; }
      }
      setTimeout(tick, deleting ? 40 : 120);
    }
    tick();
  }

  /* ============ 樱花飘落特效 ============ */
  function initSakura() {
    const canvas = document.getElementById('sakura-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;
    const petals = [];
    const COUNT = window.innerWidth < 768 ? 26 : 46;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function Petal() {
      this.reset();
    }
    Petal.prototype.reset = function () {
      this.x = Math.random() * W;
      this.y = -20 - Math.random() * H * 0.5;
      this.size = 6 + Math.random() * 8;
      this.speedY = 1 + Math.random() * 1.8;
      this.speedX = -0.6 + Math.random() * 1.2;
      this.swing = Math.random() * Math.PI * 2;
      this.swingSpeed = 0.01 + Math.random() * 0.03;
      this.opacity = 0.5 + Math.random() * 0.5;
      this.color = ['#ffc1d8', '#ffb6c9', '#ffd1e3', '#fbc2eb'][Math.floor(Math.random() * 4)];
    };
    Petal.prototype.step = function () {
      this.y += this.speedY;
      this.swing += this.swingSpeed;
      this.x += this.speedX + Math.sin(this.swing) * 0.9;
      if (this.y > H + 30 || this.x < -40 || this.x > W + 40) this.reset();
    };
    Petal.prototype.draw = function () {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(Math.sin(this.swing) * 0.9);
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(this.size * 0.4, -this.size * 0.25, this.size * 0.4, this.size * 0.25, 0, this.size * 0.5);
      ctx.bezierCurveTo(-this.size * 0.4, this.size * 0.25, -this.size * 0.4, -this.size * 0.25, 0, 0);
      ctx.fill();
      ctx.restore();
    };

    for (let i = 0; i < COUNT; i++) petals.push(new Petal());

    let raf;
    function loop() {
      ctx.clearRect(0, 0, W, H);
      petals.forEach(function (p) { p.step(); p.draw(); });
      raf = requestAnimationFrame(loop);
    }
    loop();

    // 省电：标签页不可见时暂停
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); } else { loop(); }
    });
  }

  initTheme();
  initSakura();
})();