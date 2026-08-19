/* Hanabira 主题前端脚本（原创） */
(function () {
  'use strict';

  var CFG = window.HANABIRA_CONFIG || {
    root: '/',
    words: [],
    danmaku: [],
    accentHue: 330,
    effects: {},
    live2d: { enable: false },
    music: { enable: false, autoplay: false, list: [] }
  };
  var root = document.documentElement;

  /* ============ 主题切换 ============ */
  var STORAGE_KEY = 'hanabira-theme';

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.classList.toggle('is-dark', theme === 'dark');
      var icon = btn.querySelector('svg use');
      if (icon) icon.setAttribute('href', theme === 'dark' ? '#i-sun' : '#i-moon');
    });
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (!saved) {
      saved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme(saved);
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.theme-toggle');
    if (!btn) return;
    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ============ 移动端菜单 ============ */
  document.addEventListener('click', function (e) {
    var toggle = e.target.closest('.nav-burger');
    if (toggle) {
      document.querySelector('.navbar').classList.toggle('menu-open');
      return;
    }
    if (e.target.closest('.navbar') === null) {
      var nav = document.querySelector('.navbar');
      if (nav) nav.classList.remove('menu-open');
    }
  });

  /* ============ 顶部栏滚动效果 + 阅读进度条 ============ */
  var header = document.querySelector('.navbar');
  var progress = document.querySelector('.reading-progress');

  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 10);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? (y / h) * 100 : 0;
      progress.style.width = p + '%';
    }
    var backTop = document.querySelector('.back-to-top');
    if (backTop) backTop.classList.toggle('show', y > 400);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ============ 回到顶部 ============ */
  var backTop = document.querySelector('.back-to-top');
  if (backTop) {
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============ 代码块复制按钮 ============ */
  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    done();
  }

  function addCopy(block) {
    if (block.querySelector(':scope > .code-copy')) return;
    var btn = document.createElement('button');
    btn.className = 'code-copy';
    btn.type = 'button';
    btn.setAttribute('aria-label', '复制代码');
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15"><use href="#i-copy"></use></svg>';
    btn.addEventListener('click', function () {
      var code = block.querySelector('td.code pre') || block.querySelector('code') || block.querySelector('pre') || block;
      var text = code.innerText;
      var done = function () {
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

  /* ============ 目录滚动高亮 ============ */
  var tocLinks = document.querySelectorAll('.toc a');
  if (tocLinks.length) {
    var headings = [];
    tocLinks.forEach(function (a) {
      var id = decodeURIComponent(a.getAttribute('href').replace(/^#/, ''));
      var el = document.getElementById(id);
      if (el) headings.push({ el: el, link: a });
    });
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var current = null;
        var offset = 120;
        for (var i = 0; i < headings.length; i++) {
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
    var io = new IntersectionObserver(function (entries) {
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
  function initTypewriter() {
    var typer = document.querySelector('.typewriter');
    if (!typer || !(CFG.effects.typewriter !== false) || !CFG.words.length) return;
    var words = CFG.words;
    var wi = 0, ci = 0, deleting = false;
    function tick() {
      var word = words[wi];
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
    var canvas = document.getElementById('sakura-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W, H;
    var petals = [];
    var COUNT = window.innerWidth < 768 ? 26 : 46;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function Petal() { this.reset(); }
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

    for (var i = 0; i < COUNT; i++) petals.push(new Petal());

    var raf;
    function loop() {
      ctx.clearRect(0, 0, W, H);
      petals.forEach(function (p) { p.step(); p.draw(); });
      raf = requestAnimationFrame(loop);
    }
    loop();

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); } else { loop(); }
    });
  }

  /* ============ 萤火虫特效 ============ */
  function initFirefly() {
    var canvas = document.getElementById('firefly-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W, H, flies = [];

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    var N = window.innerWidth < 768 ? 18 : 30;
    for (var i = 0; i < N; i++) {
      flies.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: 1.5 + Math.random() * 2.5,
        phase: Math.random() * Math.PI * 2
      });
    }

    var raf;
    function loop(t) {
      ctx.clearRect(0, 0, W, H);
      flies.forEach(function (f) {
        f.x += f.vx;
        f.y += f.vy;
        if (f.x < 0 || f.x > W) f.vx *= -1;
        if (f.y < 0 || f.y > H) f.vy *= -1;
        var a = 0.3 + 0.45 * Math.abs(Math.sin((t * 0.001) + f.phase));
        var g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 5);
        g.addColorStop(0, 'hsla(78, 90%, 75%, ' + a + ')');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 5, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); } else { raf = requestAnimationFrame(loop); }
    });
  }

  /* ============ 冬季下雪特效 ============ */
  function initWinter() {
    var saved = null;
    try { saved = localStorage.getItem('hanabira-winter'); } catch (e) {}
    var on = saved != null ? saved === '1' : !!(CFG.effects && CFG.effects.snow);
    setWinter(on);
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.winter-toggle');
      if (!btn) return;
      setWinter(!document.body.classList.contains('winter-mode'));
    });
  }
  function setWinter(on) {
    document.body.classList.toggle('winter-mode', on);
    document.querySelectorAll('.winter-toggle').forEach(function (b) { b.classList.toggle('active', on); });
    try { localStorage.setItem('hanabira-winter', on ? '1' : '0'); } catch (e) {}
  }

  function initSnow() {
    var canvas = document.getElementById('snow-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W, H, flakes = [];
    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    var N = window.innerWidth < 768 ? 26 : 50;
    function make(f, top) {
      f.x = Math.random() * W;
      f.y = top ? -10 - Math.random() * H : Math.random() * H;
      f.r = 1.2 + Math.random() * 2.4;
      f.vy = 0.5 + Math.random() * 1.3;
      f.vx = -0.3 + Math.random() * 0.6;
      f.sway = Math.random() * Math.PI * 2;
      f.a = 0.35 + Math.random() * 0.5;
    }
    for (var i = 0; i < N; i++) { var f = {}; make(f, false); flakes.push(f); }
    var raf;
    function loop() {
      ctx.clearRect(0, 0, W, H);
      var on = document.body.classList.contains('winter-mode');
      flakes.forEach(function (fl) {
        if (on) {
          fl.sway += 0.01 + Math.random() * 0.02;
          fl.y += fl.vy;
          fl.x += fl.vx + Math.sin(fl.sway) * 0.6;
          if (fl.y > H + 14) make(fl, true);
          if (fl.x < -24) fl.x = W + 24;
          if (fl.x > W + 24) fl.x = -24;
          ctx.save();
          ctx.globalAlpha = fl.a;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(fl.x, fl.y, fl.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); } else { raf = requestAnimationFrame(loop); }
    });
  }

  /* ============ 背景弹幕特效 ============ */
  function initDanmaku() {
    var canvas = document.getElementById('danmaku-canvas');
    if (!canvas) return;
    var texts = CFG.danmaku || [];
    if (!texts.length) return;
    var ctx = canvas.getContext('2d');
    var W, H;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    var hue = CFG.accentHue || 330;
    var items = [];
    var lanes = Math.max(4, Math.floor((H - 80) / 34));
    var lastSpawn = 0;

    function spawn() {
      var text = texts[Math.floor(Math.random() * texts.length)];
      var lane = Math.floor(Math.random() * lanes);
      items.push({
        text: text,
        x: W + 20,
        y: 70 + lane * 34,
        speed: 0.8 + Math.random() * 1.4,
        size: 14 + Math.floor(Math.random() * 10),
        alpha: 0.18 + Math.random() * 0.22
      });
    }

    var raf;
    function loop(t) {
      ctx.clearRect(0, 0, W, H);
      if (t - lastSpawn > 1300 && items.length < 30) { spawn(); lastSpawn = t; }
      items = items.filter(function (it) { return it.x > -320; });
      items.forEach(function (it) {
        it.x -= it.speed;
        ctx.font = it.size + 'px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = 'hsla(' + hue + ', 55%, 55%, ' + it.alpha + ')';
        ctx.fillText(it.text, it.x, it.y);
      });
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); } else { raf = requestAnimationFrame(loop); }
    });
  }

  /* ============ 鼠标点击特效 ============ */
  function initClickEffect() {
    if (CFG.effects.click_effect === false) return;
    var accents = [];
    var hue = CFG.accentHue || 330;
    for (var k = 0; k < 3; k++) accents.push('hsl(' + (hue + k * 40) + ' 80% 62%)');
    document.addEventListener('click', function (e) {
      var n = 8;
      for (var i = 0; i < n; i++) {
        var p = document.createElement('span');
        p.className = 'click-particle';
        var angle = (Math.PI * 2 * i) / n + Math.random() * 0.5;
        var dist = 28 + Math.random() * 30;
        p.style.left = e.clientX + 'px';
        p.style.top = e.clientY + 'px';
        p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
        p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
        p.style.background = accents[i % accents.length];
        document.body.appendChild(p);
        (function (node) { setTimeout(function () { node.remove(); }, 620); })(p);
      }
    });
  }

  /* ============ 鼠标光晕 ============ */
  function initCursorGlow() {
    var glow = document.getElementById('cursor-glow');
    if (!glow) return;
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
    glow.style.left = '0';
    glow.style.top = '0';
    var x = -400, y = -400, tx = -400, ty = -400;
    window.addEventListener('mousemove', function (e) {
      tx = e.clientX;
      ty = e.clientY;
    });
    (function loop() {
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      glow.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%, -50%)';
      requestAnimationFrame(loop);
    })();
  }

  /* ============ 开场加载动画 ============ */
  function initSplash() {
    var splash = document.getElementById('splash');
    if (!splash) return;
    var bar = splash.querySelector('.splash-bar span');
    if (bar) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { bar.style.width = '100%'; });
      });
    }
    var hide = function () { splash.classList.add('hide'); };
    window.addEventListener('load', function () { setTimeout(hide, 300); });
    setTimeout(hide, 2300);
  }

  /* ============ 动态壁纸轮播 ============ */
  function initWallpaper() {
    var items = document.querySelectorAll('.wallpaper-layer .wp-item');
    if (!items.length) return;
    var i = 0;
    items[0].classList.add('active');
    if (items.length > 1) {
      setInterval(function () {
        items[i].classList.remove('active');
        i = (i + 1) % items.length;
        items[i].classList.add('active');
      }, 6000);
    }
  }

  /* ============ 主题色切换 ============ */
  function closeHuePanel() {
    var panel = document.getElementById('hue-panel');
    if (panel) panel.classList.remove('active');
  }
  function initHue() {
    var dots = document.querySelectorAll('.hue-dot');
    var fab = document.getElementById('hue-fab');
    var panel = document.getElementById('hue-panel');
    if (!dots.length) return;
    var saved = null;
    try { saved = localStorage.getItem('hanabira-hue'); } catch (e) {}
    var hue = saved != null ? parseInt(saved, 10) : (CFG.accentHue || 330);
    function apply(h) {
      root.style.setProperty('--accent-h', h);
      dots.forEach(function (d) {
        d.classList.toggle('active', parseInt(d.getAttribute('data-hue'), 10) === h);
      });
    }
    apply(hue);
    if (fab) {
      fab.addEventListener('click', function () {
        var open = !panel.classList.contains('active');
        closeMusicPanel();
        panel.classList.toggle('active', open);
      });
    }
    dots.forEach(function (d) {
      d.addEventListener('click', function () {
        var h = parseInt(d.getAttribute('data-hue'), 10);
        try { localStorage.setItem('hanabira-hue', h); } catch (e) {}
        apply(h);
      });
    });
    document.addEventListener('click', function (e) {
      if (panel && panel.classList.contains('active') &&
          !e.target.closest('.hue-panel') && !e.target.closest('.hue-fab')) {
        panel.classList.remove('active');
      }
    });
  }

  /* ============ 音乐播放器 ============ */
  function closeMusicPanel() {
    var panel = document.getElementById('music-panel');
    if (panel) panel.classList.remove('active');
  }
  function initMusic() {
    var panel = document.getElementById('music-panel');
    if (!panel) return;
    var fab = document.getElementById('music-fab');
    var list = (CFG.music && CFG.music.list) ? CFG.music.list.filter(function (m) { return m && m.url; }) : [];
    if (!list.length) return;

    var audio = document.createElement('audio');
    audio.preload = 'metadata';
    var idx = 0;
    var titleEl = document.getElementById('mp-title');
    var artistEl = document.getElementById('mp-artist');
    var coverEl = document.getElementById('mp-cover');
    var barEl = document.getElementById('mp-bar');
    var curEl = document.getElementById('mp-cur');
    var durEl = document.getElementById('mp-dur');
    var playBtn = document.getElementById('mp-play');
    var listEl = document.getElementById('mp-list');

    function safePlay() {
      var p = audio.play();
      if (p && p.catch) p.catch(function () {});
    }
    function playIcon() {
      var use = playBtn.querySelector('svg use');
      if (use) use.setAttribute('href', audio.paused ? '#i-play' : '#i-pause');
    }
    function fmt(s) {
      if (isNaN(s) || !isFinite(s)) return '00:00';
      s = Math.floor(s);
      var m = Math.floor(s / 60);
      var ss = s % 60;
      return (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss;
    }
    function load(i, autoplay) {
      idx = (i + list.length) % list.length;
      var song = list[idx];
      audio.src = song.url;
      titleEl.textContent = song.name || ('曲目 ' + (idx + 1));
      artistEl.textContent = song.artist || '未知';
      coverEl.innerHTML = song.cover
        ? '<img src="' + song.cover + '" alt="">'
        : '<svg viewBox="0 0 24 24"><use href="#i-music"></use></svg>';
      var items = listEl.querySelectorAll('li');
      for (var k = 0; k < items.length; k++) items[k].classList.toggle('active', k === idx);
      if (autoplay) safePlay();
    }
    function toggle() {
      if (audio.paused) { safePlay(); } else { audio.pause(); }
    }

    list.forEach(function (song, i) {
      var li = document.createElement('li');
      li.textContent = song.name || ('曲目 ' + (i + 1));
      li.addEventListener('click', function () { load(i, true); });
      listEl.appendChild(li);
    });

    audio.addEventListener('timeupdate', function () {
      if (audio.duration) barEl.style.width = (audio.currentTime / audio.duration * 100) + '%';
      curEl.textContent = fmt(audio.currentTime);
    });
    audio.addEventListener('loadedmetadata', function () {
      durEl.textContent = fmt(audio.duration);
      curEl.textContent = '00:00';
    });
    audio.addEventListener('play', playIcon);
    audio.addEventListener('pause', playIcon);
    audio.addEventListener('ended', function () { load(idx + 1, true); });

    playBtn.addEventListener('click', toggle);
    document.getElementById('mp-prev').addEventListener('click', function () { load(idx - 1, true); });
    document.getElementById('mp-next').addEventListener('click', function () { load(idx + 1, true); });

    var prog = panel.querySelector('.mp-progress');
    prog.addEventListener('click', function (e) {
      if (!audio.duration) return;
      var r = prog.getBoundingClientRect();
      audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
    });

    fab.addEventListener('click', function () {
      var open = !panel.classList.contains('active');
      closeHuePanel();
      panel.classList.toggle('active', open);
    });

    load(0, !!(CFG.music && CFG.music.autoplay));
  }

  /* ============ 站内搜索 ============ */
  function initSearch() {
    var overlay = document.getElementById('search-overlay');
    if (!overlay) return;
    var input = document.getElementById('search-input');
    var results = document.getElementById('search-results');
    var data = null;
    var loading = false;

    function open() {
      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden', 'false');
      setTimeout(function () { input && input.focus(); }, 120);
    }
    function close() {
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
    }
    function load(cb) {
      if (data) return cb(data);
      if (loading) return;
      loading = true;
      fetch(CFG.root + 'search.json')
        .then(function (r) { return r.json(); })
        .then(function (j) { data = j; cb(data); })
        .catch(function () { data = []; cb(data); })
        .finally(function () { loading = false; });
    }
    function render(q) {
      q = (q || '').trim().toLowerCase();
      results.innerHTML = '';
      if (!q) {
        var empty = document.createElement('li');
        empty.className = 'search-empty';
        empty.textContent = '输入关键词开始搜索…';
        results.appendChild(empty);
        return;
      }
      if (!data || !data.length) {
        var none = document.createElement('li');
        none.className = 'search-empty';
        none.textContent = '暂无数据';
        results.appendChild(none);
        return;
      }
      var hits = data.filter(function (p) {
        var hay = (p.title + ' ' + (p.tags || []).join(' ') + ' ' + (p.categories || []).join(' ') + ' ' + p.content).toLowerCase();
        return hay.indexOf(q) !== -1;
      }).slice(0, 12);
      if (!hits.length) {
        var miss = document.createElement('li');
        miss.className = 'search-empty';
        miss.textContent = '没有找到相关内容～';
        results.appendChild(miss);
        return;
      }
      hits.forEach(function (p) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = CFG.root.replace(/\/?$/, '/') + String(p.path).replace(/^\//, '');
        var title = document.createElement('div');
        title.className = 'se-result-title';
        title.textContent = p.title;
        var info = document.createElement('div');
        info.className = 'se-result-info';
        info.textContent = p.date + (p.categories && p.categories.length ? ' · ' + p.categories.join(' / ') : '');
        var ex = document.createElement('div');
        ex.className = 'se-result-excerpt';
        ex.textContent = p.excerpt || '';
        a.appendChild(title);
        a.appendChild(info);
        a.appendChild(ex);
        li.appendChild(a);
        results.appendChild(li);
      });
    }

    document.addEventListener('click', function (e) {
      if (e.target.closest('.search-toggle')) { open(); return; }
      if (e.target.closest('#search-close') || e.target === overlay) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); open(); }
    });
    input.addEventListener('input', function () {
      load(function () { render(input.value); });
    });
  }

  /* ============ 图片灯箱 ============ */
  function initLightbox() {
    var lb = document.getElementById('lightbox');
    if (!lb) return;
    var img = document.getElementById('lightbox-img');
    function open(src) {
      img.src = src;
      lb.classList.add('active');
      lb.setAttribute('aria-hidden', 'false');
    }
    function close() {
      lb.classList.remove('active');
      lb.setAttribute('aria-hidden', 'true');
    }
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t.tagName === 'IMG' && (t.closest('.post-content') || t.closest('.album-item'))) {
        var src = t.getAttribute('src');
        if (src) open(src);
      } else if (e.target.closest('.lightbox-close') || e.target === lb) {
        close();
      }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ============ 相册筛选 ============ */
  function initAlbums() {
    var tabs = document.querySelectorAll('.album-tab');
    var items = document.querySelectorAll('.album-item');
    if (!tabs.length || !items.length) return;
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var g = tab.getAttribute('data-group');
        items.forEach(function (it) {
          var show = g === '*' || it.getAttribute('data-group') === g;
          it.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* ============ 初始化 ============ */
  initTheme();
  initSakura();
  initFirefly();
  initWinter();
  initSnow();
  initDanmaku();
  initClickEffect();
  initCursorGlow();
  initSplash();
  initWallpaper();
  initTypewriter();
  initHue();
  initMusic();
  initSearch();
  initLightbox();
  initAlbums();
})();