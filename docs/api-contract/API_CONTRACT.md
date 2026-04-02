# API Contract for 6 Services

## Common
- Base path: `/api/v1`
- Auth: `Authorization: Bearer <JWT>`
- Response envelope:
```json
{ "success": true, "data": {}, "error": null, "meta": {} }
```

## 1) api-gateway
- `POST /api/v1/auth/login` -> forward to auth-service
- `POST /api/v1/auth/register` -> forward to auth-service
- `GET /api/v1/users/me` -> user-service
- `GET /api/v1/products` -> product-service
- `POST /api/v1/orders` -> order-service
- `POST /api/v1/notifications/test` -> notification-service

## 2) auth-service
- `POST /auth/register`
  - body: `{ "email": "a@b.com", "password": "12345678" }`
  - returns: `{ "userId": "...", "email": "a@b.com" }`
- `POST /auth/login`
  - body: `{ "email": "a@b.com", "password": "12345678" }`
  - returns: `{ "accessToken": "...", "refreshToken": "..." }`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /health`

## 3) user-service
- `GET /users/:id`
- `GET /users/me`
- `PATCH /users/:id`
  - body: `{ "fullName": "...", "phone": "...", "avatarUrl": "..." }`
- `GET /health`

## 4) product-service
- `GET /products?search=&page=1&limit=20`
- `POST /products` (ADMIN)
- `GET /products/:id`
- `PATCH /products/:id` (ADMIN)
- `DELETE /products/:id` (ADMIN, soft delete)
- `GET /health`

## 5) order-service
- `POST /orders`
  - body: `{ "items": [{ "productId": "...", "qty": 2 }], "paymentMethod": "COD" }`
- `GET /orders/:id`
- `GET /orders?userId=...`
- `PATCH /orders/:id/status` (ADMIN/OPS)
- `GET /health`

## 6) notification-service
- `POST /notifications`
  - body: `{ "userId":"...", "channel":"EMAIL", "title":"...", "content":"..." }`
- `GET /notifications?userId=...`
- `POST /notifications/retry/:id`
- `GET /health`

## Error model
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid payload"
  }
}
```
