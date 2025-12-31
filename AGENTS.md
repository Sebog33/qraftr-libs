# Repository Guidelines

## Project Structure & Module Organization

- `packages/`: published libraries (one package per folder).
  - Typical layout: `src/index.ts` (public API), `tests/**/*.test.ts` (unit tests), `dist/` (build output).
- `packages/typescript-config/`: shared TS config (packages extend `packages/typescript-config/base.json`).
- `packages/eslint-config/`: shared ESLint presets (if/when linting is enabled per package).
- `apps/`: currently contains `docs/` and `web/` stubs (not part of the `pnpm-workspace.yaml` workspaces).

## Build, Test, and Development Commands

Repo (Turbo + PNPM):

- `pnpm install`: install workspace dependencies (Node `>=18`, `pnpm@10.7.1`).
- `pnpm build`: run `build` in all packages via Turbo (emits `dist/**`).
- `pnpm dev`: run each package’s `dev` task (typically `vitest watch`).
- `pnpm format`: format `**/*.{ts,tsx,md}` with Prettier.

Per-package (recommended while iterating):

- `pnpm --filter @qraftr/json-repair test`: run Vitest for a single package.
- `pnpm -r test`: run `test` across all workspace packages.

## Coding Style & Naming Conventions

- Language: TypeScript. Package entrypoint is `src/index.ts`; build output goes to `dist/`.
- Formatting: use Prettier (`pnpm format`) for consistent 2-space indentation and imports.
- Naming: packages use kebab-case folder names (e.g., `packages/json-repair`); tests use `*.test.ts`.

## Testing Guidelines

- Framework: Vitest (see `packages/*/vitest.config.ts`).
- Test files: `tests/**/*.test.ts`.
- Prefer testing public exports; import using the `@/` alias (mapped to the package’s `src/`).

## Commit & Pull Request Guidelines

- Commit messages: prefer Conventional Commits when practical (e.g., `feat(json-repair): handle trailing commas`), but keep messages short and imperative either way.
- PRs: include a clear description, how you tested (`pnpm --filter <pkg> test`), and update the package `README.md` when behavior or public APIs change.
