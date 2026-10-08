/*
 * Bản offline: thay cho React/Next.js của trang gốc.
 * Mô phỏng lại theo đúng thông số trong code gốc (template green-v1):
 *  1. Mở phong bì (con dấu vỡ, rồng phượng bay, pháo hoa 囍, phong bì bay lên)
 *  2. Parallax background khi cuộn
 *  3. Slideshow ảnh 3D (tự chạy, mũi tên, chấm, vuốt, xem ảnh lớn)
 */
(function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- 1. Phong bì ---------------- */
  function initEnvelope() {
    var env = document.querySelector('[data-landing-screenshot-id="invite-envelope"]');
    var demo = document.querySelector('.demo-page');
    if (!env || !demo) return;
    var content = demo.children[1];
    var audio = demo.querySelector('audio');
    var wrap = Array.prototype.find.call(env.children, function (c) { return c.style.zIndex === '10'; });
    var inner = wrap && wrap.firstElementChild;
    var seal = env.querySelector('[style*="seal-pulse"]');
    var btn = env.querySelector('a');
    var JSX = 'jsx-353cb38c53e4a74a';
    var colors = ['#FFC107', '#CD853F', '#e9ce9e', '#FFD700'];
    var state = 'idle';

    function finish() {
      env.style.display = 'none';
      document.dispatchEvent(new Event('invite:opened'));
    }

    function burst() {
      var layer = document.createElement('div');
      layer.className = JSX + ' absolute inset-0 pointer-events-none';
      layer.style.zIndex = '100';
      for (var a = 0; a < 32; a++) {
        var t = 2 * Math.PI * a / 32 + (Math.random() - 0.5) * 0.4;
        var r = 25 + 60 * Math.random();
        var x = 50 + Math.cos(t) * r, y = 50 + Math.sin(t) * r;
        var color = colors[Math.floor(Math.random() * colors.length)];
        var p = document.createElement('div');
        p.className = JSX + ' absolute left-1/2 top-1/2';
        p.textContent = '囍';
        p.style.cssText = 'color:' + color + ';font-size:' + (10 + 16 * Math.random()) + 'px;' +
          'text-shadow:0 0 10px ' + color + ';--dx:' + (x - 50) * 5 + 'px;--dy:' + (y - 50) * 5 + 'px;' +
          '--rot-start:' + (Math.random() - 0.5) * 30 + 'deg;--rot-end:' + (Math.random() - 0.5) * 360 + 'deg;' +
          'animation:particle-burst 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) ' + 0.15 * Math.random() + 's forwards';
        layer.appendChild(p);
      }
      env.appendChild(layer);
    }

    function open(e) {
      if (e) e.preventDefault();
      if (state !== 'idle') return;
      state = 'opening';
      if (audio) { try { if (audio.readyState < 2) audio.load(); var pr = audio.play(); if (pr && pr.catch) pr.catch(function () {}); } catch (_) {} }

      // Hiện nội dung thiệp phía sau phong bì
      if (content) content.style.display = '';
      window.scrollTo(0, 0);

      // Con dấu vỡ + vòng sáng
      if (seal) {
        seal.style.animation = 'seal-break 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards';
        var ring = document.createElement('div');
        ring.className = JSX + ' absolute left-1/2 rounded-full pointer-events-none';
        ring.style.cssText = 'top:50px;width:56px;height:56px;transform:translate(-50%, -50%);border:3px solid #e9ce9e;z-index:29;animation:seal-ring 0.6s ease-out forwards';
        seal.parentNode.insertBefore(ring, seal.nextSibling);
      }

      // Rồng & phượng bay về phía trước
      if (inner) {
        ['rong.webp', 'phuong.webp'].forEach(function (name) {
          var img = Array.prototype.find.call(inner.querySelectorAll('img'), function (i) { return (i.getAttribute('src') || '').indexOf(name) >= 0; });
          if (!img) return;
          var holder = document.createElement('div');
          holder.className = img.className.replace(/\bpointer-events-none\b/, '') + ' pointer-events-none';
          var fly = document.createElement('img');
          fly.src = img.src;
          fly.alt = '';
          fly.className = JSX + ' pointer-events-none block h-auto max-h-full w-full object-contain';
          fly.style.cssText = '--fly-scale-x:1;animation:dragon-fly-forward 1.2s ease-in forwards';
          holder.appendChild(fly);
          inner.appendChild(holder);
        });
      }

      setTimeout(function () {
        burst();
        state = 'away';
        if (wrap) wrap.style.animation = 'envelope-away 0.8s ease-in forwards';
      }, 500);
      setTimeout(function () {
        env.style.transition = 'opacity .4s ease';
        env.style.opacity = '0';
        setTimeout(finish, 400);
      }, 1300);
    }

    if (btn) btn.addEventListener('click', open);
  }

  /* ---------------- 2. Parallax background ---------------- */
  function initParallax() {
    var demo = document.querySelector('.demo-page');
    if (!demo) return;
    var layers = Array.prototype.slice.call(demo.querySelectorAll('[style*="bg-main.webp"]'))
      .filter(function (el) { return el.style.willChange === 'transform'; });
    if (layers.length < 2) return;
    var top = layers[0], bottom = layers[1];

    // Lớp thứ 3 chỉ có trên mobile (xoay 180°, chạy ngược chiều)
    var extra = bottom.cloneNode(false);
    extra.style.bottom = '-450px';
    extra.style.left = '35%';
    bottom.parentNode.insertBefore(extra, bottom.nextSibling);

    var items = [];
    function layout() {
      var desktop = window.innerWidth >= 768;
      top.style.top = desktop ? '700px' : '500px';
      bottom.style.bottom = desktop ? '-200px' : '1500px';
      extra.style.display = desktop ? 'none' : '';
      items = [
        { el: top, speed: 0.3, tpl: 'translate(-50%, {y})' },
        { el: bottom, speed: desktop ? 0.1 : 0.15, tpl: 'translate(-50%, {y}) scaleY(-1)' }
      ];
      if (!desktop) items.push({ el: extra, speed: -0.15, tpl: 'translate(-50%, {y}) rotate(180deg)' });
      update();
    }
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY;
      items.forEach(function (it) { it.el.style.transform = it.tpl.replace('{y}', y * it.speed + 'px'); });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', layout, { passive: true });
    layout();
  }

  /* ---------------- 3. Slideshow 3D ---------------- */
  function initCarousel() {
    var stage = document.querySelector('.demo-page [style*="perspective: 1000px"]');
    if (!stage) return;
    var slides = Array.prototype.slice.call(stage.children);
    var n = slides.length;
    if (n < 2) return;
    var root = stage.parentElement;                 // khung h-[340px] (vuốt)
    var gallery = root.parentElement;               // bao cả chấm (hover)
    var prevBtn = root.querySelector('[aria-label="Ảnh trước"]');
    var nextBtn = root.querySelector('[aria-label="Ảnh sau"]');
    var dots = Array.prototype.slice.call(gallery.querySelectorAll('[aria-label^="Đến ảnh"]'));
    var cur = 0, visible = false, hovered = false, held = false, holdTimer = null, timer = null;

    function rel(i) { var d = i - cur; return d > n / 2 ? d - n : d < -n / 2 ? d + n : d; }

    function render() {
      slides.forEach(function (s, i) {
        var l = rel(i), o = Math.abs(l);
        var scale = Math.max(0.7, 1 - 0.15 * o), op = Math.max(0.3, 1 - 0.25 * o);
        s.style.transform = 'translateX(' + 60 * l + '%) translateZ(' + -(150 * o) + 'px) rotateY(' + 45 * l + 'deg) scale(' + scale + ')';
        s.style.opacity = op;
        s.style.zIndex = 100 - o;
        s.classList.toggle('ring-2', l === 0);
        s.classList.toggle('ring-white/30', l === 0);
      });
      dots.forEach(function (d, i) {
        d.className = 'rounded-full transition-all duration-300 ' +
          (i === cur ? 'w-6 h-2 bg-current opacity-70' : 'w-2 h-2 bg-current opacity-25 hover:opacity-40');
      });
    }
    function go(i) { cur = (i + n) % n; render(); }
    function next() { go(cur + 1); }
    function prev() { go(cur - 1); }

    // Sau khi người dùng tương tác: tạm dừng tự chạy 6 giây
    function hold() {
      held = true; schedule();
      clearTimeout(holdTimer);
      holdTimer = setTimeout(function () { held = false; schedule(); }, 6000);
    }
    function schedule() {
      clearInterval(timer); timer = null;
      if (reduceMotion || !visible || hovered || held) return;
      timer = setInterval(next, 1400);
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { hold(); prev(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { hold(); next(); });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); hold(); }); });
    slides.forEach(function (s, i) {
      s.addEventListener('click', function () {
        if (rel(i) === 0) openLightbox(i); else { go(i); hold(); }
      });
    });
    // Chỉ dừng khi khách thật sự rê chuột trên slideshow. Bỏ qua:
    //  - chạm trên điện thoại (sinh mouseenter nhưng không bao giờ có mouseleave -> dừng mãi)
    //  - trang tự cuộn khiến slideshow lướt qua dưới con trỏ đứng yên (movement = 0)
    gallery.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || (!e.movementX && !e.movementY) || hovered) return;
      hovered = true; schedule();
    });
    gallery.addEventListener('pointerleave', function () {
      if (!hovered) return;
      hovered = false; schedule();
    });

    var touch = null;
    root.addEventListener('touchstart', function (e) { touch = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (!touch) return;
      var dx = e.changedTouches[0].clientX - touch.x, dy = Math.abs(e.changedTouches[0].clientY - touch.y);
      touch = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > dy) { dx < 0 ? next() : prev(); hold(); }
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; schedule(); },
        { threshold: 0, rootMargin: '300px 0px' }).observe(gallery);
    } else { visible = true; }

    /* Xem ảnh lớn */
    var lb = null, lbImg = null, lbIdx = 0;
    function srcOf(i) { var img = slides[i].querySelector('img'); return img ? img.src : ''; }
    function showLb(i) { lbIdx = (i + n) % n; lbImg.src = srcOf(lbIdx); }
    function closeLb() { if (lb) { lb.style.display = 'none'; document.body.style.overflow = ''; } }
    function openLightbox(i) {
      if (!lb) {
        lb = document.createElement('div');
        lb.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;';
        var btnCss = 'position:absolute;background:rgba(255,255,255,.12);color:#fff;border:0;border-radius:9999px;width:44px;height:44px;font-size:24px;line-height:44px;cursor:pointer;';
        lb.innerHTML =
          '<img style="max-width:92vw;max-height:88vh;object-fit:contain;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.5)">' +
          '<button aria-label="Đóng" style="' + btnCss + 'top:16px;right:16px;">&times;</button>' +
          '<button aria-label="Ảnh trước" style="' + btnCss + 'left:16px;top:50%;transform:translateY(-50%);">&#8249;</button>' +
          '<button aria-label="Ảnh sau" style="' + btnCss + 'right:16px;top:50%;transform:translateY(-50%);">&#8250;</button>';
        lbImg = lb.querySelector('img');
        var bs = lb.querySelectorAll('button');
        bs[0].onclick = closeLb;
        bs[1].onclick = function (e) { e.stopPropagation(); showLb(lbIdx - 1); };
        bs[2].onclick = function (e) { e.stopPropagation(); showLb(lbIdx + 1); };
        lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
        var lt = null;
        lb.addEventListener('touchstart', function (e) { lt = e.touches[0].clientX; }, { passive: true });
        lb.addEventListener('touchend', function (e) {
          if (lt === null) return;
          var dx = e.changedTouches[0].clientX - lt; lt = null;
          if (Math.abs(dx) > 50) showLb(lbIdx + (dx < 0 ? 1 : -1));
        });
        document.addEventListener('keydown', function (e) {
          if (!lb || lb.style.display === 'none') return;
          if (e.key === 'Escape') closeLb();
          else if (e.key === 'ArrowLeft') showLb(lbIdx - 1);
          else if (e.key === 'ArrowRight') showLb(lbIdx + 1);
        });
        document.body.appendChild(lb);
      }
      showLb(i);
      lb.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }

    render();
    schedule();
  }

  /* ---------------- 4. Gift Box (mã QR mừng cưới) ---------------- */
  function initGiftBox() {
    var btn = document.querySelector('button[aria-label="Mở hộp mừng cưới"]');
    if (!btn) return;
    var dlg = btn.parentElement.querySelector('dialog');
    if (!dlg) return;

    btn.addEventListener('click', function () {
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    });
    // Nút X ở góc tiêu đề
    var closeBtn = dlg.querySelector('.modal-box .modal-close');
    if (closeBtn) closeBtn.addEventListener('click', function () { dlg.close(); });

    // Nút "Lưu mã QR": tải ảnh QR tương ứng về máy
    Array.prototype.forEach.call(dlg.querySelectorAll('button'), function (b) {
      if (b.textContent.trim() !== 'Lưu mã QR') return;
      b.addEventListener('click', function () {
        var card = b.parentElement;
        var img = card.querySelector('img');
        if (!img) return;
        var title = (card.querySelector('h3') || {}).textContent || 'qr';
        var a = document.createElement('a');
        a.href = img.src;
        a.download = 'QR - ' + title.trim() + '.png';
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
    });
  }

  /* ---------------- 5. Tự động cuộn ----------------
   * Bắt đầu sau khi mở phong bì. Khách cuộn/chạm/click/gõ phím thì dừng ngay;
   * để yên IDLE_MS thì tự cuộn tiếp. Không cuộn khi đang mở hộp thoại, xem ảnh lớn
   * hoặc đang nhập lời chúc.
   */
  function initAutoScroll() {
    if (reduceMotion) return;
    var SPEED = 40;        // px/giây: đủ chậm để đọc kịp chữ
    var START_DELAY = 1500; // chờ hiệu ứng mở phong bì xong
    var IDLE_MS = 8000;     // 8 giây không thao tác thì cuộn lại
    var running = false, raf = null, idleTimer = null, last = 0, pos = 0;

    function blocked() {
      var a = document.activeElement;
      return document.body.style.overflow === 'hidden' ||
        document.querySelector('dialog[open]') ||
        (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT'));
    }
    function atBottom() {
      return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    }

    function step(t) {
      if (!running) return;
      if (blocked()) { stop(); schedule(); return; }
      if (atBottom()) { stop(); return; }
      // Cộng dồn phần lẻ: mỗi khung hình chỉ dịch < 1px
      pos += SPEED * Math.min(t - last, 100) / 1000;
      last = t;
      if (Math.abs(pos - window.scrollY) > 2) pos = window.scrollY; // trang tự nhảy (vd. đổi kích thước)
      window.scrollTo({ top: pos, behavior: 'instant' });
      raf = requestAnimationFrame(step);
    }

    function start() {
      if (running || atBottom()) return;
      if (blocked()) { schedule(); return; }
      running = true;
      pos = window.scrollY;
      raf = requestAnimationFrame(function (t) { last = t; raf = requestAnimationFrame(step); });
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    }
    function schedule() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(start, IDLE_MS);
    }
    function onUser() { stop(); schedule(); }

    // Chỉ nghe thao tác thật của khách, không nghe 'scroll' (vì chính autoscroll cũng phát ra)
    ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, onUser, { passive: true });
    });

    // Trang chủ động đưa khách tới một mục (vd. Hộp mừng cưới): dừng hẳn,
    // chỉ hẹn giờ chạy lại khi khách thao tác tiếp
    document.addEventListener('autoscroll:hold', function () {
      stop();
      clearTimeout(idleTimer);
    });

    document.addEventListener('invite:opened', function () {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(start, START_DELAY);
    });
  }

  /* ---------------- 6. Điều khiển nhạc (âm lượng, tắt/bật) ---------------- */
  function initMusicControl() {
    var audio = document.querySelector('.demo-page audio');
    if (!audio) return;
    var GOLD = '#e9ce9e', DARK = '#162614';
    var KEY = 'wedding-volume';
    var volume = 0.6;
    try { var saved = parseFloat(localStorage.getItem(KEY)); if (saved >= 0 && saved <= 1) volume = saved; } catch (_) {}
    var gain = null;

    // iOS bỏ qua audio.volume (luôn = 1); khi đó chỉnh âm lượng qua Web Audio GainNode
    function applyVolume() {
      if (gain) { gain.gain.value = volume; return; }
      audio.volume = volume;
      if (Math.abs(audio.volume - volume) > 0.01 && (window.AudioContext || window.webkitAudioContext)) {
        try {
          var ctx = new (window.AudioContext || window.webkitAudioContext)();
          gain = ctx.createGain();
          ctx.createMediaElementSource(audio).connect(gain);
          gain.connect(ctx.destination);
          gain.gain.value = volume;
          var resume = function () { if (ctx.state === 'suspended') ctx.resume(); };
          resume();
          audio.addEventListener('play', resume);
        } catch (_) { gain = null; }
      }
    }

    var ICON_ON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>';
    var ICON_OFF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/></svg>';

    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:50;display:none;align-items:center;gap:8px;' +
      'flex-direction:row-reverse;font-family:Baskerville,"Times New Roman",serif;';
    wrap.innerHTML =
      '<button type="button" aria-label="Âm lượng nhạc" aria-expanded="false" style="height:44px;padding:0 14px;gap:6px;border-radius:9999px;border:1px solid ' + GOLD + ';' +
        'background:rgba(22,38,20,.85);color:' + GOLD + ';display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;white-space:nowrap;' +
        'box-shadow:0 4px 14px rgba(0,0,0,.35);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);"></button>' +
      '<div data-panel style="display:none;align-items:center;gap:10px;padding:8px 14px;border-radius:9999px;border:1px solid rgba(233,206,158,.4);' +
        'background:rgba(22,38,20,.9);color:' + GOLD + ';box-shadow:0 4px 14px rgba(0,0,0,.35);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);">' +
        '<button type="button" data-toggle style="border:0;background:none;color:' + GOLD + ';font-size:14px;cursor:pointer;white-space:nowrap;padding:0;"></button>' +
        '<input type="range" min="0" max="100" step="1" aria-label="Âm lượng" style="width:110px;accent-color:' + GOLD + ';cursor:pointer;">' +
      '</div>';
    document.body.appendChild(wrap);
    var btn = wrap.firstChild, panel = wrap.querySelector('[data-panel]');
    var toggle = wrap.querySelector('[data-toggle]'), slider = wrap.querySelector('input');
    slider.value = Math.round(volume * 100);

    function render() {
      var silent = audio.paused || volume === 0;
      // Kèm chữ "Nhạc" để người lớn tuổi biết nút này để làm gì
      btn.innerHTML = (silent ? ICON_OFF : ICON_ON) + '<span>Nhạc</span>';
      toggle.textContent = audio.paused ? 'Bật nhạc' : 'Tắt nhạc';
    }
    function setOpen(open) {
      panel.style.display = open ? 'flex' : 'none';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(panel.style.display === 'none');
    });
    toggle.addEventListener('click', function () {
      applyVolume();
      if (audio.paused) { var p = audio.play(); if (p && p.catch) p.catch(function () {}); }
      else audio.pause();
    });
    slider.addEventListener('input', function () {
      volume = slider.value / 100;
      applyVolume();
      // Kéo âm lượng lên khi nhạc đang tắt thì bật nhạc luôn
      if (volume > 0 && audio.paused) { var p = audio.play(); if (p && p.catch) p.catch(function () {}); }
      try { localStorage.setItem(KEY, String(volume)); } catch (_) {}
      render();
    });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () { setOpen(false); });
    audio.addEventListener('play', render);
    audio.addEventListener('pause', render);

    // Đặt âm lượng đã lưu ngay khi khách bấm mở thiệp: cần đúng lúc có thao tác
    // của khách thì iOS mới cho tạo AudioContext
    var envBtn = document.querySelector('[data-landing-screenshot-id="invite-envelope"] a');
    if (envBtn) envBtn.addEventListener('click', applyVolume);
    audio.volume = volume;
    render();
    document.addEventListener('invite:opened', function () { wrap.style.display = 'flex'; });
  }

  function init() {
    initEnvelope();
    initParallax();
    initCarousel();
    initGiftBox();
    initAutoScroll();
    initMusicControl();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
