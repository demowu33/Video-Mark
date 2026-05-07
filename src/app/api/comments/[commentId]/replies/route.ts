import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { notifyProjectMembers } from "@/lib/notifications";
import { assertProjectMember, routeError } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  body: z.string().trim().min(1).max(1500)
});

export async function POST(request: Request, { params }: { params: { commentId: string } }) {
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
    const reply = await prisma.commentReply.create({
      data: { commentId: comment.id, authorId: actor.id, body: payload.body },
      include: { author: true }
    });

    await notifyProjectMembers({
      projectId: comment.version.projectId,
      actorId: actor.id,
      title: "新评论回复",
      body: `${actor.name ?? actor.email} 回复了一条审核评论`,
      href: `/review/${comment.versionId}?comment=${comment.id}`
    });

    return Response.json({ reply }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
