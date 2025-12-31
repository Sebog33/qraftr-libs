# @qraftr/image-convert

> A lightweight and focused utility to convert images to ICO format.
> Works with both **TypeScript** and **JavaScript** (ESM & CommonJS).

## Features

- Image to ICO conversion (supports PNG, JPEG, etc.)
- Support for:
  - Input from Buffer
  - EXIF-based auto-orientation
  - Metadata stripping to reduce file size
  - Automatic multiple size generation (16x16 to 256x256)
  - Custom size selection
- Minimalist and no unnecessary dependencies
- Windows icon compatible output
- Designed for Node.js environments only (sharp-based)

## Installation

```bash
pnpm add @qraftr/image-convert
```

Or with npm:

```bash
npm install @qraftr/image-convert
```

## Usage Examples

### TypeScript

> This module relies on `sharp` and must be used server-side only. Import it in Next.js API routes or server functions.

```ts
import { convertToIco } from "@qraftr/image-convert";
import { promises as fs } from "fs";

// Basic ICO conversion from file
async function convertFileToIco() {
  const imageBuffer = await fs.readFile("input.png");
  const icoBuffer = await convertToIco(imageBuffer);
  await fs.writeFile("output.ico", icoBuffer);
  console.log("Conversion completed successfully");
}

// With custom options
async function convertWithOptions() {
  const imageBuffer = await fs.readFile("input.png");
  const icoBuffer = await convertToIco(imageBuffer, {
    autoOrient: true,
    stripMetadata: true,
    sizes: [16, 32, 64],
  });
  await fs.writeFile("output.ico", icoBuffer);
}

// Handle errors
try {
  await convertFileToIco();
} catch (error) {
  console.error("Conversion failed:", error);
}
```

### JavaScript (CommonJS)

```js
const { convertToIco } = require("@qraftr/image-convert");
const fs = require("fs").promises;

async function convert() {
  const buffer = await fs.readFile("input.png");
  const icoBuffer = await convertToIco(buffer);
  await fs.writeFile("output.ico", icoBuffer);
}

convert()
  .then(() => console.log("Conversion completed"))
  .catch(console.error);
```

### JavaScript (ESM)

```js
import { convertToIco } from "@qraftr/image-convert";
import { promises as fs } from "fs";

try {
  const imageBuffer = await fs.readFile("input.png");
  const icoBuffer = await convertToIco(imageBuffer);
  await fs.writeFile("output.ico", icoBuffer);
  console.log("Conversion successful");
} catch (error) {
  console.error("Conversion error:", error);
}
```

### IcoOptions

```ts
interface IcoOptions {
  /**
   * Auto-orient based on EXIF data
   * @default true
   */
  autoOrient?: boolean;

  /**
   * Remove metadata (EXIF, profiles, comments)
   * @default true
   */
  stripMetadata?: boolean;

  /**
   * Sizes to generate for the ICO file (in pixels)
   * Must be between 16 and 256 pixels
   * @default [16, 24, 32, 48, 64, 96, 128, 192, 256]
   */
  sizes?: number[];
}
```

## Error Handling

The function will throw errors in the following cases:

- Input is not a Buffer
- Image size is less than 16px or greater than 256px
- Invalid image format
- Processing errors

## Motivation

This package was designed to provide a simple and efficient way to convert images to ICO format, working seamlessly in Node.js server environments. It is particularly useful for developers creating Windows applications or websites requiring high-quality icons.

## Author

Made by [@Sebog33](https://github.com/Sebog33)  
Follow [Qraftr Libs](https://qraftr.com/libs) for more tiny dev-focused utilities.

## License

MIT
