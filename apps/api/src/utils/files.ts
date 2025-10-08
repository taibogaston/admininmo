import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");

export const ensureUploadsDir = (...segments: string[]): string => {
  const dirPath = path.join(UPLOADS_ROOT, ...segments);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
};

export const sanitizeFileName = (original: string): string => {
  const ext = path.extname(original);
  const base = path.basename(original, ext).replace(/[^a-zA-Z0-9-_]+/g, "-");
  return `${base}-${randomUUID()}${ext.toLowerCase()}`;
};

export const getUploadsRoot = (): string => UPLOADS_ROOT;
