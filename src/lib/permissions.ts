import { ProjectRole } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";

export async function getProjectMembership(projectId: string, userId: string) {
  return prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } }
  });
}

export async function assertProjectMember(projectId: string, userId: string) {
  const membership = await getProjectMembership(projectId, userId);
  if (!membership) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }
  return membership;
}

export async function assertProjectOwner(projectId: string, userId: string) {
  const membership = await assertProjectMember(projectId, userId);
  if (membership.role !== ProjectRole.OWNER) {
    throw Object.assign(new Error("Only project owners can do this"), { status: 403 });
  }
  return membership;
}

export async function assertVersionMember(versionId: string, userId: string) {
  const version = await prisma.videoVersion.findUnique({
    where: { id: versionId },
    include: { project: true }
  });
  if (!version) throw Object.assign(new Error("Video version not found"), { status: 404 });
  await assertProjectMember(version.projectId, userId);
  return version;
}

export function routeError(error: unknown) {
  if (error instanceof ZodError) {
    return Response.json({ error: error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const status =
    typeof error === "object" && error && "status" in error
      ? Number((error as { status: number }).status)
      : 500;
  const message = error instanceof Error ? error.message : "Unexpected error";
  return Response.json({ error: message }, { status });
}
