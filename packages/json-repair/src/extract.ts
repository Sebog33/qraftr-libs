import { JsonRepairTokenizer, TokenType } from "./tokenizer";

/**
 * Attempts to extract a valid JSON block (between braces or brackets) from a string.
 */
export function extractJsonFromText(input: string): string {
  // First, try to extract content from markdown code blocks anywhere in the text
  const markdownMatch = input.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const cleaned = markdownMatch
    ? markdownMatch[1].trim()
    : input
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/```$/, "")
        .trim();

  const tokenizer = new JsonRepairTokenizer(cleaned);
  const stack: Array<"brace" | "bracket"> = [];
  let startIndex = -1;
  let endIndex = -1;

  const pushOpen = (type: TokenType) => {
    stack.push(type === "braceOpen" ? "brace" : "bracket");
  };

  const handleClose = (type: TokenType, tokenStart: number, tokenEnd: number) => {
    const last = stack.pop();
    const expected = type === "braceClose" ? "brace" : "bracket";
    if (last !== expected) {
      endIndex = tokenStart;
      return true;
    }
    if (stack.length === 0) {
      endIndex = tokenEnd;
      return true;
    }
    return false;
  };

  while (true) {
    const token = tokenizer.nextToken();
    if (!token) break;

    if (startIndex === -1) {
      if (token.type === "braceOpen" || token.type === "bracketOpen") {
        startIndex = token.start;
        pushOpen(token.type);
      }
      continue;
    }

    if (token.type === "braceOpen" || token.type === "bracketOpen") {
      pushOpen(token.type);
      continue;
    }

    if (token.type === "braceClose" || token.type === "bracketClose") {
      if (handleClose(token.type, token.start, token.end)) break;
    }
  }

  if (startIndex === -1) return input;
  if (endIndex === -1) return cleaned.substring(startIndex);
  return cleaned.substring(startIndex, endIndex);
}
