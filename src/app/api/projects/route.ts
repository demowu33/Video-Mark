import { ProjectRole } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional()
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: user.id } } },
    include: {
      members: { include: { user: true } },
      versions: { orderBy: { version: "desc" }, take: 1 }
    },
    orderBy: { updatedAt: "desc" }
  });

  return Response.json({ projects });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const payload = createProjectSchema.parse(await request.json());
  const project = await prisma.project.create({
    data: {
      name: payload.name,
      description: payload.description,
      creatorId: user.id,
      members: {
        create: {
          userId: user.id,
          role: ProjectRole.OWNER
        }
      }
    }
  });

  return Response.json({ project }, { status: 201 });
}
