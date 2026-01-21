# Free2Talk
# Free2Talk

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

A free, open-source, scalable language learning platform for real-time voice practice with native speakers and language partners worldwide.

[Features](#features) • [Quick Start](#quick-start) • [Tech Stack](#tech-stack) • [Contributing](#contributing) • [Support](#support)

</div>

---

## 🌍 About Free2Talk

Free2Talk is an innovative free open-source platform that connects language learners with native speakers and language partners for real-time voice conversations. Whether you want to improve your accent, practice conversational skills, or learn from native speakers, Free2Talk provides a scalable, free environment to achieve your language learning goals.

### Why Free2Talk?

- **🎯 Fully Open-Source** - Community-driven, transparent, and free forever
- **🌐 Real-Time Voice** - Crystal-clear voice communication with WebRTC technology
- **🤝 Smart Pairing** - Random matching with compatible language partners
- **📱 Multi-Room Support** - Create and join multiple conversation rooms
- **🚀 Scalable Architecture** - Built for millions of users
- **♿ User-Focused** - Intuitive interface designed for learners of all levels
- **🔐 Privacy-First** - Your data stays private and secure

---

## ✨ Features

- **Voice Communication**
  - High-quality real-time voice conversations using WebRTC
  - Multiple simultaneous voice rooms for group learning
  - Voice activity detection and noise management

- **Smart User Pairing**
  - Random matching algorithm to connect compatible learners
  - Filter by language pairs and skill levels
  - Build your own language learning communities

- **User Management**
  - Easy registration and authentication
  - Google OAuth integration
  - Profile customization and language preferences

- **Real-Time Messaging**
  - Text chat alongside voice conversations
  - Room-based messaging system
  - Message history and transcripts

- **Developer-Friendly**
  - Well-documented API endpoints
  - Monorepo structure for easy exploration
  - TypeScript for type safety
  - Docker support for local development

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20 or higher
- **pnpm** 9 or higher ([install pnpm](https://pnpm.io/installation))
- **Docker** and **Docker Compose**
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cryptomafiaPB/free2talk.git
   cd free2talk
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development services** (PostgreSQL, Redis)
   ```bash
   docker-compose up -d
   ```

4. **Configure environment variables**
   ```bash
   # Copy example configuration files
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.local.example apps/web/.env.local
   ```
   
   Update the `.env` files with your actual configuration (API keys, database URLs, etc.)

5. **Run database migrations**
   ```bash
   pnpm db:push
   ```

6. **Start development servers**
   ```bash
   pnpm dev
   ```

   Your application will be available at:
   - 🖥️ **Frontend**: [http://localhost:3000](http://localhost:3000)
   - ⚙️ **Backend API**: [http://localhost:3001](http://localhost:3001)

### 🐳 Docker Development

To run the entire stack with Docker:

```bash
docker-compose up
```

This will start:
- PostgreSQL database
- Redis cache
- API server
- Web frontend

---

## 📁 Project Structure

```
free2talk/
├── apps/
│   ├── api/               # Express.js backend server
│   │   ├── src/
│   │   │   ├── controllers/   # API route handlers
│   │   │   ├── services/      # Business logic
│   │   │   ├── socket/        # WebSocket handlers
│   │   │   ├── middleware/    # Auth, error handling
│   │   │   ├── db/            # Database & ORM config
│   │   │   └── config/        # Environment config
│   │   └── package.json
│   │
│   └── web/               # Next.js frontend application
│       ├── app/               # Pages and layouts
│       ├── components/        # React components
│       ├── lib/               # Utilities and hooks
│       └── package.json
│
├── packages/
│   └── shared/            # Shared types, constants & utilities
│       ├── src/
│       │   ├── types/         # TypeScript interfaces
│       │   ├── constants/     # Shared constants
│       │   └── validation/    # Validation schemas
│       └── package.json
│
├── docker-compose.yml
├── turbo.json            # Monorepo configuration
└── pnpm-workspace.yaml   # pnpm workspace setup
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 14+](https://nextjs.org/) - React with SSR and optimization
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) - High-quality React components
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) - Lightweight state management
- **Data Fetching**: [TanStack Query](https://tanstack.com/query/) - Server state management
- **WebSocket Client**: [Socket.io-client](https://socket.io/) - Real-time communication

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) with TypeScript
- **Framework**: [Express.js](https://expressjs.com/) - Minimal web framework
- **WebRTC**: [mediasoup](https://mediasoup.org/) - Powerful voice/video communication
- **Real-time**: [Socket.io](https://socket.io/) - WebSocket abstraction
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Caching**: [Redis](https://redis.io/) - High-performance cache
- **Image Upload**: [Cloudinary](https://cloudinary.com/) - Cloud storage
- **Authentication**: JWT with [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)

### DevOps & Tools
- **Package Manager**: [pnpm](https://pnpm.io/) - Fast, disk space efficient
- **Monorepo**: [Turborepo](https://turbo.build/repo) - High-performance build system
- **Containerization**: [Docker](https://www.docker.com/) - Container platform
- **Type Safety**: [TypeScript](https://www.typescriptlang.org/) - Static typing

---

## 📚 Available Commands

```bash
# Development
pnpm dev              # Start all apps in development mode
pnpm dev:web          # Start only web frontend
pnpm dev:api          # Start only API backend

# Building
pnpm build            # Build all apps for production
pnpm build:web        # Build frontend only
pnpm build:api        # Build backend only

# Production
pnpm start            # Start all apps in production mode

# Code Quality
pnpm lint             # Run ESLint on all apps
pnpm lint:fix         # Fix linting errors
pnpm format           # Format code with Prettier

# Database
pnpm db:generate      # Generate new Drizzle migrations
pnpm db:migrate       # Run pending migrations
pnpm db:push          # Push schema changes to database
pnpm db:studio        # Open Drizzle Studio (database UI)

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Run tests in watch mode
```

---

## 🤝 Contributing

We welcome contributions from developers of all skill levels! Whether you're fixing bugs, adding features, improving documentation, or suggesting ideas, your help is valuable.

### Getting Started with Contributions

1. **Read our [CONTRIBUTING.md](./CONTRIBUTING.md)** - Complete guide for contributors
2. **Review [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)** - Community standards
3. **Check [open issues](https://github.com/yourusername/free2talk/issues)** - Find areas to help
4. **Look for "good first issue" tags** - Perfect for newcomers

### Quick Contribution Steps

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/free2talk.git

# 3. Create a feature branch
git checkout -b feature/amazing-feature

# 4. Make your changes and test
pnpm lint:fix && pnpm test

# 5. Push to your fork
git push origin feature/amazing-feature

# 6. Open a Pull Request on GitHub
```

**For detailed contribution guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md)**

---

## 📖 Documentation

- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute to the project
- **[Code of Conduct](./CODE_OF_CONDUCT.md)** - Community values and standards
- **[Deployment Guide](./DEPLOYMENT_CHECKLIST.md)** - Production deployment instructions

---

## 🐛 Bug Reports & Feature Requests

Have an idea or found a bug? We'd love to hear about it!

- **[Report a Bug](https://github.com/yourusername/free2talk/issues/new?template=bug_report.md)** - Use the bug report template
- **[Request a Feature](https://github.com/yourusername/free2talk/issues/new?template=feature_request.md)** - Suggest improvements
- **[Join Discussions](https://github.com/yourusername/free2talk/discussions)** - Ask questions and discuss ideas

---

## 💬 Support & Community

- **[GitHub Issues](https://github.com/yourusername/free2talk/issues)** - Bug reports and feature requests
- **[GitHub Discussions](https://github.com/yourusername/free2talk/discussions)** - Ask questions and share ideas
- **[Contributing Guide](./CONTRIBUTING.md)** - Development documentation

---

## 📄 License

Free2Talk is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

This means:
- ✅ You can use it for personal and projects
- ✅ You can modify and distribute it
- ✅ You must include the license notice
- ❌ No warranty is provided

---

## 🙌 Acknowledgments

- **[mediasoup](https://mediasoup.org/)** - Excellent WebRTC framework
- **[Next.js](https://nextjs.org/)** - React framework powering the frontend
- **[Drizzle ORM](https://orm.drizzle.team/)** - Type-safe database access
- **Open-source community** - For tools, libraries, and inspiration

---

## 🌟 Show Your Support

If you find Free2Talk helpful, consider:
- ⭐ Giving it a star on GitHub
- 🔗 Sharing it with others
- 💬 Contributing to the project
- 💡 Reporting issues and suggesting improvements

---

This project was built with the help of the [GitHub Student Developer Pack](https://education.github.com/pack).

<div align="center">

**Made with ❤️ by the Free2Talk community**

*Helping language learners connect and grow globally*

</div>
