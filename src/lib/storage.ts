import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { randomToken } from "@/lib/crypto";

const allowedVideoTypes = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const signedReadSeconds = 60 * 60;

export type StorageDriver = "local" | "supabase";

export function getStorageDriver(): StorageDriver {
  if (process.env.STORAGE_DRIVER === "supabase") return "supabase";
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return "supabase";
  return "local";
}

export function getSupabaseBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET ?? "videos";
}

export function getPublicSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  };
}

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw Object.assign(new Error("Supabase storage is not configured"), { status: 500 });
  }
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

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

export function assertAllowedVideoMetadata(mimeType: string) {
  if (!allowedVideoTypes.has(mimeType)) {
    throw Object.assign(new Error("仅支持 mp4、webm、mov 视频文件"), { status: 400 });
  }
}

export async function saveVideoFile(projectId: string, version: number, file: File) {
  assertAllowedVideo(file);
  const extension = extensionForFileName(file.name, file.type);
  const relativePath = createVideoObjectPath(projectId, version, extension);
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

export async function createSignedVideoUpload(input: {
  projectId: string;
  version: number;
  fileName: string;
  mimeType: string;
}) {
  assertAllowedVideoMetadata(input.mimeType);
  const extension = extensionForFileName(input.fileName, input.mimeType);
  const relativePath = createVideoObjectPath(input.projectId, input.version, extension);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(getSupabaseBucket())
    .createSignedUploadUrl(relativePath);

  if (error || !data) {
    throw Object.assign(new Error(error?.message ?? "Failed to create signed upload URL"), {
      status: 500
    });
  }

  return {
    relativePath,
    token: data.token,
    path: data.path
  };
}

export async function createSignedReadUrl(relativePath: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(getSupabaseBucket())
    .createSignedUrl(relativePath, signedReadSeconds);

  if (error || !data?.signedUrl) {
    throw Object.assign(new Error(error?.message ?? "Failed to create signed read URL"), {
      status: 500
    });
  }

  return data.signedUrl;
}

export function createVideoObjectPath(projectId: string, version: number, extension: string) {
  return path.posix.join("videos", projectId, `v${version}-${randomToken(8)}${extension}`);
}

export function isProjectVideoPath(projectId: string, version: number, relativePath: string) {
  return relativePath.startsWith(`videos/${projectId}/v${version}-`);
}

export function coverPathFor(projectId: string, version: number) {
  return path.posix.join("covers", projectId, `v${version}-${randomToken(8)}.jpg`);
}

function extensionForFileName(fileName: string, mimeType: string) {
  const fromName = path.extname(fileName).toLowerCase();
  if ([".mp4", ".webm", ".mov"].includes(fromName)) return fromName;
  if (mimeType === "video/webm") return ".webm";
  if (mimeType === "video/quicktime") return ".mov";
  return ".mp4";
}
