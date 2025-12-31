import { encodeAsciiIfNeeded } from "./encode";
import { extractJsonFromText } from "./extract";
import { repairToJsonString } from "./repair";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface RepairOptions {
  safeMode?: boolean; // If true, limits aggressive repairs and throws a shorter error on failure
  extractJson?: boolean; // Attempts to extract the first valid JSON block
  disableExtractFallback?: boolean; // If true, prevents automatic JSON extraction on failure
  encodeAscii?: boolean; // Converts all non-ASCII characters to \uXXXX notation
  returnObject?: boolean; // If true, returns a JS object instead of a JSON string (default: false)
  logging?: boolean; // Log each transformation step
}

export { extractJsonFromText };

/**
 * Repairs a potentially incorrect JSON string by applying various
 * transformations (extraction, removal of trailing commas, quoting, etc.).
 * Returns either a JSON string (default) or a JS object (if `returnObject` is true).
 */
export function repairJson(
  input: string,
  options: RepairOptions & { returnObject: true },
): JsonValue;
export function repairJson(
  input: string,
  options?: RepairOptions & { returnObject?: false | undefined },
): string;
export function repairJson(
  input: string,
  options: RepairOptions = {},
): unknown {
  try {
    const parsed = JSON.parse(input);
    if (!options.returnObject) {
      return encodeAsciiIfNeeded(JSON.stringify(parsed), options.encodeAscii);
    }
    return parsed;
  } catch (e) {
    if (options.logging) {
      console.warn("JSON.parse failed:", e);
      console.warn("Trying to repair JSON...");
    }

    const extractRequested = options.extractJson === true;
    const allowExtractFallback = options.disableExtractFallback !== true;

    let fixed = input;

    if (extractRequested) {
      fixed = extractJsonFromText(fixed);
      if (options.logging) console.log("Extracted JSON block:", fixed);
    }

    const repairedString = repairToJsonString(fixed, Boolean(options.safeMode));
    if (options.logging) console.log("Repaired JSON string:", repairedString);

    try {
      const repaired = JSON.parse(repairedString);

      if (allowExtractFallback && !extractRequested) {
        const extracted = extractJsonFromText(input);
        if (extracted !== input) {
          const extractedString = repairToJsonString(
            extracted,
            Boolean(options.safeMode),
          );
          try {
            const extractedParsed = JSON.parse(extractedString);
            if (typeof repaired !== "object" || repaired === null) {
              if (options.logging) {
                console.log("Auto-extracted JSON block:", extractedString);
              }
              if (options.returnObject) return extractedParsed;
              return encodeAsciiIfNeeded(
                JSON.stringify(extractedParsed),
                options.encodeAscii,
              );
            }
          } catch {
            // Ignore fallback failures and continue with the original repaired value.
          }
        }
      }

      if (!options.returnObject) {
        return encodeAsciiIfNeeded(JSON.stringify(repaired), options.encodeAscii);
      }

      return repaired;
    } catch (err) {
      if (allowExtractFallback && !extractRequested) {
        const extracted = extractJsonFromText(input);
        if (extracted !== input) {
          const extractedString = repairToJsonString(
            extracted,
            Boolean(options.safeMode),
          );
          try {
            const extractedParsed = JSON.parse(extractedString);
            if (options.logging) {
              console.log("Auto-extracted JSON block:", extractedString);
            }
            if (!options.returnObject) {
              return encodeAsciiIfNeeded(
                JSON.stringify(extractedParsed),
                options.encodeAscii,
              );
            }
            return extractedParsed;
          } catch {
            // Continue to error handling below.
          }
        }
      }
      if (options.logging) {
        console.warn("[json-repair] Repair failed:", err);
      }

      const preview = input.slice(0, 100).replace(/\n/g, " ").trim();

      const baseMessage = "[json-repair] Failed to parse repaired JSON.";
      const details =
        err instanceof Error ? err.message : "Unknown parsing error";
      const combined = `${baseMessage} ${details} Input was: "${preview}..."`;

      if (options.safeMode) {
        throw new Error(baseMessage);
      } else {
        throw new Error(combined);
      }
    }
  }
}
