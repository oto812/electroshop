# ElectroShop MVP

A full-stack e-commerce application for electronics with real-time order tracking, admin dashboard, and live chat.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Shadcn/ui, Socket.io-client, Leaflet
- **Backend:** NestJS, TypeScript, Prisma ORM, Passport JWT, Socket.io
- **Database:** PostgreSQL 15
- **Infrastructure:** Docker, Docker Compose, Nginx

## Getting Started
```bash
docker compose up --build
```

## Ports

| Service  | URL                      |
|----------|--------------------------|
| Frontend | http://localhost:5173    |
| Backend  | http://localhost:3000    |
| Postgres | localhost:5432           |

## Default Admin Account

- Email: admin@example.com
- Password: admin123

## Scripts (Backend)
```bash
cd backend
npm run migrate        # Run Prisma migrations
npm run seed           # Seed database
npm run test           # Run tests
```

## Health Check
```bash
curl http://localhost:3000/health
```