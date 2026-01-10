# Free2Talk

A free, scalable language learning voice communication platform where users practice languages with native speakers and language partners.

## Project Structure

```
free2talk/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Express backend with mediasoup
├── packages/
│   └── shared/       # Shared types and utilities
├── docker-compose.yml
└── turbo.json
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker and Docker Compose

## Getting Started

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Start development services (PostgreSQL, Redis)**
   ```bash
   docker-compose up -d
   ```

3. **Set up environment variables**
   ```bash
   # Copy example env files
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.local.example apps/web/.env.local
   ```

4. **Run database migrations**
   ```bash
   pnpm db:push
   ```

5. **Start development servers**
   ```bash
   pnpm dev
   ```

   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## Available Scripts

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps for production
- `pnpm start` - Start all apps in production mode
- `pnpm lint` - Lint all apps
- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:push` - Push schema changes to database
- `pnpm db:studio` - Open Drizzle Studio

## Tech Stack

- **Frontend**: Next.js 14+, Tailwind CSS, shadcn/ui, Zustand, TanStack Query
- **Backend**: Express.js, TypeScript, Socket.io, mediasoup
- **Database**: PostgreSQL with Drizzle ORM
- **Cache**: Redis
- **Real-time**: Socket.io for events, mediasoup for voice

## Development Workflow

See [phase-1.md](./phase-1.md) for the detailed Phase 1 implementation plan.

## License

MIT
