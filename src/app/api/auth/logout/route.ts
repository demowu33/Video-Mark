import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import { sha256 } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
  }
  cookies().delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
