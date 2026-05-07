import { ProjectRole } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwner, routeError } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  name: z.string().trim().max(60).optional()
});

export async function POST(request: Request, { params }: { params: { projectId: string } }) {
  try {
    const actor = await getCurrentUser();
    if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });
    await assertProjectOwner(params.projectId, actor.id);

    const payload = schema.parse(await request.json());
    const user = await prisma.user.upsert({
      where: { email: payload.email },
      create: { email: payload.email, name: payload.name ?? payload.email.split("@")[0] },
      update: payload.name ? { name: payload.name } : {}
    });

    const member = await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: params.projectId, userId: user.id } },
      create: { projectId: params.projectId, userId: user.id, role: ProjectRole.MEMBER },
      update: {}
    });

    return Response.json({ member });
  } catch (error) {
    return routeError(error);
  }
}
