import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "60s", target: 30 },
    { duration: "30s", target: 0 }
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<800"]
  }
};

const BASE = __ENV.BASE_URL || "http://localhost:8080";
let token = "";

function auth() {
  http.post(`${BASE}/api/v1/auth/register`, JSON.stringify({
    email: "admin@example.com",
    password: "12345678"
  }), { headers: { "Content-Type": "application/json" } });

  const login = http.post(`${BASE}/api/v1/auth/login`, JSON.stringify({
    email: "admin@example.com",
    password: "12345678"
  }), { headers: { "Content-Type": "application/json" } });

  const body = login.json();
  token = body?.data?.accessToken || body?.accessToken || "";
}

export default function () {
  if (!token) auth();
  const headers = token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };

  const products = http.get(`${BASE}/api/v1/products`, { headers });
  check(products, { "products ok": (r) => r.status < 500 });

  const order = http.post(
    `${BASE}/api/v1/orders`,
    JSON.stringify({ items: [{ productId: "demo", qty: 1 }] }),
    { headers }
  );
  check(order, { "order ok": (r) => r.status < 500 });

  const notify = http.post(
    `${BASE}/api/v1/notifications/test`,
    JSON.stringify({ userId: "u_1", channel: "EMAIL", title: "k6", content: "load test" }),
    { headers }
  );
  check(notify, { "notify ok": (r) => r.status < 500 });
  sleep(1);
}
