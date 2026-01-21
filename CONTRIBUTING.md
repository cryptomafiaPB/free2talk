# Contributing to Free2Talk

We welcome contributions from everyone. This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please read and follow our [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) to ensure a welcoming and inclusive community.

## How to Contribute

### 1. Fork the Repository
- Click the "Fork" button on the GitHub repository
- Clone your forked repository locally:
  ```bash
  git clone https://github.com/cryptomafiaPB/free2talk.git
  cd free2talk
  ```

### 2. Set Up Development Environment

Follow the setup instructions in [README.md](./README.md):

```bash
# Install dependencies
pnpm install

# Start development services
docker-compose up -d

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local

# Update .env files with your actual configuration values

# Run database migrations
pnpm db:push

# Start development servers
pnpm dev
```

### 3. Create a Feature Branch

Create a new branch for your contribution:
```bash
git checkout -b feature/your-feature-name
# or for bug fixes:
git checkout -b fix/issue-description
```

**Branch naming conventions:**
- `feature/` - for new features
- `fix/` - for bug fixes
- `docs/` - for documentation updates
- `refactor/` - for code refactoring
- `test/` - for adding tests

### 4. Make Your Changes

- Write clean, readable code
- Follow the existing code style and conventions
- Add tests for new functionality
- Update documentation as needed
- Keep commits atomic and with clear messages

### 5. Commit Guidelines

Write meaningful commit messages:
```bash
git commit -m "feat: add voice call recording feature"
git commit -m "fix: resolve voice connection timeout issue"
git commit -m "docs: update installation instructions"
```

**Commit types:**
- `feat:` - new feature
- `fix:` - bug fix
- `docs:` - documentation
- `style:` - code formatting
- `refactor:` - code restructuring
- `test:` - adding/updating tests
- `chore:` - maintenance tasks

### 6. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 7. Create a Pull Request

- Go to the original repository on GitHub
- Click "New Pull Request"
- Select your branch and provide a clear description:
  - **Title:** Brief, descriptive title
  - **Description:** Detailed explanation of changes
  - **Related Issues:** Link any related issues with `Closes #123`
  - **Screenshots/Demo:** If applicable

### 8. Code Review

- Address feedback from reviewers
- Push additional commits if needed (don't force push on reviewed PRs)
- Once approved, your PR will be merged

## Development Guidelines

### Code Style

- Use **TypeScript** for type safety
- Follow **ESLint** and **Prettier** configurations
- Run linting and formatting:
  ```bash
  pnpm lint
  pnpm format
  ```

### Testing

- Write tests for new features
- Ensure all tests pass:
  ```bash
  pnpm test
  ```
- Aim for reasonable code coverage

### Performance

- Be mindful of bundle size
- Optimize voice/video streaming
- Test on low-bandwidth connections

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

### Web Application (apps/web)
- Next.js 14+ framework
- React components in `/components`
- Pages in `/app`
- Custom hooks in `/lib/hooks`
- Stores and state management in `/lib/stores`

### API Server (apps/api)
- Express.js framework
- Controllers handle business logic
- Services for data operations
- Routes define API endpoints
- Socket for WebSocket connections
- Middleware for authentication/error handling

### Shared Package (packages/shared)
- Shared TypeScript types
- Validation schemas
- Constants and utilities

## Common Tasks

### Running Tests
```bash
pnpm test
```

### Building for Production
```bash
pnpm build
```

### Running Linter
```bash
pnpm lint
pnpm lint:fix
```

### Database Operations
```bash
# Push schema changes
pnpm db:push

# Generate migrations
pnpm db:generate

# Open database UI
pnpm db:studio
```

## Reporting Issues

When reporting a bug:
- Use a clear, descriptive title
- Provide detailed steps to reproduce
- Include expected vs actual behavior
- Add screenshots/videos if relevant
- Specify your environment (OS, Node version, etc.)

## Feature Requests

When proposing a feature:
- Clearly describe the feature and its benefits
- Provide use cases and examples
- Discuss potential implementation approaches
- Be open to feedback and modifications

## Documentation

- Update README.md if your changes affect setup or usage
- Add inline code comments for complex logic
- Create documentation for new features
- Keep CONTRIBUTING.md up to date

## Questions?

- Check existing issues and discussions
- Ask in GitHub Discussions
- Join our community chat (if available)
- Contact the maintainers

## License

By contributing to Free2Talk, you agree that your contributions will be licensed under the MIT License (see [LICENSE](./LICENSE) for details).

---

Thank you for making Free2Talk better! 🎉
