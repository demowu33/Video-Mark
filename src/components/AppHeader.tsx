"use client";

import { Bell, LogOut, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};

export function AppHeader({
  user,
  notifications
}: {
  user: { email: string; name: string | null };
  notifications: Notification[];
}) {
  const router = useRouter();
  const unread = notifications.filter((item) => !item.readAt).length;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function markRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    router.refresh();
  }

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <Link href="/projects" className="flex items-center gap-2 text-lg font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded bg-ink text-white">
            <Video size={19} />
          </span>
          Video Mark
        </Link>
        <div className="flex items-center gap-3">
          <details className="relative">
            <summary className="focus-ring flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded border border-line bg-paper">
              <Bell size={18} />
              {unread > 0 ? (
                <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-coral px-1 text-center text-xs font-bold text-white">
                  {unread}
                </span>
              ) : null}
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-80 rounded border border-line bg-white p-2 shadow-lg">
              <div className="mb-2 flex items-center justify-between px-2 pt-1">
                <span className="font-semibold">通知</span>
                <button onClick={markRead} className="text-sm text-accent hover:underline">
                  标为已读
                </button>
              </div>
              <div className="max-h-80 overflow-auto">
                {notifications.length ? (
                  notifications.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="block rounded px-2 py-2 hover:bg-paper"
                    >
                      <div className="flex items-center gap-2">
                        {!item.readAt ? <span className="h-2 w-2 rounded-full bg-coral" /> : null}
                        <span className="text-sm font-semibold">{item.title}</span>
                      </div>
                      <p className="mt-1 text-sm text-stone-600">{item.body}</p>
                    </Link>
                  ))
                ) : (
                  <p className="px-2 py-6 text-center text-sm text-stone-500">暂无通知</p>
                )}
              </div>
            </div>
          </details>
          <div className="hidden text-right sm:block">
            <div className="text-sm font-semibold">{user.name ?? user.email}</div>
            <div className="text-xs text-stone-500">{user.email}</div>
          </div>
          <button
            onClick={logout}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded border border-line bg-white hover:bg-paper"
            title="退出登录"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}
