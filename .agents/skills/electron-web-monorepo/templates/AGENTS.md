# My Project

1. use pnpm instead of npm
2. use pnpm run check after tasks to check code
3. Support i18n. When writing business logic, initially only translate the English version of en.json
4. use English for comments&console
5. Follow the KISS (Keep It Simple, Stupid) & YAGNI (You Aren't Gonna Need It) principles
6. Use Conventional Commits format for commit messages: `type(scope): subject`. Common types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert. PR titles should also follow this format.
7. If there is an error when running `pnpm run check:i18n`, please complete the missing corresponding translation files and fields. Ensure the translation is done into the corresponding language, rather than directly copying the English version.

# Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `pnpm dlx ultracite fix`
- **Check for issues**: `pnpm dlx ultracite check`
- **Diagnose setup**: `pnpm dlx ultracite doctor`

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use `const` by default, `let` only when reassignment is needed, never `var`

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)

### Error Handling

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings
- Use `try-catch` blocks meaningfully

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
