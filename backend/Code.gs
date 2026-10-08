/**
 * Backend nhẹ cho thiệp cưới: Google Apps Script + Google Sheet.
 * Hướng dẫn cài đặt: xem backend/README.md
 *
 *  GET  ?action=wishes          -> danh sách lời chúc (mới nhất trước)
 *  POST {action:"wish", id, name, message}
 *  POST {action:"rsvp", id, name, phone, attending, guests, side, note}
 *
 *  "id" do trình duyệt tạo cho mỗi lần gửi: trình duyệt có thể gửi lại nhiều lần
 *  khi Google phản hồi lỗi, server bỏ qua các lần trùng id nên Sheet không bị lặp dòng.
 */

var SHEET_WISHES = 'LoiChuc';
var SHEET_RSVP = 'XacNhan';
var MAX_WISHES = 200;

function doGet(e) {
  var action = (e.parameter && e.parameter.action) || 'wishes';
  if (action === 'wishes') return json({ ok: true, wishes: listWishes() });
  return json({ ok: false, error: 'unknown action' });
}

function doPost(e) {
  var data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: 'bad json' }); }

  // Honeypot chống bot: trường ẩn "website" phải để trống
  if (data.website) return json({ ok: true });

  var lock = LockService.getScriptLock();
  // Không dùng waitLock: hết giờ chờ nó ném lỗi và Google trả về trang HTML thay vì JSON
  if (!lock.tryLock(20000)) return json({ ok: false, error: 'busy' });
  try {
    var cache = CacheService.getScriptCache();
    var key = data.id ? 'sent:' + String(data.id).slice(0, 64) : null;
    if (key && cache.get(key)) return json({ ok: true, duplicate: true });

    var res = data.action === 'wish' ? addWish(data)
      : data.action === 'rsvp' ? addRsvp(data)
      : { ok: false, error: 'unknown action' };
    if (res.ok && key) cache.put(key, '1', 21600); // nhớ 6 giờ
    return json(res);
  } finally {
    lock.releaseLock();
  }
}

function addWish(d) {
  var name = clean(d.name, 100), message = clean(d.message, 1000);
  if (!name || !message) return { ok: false, error: 'Vui lòng nhập tên và lời chúc' };
  var now = new Date();
  // Cột "Hiển thị": đổi thành FALSE trong Sheet để ẩn lời chúc không phù hợp
  sheet(SHEET_WISHES, ['Thời gian', 'Tên', 'Lời chúc', 'Hiển thị', 'Mã'])
    .appendRow([now, name, message, true, clean(d.id, 64)]);
  return { ok: true };
}

function addRsvp(d) {
  var name = clean(d.name, 100);
  if (!name) return { ok: false, error: 'Vui lòng nhập tên' };
  var attending = d.attending === 'yes' ? 'Có' : 'Không';
  var guests = Math.max(0, Math.min(10, parseInt(d.guests, 10) || 0));
  sheet(SHEET_RSVP, ['Thời gian', 'Tên', 'Số điện thoại', 'Tham dự', 'Số người', 'Khách của', 'Ghi chú', 'Mã'])
    .appendRow([new Date(), name, clean(d.phone, 20), attending, attending === 'Có' ? guests : 0,
      clean(d.side, 20), clean(d.note, 500), clean(d.id, 64)]);
  return { ok: true };
}

function listWishes() {
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEET_WISHES);
  if (!sh || sh.getLastRow() < 2) return [];
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues();
  var out = [];
  for (var i = rows.length - 1; i >= 0 && out.length < MAX_WISHES; i--) {
    var r = rows[i];
    if (r[3] === false || String(r[3]).toUpperCase() === 'FALSE') continue;
    out.push({ id: String(r[4]), time: new Date(r[0]).toISOString(), name: String(r[1]), message: String(r[2]) });
  }
  return out;
}

function sheet(name, header) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(header);
    sh.setFrozenRows(1);
  }
  return sh;
}

// Chặn công thức (=, +, -, @) để tránh formula injection khi mở Sheet
function clean(v, max) {
  var s = String(v == null ? '' : v).trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
