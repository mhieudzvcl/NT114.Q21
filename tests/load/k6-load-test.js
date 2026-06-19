import http from "k6/http";
import { check, sleep } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

// KỊCH BẢN 1: LOAD TEST (Kiểm tra tải bình thường)
// Mục đích: Đo lường hiệu năng hệ thống dưới mức tải dự kiến (20 người dùng)
// Mong đợi: Hệ thống chạy trơn tru, không có lỗi, độ trễ thấp (< 500ms).
export const options = {
  stages: [
    { duration: "30s", target: 20 }, // Khởi động lên 20 users
    { duration: "1m", target: 20 },  // Duy trì 20 users
    { duration: "30s", target: 0 }   // Giảm dần về 0
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"], // Tỷ lệ lỗi phải < 1%
    http_req_duration: ["p(95)<500"] // 95% request nhanh hơn 500ms
  }
};

const BASE = __ENV.BASE_URL || "http://127.0.0.1:19090";
let token = "";

function auth() {
  http.post(`${BASE}/api/v1/auth/register`, JSON.stringify({ email: "admin@example.com", password: "12345678" }), { headers: { "Content-Type": "application/json" } });
  const login = http.post(`${BASE}/api/v1/auth/login`, JSON.stringify({ email: "admin@example.com", password: "12345678" }), { headers: { "Content-Type": "application/json" } });
  try {
    const body = login.json();
    token = body?.data?.data?.accessToken || body?.data?.accessToken || body?.accessToken || "";
  } catch (_) { token = ""; }
}

export default function () {
  if (!token) auth();
  const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };

  const products = http.get(`${BASE}/api/v1/products`, { headers });
  check(products, { "products ok": (r) => r.status < 500 });

  const order = http.post(`${BASE}/api/v1/orders`, JSON.stringify({ items: [{ productId: "demo", qty: 1 }] }), { headers });
  check(order, { "order ok": (r) => r.status < 500 });

  const notify = http.post(`${BASE}/api/v1/notifications`, JSON.stringify({ userId: "u_1", channel: "EMAIL", title: "k6", content: "load test" }), { headers });
  check(notify, { "notify ok": (r) => r.status < 500 });
  
  sleep(1);
}

export function handleSummary(data) {
  return {
    "k6_load_summary.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
