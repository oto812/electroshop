# Architecture

## Overview

ElectroShop follows a modular monolith architecture with clear separation between frontend and backend, communicating via REST API and WebSockets.

## Backend (NestJS)

The backend is organized into feature modules, each encapsulating its own controllers, services, and DTOs.

**Modules:**
- **AuthModule** — JWT-based authentication with Passport. Handles registration, login, and token generation with 7-day expiry.
- **ProductsModule** — CRUD operations for electronics products. Public read access, admin-only write access.
- **CartModule** — Per-user shopping cart with guest cart merge support on login.
- **OrdersModule** — Order creation from cart with atomic stock decrement via Prisma transactions. Includes geocoding via Nominatim API.
- **GatewayModule** — Socket.IO WebSocket gateway for real-time order status updates, new order notifications, and ephemeral chat.
- **PrismaModule** — Global database access layer wrapping Prisma Client.

**Key Decisions:**
- Prisma over TypeORM for type-safe queries and schema-first migrations.
- Socket.IO rooms for scoped real-time updates (per-order chat, admin dashboard).
- Bcrypt for password hashing with salt rounds of 10.
- Global ValidationPipe with whitelist for automatic DTO validation.

## Frontend (React + Vite)

Single-page application with client-side routing.

**Key Patterns:**
- Context API for auth and cart state (AuthContext, CartContext).
- Guest cart persisted in localStorage, merged on login.
- Dual-mode cart: localStorage for guests, REST API for authenticated users.
- WebSocket connections created per-page (not singleton) to avoid stale connections.
- Polling fallback if WebSocket connection fails after 3 seconds.

## Infrastructure

- Docker Compose orchestrates three services: postgres, backend, frontend.
- Multi-stage Docker builds minimize image size.
- Nginx serves the frontend SPA with fallback routing.
- Named volume ensures database persistence across restarts.
- Backend entrypoint runs migrations and seeds before starting the server.