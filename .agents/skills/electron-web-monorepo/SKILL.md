---
name: electron-web-monorepo
description: Scaffold and maintain Electron + Web monorepo projects with standardized structure, code quality tools (Biome/Ultracite), Git hooks (Husky), i18n, oRPC API patterns, and CI/CD. Use when creating new projects, setting up project structure, configuring code quality tools, or migrating existing projects to this architecture.
---

# Electron + Web Monorepo Scaffold

A reusable skill for scaffolding Electron + Web monorepo projects.

## Quick Start

```bash
# Create empty directory and run scaffold
mkdir my-project && cd my-project

# Option 1: Run from GitHub
npx github:2048Nemo/electron-web-monorepo-skill/skill/scripts/create.mjs

# Option 2: Clone and run locally
git clone https://github.com/2048Nemo/electron-web-monorepo-skill.git
mkdir my-project && cd my-project
node ../electron-web-monorepo-skill/skill/scripts/create.mjs
```

## CLI Options

```bash
node create.mjs [options]

Options:
  --name=<name>         Project name
  --apps=<apps>         Apps to include (comma-separated: desktop,web,api)
  --packages=<pkgs>     Packages to include (comma-separated: ui,i18n,db,core)
  --no-code-quality     Skip code quality tools
  --no-git              Skip git initialization
  --no-install          Skip dependency installation
  --yes, -y             Use defaults for all prompts
  --help, -h            Show help
```

## Project Structure

```
my-project/
├── apps/
│   ├── desktop/          # Electron app
│   ├── web/              # Next.js web app
│   └── api/              # Backend API
├── packages/
│   ├── ui/               # Shared UI components
│   ├── i18n/             # Internationalization
│   ├── db/               # Database layer
│   └── core/             # Core business logic
├── biome.json            # Code quality config
├── pnpm-workspace.yaml   # Monorepo config
└── package.json
```

## Core Principles

- **KISS** & **YAGNI** - Keep it simple
- **pnpm** over npm
- **Conventional Commits** - `type(scope): subject`
- **i18n** - English first, translate later
- **English comments**

## Essential Commands

```bash
pnpm dlx ultracite fix                    # Format code
pnpm dlx ultracite check                  # Check issues
pnpm --filter ./apps/desktop run dev      # Run app
```

## References

Detailed guides for specific topics:

| Topic | Description |
|-------|-------------|
| [Monorepo Structure](references/monorepo-structure.md) | Directory structure and configuration |
| [Electron Development](references/electron-development.md) | Main/Renderer/Preload development |
| [Code Quality](references/code-quality.md) | Biome, Husky, Git conventions |
| [i18n](references/i18n.md) | Internationalization setup |
| [API Patterns](references/api-patterns.md) | oRPC contract-first development |

## Templates

| File | Description |
|------|-------------|
| `biome.json` | Biome/Ultracite configuration |
| `.husky/pre-commit` | Pre-commit hook with formatting |
| `.vscode/` | Editor settings |
| `AGENTS.md` | AI assistant instructions |
| `tsconfig.base.json` | TypeScript base config |

## Using as Agent Skill

```bash
cp -r skill/ your-project/.agents/skills/electron-web-monorepo/
```

## License

MIT
