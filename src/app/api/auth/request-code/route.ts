import { z } from "zod";
import { randomLoginCode, sha256 } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase())
});

export async function POST(request: Request) {
  const { email } = schema.parse(await request.json());
  const code = randomLoginCode();

  await prisma.loginCode.create({
    data: {
      email,
      codeHash: sha256(`${email}:${code}`),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    }
  });

  if (process.env.NODE_ENV !== "production" || process.env.SHOW_DEV_LOGIN_CODE === "true") {
    return Response.json({ ok: true, devCode: code });
  }

  console.info(`Login code requested for ${email}. Configure email delivery before production use.`);
  return Response.json({ ok: true });
}
