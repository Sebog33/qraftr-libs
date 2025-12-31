# Qraftr Libs

**Qraftr Libs** is a collection of developer-focused utilities packaged as standalone NPM modules - fast, focused, and open source.

Each tool is fully independent, lightweight, and designed to solve one dev pain point at a time.

## Packages

| Tool                                                    | Description                                                            |
| ------------------------------------------------------- | ---------------------------------------------------------------------- |
| [`@qraftr/json-repair`](./packages/json-repair)         | Repairs broken JSON strings, especially useful with LLM or user inputs |
| [`@qraftr/json-merge`](./packages/json-merge)           | Deeply merges JSON objects with configurable strategies                |
| [`@qraftr/json-diff`](./packages/json-diff)             | Compares, intersects, or subtracts JSON objects deeply                 |
| [`@qraftr/json-schema-gen`](./packages/json-schema-gen) | Generates lightweight JSON schemas and validates data                  |
| [`@qraftr/image-convert`](./packages/image-convert)     | Converts images to ICO (Node.js only)                                  |

## Project structure

```
qraftr-libs/
  packages/
    json-repair/
    json-merge/
    json-diff/
    json-schema-gen/
    image-convert/
    typescript-config/
  pnpm-workspace.yaml
  turbo.json
  package.json
  README.md
```

## Usage

All packages are published under the `@qraftr` scope and can be installed individually:

```bash
pnpm add @qraftr/json-repair
```

## Author

Made by [@Sebog33](https://github.com/Sebog33)  
Follow [Qraftr Libs](https://qraftr.com/libs) for more tiny dev-focused utilities.

## License

MIT
