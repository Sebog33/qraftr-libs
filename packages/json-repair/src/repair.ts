import { JsonRepairTokenizer, Token, TokenType } from "./tokenizer";

type Expectation = "value" | "key" | "colon" | "commaOrEnd";

function isCommaOrEnd(value: Expectation): boolean {
  return value === "commaOrEnd";
}

function normalizeNumber(raw: string): string {
  const num = Number(raw);
  if (!Number.isFinite(num)) return "null";
  return String(num);
}

function normalizeIdentifier(value: string): string {
  const lower = value.toLowerCase();
  if (lower === "true" || lower === "false" || lower === "null") return lower;
  if (
    lower === "nan" ||
    lower === "undefined" ||
    lower === "infinity" ||
    lower === "-infinity"
  ) {
    return "null";
  }
  return JSON.stringify(value);
}

export function repairToJsonString(input: string, safeMode: boolean): string {
  const tokenizer = new JsonRepairTokenizer(input);
  const stack: Array<"object" | "array"> = [];
  let expecting: Expectation = "value";
  let output = "";

  const setExpectingAfterValue = () => {
    expecting = "commaOrEnd";
  };

  const writeValueToken = (token: Token) => {
    switch (token.type) {
      case "string":
        output += JSON.stringify(token.value ?? "");
        setExpectingAfterValue();
        return;
      case "number":
        output += normalizeNumber(token.value ?? "0");
        setExpectingAfterValue();
        return;
      case "identifier":
        output += normalizeIdentifier(token.value ?? "");
        setExpectingAfterValue();
        return;
      case "braceOpen":
        output += "{";
        stack.push("object");
        expecting = "key";
        return;
      case "bracketOpen":
        output += "[";
        stack.push("array");
        expecting = "value";
        return;
      default:
        output += "null";
        setExpectingAfterValue();
    }
  };

  const closeContext = (tokenType: TokenType) => {
    if (tokenType === "braceClose") output += "}";
    if (tokenType === "bracketClose") output += "]";
    stack.pop();
    setExpectingAfterValue();
  };

  while (true) {
    const token = tokenizer.nextToken();
    if (!token) break;

    if (isCommaOrEnd(expecting) && stack.length === 0) {
      break;
    }

    if (expecting === "key") {
      if (token.type === "braceClose") {
        closeContext("braceClose");
        continue;
      }
      if (token.type === "comma") continue;

      const keyValue =
        token.type === "string"
          ? (token.value ?? "")
          : token.type === "identifier"
            ? (token.value ?? "")
            : token.type === "number"
              ? (token.value ?? "")
              : "";

      if (keyValue.length === 0 && token.type !== "string") continue;

      output += JSON.stringify(keyValue);
      expecting = "colon";
      continue;
    }

    if (expecting === "colon") {
      if (token.type === "colon") {
        output += ":";
        expecting = "value";
        continue;
      }

      output += ":";
      expecting = "value";
      writeValueToken(token);
      continue;
    }

    if (expecting === "value") {
      if (token.type === "braceClose") {
        output += "null";
        closeContext(token.type);
        continue;
      }
      if (token.type === "bracketClose") {
        closeContext(token.type);
        continue;
      }
      if (token.type === "comma") continue;

      writeValueToken(token);
      continue;
    }

    if (expecting === "commaOrEnd") {
      if (token.type === "comma") {
        const nextToken = tokenizer.peekToken();
        if (
          !nextToken ||
          nextToken.type === "braceClose" ||
          nextToken.type === "bracketClose"
        ) {
          continue;
        }
        output += ",";
        expecting = stack[stack.length - 1] === "object" ? "key" : "value";
        continue;
      }

      if (token.type === "braceClose" || token.type === "bracketClose") {
        closeContext(token.type);
        continue;
      }

      output += ",";
      expecting = stack[stack.length - 1] === "object" ? "key" : "value";
      if (expecting === "key") {
        const keyValue =
          token.type === "string"
            ? (token.value ?? "")
            : token.type === "identifier"
              ? (token.value ?? "")
              : token.type === "number"
                ? (token.value ?? "")
                : "";
        output += JSON.stringify(keyValue);
        expecting = "colon";
      } else {
        writeValueToken(token);
      }
    }
  }

  if (!safeMode) {
    while (stack.length > 0) {
      const type = stack.pop();
      output += type === "object" ? "}" : "]";
    }
  }

  return output;
}
