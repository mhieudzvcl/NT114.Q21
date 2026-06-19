import http from "k6/http";
import { check, sleep } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

// KỊCH BẢN 3: SPIKE TEST (Tấn công chớp nhoáng / Flash Sale)
// Mục đích: Kiểm tra khả năng sinh tồn của hệ thống khi lượng user tăng đột biến cực nhanh.
// Mong đợi: Server có thể bị timeout vài giây, nhưng sau đó phải hồi phục chứ không được sập hoàn toàn.
export const options = {
  stages: [
    { duration: "10s", target: 100 }, // Bơm sốc lên 100 users chỉ trong 10 giây!
    { duration: "1m", target: 100 },  // Giữ tải sốc 1 phút
    { duration: "30s", target: 0 }    // Giảm đột ngột về 0
  ],
  thresholds: {
    http_req_failed: ["rate<0.15"], // Chấp nhận lỗi lên tới 15% (vì bị sốc tải)
    http_req_duration: ["p(95)<3000"] // 95% request dưới 3 giây
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

  const notify = http.post(`${BASE}/api/v1/notifications`, JSON.stringify({ userId: "u_1", channel: "EMAIL", title: "k6", content: "spike test" }), { headers });
  check(notify, { "notify ok": (r) => r.status < 500 });
  
  sleep(1);
}

export function handleSummary(data) {
  return {
    "k6_spike_summary.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
