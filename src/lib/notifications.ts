import { prisma } from "@/lib/prisma";

export async function notifyProjectMembers(input: {
  projectId: string;
  actorId: string;
  title: string;
  body: string;
  href: string;
}) {
  const members = await prisma.projectMember.findMany({
    where: {
      projectId: input.projectId,
      userId: { not: input.actorId }
    },
    select: { userId: true }
  });

  if (!members.length) return;

  await prisma.notification.createMany({
    data: members.map((member) => ({
      userId: member.userId,
      title: input.title,
      body: input.body,
      href: input.href
    }))
  });
}
