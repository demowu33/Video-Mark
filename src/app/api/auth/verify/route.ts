import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { sha256 } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  code: z.string().length(6)
});

export async function POST(request: Request) {
  const { email, code } = schema.parse(await request.json());
  const loginCode = await prisma.loginCode.findFirst({
    where: {
      email,
      codeHash: sha256(`${email}:${code}`),
      usedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: "desc" }
  });

  if (!loginCode) {
    return Response.json({ error: "验证码无效或已过期" }, { status: 401 });
  }

  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name: email.split("@")[0] },
    update: {}
  });

  await prisma.loginCode.update({
    where: { id: loginCode.id },
    data: { usedAt: new Date(), userId: user.id }
  });

  const session = await createSession(user.id);
  cookies().set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: session.expiresAt,
    path: "/"
  });

  return NextResponse.json({ ok: true });
}
