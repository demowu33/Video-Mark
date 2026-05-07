import { AppHeader } from "@/components/AppHeader";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function AppFrame({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30
  });

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader
        user={{ email: user.email, name: user.name }}
        notifications={notifications.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          readAt: item.readAt?.toISOString() ?? null
        }))}
      />
      {children}
    </div>
  );
}
