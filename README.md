# SU Attend (Production-Ready Attendance Monitoring Platform)

SU Attend is a deployable web attendance system that supports:

- Student attendance via **Student Number + OTP SMS verification**.
- Full student registry (name, program, intake year, student number, phone, academic email).
- Admin authentication and role-based access (`SUPER_ADMIN`, `ADMIN`, `LECTURER`).
- Dashboard analytics for daily check-ins and session timestamps.
- Student profile view + printable/downloadable virtual ID card.
- Attendance exports to **CSV** and **Excel (.xlsx)**.

## Technology Stack

- **Backend/UI:** Node.js, Express, EJS
- **Database/ORM:** PostgreSQL + Prisma
- **Authentication:** JWT (HTTP-only cookies)
- **SMS Integration:** Twilio API
- **Export:** `csv-stringify`, `exceljs`
- **Deployment:** Docker + Docker Compose

## Quick Start (Local)

1. Copy env file:
   ```bash
   cp .env.example .env
   ```
2. Start PostgreSQL (via Docker compose service if desired):
   ```bash
   docker compose up -d db
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Generate Prisma client and run migrations:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```
5. Seed initial admin and sample student:
   ```bash
   npm run prisma:seed
   ```
6. Start application:
   ```bash
   npm run dev
   ```

App endpoints:
- Student portal: `http://localhost:3000/`
- Admin login: `http://localhost:3000/admin/login`

## Production Deployment

1. Configure secrets in `.env` (especially `JWT_SECRET`, Twilio values).
2. Build and run:
   ```bash
   docker compose up --build -d
   ```
3. Ensure reverse proxy + TLS in front of app (Nginx/Caddy/Cloud LB).
4. Change seeded admin credentials immediately after first login.

## Core Environment Variables

- `DATABASE_URL` (required)
- `JWT_SECRET` (required)
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` (required for OTP SMS)
- `OTP_TTL_MINUTES` (default: 5)
- `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD`

## Security Notes

- OTP tokens are short-lived and single-use.
- Admin auth uses HTTP-only cookie JWT.
- Helmet enabled for secure headers.
- Passwords stored as bcrypt hashes.

## Suggested Next Production Enhancements

- Add rate limiting + brute-force protection on login/OTP routes.
- Add audit logs for admin actions.
- Add 2FA for administrators.
- Add image upload for student photo on ID card.
- Add SSO/LDAP integration for institution identity systems.
