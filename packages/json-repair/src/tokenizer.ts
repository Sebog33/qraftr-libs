export type TokenType =
  | "braceOpen"
  | "braceClose"
  | "bracketOpen"
  | "bracketClose"
  | "colon"
  | "comma"
  | "string"
  | "number"
  | "identifier";

export type Token = {
  type: TokenType;
  value?: string;
  start: number;
  end: number;
};

export class JsonRepairTokenizer {
  private index = 0;

  constructor(private readonly input: string) {}

  peekToken(): Token | null {
    const current = this.index;
    const token = this.nextToken();
    this.index = current;
    return token;
  }

  nextToken(): Token | null {
    this.skipWhitespaceAndComments();
    if (this.index >= this.input.length) return null;

    const start = this.index;
    const c = this.input[this.index];

    if ((c === '"' || c === "'") && this.isStrayClosingQuote(this.index)) {
      this.index++;
      return this.nextToken();
    }

    if (c === '"' || c === "'") {
      return this.readStringToken(c);
    }

    const numberToken = this.readNumberToken();
    if (numberToken) return numberToken;

    if (this.isIdentifierStart(c)) {
      return this.readIdentifierToken();
    }

    if (c === "-" && this.isIdentifierStart(this.input[this.index + 1])) {
      return this.readIdentifierToken();
    }

    this.index++;
    switch (c) {
      case "{":
        return { type: "braceOpen", start, end: this.index };
      case "}":
        return { type: "braceClose", start, end: this.index };
      case "[":
        return { type: "bracketOpen", start, end: this.index };
      case "]":
        return { type: "bracketClose", start, end: this.index };
      case ":":
        return { type: "colon", start, end: this.index };
      case ",":
        return { type: "comma", start, end: this.index };
      default:
        return this.nextToken();
    }
  }

  private skipWhitespaceAndComments() {
    while (this.index < this.input.length) {
      const c = this.input[this.index];
      const next = this.input[this.index + 1];
      if (c === " " || c === "\t" || c === "\n" || c === "\r") {
        this.index++;
        continue;
      }
      if (c === "/" && next === "/") {
        this.index += 2;
        while (
          this.index < this.input.length &&
          this.input[this.index] !== "\n"
        ) {
          this.index++;
        }
        continue;
      }
      if (c === "/" && next === "*") {
        this.index += 2;
        while (this.index < this.input.length - 1) {
          if (
            this.input[this.index] === "*" &&
            this.input[this.index + 1] === "/"
          ) {
            this.index += 2;
            break;
          }
          this.index++;
        }
        continue;
      }
      break;
    }
  }

  private isStrayClosingQuote(pos: number): boolean {
    const prev = this.findPrevNonWhitespace(pos - 1);
    if (!prev) return false;
    if (!this.isIdentifierChar(prev) && !this.isDigit(prev)) return false;

    const next = this.findNextNonWhitespace(pos + 1);
    if (!next) return true;
    return next === "," || next === "}" || next === "]" || next === ":";
  }

  private readStringToken(quoteChar: string): Token {
    const start = this.index;
    this.index++;
    let value = "";
    let escaped = false;

    while (this.index < this.input.length) {
      const c = this.input[this.index];
      const next = this.input[this.index + 1];

      if (!escaped && c === "/" && (next === "/" || next === "*")) {
        if (!this.hasClosingQuoteBeforeNewline(this.index + 2, quoteChar)) {
          value = value.replace(/\s+$/, "");
          if (next === "/") {
            this.index += 2;
            while (
              this.index < this.input.length &&
              this.input[this.index] !== "\n"
            ) {
              this.index++;
            }
          } else {
            this.index += 2;
            while (this.index < this.input.length - 1) {
              if (
                this.input[this.index] === "*" &&
                this.input[this.index + 1] === "/"
              ) {
                this.index += 2;
                break;
              }
              this.index++;
            }
          }
          break;
        }
      }

      if (!escaped && c === quoteChar) {
        const nextIndex = this.findNextNonWhitespaceIndex(this.index + 1);
        const nextNonWhitespace =
          nextIndex === -1 ? null : this.input[nextIndex];
        const isCommentStart =
          nextNonWhitespace === "/" &&
          (this.input[nextIndex + 1] === "/" ||
            this.input[nextIndex + 1] === "*");
        const isTokenStart =
          nextNonWhitespace === "{" || nextNonWhitespace === "[";
        const isQuoteStart =
          nextNonWhitespace === '"' || nextNonWhitespace === "'";

        if (
          !nextNonWhitespace ||
          nextNonWhitespace === "," ||
          nextNonWhitespace === "}" ||
          nextNonWhitespace === "]" ||
          nextNonWhitespace === ":" ||
          isCommentStart ||
          isTokenStart ||
          isQuoteStart
        ) {
          this.index++;
          break;
        }
        value += quoteChar;
        this.index++;
        continue;
      }

      if (!escaped && c === "\\") {
        escaped = true;
        this.index++;
        continue;
      }

      if (escaped) {
        value += this.decodeEscape(c);
        escaped = false;
        this.index++;
        continue;
      }

      value += c;
      this.index++;
    }

    if (escaped) value += "\\";

    return { type: "string", value, start, end: this.index };
  }

