import { VideoStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwner, routeError } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getStorageDriver, saveVideoFile } from "@/lib/storage";
import { generateCover, probeDurationMs } from "@/lib/video";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { projectId: string } }) {
  try {
    const actor = await getCurrentUser();
    if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });
    await assertProjectOwner(params.projectId, actor.id);

    if (getStorageDriver() === "supabase") {
      return Response.json(
        { error: "Supabase storage uses signed browser uploads. Use /videos/presign first." },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "请选择视频文件" }, { status: 400 });
    }

    const latest = await prisma.videoVersion.findFirst({
      where: { projectId: params.projectId },
      orderBy: { version: "desc" }
    });
    const versionNumber = (latest?.version ?? 0) + 1;
    const saved = await saveVideoFile(params.projectId, versionNumber, file);
    const durationMs = await probeDurationMs(saved.fullPath);
    const coverPath = await generateCover(params.projectId, versionNumber, saved.fullPath);

    const version = await prisma.videoVersion.create({
      data: {
        projectId: params.projectId,
        version: versionNumber,
        originalName: file.name,
        filePath: saved.relativePath,
        coverPath,
        fileSize: saved.size,
        mimeType: file.type,
        durationMs,
        status: VideoStatus.READY,
        uploadedById: actor.id
      }
    });

    return Response.json({ version }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
