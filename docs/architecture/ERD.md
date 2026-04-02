# ERD (MongoDB logical model)

## 1) auth_db
### users_auth
- _id (ObjectId)
- email (string, unique)
- passwordHash (string)
- status (ACTIVE | DISABLED)
- roleIds (ObjectId[])
- createdAt, updatedAt

### roles
- _id
- code (ADMIN | USER | DEVOPS)
- permissions (string[])

### refresh_tokens
- _id
- userId
- tokenHash
- expiresAt
- revokedAt

## 2) user_db
### profiles
- _id
- userId (from auth-service)
- fullName
- phone
- avatarUrl
- department
- createdAt, updatedAt

## 3) product_db
### products
- _id
- sku (unique)
- name
- description
- price
- stock
- status (ACTIVE | INACTIVE)
- createdAt, updatedAt

## 4) order_db
### orders
- _id
- orderNo (unique)
- userId
- items [{ productId, sku, qty, unitPrice }]
- totalAmount
- status (PENDING | PAID | SHIPPED | CANCELLED)
- createdAt, updatedAt

### payments
- _id
- orderId
- method (COD | CARD)
- amount
- status (INIT | SUCCESS | FAIL)
- transactionRef
- createdAt

## 5) notification_db
### notifications
- _id
- userId
- channel (EMAIL | WEBHOOK | INAPP)
- title
- content
- status (QUEUED | SENT | FAILED)
- createdAt, sentAt

## Service relationships
- auth-service owns identity and roles.
- user-service extends user profile.
- order-service references user and product snapshots.
- notification-service listens to order/auth events.
