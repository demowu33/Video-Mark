import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwner, routeError } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  createSignedVideoUpload,
  getPublicSupabaseConfig,
  getStorageDriver
} from "@/lib/storage";

const schema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1),
  fileSize: z.number().int().min(1)
});

export async function POST(request: Request, { params }: { params: { projectId: string } }) {
  try {
    const actor = await getCurrentUser();
    if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });
    await assertProjectOwner(params.projectId, actor.id);

    if (getStorageDriver() !== "supabase") {
      return Response.json({ error: "Signed uploads are only available with Supabase storage" }, { status: 400 });
    }

    const publicConfig = getPublicSupabaseConfig();
    if (!publicConfig.url || !publicConfig.anonKey) {
      return Response.json({ error: "Supabase public client config is missing" }, { status: 500 });
    }

    const payload = schema.parse(await request.json());
    const latest = await prisma.videoVersion.findFirst({
      where: { projectId: params.projectId },
      orderBy: { version: "desc" }
    });
    const versionNumber = (latest?.version ?? 0) + 1;
    const upload = await createSignedVideoUpload({
      projectId: params.projectId,
      version: versionNumber,
      fileName: payload.fileName,
      mimeType: payload.mimeType
    });

    return Response.json({
      upload,
      versionNumber,
      bucket: process.env.SUPABASE_STORAGE_BUCKET ?? "videos",
      supabase: publicConfig
    });
  } catch (error) {
    return routeError(error);
  }
}
