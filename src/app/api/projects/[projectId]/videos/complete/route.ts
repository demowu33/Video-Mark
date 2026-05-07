import { VideoStatus } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwner, routeError } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { assertAllowedVideoMetadata, isProjectVideoPath } from "@/lib/storage";

const schema = z.object({
  versionNumber: z.number().int().min(1),
  fileName: z.string().trim().min(1).max(255),
  filePath: z.string().trim().min(1),
  fileSize: z.number().int().min(1),
  mimeType: z.string().trim().min(1),
  durationMs: z.number().int().min(0).optional()
});

export async function POST(request: Request, { params }: { params: { projectId: string } }) {
  try {
    const actor = await getCurrentUser();
    if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });
    await assertProjectOwner(params.projectId, actor.id);

    const payload = schema.parse(await request.json());
    assertAllowedVideoMetadata(payload.mimeType);

    if (!isProjectVideoPath(params.projectId, payload.versionNumber, payload.filePath)) {
      return Response.json({ error: "Invalid uploaded file path" }, { status: 400 });
    }

    const version = await prisma.videoVersion.create({
      data: {
        projectId: params.projectId,
        version: payload.versionNumber,
        originalName: payload.fileName,
        filePath: payload.filePath,
        coverPath: null,
        fileSize: payload.fileSize,
        mimeType: payload.mimeType,
        durationMs: payload.durationMs ?? 0,
        status: VideoStatus.READY,
        uploadedById: actor.id
      }
    });

    return Response.json({ version }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
