# 🕌 Donation Management System

A full-stack web application for managing donations, khidmat (service) records, and organizational operations — built for **Khanqah-style Islamic organizations** in Pakistan. Features real-time WhatsApp notifications, PDF report generation, role-based access control, and a complete audit trail.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [WhatsApp Integration](#whatsapp-integration)
- [PDF Reports](#pdf-reports)
- [Role & Access Control](#role--access-control)
- [Audit Logging](#audit-logging)

---

## Overview

This system allows admins and operators to:

- Record and manage **donations** with full donor details, payment methods, and category tagging
- Manage **Khidmat Records** — service entries tracking whether a service was completed, partial, or just recorded
- Send **WhatsApp notifications** to donors/recipients based on record status using Meta Cloud API templates
- Generate **PDF reports** (full reports, per-category reports, and individual receipts)
- Maintain a complete **audit log** of every action across the system
- Manage **users** (Admins + Operators) with scoped data access

---

## Features

### 🤝 Donations
- Create, update, soft-delete and restore donations
- Donor search and phone-based lookup with autocomplete
- Email receipt sending and resending via configured mail provider
- WhatsApp confirmation on donation creation
- Category tagging with color-coded labels and icons
- Filters by date range, purpose, payment method, category, and amount

### 🕌 Khidmat Records
- Record service entries against a person's name, phone, address, amount, and category
- Three statuses: **Completed**, **Partial**, **Record Only** — each triggers a different WhatsApp template
- Manual WhatsApp send button per record from the UI
- Inline status update directly in the table (no modal required)
- Soft-delete with optional reason and admin-only restore
- Per-record receipt PDF download

### 📊 Analytics & Reports
- Dashboard with live metrics (today, monthly, total amounts)
- Donations by purpose/category breakdown
- Top donors leaderboard
- PDF export: full donation report, per-category report, analytics report, khidmat report, and individual receipts
- All reports support active filter passthrough

### 🔔 WhatsApp Notifications (Meta Cloud API)
- Donation confirmation on creation
- Khidmat notifications: three separate approved templates per status
- Delivery status tracking (Sent → Delivered → Read → Failed)
- Webhook endpoint for incoming status updates from Meta
- Per-record WhatsApp status visible in UI with sent indicator

### 🔐 Auth & Access Control
- JWT-based authentication with Bearer token
- Two roles: **Admin** (full access) and **Operator** (scoped to own records)
- Password reset flow with time-limited token and email link
- Rate limiting on login endpoint (5 attempts / 15 min)
- Active/inactive user toggling by Admin

### 📝 Audit Logs
- Every create, update, delete, restore, login, email, and WhatsApp action is logged
- Stores: action type, user, role, entity type + ID, description, IP address, user agent, metadata
- Filterable and paginated audit log viewer in the admin panel

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js |
| Database | PostgreSQL |
| ORM | Prisma v7 (`@prisma/adapter-pg`) |
| Auth | JWT (`jsonwebtoken`) |
| Validation | `express-validator` |
| PDF Generation | PDFKit |
| WhatsApp | Meta Cloud API (WhatsApp Business) |
| Security | Helmet, CORS, express-rate-limit |
| Logging | Morgan |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React (Vite) |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| HTTP Client | Axios (shared instance with interceptors) |
| State Management | React Context API |
| Routing | React Router v6 |
| PDF Trigger | Blob download via Axios `responseType: 'blob'` |

---

## Project Structure

```
root/
├── backend/
│   ├── config/
│   │   ├── index.js               # Env config aggregator
│   │   └── prisma.js              # PrismaClient singleton
│   ├── features/
│   │   ├── auth/                  # Login, password reset
│   │   ├── donations/             # Donation CRUD + repository
│   │   ├── admin/                 # User management
│   │   ├── reports/               # PDF report controllers
│   │   │   ├── pdfGenerator.js    # Donation PDF engine (PDFKit)
│   │   │   └── reports.controller.js
│   │   ├── audit/                 # Audit log viewer
│   │   ├── whatsapp/              # WhatsApp test routes
│   │   └── khidmatRecord/         # Khidmat feature (full module)
│   │       ├── khidmat.service.js
│   │       ├── khidmat.controller.js
│   │       ├── khidmat.routes.js
│   │       ├── khidmat.validator.js
│   │       ├── khidmatPdfGenerator.js
│   │       └── khidmatReport.controller.js
│   ├── middlewares/
│   │   ├── auth.js                # JWT + role guards
│   │   └── validation.js          # Input sanitization
│   ├── routes/
│   │   └── webhook.routes.js      # Meta webhook handler
│   ├── utils/
│   │   ├── auditLogger.js         # createAuditLog + getAuditLogs
│   │   └── recordNotification.js  # WhatsApp sender for KhidmatRecord
│   ├── prisma/
│   │   └── schema.prisma          # Full database schema
│   └── app.js                     # Express app entry point
│
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── api.js             # Axios instance + interceptors
│   │   │   ├── donationService.js # Donation API calls
│   │   │   └── khidmat.service.js # Khidmat API calls
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── DonationContext.jsx
│   │   │   └── KhidmatContext.jsx
│   │   ├── components/
│   │   │   ├── Layout/            # Sidebar, Header, ProtectedRoute
│   │   │   └── khidmat/
│   │   │       ├── KhidmatTable.jsx
│   │   │       ├── KhidmatForm.jsx
│   │   │       └── KhidmatFilter.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Donations.jsx
│   │   │   ├── Khidmat.jsx
│   │   │   ├── Categories.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── AuditLogs.jsx
│   │   │   ├── Operators.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── DeletedDonations.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   └── ResetSuccess.jsx
│   │   └── App.jsx
│   └── index.html
│
└── README.md
```

---

## Database Schema

### Models

| Model | Purpose |
|---|---|
| `User` | Admins and Operators with role-based access |
| `Donation` | Core donation records with full donor info and WhatsApp tracking |
| `DonationCategory` | Reusable categories shared across Donations and Khidmat |
| `KhidmatRecord` | Service records with status, amount, and WhatsApp tracking |
| `AuditLog` | Immutable action log across the entire system |

### Enums

```prisma
enum Role          { ADMIN | OPERATOR }
enum PaymentMethod { CASH | CARD | BANK_TRANSFER | UPI | CHEQUE }
enum KhidmatStatus { COMPLETED | PARTIAL | RECORD_ONLY }
```

### Key relationships

```
User ──< Donation        (operator created)
User ──< KhidmatRecord   (operator created)
DonationCategory ──< Donation
DonationCategory ──< KhidmatRecord
User ──< AuditLog
```

> Soft-delete is implemented on both `Donation` and `KhidmatRecord` via `isDeleted`, `deletedAt`, `deletedBy`, and `deletionReason` fields. Hard deletes are never performed on these models.

---

## API Reference

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login, returns JWT |
| POST | `/api/auth/forgot-password` | Public | Send reset email |
| POST | `/api/auth/reset-password` | Public | Reset with token |
| GET | `/api/auth/me` | Auth | Current user profile |

### Donations
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/donations` | Auth | List (paginated, filtered) |
| POST | `/api/donations` | Auth | Create donation |
| PUT | `/api/donations/:id` | Auth | Update donation |
| DELETE | `/api/donations/:id` | Auth | Soft-delete |
| POST | `/api/donations/:id/restore` | Admin | Restore deleted |
| POST | `/api/donations/:id/send-email` | Auth | Send receipt email |

### Khidmat Records
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/khidmat` | Auth | List (paginated, filtered) |
| POST | `/api/khidmat` | Auth | Create record |
| GET | `/api/khidmat/:id` | Auth | Get single record |
| PUT | `/api/khidmat/:id` | Auth | Update record |
| DELETE | `/api/khidmat/:id` | Auth | Soft-delete |
| POST | `/api/khidmat/:id/restore` | Admin | Restore deleted |
| POST | `/api/khidmat/:id/whatsapp` | Auth | Send WhatsApp notification |
| GET | `/api/khidmat/stats` | Admin | Overview statistics |
| GET | `/api/khidmat/reports/full` | Auth | Full PDF report |
| GET | `/api/khidmat/reports/category` | Auth | Per-category PDF |
| GET | `/api/khidmat/reports/receipt/:id` | Auth | Single receipt PDF |

### Categories
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/admin/categories` | Auth | All categories (paginated) |
| GET | `/api/admin/categories/active` | Auth | Active categories only |
| POST | `/api/admin/categories` | Admin | Create category |
| PUT | `/api/admin/categories/:id` | Admin | Update category |
| DELETE | `/api/admin/categories/:id` | Admin | Delete (if no donations) |
| PATCH | `/api/admin/categories/:id/toggle` | Admin | Toggle active status |

### Reports
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/reports/donations` | Auth | Full donation PDF |
| GET | `/api/reports/category` | Auth | Per-category PDF |
| GET | `/api/reports/analytics` | Auth | Analytics PDF |

### Webhooks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/webhook/whatsapp` | Meta webhook verification |
| POST | `/webhook/whatsapp` | Incoming delivery status updates |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- PostgreSQL ≥ 14
- A Meta Business account with a verified WhatsApp Business App (for WhatsApp features)

### 1. Clone the repository

```bash
git clone https://github.com/your-org/donation-management-system.git
cd donation-management-system
```

### 2. Backend setup

```bash
cd backend
npm install

# Copy and fill in environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start the server
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install

cp .env.example .env   # set VITE_API_URL

npm run dev
```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:3001` by default.

### 4. Seed an admin user

```bash
cd backend
node scripts/seed-admin.js
```

---

## Environment Variables

### Backend — `.env`

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/donation_db

# Auth
JWT_SECRET=your_jwt_secret_here

# App
PORT=3001
NODE_ENV=development
ORG_NAME="Donation Management Khanqah"

# CORS (comma-separated origins)
CORS_ORIGIN=http://localhost:5173

# Rate limiting
RATE_LIMIT_WINDOW=15        # minutes
RATE_LIMIT_MAX=100          # requests per window

# WhatsApp (Meta Cloud API)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token

# Email (configure per your provider)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_smtp_password
EMAIL_FROM="Khanqah <noreply@example.com>"
```

### Frontend — `.env`

```env
VITE_API_URL=http://localhost:3001/api
```

---

## WhatsApp Integration

This system uses the **Meta WhatsApp Cloud API** to send templated messages.

### Templates required

You must create and get the following templates approved in your **Meta Business Manager** before WhatsApp notifications will work:

| Template Name | Used For | Variables |
|---|---|---|
| `khidmat_completed` | Khidmat — Completed status | `{{1}}` name, `{{2}}` category, `{{3}}` amount |
| `khidmat_partial` | Khidmat — Partial status | `{{1}}` name, `{{2}}` category, `{{3}}` amount |
| `khidmat_record` | Khidmat — Record Only status | `{{1}}` name, `{{2}}` category |

> If a template is not yet approved or the name doesn't match, the system catches the Meta API error and displays `"WhatsApp template not defined"` in the UI rather than a generic error.

### Webhook setup

Set your Meta App webhook URL to:

```
https://yourdomain.com/webhook/whatsapp
```

With verify token matching `WHATSAPP_VERIFY_TOKEN` in your `.env`. The webhook receives delivery status updates (`sent`, `delivered`, `read`, `failed`) and updates the corresponding record in the database automatically.

---

## PDF Reports

PDF generation is handled server-side using **PDFKit** with a custom layout engine. All reports are A4 size and include:

- Organization name header
- Generation timestamp
- Summary cards
- Active filter summary bar
- Paginated data tables with alternating row shading
- Grand total banner
- Breakdown sections (by category, by status)
- Page numbers in footer

### Available reports

| Report | Endpoint | Notes |
|---|---|---|
| Full Donation Report | `GET /api/reports/donations` | Supports all donation filters |
| Category Donation Report | `GET /api/reports/category?categoryId=` | Filtered to one category |
| Analytics Report | `GET /api/reports/analytics` | Metrics + top donors |
| Full Khidmat Report | `GET /api/khidmat/reports/full` | Includes status breakdown |
| Khidmat Category Report | `GET /api/khidmat/reports/category?categoryId=` | Single category |
| Khidmat Receipt | `GET /api/khidmat/reports/receipt/:id` | Single record A4 receipt |

---

## Role & Access Control

| Feature | Admin | Operator |
|---|---|---|
| View all donations / khidmat | ✅ | ❌ (own records only) |
| Create records | ✅ | ✅ |
| Update records | ✅ | ✅ (own only) |
| Delete records | ✅ | ✅ (own only) |
| Restore deleted records | ✅ | ❌ |
| View audit logs | ✅ | ❌ |
| Manage users/operators | ✅ | ❌ |
| Manage categories | ✅ | ❌ |
| View stats / analytics | ✅ | ❌ |
| Download PDF reports | ✅ | ✅ |
| Send WhatsApp | ✅ | ✅ |

---

## Audit Logging

Every significant action in the system writes an entry to the `AuditLog` table. Logged events include:

**Donations:** `DONATION_CREATED` · `DONATION_UPDATED` · `DONATION_DELETED` · `DONATION_RESTORED`

**Email:** `EMAIL_SENT` · `EMAIL_RESENT` · `EMAIL_FAILED`

**WhatsApp:** `WHATSAPP_SENT` · `WHATSAPP_DELIVERED` · `WHATSAPP_READ` · `WHATSAPP_FAILED` · `WHATSAPP_PENDING` · `WHATSAPP_SKIPPED`

**Khidmat:** `KHIDMAT_CREATED` · `KHIDMAT_UPDATED` · `KHIDMAT_DELETED` · `KHIDMAT_RESTORED` · `KHIDMAT_WHATSAPP_SENT` · `KHIDMAT_WHATSAPP_FAILED`

**Auth / Users:** `ADMIN_LOGIN` · `OPERATOR_LOGIN` · `USER_CREATED` · `USER_UPDATED` · `PASSWORD_CHANGED` · `PASSWORD_RESET_REQUESTED` · `PASSWORD_RESET_COMPLETED`

**System:** `PDF_EXPORTED`

Each log entry stores: `userId`, `userRole`, `entityType`, `entityId`, `description`, `ipAddress`, `userAgent`, and a flexible `metadata` JSON field for change diffs and additional context.

---

## License

This project is private and proprietary. All rights reserved.

---

> Built with ❤️ for Khanqah donation and service management operations.