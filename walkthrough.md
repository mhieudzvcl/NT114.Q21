# 🗺️ Bản Đồ Hệ Thống Microservices

Dưới đây là danh sách toàn bộ các Service đang chạy ngầm trong máy tính của bạn thông qua Docker. Mọi Service đều có trang Swagger giao diện độc lập để bạn debug riêng biệt khi cần thiết:

| Tên Dịch Vụ | Chức Năng | API / Swagger Docs (Bấm vào để xem) | Mức Độ |
| :--- | :--- | :--- | :--- |
| **API Gateway** | Cửa ngõ trung tâm kết nối toàn bộ 5 dịch vụ bên dưới. Xử lý bảo vệ bằng chứng nhận (Token). | [http://localhost:8080/docs](http://localhost:8080/docs) | 🟢 Public |
| **Auth Service** | Quản lý Đăng ký / Đăng nhập / Cấp Token. | [http://localhost:8081/docs](http://localhost:8081/docs) | 🔴 Nội bộ |
| **User Service** | Lưu trữ thông tin cá nhân của khách hàng. | [http://localhost:8082/docs](http://localhost:8082/docs) | 🔴 Nội bộ |
| **Product Service** | Quản lý mặt hàng, kho hàng. | [http://localhost:8083/docs](http://localhost:8083/docs) | 🔴 Nội bộ |
| **Order Service** | Quản lý Đơn hàng, giỏ hàng, doanh số. | [http://localhost:8084/docs](http://localhost:8084/docs) | 🔴 Nội bộ |
| **Notification Service** | Bắn thông báo (Push/Email) | [http://localhost:8085/docs](http://localhost:8085/docs) | 🔴 Nội bộ |
| **Frontend Web** | Giao diện đồ hoạ cho khách mua hàng thật (React/Vue). | [http://localhost:3000](http://localhost:3000) | 🟢 Public |

> [!IMPORTANT]
> **Quy Tắc Test:** Bạn **CHỈ CẦN DÙNG DUY NHẤT API GATEWAY (8080)** để chơi thử toàn bộ hệ thống! Đừng mở các Service Nội bộ (8081-8085) trừ khi muốn sửa lỗi tĩnh từng module một.

---

# 🚀 Kịch Bản Test Tổng Thể (Luồng Mua Hàng)

Hãy mở [http://localhost:8080/docs](http://localhost:8080/docs) và làm lần lượt các bước này để xem toàn bộ 5 ổ đĩa nghiệp vụ chạy xuyên suốt ra sao.

### Bước 1: Mở cửa vào nhà (Auth Service)
1. Tới mục `POST /auth/register` (Đăng ký).
   - Điền Email & Password tự chọn rồi **Execute**.
2. Tới mục `POST /auth/login` (Đăng nhập).
   - Điền Email & Password vừa nãy.
   - Trả về `accessToken` dài lượt thượt -> **Copy đoạn mã này.**
3. Kéo lên trên cùng trang Web, bấm vào Nút Khóa Xanh **🔓 Authorize** -> Gõ chữ `Bearer ` rồi dán token vào (VD: `Bearer eyJh...`) -> Bấm Authorize.
*(Giờ hệ thống đã nhận diện bạn là khách VIP hợp lệ)*

### Bước 2: Xem hồ sơ tài khoản (User Service)
1. Tới mục `GET /users/me`.
2. Bấm **Execute**.
   - Nó sẽ chạy thẳng xuyên không qua 8080 -> 8082 trả về thông tin tên tuổi mã số cá nhân `userId` của bạn siêu tốc.

### Bước 3: Đi chợ lựa đồ (Product Service)
1. Có 2 API: `POST /products` (dành cho Admin tạo hàng) và `GET /products` (Xem danh sách đồ).
2. Tới mục `GET /products` -> Bấm **Execute**.
   - Nhìn vào mớ Hàng hóa hiện ra, bốc đại 1 cái **Copy lấy cái giá trị `_id` của mặt hàng đó** (VD: *"65f2123...abc"*).

### Bước 4: Chốt đơn mua xách về (Order Service)
1. Tới mục `POST /orders` (Tạo đơn hàng).
2. Sửa lại ô Request Body cho nó khớp với kiện hàng mà bạn chốt mua:
   ```json
   {
     "items": [
       {
         "productId": "dán_cái_id_sản_phẩm_ở_bước_3_vào_đây",
         "qty": 5
       }
     ]
   }
   ```
3. Bấm **Execute**. Hệ thống 8084 sẽ lập tức in ra một Tờ Hóa Đơn Trạng thái `PENDING` thành công chuẩn mã 201!. Tiếp tục **Copy lại `_id` của tờ đơn hàng** này (VD: *"65f...999"*).

### Bước 5: Thanh toán và Push Tin nhắn (Notification Service)
1. Tới mục `PATCH /orders/:id/status` (Đổi trạng thái bill).
   - Gắn `_id` đơn hàng của Bước 4 vào ô `id`.
   - Để nguyên JSON `"status": "PAID"`. Bấm **Execute** -> Hệ thống đánh dấu đơn đã trả tiền.
2. Tới mục `POST /notifications/test` để báo cho khách hàng:
   - Thay `userId` bằng cái ID của bạn từ Bước 2.
   - Đổi tiêu đề `"Cám ơn bạn đã ủng hộ!"` -> Bấm **Execute**. (Dịch vụ 8085 sẽ ghi nhận đã bắn SMS/Email thành công).

🎉 Vậy là bạn vừa cầm lái một hệ thống Microservices khổng lồ hoàn thiện tự động trôi từ cổng nhà tới tận khâu giao hàng mà không sập 1 nhịp nào!
