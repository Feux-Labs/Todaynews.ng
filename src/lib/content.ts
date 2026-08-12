const ALLOWED_TAGS = new Set([
  "a",
  "blockquote",
  "br",
  "div",
  "em",
  "h2",
  "h3",
  "h4",
  "li",
  "ol",
  "p",
  "span",
  "strong",
  "ul",
]);

const ALLOWED_ATTRS = new Set(["class", "href", "rel", "target"]);

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function textToParagraphHtml(value: string): string {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p class="mb-4">${escapeHtml(paragraph)}</p>`)
    .join("");
}

export function sanitizeArticleHtml(html: string): string {
  if (!html) return "";

  let safe = html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*(["']).*?\1/gi, "")
    .replace(/\s(href)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, "");

  safe = safe.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, rawTag, rawAttrs = "") => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (match.startsWith("</")) return `</${tag}>`;

    const attrs: string[] = [];
    rawAttrs.replace(/([a-zA-Z:-]+)\s*=\s*(["'])(.*?)\2/g, (_: string, rawName: string, quote: string, rawValue: string) => {
      const name = rawName.toLowerCase();
      if (!ALLOWED_ATTRS.has(name)) return "";
      if (name === "href" && !/^https?:\/\/|^\//i.test(rawValue)) return "";
      attrs.push(`${name}=${quote}${escapeHtml(rawValue)}${quote}`);
      return "";
    });

    if (tag === "a") {
      if (!attrs.some((attr) => attr.startsWith("rel="))) attrs.push('rel="noopener noreferrer"');
      if (!attrs.some((attr) => attr.startsWith("target="))) attrs.push('target="_blank"');
    }

    return `<${tag}${attrs.length ? ` ${attrs.join(" ")}` : ""}>`;
  });

  return safe;
}

