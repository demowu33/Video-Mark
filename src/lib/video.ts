import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { coverPathFor, safeUploadPath } from "@/lib/storage";

const execFileAsync = promisify(execFile);

export async function probeDurationMs(filePath: string) {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath
    ]);
    const seconds = Number(stdout.trim());
    return Number.isFinite(seconds) ? Math.round(seconds * 1000) : 0;
  } catch {
    return 0;
  }
}

export async function generateCover(projectId: string, version: number, inputPath: string) {
  const relativePath = coverPathFor(projectId, version);
  const outputPath = safeUploadPath(relativePath);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  try {
    await execFileAsync("ffmpeg", [
      "-y",
      "-ss",
      "00:00:01",
      "-i",
      inputPath,
      "-frames:v",
      "1",
      "-q:v",
      "3",
      outputPath
    ]);
    return relativePath;
  } catch {
    return null;
  }
}
