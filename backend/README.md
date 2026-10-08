# Backend cho Sổ lưu bút & Xác nhận tham dự

GitHub Pages chỉ chạy được trang tĩnh, nên dữ liệu được lưu vào **Google Sheet** thông qua **Google Apps Script**. Cách này miễn phí và không cần server riêng. Lời chúc và danh sách khách xác nhận sẽ nằm ngay trong Sheet của bạn.

## Cài đặt (khoảng 5 phút)

1. Tạo một Google Sheet mới, đặt tên tùy ý (ví dụ: `Thiệp cưới Minh & Ngọc`).
2. Trong Sheet, chọn **Tiện ích mở rộng → Apps Script**.
3. Xóa code mặc định, dán toàn bộ nội dung file [`Code.gs`](Code.gs) vào rồi bấm **Lưu**.
4. Bấm **Triển khai → Tùy chọn triển khai mới**:
   - Loại: **Ứng dụng web**
   - Thực thi dưới dạng: **Tôi**
   - Người có quyền truy cập: **Bất kỳ ai**
5. Bấm **Triển khai**, cấp quyền cho tài khoản Google, rồi sao chép **URL ứng dụng web** (có dạng `https://script.google.com/macros/s/.../exec`).
6. Mở [`assets/backend.js`](../assets/backend.js) và dán URL đó vào:
   ```js
   var API_URL = 'https://script.google.com/macros/s/.../exec';
   ```
7. Commit rồi push lên GitHub. Trang sẽ tự gọi backend.

Hai tab `LoiChuc` và `XacNhan` sẽ được tạo tự động khi có dữ liệu đầu tiên.

## Quản lý

- **Ẩn lời chúc không phù hợp:** trong tab `LoiChuc`, đổi cột `Hiển thị` thành `FALSE`.
- **Sửa code `Code.gs`:** sau khi sửa, vào **Triển khai → Quản lý triển khai → Chỉnh sửa → Phiên bản mới**. Làm vậy thì URL được giữ nguyên.
- **Đếm số khách:** tính tổng cột `Số người` trong tab `XacNhan`.
