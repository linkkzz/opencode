# Agent Instructions for OpenCode Repository

## Build and Test Commands

### Root Commands

- `bun turbo typecheck` - Run typecheck across all packages
- Default branch: `dev`

### Core Package (`packages/opencode`)

- `bun dev` - Run opencode main entry point
- `bun test` - Run all tests
- `bun typecheck` - Run TypeScript type checking
- `tsgo --noEmit` - Alternative typecheck method

### Running Single Tests

```bash
# Run a specific test file
bun test packages/opencode/test/tool/read.test.ts

# Run tests with filter pattern
bun test --t "test name"

# Run tests in watch mode (for some packages)
bun test --watch
```

### App Package (`packages/app`)

- `bun dev` / `vite` - Start dev server (runs at http://localhost:3000)
- `bun typecheck` - Run typecheck
- `bun build` - Build for production

### Enterprise (`packages/enterprise`)

- `bun test packages/enterprise/test/core/storage.test.ts` - Test storage code

## Code Style Guidelines

### Core Principles

- Keep things in one function unless composable or reusable
- Avoid unnecessary destructuring. Use `obj.a` and `obj.b` instead of `const { a, b } = obj`
- Avoid `try`/`catch` where possible
- Avoid using the `any` type
- Prefer single word variable names where possible
- Use Bun APIs when available (`Bun.file()`, etc.)

### Variable Declarations

- Prefer `const` over `let`, especially with ternary operators

Good:

```ts
const foo = condition ? 1 : 2
```

Bad:

```ts
let foo
if (condition) foo = 1
else foo = 2
```

### Control Flow

- Avoid `else` statements - use early returns or IIFE

Good:

```ts
function foo() {
  if (condition) return 1
  return 2
}
```

Bad:

```ts
function foo() {
  if (condition) return 1
  else return 2
}
```

### Naming Conventions

- Prefer single word names for variables, functions, etc.
- Only use multiple words if truly necessary

Good:

```ts
const foo = 1
const bar = 2
```

Bad:

```ts
const fooBar = 1
const barBaz = 2
```

## Framework-Specific Guidelines

### SolidJS (App Package)

- Always prefer `createStore` over multiple `createSignal` calls

### Testing

- Tests use `bun:test` framework: `import { describe, test, expect, beforeAll, afterEach } from "bun:test"`
- Use test fixtures located in `packages/opencode/test/fixture/`
- Tests use `tmpdir()` helper for temporary directories
- Test context usually includes `sessionID`, `messageID`, `agent`, `abort`, `metadata`, and `ask`

## Tool Usage Guidelines

- **ALWAYS USE PARALLEL TOOLS WHEN APPLICABLE** - batch independent operations together

## Error Handling

- Use custom error types like `NamedError` from `@opencode-ai/util/error`
- Log errors with proper context using utility logging
- Format user-facing errors with `FormatError()`

## Imports

- Default relative imports look like `import { Foo } from "@/module/foo"`
- Workspace imports use `@opencode-ai/*` naming convention
- Avoid importing `@types/*` packages in production code (use in devDependencies only)

## SDK Regeneration

- To regenerate the JavaScript SDK: run `./packages/sdk/js/script/build.ts`

## File Organization

- Source files primarily in `src/` directories within packages
- Tests in `test/` directories mirroring `src/` structure
- Configuration files (package.json, tsconfig.json) in package roots
