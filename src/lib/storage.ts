import fs from "node:fs/promises";
import path from "node:path";
import { randomToken } from "@/lib/crypto";

const allowedVideoTypes = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export function getUploadRoot() {
  return path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));
}

export function safeUploadPath(relativePath: string) {
  const root = getUploadRoot();
  const normalized = relativePath.split(/[\\/]+/).join(path.sep);
  const fullPath = path.resolve(root, normalized);
  const relativeFromRoot = path.relative(root, fullPath);
  if (relativeFromRoot.startsWith("..") || path.isAbsolute(relativeFromRoot)) {
    throw Object.assign(new Error("Invalid upload path"), { status: 400 });
  }
  return fullPath;
}

export function videoUrl(relativePath: string) {
  return `/api/uploads/${relativePath.split(/[\\/]+/).join("/")}`;
}

export function assertAllowedVideo(file: File) {
  if (!allowedVideoTypes.has(file.type)) {
    throw Object.assign(new Error("仅支持 mp4、webm、mov 视频文件"), { status: 400 });
  }
}

export async function saveVideoFile(projectId: string, version: number, file: File) {
  assertAllowedVideo(file);
  const extension = extensionForFile(file);
  const relativePath = path.posix.join("videos", projectId, `v${version}-${randomToken(8)}${extension}`);
  const fullPath = safeUploadPath(relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, bytes);
  return {
    relativePath,
    fullPath,
    size: bytes.byteLength
  };
}

export function coverPathFor(projectId: string, version: number) {
  return path.posix.join("covers", projectId, `v${version}-${randomToken(8)}.jpg`);
}

function extensionForFile(file: File) {
  const fromName = path.extname(file.name).toLowerCase();
  if ([".mp4", ".webm", ".mov"].includes(fromName)) return fromName;
  if (file.type === "video/webm") return ".webm";
  if (file.type === "video/quicktime") return ".mov";
  return ".mp4";
}
