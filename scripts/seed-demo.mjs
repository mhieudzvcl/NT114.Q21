const baseUrl = process.env.BASE_URL || "http://localhost:8080";

async function req(path, method = "GET", body, token) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return res.json();
}

async function run() {
  const register = await req("/api/v1/auth/register", "POST", { email: "admin@example.com", password: "12345678" });
  console.log("register", register);
  const login = await req("/api/v1/auth/login", "POST", { email: "admin@example.com", password: "12345678" });
  const token = login?.data?.accessToken || login?.accessToken;
  console.log("login", login);
  if (!token) throw new Error("Missing access token");

  const product = await req(
    "/api/v1/products",
    "POST",
    { sku: "SKU-002", name: "Seed Product", description: "seeded", price: 200000, stock: 50, status: "ACTIVE" },
    token
  );
  console.log("product", product);

  const order = await req("/api/v1/orders", "POST", { items: [{ productId: "demo", qty: 1 }] }, token);
  console.log("order", order);

  const notification = await req(
    "/api/v1/notifications/test",
    "POST",
    { userId: "u_1", channel: "EMAIL", title: "seed", content: "seed notification" },
    token
  );
  console.log("notification", notification);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
