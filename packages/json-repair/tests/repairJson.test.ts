import { describe, it, expect } from "vitest";
import { extractJsonFromText, repairJson } from "@/index";

const mulberry32 = (seed: number) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const randInt = (rng: () => number, max: number) =>
  Math.floor(rng() * max);

const maybe = (rng: () => number, prob: number) => rng() < prob;

const pick = <T,>(rng: () => number, items: T[]): T =>
  items[randInt(rng, items.length)];

const buildBaseObject = (rng: () => number) => {
  const keys = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta"];
  const words = [
    "hello",
    "brace } in string",
    "url http://example.com",
    "value with [brackets]",
    "simple text",
  ];
  const count = 3 + randInt(rng, 3);
  const used = new Set<string>();
  const result: Record<string, string | number | boolean> = {};

  while (used.size < count) {
    const key = pick(rng, keys);
    if (used.has(key)) continue;
    used.add(key);

    const type = randInt(rng, 3);
    if (type === 0) result[key] = randInt(rng, 1000);
    if (type === 1) result[key] = rng() < 0.5;
    if (type === 2) result[key] = pick(rng, words);
  }

  return result;
};

const buildLooseJson = (seed: number) => {
  const rng = mulberry32(seed);
  const baseObject = buildBaseObject(rng);
  const wrapArray = maybe(rng, 0.2);
  const baseJson = wrapArray
    ? JSON.stringify([baseObject, { extra: randInt(rng, 10) }])
    : JSON.stringify(baseObject);

  let result = baseJson;

  const mutations: Array<(value: string) => string> = [
    (value) =>
      value.replace(/"([A-Za-z_][A-Za-z0-9_]*)":/g, (match, key) => {
        if (maybe(rng, 0.5)) return `${key}:`;
        return match;
      }),
    (value) =>
      value.replace(/"([^"\\]*)"/g, (match, token) => {
        if (maybe(rng, 0.35)) return `'${token}'`;
        return match;
      }),
    (value) =>
      value.replace(
        /([A-Za-z_][A-Za-z0-9_]*|'[^']*'|"[^"]*")\s*:/,
        "$1 ",
      ),
    (value) =>
      value.replace(
        /,\s*([A-Za-z_][A-Za-z0-9_]*|'[^']*'|"[^"]*")/,
        " $1",
      ),
    (value) => value.replace(/([{\[])\s*/, "$1 /* comment */ "),
    (value) => value.replace(/([}\]])$/, " // end\n$1"),
    (value) => value.replace(/([}\]])$/, ",$1"),
    (value) => value.replace(/([}\]])$/, ""),
  ];

  const mutationCount = 1 + randInt(rng, 2);
  for (let i = 0; i < mutationCount; i++) {
    const index = randInt(rng, mutations.length);
    const [mutation] = mutations.splice(index, 1);
    result = mutation(result);
  }

  if (maybe(rng, 0.5)) result = `Intro: ${result}`;
  if (maybe(rng, 0.5)) result = `${result} End.`;

  return result;
};

