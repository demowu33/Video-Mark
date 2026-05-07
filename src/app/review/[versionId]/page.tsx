import { notFound } from "next/navigation";
import { AppFrame } from "@/components/AppFrame";
import { ReviewWorkspace } from "@/components/ReviewWorkspace";
import { requireUser } from "@/lib/auth";
import { getProjectMembership } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function ReviewPage({ params }: { params: { versionId: string } }) {
  const user = await requireUser();
  const version = await prisma.videoVersion.findUnique({
    where: { id: params.versionId },
    include: { project: true }
  });
  if (!version) notFound();
  const membership = await getProjectMembership(version.projectId, user.id);
  if (!membership) notFound();

  return (
    <AppFrame>
      <ReviewWorkspace versionId={version.id} currentUserId={user.id} />
    </AppFrame>
  );
}
