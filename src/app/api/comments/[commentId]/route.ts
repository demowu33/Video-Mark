import { CommentStatus } from "@prisma/client";
import { z } from "zod";
import { canTransitionCommentStatus } from "@/lib/comment-state";
import { getCurrentUser } from "@/lib/auth";
import { notifyProjectMembers } from "@/lib/notifications";
import { assertProjectMember, routeError } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  body: z.string().trim().min(1).max(2000).optional(),
  status: z.nativeEnum(CommentStatus).optional()
});

export async function PATCH(request: Request, { params }: { params: { commentId: string } }) {
  try {
    const actor = await getCurrentUser();
    if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const comment = await prisma.reviewComment.findUnique({
      where: { id: params.commentId },
      include: { version: true }
    });
    if (!comment) return Response.json({ error: "Comment not found" }, { status: 404 });
    await assertProjectMember(comment.version.projectId, actor.id);

    const payload = schema.parse(await request.json());
    if (payload.body && comment.authorId !== actor.id) {
      return Response.json({ error: "只能编辑自己的评论正文" }, { status: 403 });
    }
    if (payload.status && !canTransitionCommentStatus(payload.status)) {
      return Response.json({ error: "评论状态无效" }, { status: 400 });
    }

    const updated = await prisma.reviewComment.update({
      where: { id: comment.id },
      data: payload,
      include: {
        author: true,
        annotation: true,
        replies: { include: { author: true }, orderBy: { createdAt: "asc" } }
      }
    });

    if (payload.status && payload.status !== comment.status) {
      await notifyProjectMembers({
        projectId: comment.version.projectId,
        actorId: actor.id,
        title: "评论状态已更新",
        body: `${actor.name ?? actor.email} 将评论状态更新为 ${payload.status}`,
        href: `/review/${comment.versionId}?comment=${comment.id}`
      });
    }

    return Response.json({ comment: updated });
  } catch (error) {
    return routeError(error);
  }
}
