export function encodeAsciiIfNeeded(
  json: string,
  encodeAscii?: boolean,
): string {
  if (!encodeAscii) return json;
  return json.replace(
    /[^\x00-\x7F]/g,
    (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"),
  );
}