describe("repairJson", () => {
  it("repairs unquoted keys and trailing comma", () => {
    const input = '{name: "Seb", age: 42,}';
    const result = repairJson(input);
    expect(result).toBe('{"name":"Seb","age":42}');
  });

  it("repairs unquoted string value", () => {
    const input = "{city: Paris}";
    const result = repairJson(input);
    expect(result).toBe('{"city":"Paris"}');
  });

  it("repairs single-quoted strings", () => {
    const input = "{'name': 'Seb'}";
    const result = repairJson(input);
    expect(result).toBe('{"name":"Seb"}');
  });

  it("repairs unquoted string value with escaped quotes", () => {
    const input = '{"comment": "His name is "John"."}';
    const result = repairJson(input);
    expect(result).toBe('{"comment":"His name is \\"John\\"."}');
  });

  it("extracts JSON from LLM markdown block and repairs it", () => {
    const input = "```json\n{name: Seb, age: 30,}\n```";
    const result = repairJson(input, { extractJson: true });
    expect(result).toBe('{"name":"Seb","age":30}');
  });

  it("extracts JSON from LLM markdown block between text blocks and repairs it", () => {
    const input =
      "Hello, this is the JSON:\n\n```json\n{name: Seb, age: 30,}\n```\n\nThanks!";
    const result = repairJson(input, { extractJson: true });
    expect(result).toBe('{"name":"Seb","age":30}');
  });

  it("auto-extracts JSON from surrounding text by default", () => {
    const input = "Intro text... {name: Seb, age: 30,} ...outro";
    const result = repairJson(input);
    expect(result).toBe('{"name":"Seb","age":30}');
  });

  it("extracts JSON with braces inside strings", () => {
    const input = 'Intro {"text": "brace } in string", "ok": true} Outro';
    const extracted = extractJsonFromText(input);
    expect(extracted).toBe('{"text": "brace } in string", "ok": true}');
  });

  it("extracts unclosed JSON blocks to the end of input", () => {
    const input = 'Intro {"a": 1, "b": 2';
    const extracted = extractJsonFromText(input);
    expect(extracted).toBe('{"a": 1, "b": 2');
  });

  it("auto-extracts and repairs unclosed JSON inside text", () => {
    const input = 'Intro {"a": 1, "b": 2';
    const result = repairJson(input);
    expect(result).toBe('{"a":1,"b":2}');
  });

  it("extracts the first JSON block when multiple blocks exist", () => {
    const input = 'Intro {"a": 1} middle {"b": 2}';
    const extracted = extractJsonFromText(input);
    expect(extracted).toBe('{"a": 1}');
  });

  it("extracts arrays when they appear before objects", () => {
    const input = "Intro [1, 2, 3] middle {a: 1}";
    const extracted = extractJsonFromText(input);
    expect(extracted).toBe("[1, 2, 3]");
  });

  it("ignores braces inside comments when extracting JSON", () => {
    const input = 'Intro /* {not json} */ {"a": 1}';
    const extracted = extractJsonFromText(input);
    expect(extracted).toBe('{"a": 1}');
  });

  it("auto-extracts the first JSON block when multiple blocks exist", () => {
    const input = 'Intro {"a": 1} middle {"b": 2}';
    const result = repairJson(input);
    expect(result).toBe('{"a":1}');
  });

  it("repairs fuzzed inputs deterministically", () => {
    const seeds = Array.from({ length: 30 }, (_, i) => i + 1);
    for (const seed of seeds) {
      const input = buildLooseJson(seed);
      const result = repairJson(input);
      expect(typeof result).toBe("string");
      expect(() => JSON.parse(result as string)).not.toThrow();
    }
  });

  it("returns JS object instead of string when returnObject is true", () => {
    const input = "{name: Seb}";
    const result = repairJson(input, { returnObject: true });
    expect(result).toEqual({ name: "Seb" });
  });

  it("encodes non-ASCII characters to \\uXXXX format", () => {
    const input = '{"greeting": "Café"}';
    const result = repairJson(input, { encodeAscii: true });
    expect(result).toBe('{"greeting":"Caf\\u00e9"}');
  });

  it("replaces invalid JSON literal NaN with null", () => {
    const input = "{value: NaN}";
    const result = repairJson(input);
    expect(result).toBe('{"value":null}');
  });

  it("replaces Infinity variants with null", () => {
    const input = "{value: Infinity, other: -Infinity, missing: undefined}";
    const result = repairJson(input);
    expect(result).toBe('{"value":null,"other":null,"missing":null}');
  });

  // it('throws a safe error if repair fails and safeMode is true', () => {
  //   const input = '{name: "Seb"'; // missing closing brace
  //   expect(() => repairJson(input, { safeMode: true })).toThrow('Unable to repair invalid JSON.');
  // });

  // Additional edge cases

  it("removes comments in strings without other issue", () => {
    const input = '{"name": "Seb" // test comments}';
    const result = repairJson(input);
    expect(result).toBe('{"name":"Seb"}');
  });

  it("removes comments in strings with one issue", () => {
    const input = '{name: "Seb" // test comments}';
    const result = repairJson(input);
    expect(result).toBe('{"name":"Seb"}');
  });

  it("removes comments in strings with string value beginning only with double quotes", () => {
    const input = '{"name": "Seb // test comments}';
    const result = repairJson(input);
    expect(result).toBe('{"name":"Seb"}');
  });

  it("removes comments in strings with string value without double quotes", () => {
    const input = '{"name": Seb // test comments}';
    const result = repairJson(input);
    expect(result).toBe('{"name":"Seb"}');
  });

  it("keeps // inside quoted strings", () => {
    const input = '{url: "http://example.com"}';
    const result = repairJson(input);
    expect(result).toBe('{"url":"http://example.com"}');
  });

  it("removes block comments outside strings", () => {
    const input = '{name: "Seb" /* comment */, age: 42}';
    const result = repairJson(input);
    expect(result).toBe('{"name":"Seb","age":42}');
  });

  it("repairs nested unquoted keys", () => {
    const input = "{user: {name: Seb, age: 30}}";
    const result = repairJson(input);
    expect(result).toBe('{"user":{"name":"Seb","age":30}}');
  });

  it("repairs capitalized literals", () => {
    const input = "{valid: True, deleted: Null, open: FALSE}";
    const result = repairJson(input);
    expect(result).toBe('{"valid":true,"deleted":null,"open":false}');
  });

  it("repairs trailing comma in array", () => {
    const input = '["a", "b", ]';
    const result = repairJson(input);
    expect(result).toBe('["a","b"]');
  });

  it("normalizes line breaks inside string values", () => {
    const input = '{desc: "Line 1\nLine 2"}';
    const result = repairJson(input);
    expect(result).toBe('{"desc":"Line 1\\nLine 2"}');
  });

  it("repairs missing closing bracket", () => {
    const input = '{name: "Seb", age: 30';
    const result = repairJson(input);
    expect(result).toBe('{"name":"Seb","age":30}');
  });

  it("repairs missing colon between key and value", () => {
    const input = '{"name" "Seb"}';
    const result = repairJson(input);
    expect(result).toBe('{"name":"Seb"}');
  });

  it("repairs several errors on one line", () => {
    const input = '{"name": John", "age": 30, "city": "New York "';
    const result = repairJson(input);
    expect(result).toBe('{"name":"John","age":30,"city":"New York "}');
  });

  it("repairs missing commas between object properties", () => {
    const input = '{name: Seb age: 30 city: "Paris"}';
    const result = repairJson(input);
    expect(result).toBe('{"name":"Seb","age":30,"city":"Paris"}');
  });

  it("repairs missing commas between array values", () => {
    const input = "[1 2 3, 4]";
    const result = repairJson(input);
    expect(result).toBe("[1,2,3,4]");
  });
});
