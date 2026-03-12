# Database Schema

## Provider
PostgreSQL 15 (Alpine)

## Models

### User
| Column    | Type     | Constraints        |
|-----------|----------|--------------------|
| id        | Int      | PK, autoincrement  |
| email     | String   | Unique             |
| password  | String   |                    |
| isAdmin   | Boolean  | Default: false     |
| createdAt | DateTime | Default: now()     |
| updatedAt | DateTime | @updatedAt         |

### Product
| Column        | Type     | Constraints        |
|---------------|----------|--------------------|
| id            | Int      | PK, autoincrement  |
| name          | String   | Unique             |
| description   | String   |                    |
| imageUrl      | String   |                    |
| price         | Decimal  |                    |
| stockQuantity | Int      |                    |
| createdAt     | DateTime | Default: now()     |
| updatedAt     | DateTime | @updatedAt         |

### CartItem
| Column    | Type | Constraints                    |
|-----------|------|--------------------------------|
| id        | Int  | PK, autoincrement              |
| userId    | Int  | FK → User                      |
| productId | Int  | FK → Product                   |
| quantity  | Int  |                                |
| @@unique([userId, productId])                    |

### Order
| Column            | Type        | Constraints       |
|-------------------|-------------|--------------------|
| id                | Int         | PK, autoincrement  |
| userId            | Int         | FK → User          |
| totalAmount       | Decimal     |                    |
| status            | OrderStatus | Default: Pending   |
| deliveryAddress   | String      |                    |
| deliveryLatitude  | Float?      |                    |
| deliveryLongitude | Float?      |                    |
| paymentId         | String?     |                    |
| createdAt         | DateTime    | Default: now()     |
| updatedAt         | DateTime    | @updatedAt         |

### OrderItem
| Column       | Type    | Constraints       |
|--------------|---------|-------------------|
| id           | Int     | PK, autoincrement |
| orderId      | Int     | FK → Order        |
| productId    | Int     | FK → Product      |
| quantity     | Int     |                   |
| priceAtOrder | Decimal |                   |

### OrderStatus Enum
Pending, Processing, OutForDelivery, Delivered

## Seed Data
- 1 admin user: admin@example.com (bcrypt hashed password)
- 7 sample electronics products
- Seeding is idempotent using Prisma upsert