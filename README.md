# SU Attend (Production-Ready Attendance Monitor)

SU Attend is a deployable web-based attendance platform with:
- Student check-in using **student number**.
- OTP verification via SMS (Twilio integration).
- Student registry: name, program, intake year, student number, phone, and academic email.
- Admin authentication and role-based access (`SUPER_ADMIN`, `LECTURER`, `STAFF`).
- Dashboard analytics and recent login logs.
- Student virtual ID card preview + print.
- Attendance export to CSV and Excel.

## Tech stack
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- JWT authentication
- Twilio SMS API
- Vanilla HTML/CSS/JS frontend
- Docker + Docker Compose deployment

## 1) Configure environment

```bash
cp .env.example .env
```

Update `.env`:
- `DATABASE_URL`
- `JWT_SECRET`
- Twilio credentials (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`)

## 2) Install and run locally

```bash
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Open:
- `http://localhost:4000` (student check-in)
- `http://localhost:4000/admin.html` (admin dashboard)

## 3) Default seeded admin
Seed values are controlled in `.env`:
- `SEED_SUPER_ADMIN_USERNAME`
- `SEED_SUPER_ADMIN_PASSWORD`
- `SEED_SUPER_ADMIN_NAME`

## 4) Deployment with Docker

```bash
docker compose up --build -d
```

The container starts with migrations (`prisma migrate deploy`) and serves the production app.

## API overview
- `POST /api/auth/admin/login`
- `POST /api/students/check-in/request-otp`
- `POST /api/students/check-in/verify-otp`
- `GET /api/admin/dashboard/summary`
- `GET /api/admin/attendance/export.csv`
- `GET /api/admin/attendance/export.xlsx`
- `GET /api/students/:id/card`
- `POST /api/admin/accounts` (super admin only)

## Security and operations notes
- OTPs are hashed in the database.
- OTP expiration and length are configurable.
- Pending OTPs are invalidated when a new OTP is requested.
- Admin endpoints are protected with JWT + role guards.
- In production, configure reverse proxy TLS, secure secrets store, and database backups.
