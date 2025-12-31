# @qraftr/json-repair

> A small but powerful utility to repair broken JSON strings - especially useful when dealing with LLM output or hand-written JSON.  
> Need to repair JSON? This tool automatically fixes malformed or broken JSON structures with a single function call.
> Works seamlessly with both **TypeScript** and **JavaScript** (ESM & CommonJS).

## Features

- Fixes:
  - Unquoted keys
  - Unquoted string values
  - Trailing commas
  - Missing commas between values
  - Missing colons between keys and values
  - Invalid literals (NaN, undefined, Infinity)
  - Capitalized literals (True, False, Null)
  - Single quotes
  - Line and block comments
  - Unclosed strings in noisy input
  - Missing closing braces
  - Misplaced quotes inside strings
  - LLM code blocks (e.g. `json ... `)
  - LLM JSON extraction (e.g. `The result is: {...}`)
- Auto-extracts JSON blocks from surrounding text as a fallback
- Option to return a string or JS object
- ASCII escaping (converts non-ASCII characters to `\uXXXX`)
- Safe fallback mode

## Install

```bash
pnpm add @qraftr/json-repair
```

Or with npm:

```bash
npm install @qraftr/json-repair
```

## Example usage

### TypeScript

```ts
import { repairJson } from "@qraftr/json-repair";

const input = `{name: Seb, age: 42,}`;
const repaired = repairJson(input);
console.log(repaired);
// {"name":"Seb","age":42}
```

### JavaScript (CommonJS)

```js
const { repairJson } = require("@qraftr/json-repair");

console.log(repairJson("{name: Seb, age: 42,}"));
```

### JavaScript (ESM)

```js
import { repairJson } from "@qraftr/json-repair";

console.log(repairJson("{name: Seb, age: 42,}"));
```

## Options

| Option                   | Type    | Default | Description                                                       |
| ------------------------ | ------- | ------- | ----------------------------------------------------------------- |
| `extractJson`            | boolean | `false` | Extract the first JSON block up front from surrounding text       |
| `disableExtractFallback` | boolean | `false` | Disable the automatic fallback extraction when parsing fails      |
| `encodeAscii`            | boolean | `false` | Escape non-ASCII characters to `\uXXXX`                           |
| `returnObject`           | boolean | `false` | Return a JS object instead of a JSON string                       |
| `logging`                | boolean | `false` | Enable console logs of each transformation step                   |
| `safeMode`               | boolean | `false` | Throw a friendly error instead of crashing on unrecoverable input |

Automatic fallback: if parsing fails (or yields only a primitive) and a JSON block is found inside the input, it will be extracted and repaired unless `disableExtractFallback` is set to `true`.

## Examples

| Input                               | Output                             |
| ----------------------------------- | ---------------------------------- |
| `{name: Seb}`                       | `{"name":"Seb"}`                   |
| `{user: {name: Seb, age: 30}}`      | `{"user":{"name":"Seb","age":30}}` |
| `{value: NaN}`                      | `{"value":null}`                   |
| `Intro... {name: Seb} ...outro`     | `{"name":"Seb"}`                   |
| `Hello!\n\n\`\`\`json\n{name: Seb}` | `{"name":"Seb"}`                   |

## Live demonstration

Try it: [Qraftr Libs](https://qraftr.com/libs)

## Motivation

This package was designed to help deal with **malformed JSON**, especially the kind you get from LLMs like ChatGPT and OpenAI APIs when asking for `json` output.
This package is ideal if you're looking to **repair JSON**, **fix malformed JSON**, or **sanitize AI-generated output**.
It can also be used to quickly recover and parse broken logs or hand-crafted config files.

## Author

Made by [@Sebog33](https://github.com/Sebog33)  
Follow [Qraftr Libs](https://qraftr.com/libs) for more tiny dev-focused utilities.

## License

MIT
