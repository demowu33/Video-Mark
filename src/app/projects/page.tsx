import { AppFrame } from "@/components/AppFrame";
import { ProjectDashboard } from "@/components/ProjectDashboard";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: user.id } } },
    include: {
      members: { include: { user: true } },
      versions: { orderBy: { version: "desc" }, take: 1 }
    },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <AppFrame>
      <main className="mx-auto max-w-7xl px-5 py-8">
        <ProjectDashboard
          projects={projects.map((project) => ({
            id: project.id,
            name: project.name,
            description: project.description,
            updatedAt: project.updatedAt.toISOString(),
            memberCount: project.members.length,
            latestVersion: project.versions[0]
              ? {
                  id: project.versions[0].id,
                  version: project.versions[0].version,
                  originalName: project.versions[0].originalName
                }
              : null
          }))}
        />
      </main>
    </AppFrame>
  );
}
