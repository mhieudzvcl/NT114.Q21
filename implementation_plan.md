# Xây dựng Giao diện Web Bán hàng Hiện đại (E-commerce UI)

Mục tiêu là lột xác hoàn toàn file `main.jsx` từ một danh sách link đơn giản trở thành một **trang E-commerce hiện đại, lung linh, mượt mà** với phong cách thiết kế cao cấp (Premium UI).

## ⚠️ Thông tin cần bạn phê duyệt (User Review Required)

> [!CAUTION]  
> **Vấn đề CORS:** Khi giao diện Frontend (cổng 3000) gọi đồ trực tiếp xuống API Gateway (cổng 8080) bằng trình duyệt, có khả năng cao sẽ bị lỗi chặn tên miền phụ (CORS Error) do API Gateway của bạn hiện tại chưa được Config mở CORS.
> **Bạn muốn tôi làm theo cách nào?**
> 1. Gọi thẳng vào API Gateway luôn. (Nếu bị lỗi CORS thì tôi sẽ vòng qua bên Backend sửa lốt cái API Gateway bật CORS lên).
> 2. Tạm thời dùng Dữ liệu giả (Mock Data) trên giao diện Web trước để cảm nhận cái độ "Đẹp" và "Mượt" của nó, đẹp rồi tính chuyện ghép API sau.

> [!NOTE] 
> **Phong cách thiết kế:** Tôi dự định thiết kế theo trào lưu thiết kế **Dark Mode Glassmorphism** (Giao diện tối pha kính mờ sang trọng, Gradient sinh động kết hợp các hiệu ứng di chuột (hover) nảy vi ngàm mượt mà). Bạn đồng ý với phong cách ngầu và rực rỡ này chứ?

## 📝 Chi tiết thay đổi (Proposed Changes)

Tuân thủ nghiêm ngặt việc không dùng TailwindCSS, tôi sẽ tự tay quy hoạch lại hệ thống CSS thuần 100% nhưng đạt chuẩn thiết kế Pixel-perfect.

### Frontend Web (`apps/frontend-web`)

#### [MODIFY] `index.html`(file:///c:/HK2_2025-2026/%C4%90%E1%BB%93%20%C3%A1n%20chuy%C3%AAn%20ng%C3%A0nh/Project/apps/frontend-web/index.html)
- Tích hợp font chữ hiện đại **Outfit** và **Inter** từ Google Fonts.
- Update lại thẻ meta viewport chuẩn thiết bị di động.

#### [NEW] `src/index.css`(file:///c:/HK2_2025-2026/%C4%90%E1%BB%93%20%C3%A1n%20chuy%C3%AAn%20ng%C3%A0nh/Project/apps/frontend-web/src/index.css)
- Khai báo hệ thống biến số CSS (CSS Custom Properties) cho Dark Theme.
- Khởi tạo thư viện class tiện ích (Glass effect classes: `glass-panel`, `glass-card`).
- Khai báo các Keyframes animation mượt mà: `fade-in-up`, `glow-pulse`.
- Thiết lập hệ thống Grid layout đáp ứng (Responsive).

#### [MODIFY] `src/main.jsx`(file:///c:/HK2_2025-2026/%C4%90%E1%BB%93%20%C3%A1n%20chuy%C3%AAn%20ng%C3%A0nh/Project/apps/frontend-web/src/main.jsx)
Viết lại toàn bộ cấu trúc React chia thành các section chuyên biệt, bao quanh bởi `React.StrictMode`:
- **Navbar:** Thanh điều hướng trên cùng kèm Logo phát sáng và Nút Giỏ Hàng/Login động.
- **Hero Section:** Banner khổ lớn với hiệu ứng Gradient Text chuyển động và nút Call-to-action (CTA) bắt mắt.
- **Product Grid:** Danh sách các Card (Thẻ) chứa sản phẩm bán.
  - Các Thẻ Sản Phẩm (`ProductCard`) sẽ có hiệu ứng Floating (nổi lên khi chỉ chuột vào), viền bóng tối lập thể, hình ảnh đại diện Placeholder tuyệt đẹp được sinh ngẫu nhiên từ thư viện hình khối bắt mắt, kèm nút "Thêm vào giỏ hàng".
- **Footer:** Chân trang đơn giản mang phong cách Minimalist.

## 🔎 Kế hoạch Kiểm tra (Verification Plan)

### Kiểm tra tĩnh (Manual Verification)
- Sau khi được bạn duyệt, tôi sẽ viết file, chạy thử và chụp **Screenshots / Quay Video Screen Flow** của cái giao diện Web E-commerce mới để gửi cho bạn xem trực tiếp màu sắc, hiệu ứng di chuột và viền kính bo tròn.
- Nhờ bạn truy cập vào cửa sổ trình duyệt `http://localhost:3000` xem nó có vừa mắt không để chỉnh lại các Micro Animations hoặc Gradient màu sắc.
