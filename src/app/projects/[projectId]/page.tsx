import { notFound } from "next/navigation";
import { AppFrame } from "@/components/AppFrame";
import { ProjectDetail } from "@/components/ProjectDetail";
import { requireUser } from "@/lib/auth";
import { getProjectMembership } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function ProjectPage({ params }: { params: { projectId: string } }) {
  const user = await requireUser();
  const membership = await getProjectMembership(params.projectId, user.id);
  if (!membership) notFound();

  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    include: {
      members: { include: { user: true }, orderBy: { createdAt: "asc" } },
      versions: {
        include: {
          _count: { select: { comments: true } }
        },
        orderBy: { version: "desc" }
      }
    }
  });
  if (!project) notFound();

  return (
    <AppFrame>
      <main className="mx-auto max-w-7xl px-5 py-8">
        <ProjectDetail
          project={{
            id: project.id,
            name: project.name,
            description: project.description,
            role: membership.role,
            members: project.members.map((member) => ({
              id: member.id,
              role: member.role,
              email: member.user.email,
              name: member.user.name
            })),
            versions: project.versions.map((version) => ({
              id: version.id,
              version: version.version,
              originalName: version.originalName,
              fileSize: version.fileSize,
              durationMs: version.durationMs,
              status: version.status,
              createdAt: version.createdAt.toISOString(),
              commentCount: version._count.comments
            }))
          }}
        />
      </main>
    </AppFrame>
  );
}
