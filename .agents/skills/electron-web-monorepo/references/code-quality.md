# Code Quality

Code quality tools and standards for the project.

## Biome/Ultracite

[Ultracite](https://github.com/nicholasxuuso/ultracite) is a zero-config preset for Biome.

### Setup

```bash
pnpm add -D ultracite @biomejs/biome
pnpm dlx ultracite doctor
```

### Commands

```bash
pnpm dlx ultracite fix      # Format and fix issues
pnpm dlx ultracite check    # Check for issues
pnpm dlx ultracite doctor   # Diagnose setup
```

### Configuration

```json
// biome.json
{
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "useExhaustiveDependencies": "warn"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      },
      "style": {
        "useConst": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "asNeeded",
      "trailingCommas": "none"
    }
  },
  "extends": ["ultracite/biome/core", "ultracite/biome/react"]
}
```

## Git Hooks (Husky)

### Setup

```bash
pnpm add -D husky
pnpm exec husky init
```

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
set -e

if [ -z "$(git diff --cached --name-only)" ]; then
  echo "No staged files to format"
  exit 0
fi

pnpm run fix
```

## Conventional Commits

Format: `type(scope): subject`

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting (no code change) |
| `refactor` | Code refactoring |
| `test` | Adding tests |
| `chore` | Maintenance |
| `perf` | Performance improvement |
| `ci` | CI/CD changes |
| `build` | Build system changes |

### Examples

```
feat(desktop): add download queue management
fix(api): resolve memory leak in stream handler
docs(readme): update installation instructions
refactor(ui): extract Button component
test(electron): add IPC handler tests
```

## VS Code Integration

### Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "editor.tabSize": 2,
  "files.eol": "\n"
}
```

### Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    "biomejs.biome"
  ]
}
```

## Code Standards

### Type Safety

- Use explicit types for function parameters and return values
- Prefer `unknown` over `any`
- Use const assertions (`as const`)
- Leverage TypeScript's type narrowing

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks
- Prefer `for...of` loops over `.forEach()`
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Prefer template literals over string concatenation
- Use `const` by default, `let` only when reassignment is needed

### React

- Use function components
- Call hooks at the top level only
- Specify all dependencies in hook dependency arrays
- Use unique IDs for `key` prop (not array indices)

### Error Handling

- Remove `console.log` and `debugger` from production code
- Throw `Error` objects with descriptive messages
- Use `try-catch` blocks meaningfully
- Prefer early returns over nested conditionals

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
