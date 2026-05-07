import { CommentStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { canTransitionCommentStatus, commentStatusLabels } from "@/lib/comment-state";

describe("comment state", () => {
  it("accepts the three supported statuses", () => {
    expect(canTransitionCommentStatus(CommentStatus.OPEN)).toBe(true);
    expect(canTransitionCommentStatus(CommentStatus.IN_PROGRESS)).toBe(true);
    expect(canTransitionCommentStatus(CommentStatus.RESOLVED)).toBe(true);
  });

  it("has a user-facing label for each status", () => {
    expect(commentStatusLabels.OPEN).toBe("待处理");
    expect(commentStatusLabels.IN_PROGRESS).toBe("处理中");
    expect(commentStatusLabels.RESOLVED).toBe("已解决");
  });
});
