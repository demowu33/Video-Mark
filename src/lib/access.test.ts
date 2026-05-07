import { ProjectRole } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { canEditComment, canManageProject, isProjectMember } from "@/lib/access";

const members = [
  { userId: "owner", role: ProjectRole.OWNER },
  { userId: "member", role: ProjectRole.MEMBER }
];

describe("access helpers", () => {
  it("detects project membership", () => {
    expect(isProjectMember("member", members)).toBe(true);
    expect(isProjectMember("outsider", members)).toBe(false);
  });

  it("only lets owners manage the project", () => {
    expect(canManageProject("owner", members)).toBe(true);
    expect(canManageProject("member", members)).toBe(false);
  });

  it("only lets authors edit comment bodies", () => {
    expect(canEditComment("u1", "u1")).toBe(true);
    expect(canEditComment("u2", "u1")).toBe(false);
  });
});
