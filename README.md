# CashTrack Backend

Vendor Payment Management System - Backend API

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials

4. Create PostgreSQL database:
```bash
createdb cashtrack
```

5. Run migrations:
```bash
npm run migration:run
```

6. Start development server:
```bash
npm run dev
```

## Migration Commands

Generate new migration after entity changes:
```bash
npm run migration:generate --name=MigrationName
```

Run pending migrations:
```bash
npm run migration:run
```

Revert last migration:
```bash
npm run migration:revert
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/create-vendor` - Create vendor (Super Admin only)
- `GET /api/auth/me` - Get current user
- `GET /api/auth/vendors` - Get all vendors (Super Admin only)

### Requests
- `POST /api/requests` - Create request
- `GET /api/requests/available` - Get available requests
- `GET /api/requests/my-requests` - Get my requests
- `POST /api/requests/:id/pick` - Pick a request
- `GET /api/requests/:id/details` - Get request details
- `POST /api/requests/:id/upload-slip` - Upload payment slip
- `POST /api/requests/:id/verify` - Verify payment

### Dashboard
- `GET /api/dashboard/vendor/stats` - Vendor statistics
- `GET /api/dashboard/vendor/monthly` - Vendor monthly stats
- `GET /api/dashboard/admin/vendors` - All vendors stats (Super Admin)
- `GET /api/dashboard/admin/overview` - System overview (Super Admin)
- `GET /api/dashboard/admin/monthly` - System monthly stats (Super Admin)

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
