import { AnnotationKind } from "@prisma/client";
import { z } from "zod";
import { annotationPayloadSchema } from "@/lib/annotations";
import { getCurrentUser } from "@/lib/auth";
import { notifyProjectMembers } from "@/lib/notifications";
import { assertVersionMember, routeError } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  timeMs: z.number().int().min(0),
  body: z.string().trim().min(1).max(2000),
  annotation: annotationPayloadSchema.optional()
});

export async function POST(request: Request, { params }: { params: { versionId: string } }) {
  try {
    const actor = await getCurrentUser();
    if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const version = await assertVersionMember(params.versionId, actor.id);
    const payload = schema.parse(await request.json());

    const comment = await prisma.reviewComment.create({
      data: {
        versionId: params.versionId,
        authorId: actor.id,
        timeMs: payload.timeMs,
        body: payload.body,
        annotation: payload.annotation
          ? {
              create: {
                kind: payload.annotation.kind as AnnotationKind,
                payload: payload.annotation
              }
            }
          : undefined
      },
      include: { author: true, annotation: true, replies: { include: { author: true } } }
    });

    await notifyProjectMembers({
      projectId: version.projectId,
      actorId: actor.id,
      title: "新视频评论",
      body: `${actor.name ?? actor.email} 在 v${version.version} 添加了评论`,
      href: `/review/${version.id}?comment=${comment.id}`
    });

    return Response.json({ comment }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
