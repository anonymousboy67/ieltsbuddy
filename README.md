# IELTSBuddy

Production-ready Next.js application with authentication and an admin-only user management panel.

## Stack

- Next.js App Router + TypeScript
- NextAuth (Auth.js) for sessions
- MongoDB + Mongoose for user data
- Firebase Admin (optional sync for disable/delete/password operations)

## Project Structure

- `src/app`: Pages and API routes
- `src/app/api/auth`: Auth endpoints (login helpers, OTP, NextAuth handlers)
- `src/app/api/admin/users`: Admin-only user management API
- `src/components`: UI components (auth modal, admin user panel, dashboards)
- `src/lib`: DB/auth/firebase utility modules
- `src/models`: Mongoose schemas
- `middleware.ts`: Route access control

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Add environment values in `.env.local` (Mongo, NextAuth secret, Firebase/Google keys as needed).

3. Start development server:

```bash
npm run dev
```

4. Open:

`http://localhost:3000`

## Admin Login (Fixed Credentials)

- Identifier: `admin@iletsbuddy.com` or `admin`
- Password: `admin`

Admin users are redirected to `/admin` and are blocked from normal dashboard routes.

## Admin Features

Inside `/admin`, admin can:

- View all registered users
- Search users by email/username/name
- Disable or re-enable accounts
- Reset account password
- Delete accounts

## Validation Commands

```bash
npm run build
npm run start
```

