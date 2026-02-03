# ASES backend

## Setup
1. Copy `.env.example` to `.env` and update values.
2. Install dependencies: `bun install`
3. Generate Prisma client: `bun run prisma:generate`
4. Run migrations: `bun run prisma:migrate`
5. Start dev server: `bun run dev`
6. Typecheck (optional): `bun run typecheck`

## Endpoints
- `GET /health`
- `GET /`
