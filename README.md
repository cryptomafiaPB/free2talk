<div align="center">

<!-- Project Logo -->
<img src="./assets/logo-circle.png" alt="Free2Talk Logo" width="120" height="120">

# Free2Talk

**Connect, Practice, Master Languages** 🌍

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

**[Live Demo](#) • [Documentation](./TECHNICAL.md) • [Community](https://t.me/freetotalk2) • [Contributing](./CONTRIBUTING.md)**

<p align="center">
A free, open-source platform for real-time voice conversations with language partners worldwide. Practice languages through voice rooms and random matching.
</p>

</div>

---

## ✨ What is Free2Talk?

Free2Talk is a **scalable language learning platform** that connects learners with native speakers and language partners for **real-time voice practice**. Whether you're improving your accent, building conversational fluency, or learning from native speakers, Free2Talk provides the tools you need.

### 🎯 Key Highlights

| Feature | Description |
|---------|-------------|
| 🎙️ **Voice Rooms** | Create or join multi-user voice rooms for group conversations |
| 🎲 **Random Matching** | One-click matching with compatible language partners |
| 🔒 **Privacy-First** | Your conversations and data remain private and secure |
| 🚀 **Enterprise-Grade** | Built with mediasoup for production-ready WebRTC communication |
| 📱 **Fully Responsive** | Seamless experience across desktop, tablet, and mobile |
| 🌐 **100% Free** | Open-source, community-driven, free forever |

---

## 🎯 Core Features

### 🎙️ Voice Communication
- **High-Quality Audio** powered by mediasoup WebRTC SFU
- **Voice Rooms** - Create/join multi-user voice chat rooms (2-12 participants)
- **Room Controls** - Mute/unmute, kick users, transfer ownership
- **Real-time Audio** - Low-latency voice streaming

### 🎲 Random Matching
- **One-Click Pairing** - Instantly connect with language partners
- **Smart Queueing** - Fair matchmaking system
- **Language Filtering** - Match with speakers of your target language

### 👤 User Management
- **Secure Authentication** - JWT-based auth with HTTP-only cookies
- **Google OAuth** - Quick sign-in with Google
- **Profile System** - Customize profile, set language preferences
- **Cloudinary Integration** - Profile picture uploads

### 🏗️ Production-Ready Architecture
- **Scalable Backend** - Express.js with Redis caching
- **Type-Safe** - Full TypeScript coverage
- **Monorepo Structure** - Turborepo for optimized builds
- **Docker Support** - Development and production containers

> **📖 For detailed technical documentation, see [TECHNICAL.md](./TECHNICAL.md)**

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:

- **Node.js** `>=20.0.0` - [Download](https://nodejs.org/)
- **pnpm** `>=9.0.0` - [Install Guide](https://pnpm.io/installation)
- **Docker** & **Docker Compose** - [Get Docker](https://docs.docker.com/get-docker/)
- **Git** - [Install Git](https://git-scm.com/)

### Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/cryptomafiaPB/free2talk.git
cd free2talk

# 2. Install dependencies (uses pnpm workspaces)
pnpm install

# 3. Start PostgreSQL and Redis via Docker
docker-compose up -d

# 4. Configure environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local

# Edit .env files with your configurations:
# - Database connection strings
# - JWT secrets
# - Google OAuth credentials (optional)
# - Cloudinary keys (for image uploads)

# 5. Initialize the database
pnpm db:push

# 6. Start development servers
pnpm dev
```

**Your app is now running!**
- 🌐 **Frontend**: http://localhost:3000
- 🔧 **API**: http://localhost:3001

### 🐳 Full Docker Setup

Run the entire stack with one command:

```bash
docker-compose up
```

This starts PostgreSQL, Redis, API server, and web frontend together.

---

## 📁 Project Structure

```
free2talk/
├── apps/
│   ├── api/                      # Express.js Backend API
│   │   ├── src/
│   │   │   ├── controllers/      # HTTP route handlers
│   │   │   ├── services/         # Business logic layer
│   │   │   ├── socket/           # Socket.io event handlers
│   │   │   │   ├── mediasoup/    # WebRTC SFU implementation
│   │   │   │   └── random-handlers.ts
│   │   │   ├── middleware/       # Auth, rate limiting, errors
│   │   │   ├── routes/           # API route definitions
│   │   │   ├── db/               # Database config & schema
│   │   │   │   ├── schema.ts     # Drizzle schema
│   │   │   │   ├── redis.ts      # Redis client
│   │   │   │   └── migrations/   # SQL migrations
│   │   │   ├── config/           # Environment configuration
│   │   │   └── utils/            # Utility functions
│   │   └── Dockerfile
│   │
│   └── web/                      # Next.js Frontend App
│       ├── app/                  # App Router pages
│       │   ├── rooms/            # Voice rooms UI
│       │   ├── random/           # Random matching UI
│       │   ├── profile/          # User profile
│       │   └── login/            # Authentication
│       ├── components/           # React components
│       │   ├── room/             # Room components
│       │   ├── random/           # Random call components
│       │   ├── auth/             # Auth components
│       │   └── ui/               # shadcn/ui components
│       ├── lib/
│       │   ├── stores/           # Zustand state
│       │   ├── hooks/            # Custom React hooks
│       │   ├── services/         # API service layer
│       │   ├── api.ts            # Axios instance
│       │   └── socket.ts         # Socket.io client
│       └── Dockerfile
│
├── packages/
│   └── shared/                   # Shared Code (Monorepo)
│       └── src/
│           ├── types/            # TypeScript interfaces
│           ├── constants/        # Shared constants
│           └── validation/       # Zod schemas
│
├── docker-compose.yml            # Development compose
├── docker-compose.prod.yml       # Production compose
├── turbo.json                    # Turborepo config
├── pnpm-workspace.yaml           # pnpm workspaces
└── README.md                     # You are here!
```

---

## 🛠️ Technology Stack

<table>
<tr>
<td width="50%">

### Frontend
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful UI components
- **[Zustand](https://zustand-demo.pmnd.rs/)** - State management
- **[TanStack Query](https://tanstack.com/query)** - Server state & caching
- **[Socket.io Client](https://socket.io/)** - Real-time WebSocket
- **[mediasoup-client](https://mediasoup.org/)** - WebRTC client

</td>
<td width="50%">

### Backend
- **[Express.js](https://expressjs.com/)** - Web framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe Node.js
- **[mediasoup](https://mediasoup.org/)** - WebRTC SFU
- **[Socket.io](https://socket.io/)** - WebSocket server
- **[PostgreSQL](https://www.postgresql.org/)** - Primary database
- **[Drizzle ORM](https://orm.drizzle.team/)** - Type-safe SQL
- **[Redis](https://redis.io/)** - Caching & sessions
- **[JWT](https://jwt.io/)** - Authentication
- **[Cloudinary](https://cloudinary.com/)** - Media storage

</td>
</tr>
<tr>
<td colspan="2">

### DevOps & Tools
- **[Turborepo](https://turbo.build/)** - Monorepo build system
- **[pnpm](https://pnpm.io/)** - Fast package manager
- **[Docker](https://www.docker.com/)** - Containerization
- **[ESLint](https://eslint.org/)** & **[Prettier](https://prettier.io/)** - Code quality
- **[Zod](https://zod.dev/)** - Runtime validation

</td>
</tr>
</table>

> **📘 Detailed architecture and system design: [TECHNICAL.md](./TECHNICAL.md)**

---

## 📚 Available Scripts

| Command | Description |
|---------|-------------|
| **Development** | |
| `pnpm dev` | Start all apps in dev mode with hot reload |
| `pnpm dev --filter=web` | Start only the Next.js frontend |
| `pnpm dev --filter=api` | Start only the Express API |
| **Building** | |
| `pnpm build` | Build all apps for production |
| `pnpm build:web` | Build frontend only |
| `pnpm build:api` | Build backend only |
| **Production** | |
| `pnpm start` | Start all production servers |
| `pnpm start:web` | Start Next.js production server |
| `pnpm start:api` | Start Express API server |
| **Database** | |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run pending migrations |
| `pnpm db:push` | Push schema changes to DB |
| `pnpm db:studio` | Open Drizzle Studio (DB GUI) |
| **Code Quality** | |
| `pnpm lint` | Run ESLint on all apps |
| `pnpm clean` | Remove all build artifacts |

---

## 🤝 Contributing

We ❤️ contributions! Whether you're fixing bugs, adding features, improving docs, or sharing ideas - all help is appreciated.

### How to Contribute

1. **🍴 Fork** the repository
2. **🌿 Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **💻 Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **📤 Push** to your branch (`git push origin feature/amazing-feature`)
5. **🎉 Open** a Pull Request

### Contribution Guidelines

- Read [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines
- Follow [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- Check existing issues before creating new ones
- Write clear commit messages
- Add tests for new features
- Update documentation as needed

### Good First Issues

New to the project? Look for issues labeled `good first issue` to get started!

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| **[TECHNICAL.md](./TECHNICAL.md)** | Detailed technical architecture and system design |
| **[CONTRIBUTING.md](./CONTRIBUTING.md)** | Contribution guidelines and development workflow |
| **[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)** | Community standards and values |
| **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** | Production deployment guide |

---

## � Community & Support

<table>
<tr>
<td width="33%">

### 💡 Get Help
- [GitHub Issues](https://github.com/cryptomafiaPB/free2talk/issues)
- [Discussions](https://github.com/cryptomafiaPB/free2talk/discussions)
- [Telegram Group](https://t.me/+SXrT3SraB9piMmVl)

</td>
<td width="33%">

### 📢 Stay Updated
- [Telegram Channel](https://t.me/freetotalk2)
- [GitHub Releases](https://github.com/cryptomafiaPB/free2talk/releases)
- Follow development updates

</td>
<td width="33%">

### 🐛 Report Issues
- [Bug Reports](https://github.com/cryptomafiaPB/free2talk/issues/new?template=bug_report.md)
- [Feature Requests](https://github.com/cryptomafiaPB/free2talk/issues/new?template=feature_request.md)
- Security: mail security issues to [romanreignsbro304@gmail.com](mailto:romanreignsbro304@gmail.com)

</td>
</tr>
</table>

---

## 🗺️ Roadmap

- [x] **Phase 1**: Voice rooms with mediasoup WebRTC
- [x] **Phase 2**: Random matching feature
- [x] **Phase 3**: Google OAuth integration
- [ ] **Phase 4**: Text messaging in rooms
- [ ] **Phase 5**: User profiles & social features
- [ ] **Phase 6**: Mobile apps (React Native)
- [ ] **Phase 7**: Video chat support
- [ ] **Phase 8**: AI-powered conversation suggestions

---

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](./LICENSE) for details.

**What this means:**
- ✅ Free to use for personal and commercial projects
- ✅ Modify and distribute freely
- ✅ Private use allowed
- ⚠️ Must include the license notice
- ❌ No warranty provided

---

## 🙌 Acknowledgments

Built with incredible open-source tools:

- **[mediasoup](https://mediasoup.org/)** - Production-grade WebRTC SFU
- **[Next.js](https://nextjs.org/)** - The React Framework for the Web
- **[Drizzle ORM](https://orm.drizzle.team/)** - TypeScript ORM that doesn't get in your way
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautifully designed components
- All the amazing open-source libraries that made this possible

---

## ⭐ Show Your Support

If Free2Talk helps you or your community:

- ⭐ **Star** this repository
- 🐦 **Share** on social media
- 🤝 **Contribute** to the project
- 💬 **Spread** the word in language learning communities
- ☕ **Sponsor** the project (coming soon)

---

<div align="center">

**Built with ❤️ by the Free2Talk Community**

*Empowering language learners worldwide through open-source technology*

[🌐 Website](#) • [📱 Telegram](https://t.me/freetotalk2) • [🐙 GitHub](https://github.com/cryptomafiaPB/free2talk)

---

Made possible by the [GitHub Student Developer Pack](https://education.github.com/pack) 🎓

</div>
