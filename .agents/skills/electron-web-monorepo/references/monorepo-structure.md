# Monorepo Structure

Directory structure and configuration for the Electron + Web monorepo.

## Root Structure

```
my-project/
├── apps/                    # Applications
│   ├── desktop/             # Electron app
│   ├── web/                 # Next.js web app
│   └── api/                 # Backend API
├── packages/                # Shared packages
│   ├── ui/                  # Shared UI components
│   ├── i18n/                # Internationalization
│   ├── db/                  # Database layer
│   └── core/                # Core business logic
├── biome.json               # Code quality config
├── pnpm-workspace.yaml      # Monorepo config
├── tsconfig.base.json       # TypeScript base config
└── package.json             # Root package.json
```

## Apps

### Desktop (Electron)

```
apps/desktop/src/
├── main/                    # Main process (Node.js)
│   ├── config/              # App configuration
│   ├── ipc/                 # IPC handlers
│   │   └── services/        # IPC service implementations
│   ├── lib/                 # Main process libraries
│   │   └── database/        # Database operations
│   └── utils/               # Main process utilities
├── renderer/                # Renderer process (React/Vue)
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── assets/          # Images, fonts, etc.
│   │   ├── components/      # React components
│   │   ├── data/            # Data fetching, API clients
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Renderer libraries
│   │   ├── pages/           # Page components
│   │   └── store/           # State management
│   └── index.html
├── preload/                 # Preload scripts
│   └── index.ts             # Expose APIs to renderer
└── shared/                  # Shared between processes
    ├── types/               # Shared TypeScript types
    └── utils/               # Shared utilities
```

**Key Principles:**
- `main/` runs in Node.js - has filesystem access
- `renderer/` runs in browser - UI layer only
- `preload/` bridges main and renderer securely
- `shared/` contains types and pure functions

### Web (Next.js)

```
apps/web/
├── public/                  # Static files
├── src/
│   ├── app/                 # App Router pages
│   ├── components/          # React components
│   ├── lib/                 # Utilities
│   └── contract/            # oRPC contracts
└── tsconfig.json
```

### API

```
apps/api/src/
├── lib/                     # API utilities
│   ├── middleware/          # Express/Fastify middleware
│   └── routes/              # Route definitions
├── server.ts                # Server entry point
└── index.ts                 # Exports
```

## Packages

### UI Package

```
packages/ui/src/
├── components/
│   ├── ui/                  # Base UI components
│   └── layouts/             # Layout components
├── lib/
│   └── utils.ts             # UI utilities (cn, etc.)
└── index.ts                 # Exports
```

**Package.json:**
```json
{
  "name": "@myproject/ui",
  "exports": {
    ".": "./src/index.ts",
    "./components/*": "./src/components/*/index.ts"
  }
}
```

### Database Package

```
packages/db/src/
├── schema/                  # Database schemas
├── migrations/              # Migration files
├── queries/                 # Query functions
└── index.ts
```

### i18n Package

```
packages/i18n/src/
├── locales/
│   ├── en.json              # English (base)
│   ├── zh.json              # Chinese
│   └── ...                  # Other languages
├── languages.ts             # Language definitions
├── resources.ts             # Translation resources
├── init.ts                  # i18n initialization
└── index.ts
```

### Core Package

```
packages/core/src/
├── services/                # Core services
├── types/                   # Type definitions
├── utils/                   # Utilities
└── index.ts
```

## Configuration

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Root package.json

```json
{
  "name": "my-project",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter ./apps/desktop run dev",
    "build": "pnpm --filter ./apps/desktop run build",
    "check": "pnpm --filter ./apps/desktop run check",
    "typecheck": "pnpm --filter ./apps/desktop run typecheck"
  },
  "devDependencies": {
    "husky": "^9.0.0"
  }
}
```

### TypeScript Configuration

**Root tsconfig.base.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true
  }
}
```

**App tsconfig.json:**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```
