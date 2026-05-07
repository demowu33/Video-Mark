import { ProjectRole } from "@prisma/client";

export type MembershipLike = { userId: string; role: ProjectRole };

export function isProjectMember(userId: string, members: MembershipLike[]) {
  return members.some((member) => member.userId === userId);
}

export function canManageProject(userId: string, members: MembershipLike[]) {
  return members.some(
    (member) => member.userId === userId && member.role === ProjectRole.OWNER
  );
}

export function canEditComment(userId: string, authorId: string) {
  return userId === authorId;
}