  private decodeEscape(c: string): string {
    switch (c) {
      case "n":
        return "\n";
      case "r":
        return "\r";
      case "t":
        return "\t";
      case "b":
        return "\b";
      case "f":
        return "\f";
      case "\\":
        return "\\";
      case '"':
        return '"';
      case "'":
        return "'";
      case "/":
        return "/";
      case "u": {
        const hex = this.input.slice(this.index + 1, this.index + 5);
        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
          this.index += 4;
          return String.fromCharCode(parseInt(hex, 16));
        }
        return "u";
      }
      default:
        return c;
    }
  }

  private hasClosingQuoteBeforeNewline(
    start: number,
    quoteChar: string,
  ): boolean {
    let escaped = false;
    for (let i = start; i < this.input.length; i++) {
      const c = this.input[i];
      if (c === "\n" || c === "\r") return false;
      if (escaped) {
        escaped = false;
        continue;
      }
      if (c === "\\") {
        escaped = true;
        continue;
      }
      if (c === quoteChar) return true;
    }
    return false;
  }

  private readNumberToken(): Token | null {
    const start = this.index;
    let i = this.index;

    if (this.input[i] === "+" || this.input[i] === "-") i++;

    let hasDigits = false;
    while (this.isDigit(this.input[i])) {
      i++;
      hasDigits = true;
    }

    if (this.input[i] === ".") {
      i++;
      while (this.isDigit(this.input[i])) {
        i++;
        hasDigits = true;
      }
    }

    if (!hasDigits) return null;

    if (this.input[i] === "e" || this.input[i] === "E") {
      const expStart = i;
      i++;
      if (this.input[i] === "+" || this.input[i] === "-") i++;
      const expDigitsStart = i;
      while (this.isDigit(this.input[i])) i++;
      if (expDigitsStart === i) {
        i = expStart;
      }
    }

    const raw = this.input.slice(start, i);
    this.index = i;
    return { type: "number", value: raw, start, end: this.index };
  }

  private readIdentifierToken(): Token {
    const start = this.index;
    let i = this.index;

    if (this.input[i] === "-") i++;
    while (
      this.isIdentifierChar(this.input[i]) ||
      this.isDigit(this.input[i]) ||
      this.input[i] === "-"
    ) {
      i++;
    }

    const value = this.input.slice(start, i);
    this.index = i;
    return { type: "identifier", value, start, end: this.index };
  }

  private isIdentifierStart(c?: string): boolean {
    if (!c) return false;
    return /[A-Za-z_$]/.test(c);
  }

  private isIdentifierChar(c?: string): boolean {
    if (!c) return false;
    return /[A-Za-z_$]/.test(c);
  }

  private isDigit(c?: string): boolean {
    if (!c) return false;
    return c >= "0" && c <= "9";
  }

  private findPrevNonWhitespace(pos: number): string | null {
    for (let i = pos; i >= 0; i--) {
      const c = this.input[i];
      if (c !== " " && c !== "\t" && c !== "\n" && c !== "\r") return c;
    }
    return null;
  }

  private findNextNonWhitespace(pos: number): string | null {
    for (let i = pos; i < this.input.length; i++) {
      const c = this.input[i];
      if (c !== " " && c !== "\t" && c !== "\n" && c !== "\r") return c;
    }
    return null;
  }

  private findNextNonWhitespaceIndex(pos: number): number {
    for (let i = pos; i < this.input.length; i++) {
      const c = this.input[i];
      if (c !== " " && c !== "\t" && c !== "\n" && c !== "\r") return i;
    }
    return -1;
  }
}
