# HƯỚNG DẪN BÁO CÁO TIẾN ĐỘ THÁNG 4 - ĐỒ ÁN CHUYÊN NGÀNH
*(Tài liệu này được AI tổng hợp tự động từ cuộc trò chuyện để nhóm dễ dàng xem lại)*

## 1. Nội dung báo cáo tiến độ (Dựa trên timeline đề cương)
**Công việc đã hoàn thành (Tháng 3):**
*   **Nghiên cứu tài liệu:** DevSecOps, mô hình GitOps, CI/CD, Kubernetes, EKS, VPC, IAM.
*   **Phân tích & Lựa chọn kiến trúc:** Chốt kiến trúc Microservices (Frontend ReactJS/Vite, Backend NestJS, Database MongoDB).

**Tiến độ triển khai thực tế (Cập nhật Tháng 4):**
*   **Xây dựng thành công hệ thống Backend với 6 Microservices cốt lõi:**
    1.  **API Gateway (Port 8080):** Điểm giao tiếp tập trung phân giải request, chịu trách nhiệm định tuyến, authentication.
    2.  **Auth Service (Port 8081):** Quản lý bảo mật, xử lý đăng ký, đăng nhập và cấp phát JWT token. *(Không chứa API lấy profile).*
    3.  **User Service (Port 8082):** Quản lý thông tin hồ sơ người dùng (chứa API Get Profile `/users/me`).
    4.  **Product Service (Port 8083):** Quản lý danh mục, thông tin sản phẩm.
    5.  **Order Service (Port 8084):** Xử lý nghiệp vụ đặt hàng.
    6.  **Notification Service (Port 8085):** Quản lý việc gửi thông báo bất đồng bộ (email/tin nhắn).
*   **Hoàn thiện Containerization:** Đã viết `Dockerfile` cho toàn bộ các services và chạy đồng bộ qua `docker-compose`.
*   **Xây dựng giao diện Frontend Web:** Phát triển giao diện Web (Cartify) giao tiếp với API Gateway.
*   **Kiểm thử API cơ bản:** Sử dụng Postman để kiểm tra luồng API.

---

## 2. Hướng dẫn Test API bằng Postman (Lý do chọn Postman thay vì Swagger)
**Tại sao dùng Postman cho báo cáo CI/CD?**
*   Swagger sinh ra để **tài liệu hóa (Document)**. 
*   Postman sinh ra để **kiểm thử (Testing) và Tự động hóa (Automation)**.
*   Postman cho phép xuất Collection để chạy tự động trong pipeline CI/CD bằng CLI `Newman` (tiền đề cho việc tự động hoá ở các tháng tiếp theo).

**Chi tiết Test (Gọi qua cổng của API Gateway: 8080)**

1.  **API: Đăng ký tài khoản (Register)**
    *   **Method:** `POST`
    *   **URL:** `http://localhost:8080/api/v1/auth/register`
    *   **Body (raw -> JSON):**
        ```json
        { "email": "huynhminhhieu@gmail.com", "password": "Password123!" }
        ```

2.  **API: Đăng nhập (Login)**
    *   **Method:** `POST`
    *   **URL:** `http://localhost:8080/api/v1/auth/login`
    *   **Body (raw -> JSON):**
        ```json
        { "email": "huynhminhhieu@gmail.com", "password": "Password123!" }
        ```
    *   *Lưu ý:* Cần lấy chuỗi Token JWT trả về ở bước này để dùng cho các luồng đòi hỏi bảo mật (như Get Profile).

3.  **API: Lấy thông tin cá nhân (Get Profile)**
    *   **Method:** `GET`
    *   **URL:** `http://localhost:8080/api/v1/users/me`
    *   **Header/Auth:** Chuyển qua tab **Authorization** -> Chọn loại **Bearer Token** -> Dán JWT Token vừa lấy được ở bước Login vào.

---

## 3. Tổng hợp link Swagger UI (Cổng API Document)
*   **API Gateway (Tổng hợp tất cả):** http://localhost:8080/docs
*   **Auth Service:** http://localhost:8081/docs *(Không có Get Profile do tách biệt mối quan tâm)*
*   **User Service:** http://localhost:8082/docs *(Chứa Get Profile)*
*   **Product Service:** http://localhost:8083/docs
*   **Order Service:** http://localhost:8084/docs
*   **Notification Service:** http://localhost:8085/docs

---

## 4. Hướng dẫn xem Database MongoDB & Metrics hệ thống
**A. Xem Database trực quan**
*   Tải phần mềm: **MongoDB Compass**
*   Chuỗi kết nối (URI): `mongodb://localhost:27017`
*   Tại đây có thể thấy toàn bộ các cơ sở dữ liệu độc lập của từng service: `auth_db`, `user_db`, `product_db`,... Mở collection `users` trong `auth_db` để đếm số lượng tài khoản đăng ký.

**B. Quan sát Metrics hệ thống (Observability)**
*   Dữ liệu thô (Raw Prometheus Metrics) được xuất trực tiếp tại các cổng `/metrics`. Ví dụ: `http://localhost:8080/metrics`.
*   *(Giai đoạn mở rộng Tháng 5)*: Nhóm sẽ cài đặt thêm **Prometheus** (để tự động cào dữ liệu từ các link `/metrics` này) và **Grafana** (để vẽ thành các biểu đồ Dashboard quản trị cực đẹp như đếm Tổng Request, Thời gian phản hồi API, Số lượng Order trong ngày).
