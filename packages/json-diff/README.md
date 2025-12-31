# @qraftr/json-diff

> A small but powerful utility to compare, intersect, or subtract JSON objects deeply.
> Works seamlessly with both **TypeScript** and **JavaScript** (ESM & CommonJS).

## Features

- Detects:
  - Added keys
  - Removed keys
  - Changed values
  - Identical key-values (intersection)
  - Keys to subtract from another JSON
- Fully recursive (works with nested structures)
- Useful for state comparison, config patching, debugging
- Lightweight, no dependencies

## Install

```bash
pnpm add @qraftr/json-diff
```

Or with npm:

```bash
npm install @qraftr/json-diff
```

## Example usage

### TypeScript

```ts
import { diffJson, intersectJson, subtractJson } from "@qraftr/json-diff";

const a = { name: "Seb", age: 42, extra: true };
const b = { name: "Seb", age: 33 };

console.log(diffJson(a, b));
// { added: {}, removed: { extra: true }, changed: { age: [42, 33] } }

console.log(intersectJson(a, b));
// { name: 'Seb' }

console.log(subtractJson(a, b));
// { age: 42, extra: true }
```

### JavaScript (CommonJS)

```js
const { diffJson, intersectJson, subtractJson } = require("@qraftr/json-diff");

console.log(diffJson({ a: 1 }, { a: 2 }));
```

### JavaScript (ESM)

```js
import { diffJson } from "@qraftr/json-diff";

console.log(diffJson({ a: 1 }, { a: 2 }));
```

## Functions

| Function              | Description                                    |
| --------------------- | ---------------------------------------------- |
| `diffJson(a, b)`      | Returns `{ added, removed, changed }`          |
| `intersectJson(a, b)` | Returns only the shared key-values             |
| `subtractJson(a, b)`  | Removes values from `a` that also exist in `b` |

## Examples

| A                         | B                        | diffJson(A, B)                       |
| ------------------------- | ------------------------ | ------------------------------------ |
| `{name: 'Seb', age: 42}`  | `{name: 'Seb', age: 33}` | `changed: { age: [42, 33] }`         |
| `{user: {role: 'admin'}}` | `{user: {role: 'user'}}` | `changed: { user: [...] }`           |
| `{a: 1, b: 2}`            | `{a: 1, c: 3}`           | `removed: { b: 2 }, added: { c: 3 }` |

## Live demonstration

Try it: [Qraftr Libs](https://qraftr.com/libs)

## Motivation

This utility was built to help developers quickly understand differences between JSON structures.
Whether debugging frontend state, comparing API responses, or writing patches - it is designed to give you clean, actionable data.

## Author

Made by [@Sebog33](https://github.com/Sebog33)  
Follow [Qraftr Libs](https://qraftr.com/libs) for more tiny dev-focused utilities.

## License

MIT
