import { getCurrentUser } from "@/lib/auth";
import { assertVersionMember, routeError } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { videoUrl } from "@/lib/storage";

export async function GET(_request: Request, { params }: { params: { versionId: string } }) {
  try {
    const actor = await getCurrentUser();
    if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const version = await assertVersionMember(params.versionId, actor.id);

    const data = await prisma.videoVersion.findUniqueOrThrow({
      where: { id: version.id },
      include: {
        project: { include: { members: { include: { user: true } } } },
        comments: {
          include: {
            author: true,
            annotation: true,
            replies: { include: { author: true }, orderBy: { createdAt: "asc" } }
          },
          orderBy: [{ timeMs: "asc" }, { createdAt: "asc" }]
        }
      }
    });

    return Response.json({
      version: {
        ...data,
        videoUrl: videoUrl(data.filePath),
        coverUrl: data.coverPath ? videoUrl(data.coverPath) : null
      }
    });
  } catch (error) {
    return routeError(error);
  }
}
