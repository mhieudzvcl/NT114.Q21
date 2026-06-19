import http from "k6/http";
import { check, sleep } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

// KỊCH BẢN 2: STRESS TEST (Ép tải & Kiểm tra HPA)
// Mục đích: Bơm tải cao và giữ lâu (5 phút) để xem HPA có tự động đẻ thêm Pod không.
// Mong đợi: HPA kích hoạt mượt mà, scale từ 2 lên 5 pod, hệ thống không bị sập.
export const options = {
  stages: [
    { duration: "1m", target: 50 }, // Bơm dần lên 50 users (cao)
    { duration: "3m", target: 50 }, // Giữ tải 50 users trong 3 phút để đợi K8s gom số liệu CPU
    { duration: "1m", target: 0 }   // Rút quân
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"], // Chấp nhận lỗi tối đa 5% khi bị ép tải
    http_req_duration: ["p(95)<1000"] // 95% request nhanh hơn 1 giây (do tải cao)
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

  const notify = http.post(`${BASE}/api/v1/notifications`, JSON.stringify({ userId: "u_1", channel: "EMAIL", title: "k6", content: "stress test" }), { headers });
  check(notify, { "notify ok": (r) => r.status < 500 });
  
  sleep(1);
}

export function handleSummary(data) {
  return {
    "k6_stress_summary.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
