# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests for all packages
pnpm build && pnpm --filter @qraftr/<package-name> test

# Run tests in watch mode for a specific package
pnpm --filter @qraftr/<package-name> dev

# Lint all packages
pnpm lint

# Type check all packages
pnpm check-types

# Format code
pnpm format
```

To run a single test file within a package:

```bash
cd packages/<package-name>
npx vitest run src/index.test.ts
```

## Architecture

This is a pnpm monorepo managed by Turborepo containing @qraftr npm packages.

### Package Structure

- **packages/json-repair**: Repairs malformed JSON strings (particularly from LLM output). Exports `repairJson()` and `extractJsonFromText()`.
- **packages/json-diff**: Deep comparison of JSON objects. Exports `diffJson()`, `intersectJson()`, `subtractJson()`, `isEqual()`.
- **packages/json-merge**: Deep merge of objects with options (array strategy, depth limit, custom merge). Exports `deepMerge()`, `mergeMany()`.
- **packages/json-schema-gen**: Generates JSON Schema for OpenAI function calling. Exports `generateSchema()`, `generateSchemaFromData()`, `validateSchema()`.
- **packages/image-convert**: Server-side image conversion using sharp. Exports `convertToIco()`. Uses dynamic imports to avoid browser bundling issues.
- **packages/eslint-config**: Shared ESLint configs (internal, not published).
- **packages/typescript-config**: Shared TypeScript configs (internal, not published).

### Build System

- Turborepo orchestrates builds with `^build` dependencies
- Each package compiles TypeScript to `dist/` via `tsc`
- Tests use Vitest with `globals: true`

### TypeScript Configuration

Packages extend `@repo/typescript-config/base.json`:

- Target: ES2020
- Module: CommonJS
- Strict mode enabled
