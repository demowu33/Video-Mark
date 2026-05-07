"use client";

import { Plus, Users, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  updatedAt: string;
  memberCount: number;
  latestVersion: { id: string; version: number; originalName: string } | null;
};

export function ProjectDashboard({ projects }: { projects: ProjectSummary[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  async function createProject(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "创建失败");
      return;
    }
    router.push(`/projects/${data.project.id}`);
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <section className="rounded border border-line bg-white p-5">
        <h1 className="text-xl font-bold">创建审核项目</h1>
        <form onSubmit={createProject} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-medium">项目名称</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="focus-ring mt-1 w-full rounded border border-line px-3 py-2"
              placeholder="品牌广告 0429"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">说明</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="focus-ring mt-1 w-full resize-none rounded border border-line px-3 py-2"
              placeholder="审核目标、截止时间或交付说明"
            />
          </label>
          {error ? <p className="text-sm text-coral">{error}</p> : null}
          <button
            disabled={!name.trim()}
            className="focus-ring flex w-full items-center justify-center gap-2 rounded bg-ink px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            <Plus size={18} />
            新建项目
          </button>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">我的项目</h2>
          <span className="text-sm text-stone-500">{projects.length} 个项目</span>
        </div>
        <div className="grid gap-3">
          {projects.length ? (
            projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="rounded border border-line bg-white p-5 transition hover:border-accent hover:shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{project.name}</h3>
                    {project.description ? (
                      <p className="mt-1 text-sm text-stone-600">{project.description}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2 text-sm text-stone-600">
                    <span className="inline-flex items-center gap-1">
                      <Users size={15} />
                      {project.memberCount}
                    </span>
                    {project.latestVersion ? (
                      <span className="inline-flex items-center gap-1">
                        <Video size={15} />v{project.latestVersion.version}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 text-sm text-stone-500">
                  {project.latestVersion
                    ? `最新视频：${project.latestVersion.originalName}`
                    : "还没有上传视频版本"}
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded border border-dashed border-line bg-white p-8 text-center text-stone-500">
              创建第一个项目后，就可以上传视频并开始逐帧留评。
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
