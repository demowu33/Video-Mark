import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/projects");

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-5">
      <section className="w-full max-w-md rounded border border-line bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold text-accent">Video Mark</p>
          <h1 className="mt-2 text-2xl font-bold">团队视频审核</h1>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
