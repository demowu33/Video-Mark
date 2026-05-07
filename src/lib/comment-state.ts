import { CommentStatus } from "@prisma/client";

export const commentStatusLabels: Record<CommentStatus, string> = {
  OPEN: "待处理",
  IN_PROGRESS: "处理中",
  RESOLVED: "已解决"
};

export function canTransitionCommentStatus(next: CommentStatus) {
  return Object.values(CommentStatus).includes(next);
}
