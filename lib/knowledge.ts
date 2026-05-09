import fs from "fs";
import path from "path";

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");
const SCREENSHOTS_DIR = path.join(KNOWLEDGE_DIR, "screenshots");
const MAX_KNOWLEDGE_BYTES = 100 * 1024; // 100 KB per file

let _knowledgeText: string | null = null;
let _screenshots: ScreenshotData[] | null = null;

export interface ScreenshotData {
  mimeType: "image/png" | "image/jpeg";
  data: string; // base64
}

/** Reads all .md files from knowledge/ and concatenates them for use in the system prompt. */
export function loadKnowledgeText(): string {
  if (_knowledgeText !== null) return _knowledgeText;

  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    _knowledgeText = "";
    return _knowledgeText;
  }

  const files = fs
    .readdirSync(KNOWLEDGE_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  _knowledgeText = files
    .map((f) => {
      const content = fs.readFileSync(path.join(KNOWLEDGE_DIR, f), "utf-8");
      if (Buffer.byteLength(content, "utf-8") > MAX_KNOWLEDGE_BYTES) {
        console.warn(`[knowledge] Skipping oversized file: ${f}`);
        return "";
      }
      return content;
    })
    .filter(Boolean)
    .join("\n\n---\n\n");

  return _knowledgeText;
}

/** Reads up to 5 images from knowledge/screenshots/ and returns them as base64 data. */
export function loadScreenshots(): ScreenshotData[] {
  if (_screenshots !== null) return _screenshots;

  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    _screenshots = [];
    return _screenshots;
  }

  const files = fs
    .readdirSync(SCREENSHOTS_DIR)
    .filter((f) => f.endsWith(".png") || f.endsWith(".jpg") || f.endsWith(".jpeg"))
    .slice(0, 5);

  _screenshots = files.map((f) => {
    const ext = path.extname(f).toLowerCase();
    const mimeType: "image/png" | "image/jpeg" =
      ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
    return {
      mimeType,
      data: fs.readFileSync(path.join(SCREENSHOTS_DIR, f)).toString("base64"),
    };
  });

  return _screenshots;
}
