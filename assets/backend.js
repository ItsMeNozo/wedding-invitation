/*
 * Kết nối Sổ lưu bút + Xác nhận tham dự với backend Google Apps Script.
 * Dán URL Web App (kết thúc bằng /exec) vào API_URL. Xem backend/README.md.
 * Khi API_URL để trống: trang vẫn chạy, lời chúc chỉ hiện tạm trên máy khách.
 */
(function () {
  var API_URL = 'https://script.google.com/macros/s/AKfycbwbDjX8tsMb-xN1NsRf-zr-sHdbZEQy376nH8L0ZrggRPa50q1XOmnFvUrhZHWZ03xx0w/exec';

  var GOLD = 'rgb(233, 206, 158)';
  var FIELD_CSS = 'border-color:' + GOLD + ';color:' + GOLD + ';background-color:rgba(233, 206, 158, 0.1);';
  var FIELD_CLS = 'w-full rounded-lg border px-4 py-3 text-sm focus:outline-none';
  // Mũi tên mặc định của <select> nhỏ, sát mép và mỗi trình duyệt một kiểu: thay bằng mũi tên vẽ sẵn
  var CHEVRON = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 ' +
    'stroke=%27%23e9ce9e%27 stroke-width=%272.2%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E';
  var SELECT_CSS = FIELD_CSS + 'appearance:none;-webkit-appearance:none;padding-right:40px;cursor:pointer;' +
    'background-image:url(\'' + CHEVRON + '\');background-repeat:no-repeat;background-position:right 14px center;background-size:16px 16px;';
  var SAMPLE_WISHES = [
    'Chúc hai bạn trăm năm hạnh phúc, viên mãn yêu thương.',
    'Chúc vợ chồng son mãi yêu thương, sớm có tin vui nhé!',
    'Trăm năm tình viên mãn – bạc đầu nghĩa phu thê.',
    'Chúc hai bạn về chung một nhà, cười nhiều hơn cãi, yêu nhiều hơn giận.',
    'Chúc gia đình nhỏ luôn ấm áp, bình an và ngập tràn tiếng cười.',
    'Chúc mừng hạnh phúc! Mong hai bạn luôn nắm tay nhau qua mọi thăng trầm.'
  ];

  function request(method, body) {
    var opts = method === 'GET'
      ? { method: 'GET' }
      // text/plain để tránh preflight CORS mà Apps Script không hỗ trợ
      : { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) };
    var url = method === 'GET' ? API_URL + '?action=wishes' : API_URL;
    // Google đôi khi trả về trang lỗi HTML thay vì JSON; coi như lỗi tạm thời
    return fetch(url, opts).then(function (r) { return r.json(); }).then(function (res) {
      if (!res.ok) { var err = new Error(res.error); err.rejected = res.error !== 'busy'; throw err; }
      return res;
    });
  }

  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key)) || null;
      localStorage.setItem(key, JSON.stringify(val));
    } catch (_) { return null; }
  }

  function uid() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  /*
   * Hàng chờ gửi: mỗi lần gửi được lưu vào localStorage trước, rồi gửi ngầm và tự thử lại
   * (kể cả khi khách tải lại trang sau). Server bỏ qua id trùng nên gửi lại không bị lặp dòng.
   * Nhờ vậy khách luôn thấy lời cảm ơn, không bao giờ thấy thông báo lỗi kỹ thuật.
   */
  var CACHE_KEY = 'wedding-wishes';
  var OUTBOX = 'wedding-outbox';
  var RETRY_DELAYS = [2000, 5000, 10000, 20000, 40000];
  var flushing = false;

  function enqueue(item) {
    item.id = uid();
    item.tries = 0;
    store(OUTBOX, (store(OUTBOX) || []).concat(item));
    flush();
    return item;
  }

  function dequeue(id) {
    store(OUTBOX, (store(OUTBOX) || []).filter(function (i) { return i.id !== id; }));
  }

  function flush() {
    if (!API_URL || flushing) return;
    var item = (store(OUTBOX) || [])[0];
    if (!item) return;
    flushing = true;
    var payload = {};
    for (var k in item) if (k !== 'tries') payload[k] = item[k];
    request('POST', payload)
      .then(function () { dequeue(item.id); flushing = false; flush(); })
      .catch(function (err) {
        flushing = false;
        // Server từ chối hẳn (dữ liệu không hợp lệ) thì bỏ; còn lại là lỗi tạm thời, thử lại sau
        if (err.rejected) { dequeue(item.id); flush(); return; }
        var box = store(OUTBOX) || [];
        box.forEach(function (i) { if (i.id === item.id) i.tries++; });
        store(OUTBOX, box);
        var delay = RETRY_DELAYS[Math.min(item.tries, RETRY_DELAYS.length - 1)];
        setTimeout(flush, delay);
      });
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function fmtTime(d) {
    d = new Date(d);
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + ' ' +
      pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function el(tag, cls, css, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (css) e.style.cssText = css;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ---------------- Sổ lưu bút ---------------- */
  function initGuestbook() {
    var section = document.querySelector('[data-landing-screenshot-id="invite-guestbook"]');
    if (!section) return;
    var form = section.querySelector('form');
    var list = form.nextElementSibling;
    var nameInput = form.querySelector('input');
    var msgInput = form.querySelector('textarea');
    var submit = form.querySelector('button[type="submit"]');
    var magic = form.querySelector('button[title="Tạo lời chúc bằng AI"]');
    var status = el('p', 'mt-3 text-xs text-center', 'color:' + GOLD + ';min-height:1em;');
    form.firstElementChild.appendChild(status);

    function card(w) {
      var c = el('div', 'rounded-xl border p-4 text-sm shadow', 'border-color:rgba(233, 206, 158, 0.4);background-color:rgba(255, 255, 255, 0.11);');
      var head = el('div', 'flex items-start justify-between');
      head.appendChild(el('span', 'font-semibold', 'color:' + GOLD + ';', w.name));
      head.appendChild(el('span', 'text-xs opacity-70', null, fmtTime(w.time)));
      c.appendChild(head);
      c.appendChild(el('p', 'mt-2 leading-relaxed', 'white-space:pre-line;', w.message));
      return c;
    }

    function render(wishes) {
      list.innerHTML = '';
      if (!wishes.length) {
        list.appendChild(el('p', 'text-center text-sm opacity-70', null, 'Hãy là người đầu tiên gửi lời chúc nhé!'));
        return;
      }
      wishes.forEach(function (w) { list.appendChild(card(w)); });
    }

    // Lời chúc khách vừa gửi nhưng server chưa nhận: luôn hiện ở đầu danh sách
    function withPending(wishes) {
      var have = {};
      wishes.forEach(function (w) { have[w.id] = true; });
      var pending = (store(OUTBOX) || []).filter(function (i) { return i.action === 'wish' && !have[i.id]; });
      return pending.reverse().concat(wishes);
    }

    if (API_URL) {
      // Bỏ lời chúc mẫu ngay; hiện bản lưu lần trước (nếu có) trong lúc chờ Apps Script
      var cached = store(CACHE_KEY);
      if (cached) render(withPending(cached));
      else { list.innerHTML = ''; list.appendChild(el('p', 'text-center text-sm opacity-70', null, 'Đang tải lời chúc...')); }
      var load = function (attempt) {
        request('GET')
          .then(function (res) { store(CACHE_KEY, res.wishes); render(withPending(res.wishes)); })
          // Tải lại ngầm; trong lúc đó vẫn để nguyên nội dung đang hiển thị
          .catch(function () { if (attempt < 4) setTimeout(function () { load(attempt + 1); }, 3000 * (attempt + 1)); });
      };
      load(0);
    }

    if (magic) magic.addEventListener('click', function () {
      var cur = msgInput.value, next;
      do { next = SAMPLE_WISHES[Math.floor(Math.random() * SAMPLE_WISHES.length)]; } while (next === cur && SAMPLE_WISHES.length > 1);
      msgInput.value = next;
      msgInput.focus();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = nameInput.value.trim(), message = msgInput.value.trim();
      if (!name || !message) { status.textContent = 'Bạn nhập giúp tên và lời chúc nhé.'; return; }

      var wish = API_URL
        ? enqueue({ action: 'wish', name: name, message: message, time: new Date().toISOString() })
        : { name: name, message: message, time: new Date() };
      var empty = list.querySelector('p.text-center');
      if (empty) empty.remove();
      list.insertBefore(card(wish), list.firstChild);
      list.scrollTop = 0;
      msgInput.value = '';
      status.textContent = 'Cảm ơn bạn đã gửi lời chúc! 💛';
    });
  }

  /* ---------------- Xác nhận tham dự ---------------- */
  function buildRsvpDialog() {
    var dlg = el('dialog', 'modal modal-bottom sm:modal-middle');
    dlg.innerHTML =
      '<div class="modal-box max-w-lg p-0 max-h-[90vh] overflow-y-auto" style="background-color: rgb(22, 38, 20);">' +
        '<div class="relative px-6 pt-6 pb-4 text-center" style="background-color: ' + GOLD + ';">' +
          '<button type="button" data-close class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3 text-white/80 hover:text-white hover:bg-white/20" aria-label="Đóng">✕</button>' +
          '<h2 class="uppercase font-normal text-[20px] md:text-[26px]" style="text-shadow: rgba(0,0,0,0.2) 1px 1px 2px; font-family: Baskerville, \'Times New Roman\', serif; letter-spacing: 0.05em; color: white;">Xác nhận tham dự</h2>' +
        '</div>' +
        '<form class="p-6 space-y-4 text-sm" style="color: ' + GOLD + ';">' +
          '<input name="name" placeholder="Tên của bạn*" required maxlength="100" class="' + FIELD_CLS + '" style="' + FIELD_CSS + '">' +
          '<input name="phone" type="tel" placeholder="Số điện thoại (không bắt buộc)" maxlength="20" class="' + FIELD_CLS + '" style="' + FIELD_CSS + '">' +
          '<input name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;">' +
          '<div class="flex gap-4">' +
            '<label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="attending" value="yes" checked> Mình sẽ đến</label>' +
            '<label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="attending" value="no"> Tiếc quá, không đến được</label>' +
          '</div>' +
          '<div class="flex gap-3" data-guests>' +
            '<label class="flex-1">Số người<select name="guests" class="mt-1 ' + FIELD_CLS + '" style="' + SELECT_CSS + '">' +
              [1, 2, 3, 4, 5].map(function (n) { return '<option value="' + n + '">' + n + '</option>'; }).join('') +
            '</select></label>' +
            '<label class="flex-1">Khách của<select name="side" class="mt-1 ' + FIELD_CLS + '" style="' + SELECT_CSS + '">' +
              '<option>Nhà trai</option><option>Nhà gái</option>' +
            '</select></label>' +
          '</div>' +
          '<textarea name="note" rows="3" maxlength="500" placeholder="Ghi chú (ăn chay, đi cùng trẻ nhỏ...)" class="' + FIELD_CLS + '" style="' + FIELD_CSS + 'resize:none;"></textarea>' +
          '<p data-status class="text-xs text-center" style="min-height:1em;"></p>' +
          '<div class="text-center"><button type="submit" class="rounded-full px-8 py-2 text-sm font-semibold transition-transform hover:scale-105 disabled:opacity-60" style="background-color: ' + GOLD + '; color: rgb(85, 63, 24); font-family: Baskerville, \'Times New Roman\', serif;">GỬI XÁC NHẬN</button></div>' +
        '</form>' +
      '</div>' +
      '<form method="dialog" class="modal-backdrop"><button>close</button></form>';
    // Màu chữ trong <option> cho dễ đọc trên nền tối
    Array.prototype.forEach.call(dlg.querySelectorAll('option'), function (o) { o.style.cssText = 'background:#162614;color:' + GOLD; });
    document.body.appendChild(dlg);
    return dlg;
  }

  function goToGiftBox() {
    var gift = document.querySelector('button[aria-label="Mở hộp mừng cưới"]');
    if (!gift) return;
    // Giữ yên trang tại đây, autoscroll chỉ chạy lại sau khi khách thao tác tiếp
    document.dispatchEvent(new Event('autoscroll:hold'));
    gift.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Ảnh lazy phía trên tải xong trong lúc cuộn làm trang dài ra: kiểm tra lại và chỉnh cho đúng
    // (dừng chỉnh nếu khách đã tự cuộn/chạm)
    var checks = 0, userMoved = false;
    function moved() { userMoved = true; }
    ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, moved, { passive: true, once: true });
    });
    (function recheck() {
      setTimeout(function () {
        if (userMoved) return;
        var r = gift.getBoundingClientRect();
        if (Math.abs(r.top + r.height / 2 - window.innerHeight / 2) > 40) {
          gift.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (++checks < 4) recheck();
      }, 700);
    })();
    // Nhịp sáng nhẹ để khách nhận ra hộp mừng cưới
    if (gift.animate) setTimeout(function () {
      gift.animate([
        { transform: 'scale(1)', filter: 'drop-shadow(0 0 0 rgba(233,206,158,0))' },
        { transform: 'scale(1.06)', filter: 'drop-shadow(0 0 18px rgba(233,206,158,0.7))' },
        { transform: 'scale(1)', filter: 'drop-shadow(0 0 0 rgba(233,206,158,0))' }
      ], { duration: 1400, iterations: 2, easing: 'ease-in-out' });
    }, 700);
  }

  function initRsvp() {
    var btn = document.querySelector('[data-landing-screenshot-id="invite-rsvp"] button');
    if (!btn) return;
    var dlg = null;

    btn.addEventListener('click', function () {
      if (!dlg) dlg = setup(buildRsvpDialog());
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    });

    function setup(dlg) {
      var form = dlg.querySelector('form:not([method])');
      var status = dlg.querySelector('[data-status]');
      var guestsRow = dlg.querySelector('[data-guests]');
      var submit = form.querySelector('button[type="submit"]');
      dlg.querySelector('[data-close]').addEventListener('click', function () { dlg.close(); });

      form.addEventListener('change', function () {
        guestsRow.style.display = form.attending.value === 'yes' ? '' : 'none';
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var data = {
          action: 'rsvp',
          name: form.name.value.trim(),
          phone: form.phone.value.trim(),
          attending: form.attending.value,
          guests: form.guests.value,
          side: form.side.value,
          note: form.note.value.trim()
        };
        if (!data.name) { status.textContent = 'Bạn cho tụi mình biết tên nhé.'; return; }
        if (form.website.value) data = null; // bot điền vào trường ẩn: bỏ qua nhưng vẫn cảm ơn như thường
        else if (API_URL) enqueue(data);

        status.textContent = form.attending.value === 'yes'
          ? 'Cảm ơn bạn! Hẹn gặp bạn tại tiệc cưới 💛'
          : 'Cảm ơn bạn đã báo, tụi mình rất tiếc vì không gặp được bạn 💛';
        var notComing = form.attending.value === 'no';
        submit.disabled = true;
        setTimeout(function () {
          dlg.close();
          form.reset();
          guestsRow.style.display = '';
          status.textContent = '';
          submit.disabled = false;
          // Không đến được: đưa khách tới thẳng Hộp mừng cưới thay vì chờ cuộn tới
          // Chờ trình duyệt trả focus về nút RSVP xong, nếu không lệnh cuộn sẽ bị hủy
          if (notComing) setTimeout(goToGiftBox, 150);
        }, notComing ? 2000 : 2500);
      });
      return dlg;
    }
  }

  function init() {
    initGuestbook();
    initRsvp();
    flush(); // gửi nốt những gì còn tồn từ lần mở trang trước
    window.addEventListener('online', flush);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
