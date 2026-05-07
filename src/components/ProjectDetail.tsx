"use client";

import { Upload, UserPlus, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ProjectRole = "OWNER" | "MEMBER";
type VideoStatus = "PROCESSING" | "READY" | "FAILED";

type ProjectDetailData = {
  id: string;
  name: string;
  description: string | null;
  role: ProjectRole;
  members: { id: string; role: ProjectRole; email: string; name: string | null }[];
  versions: {
    id: string;
    version: number;
    originalName: string;
    fileSize: number;
    durationMs: number;
    status: VideoStatus;
    createdAt: string;
    commentCount: number;
  }[];
};

export function ProjectDetail({ project }: { project: ProjectDetailData }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [memberEmail, setMemberEmail] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const canManage = project.role === "OWNER";

  async function uploadVideo(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return;
    setUploading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`/api/projects/${project.id}/videos`, {
      method: "POST",
      body: formData
    });
    const data = await response.json();
    setUploading(false);
    if (!response.ok) {
      setMessage(data.error ?? "上传失败");
      return;
    }
    router.push(`/review/${data.version.id}`);
    router.refresh();
  }

  async function inviteMember(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const response = await fetch(`/api/projects/${project.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: memberEmail })
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "邀请失败");
      return;
    }
    setMemberEmail("");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <aside className="space-y-4">
        <section className="rounded border border-line bg-white p-5">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description ? (
            <p className="mt-2 text-sm leading-6 text-stone-600">{project.description}</p>
          ) : null}
          <div className="mt-4 text-sm text-stone-500">
            你的权限：{project.role === "OWNER" ? "项目创建者" : "成员"}
          </div>
        </section>

        {canManage ? (
          <section className="rounded border border-line bg-white p-5">
            <h2 className="font-semibold">上传新版本</h2>
            <form onSubmit={uploadVideo} className="mt-4 space-y-3">
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="block w-full text-sm"
              />
              <button
                disabled={!file || uploading}
                className="focus-ring flex w-full items-center justify-center gap-2 rounded bg-accent px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                <Upload size={17} />
                {uploading ? "上传处理中" : "上传视频"}
              </button>
            </form>
          </section>
        ) : null}

        {canManage ? (
          <section className="rounded border border-line bg-white p-5">
            <h2 className="font-semibold">项目成员</h2>
            <form onSubmit={inviteMember} className="mt-4 flex gap-2">
              <input
                value={memberEmail}
                onChange={(event) => setMemberEmail(event.target.value)}
                type="email"
                placeholder="member@company.com"
                className="focus-ring min-w-0 flex-1 rounded border border-line px-3 py-2 text-sm"
              />
              <button
                disabled={!memberEmail}
                className="focus-ring flex h-10 w-10 items-center justify-center rounded bg-ink text-white disabled:opacity-50"
                title="邀请成员"
              >
                <UserPlus size={17} />
              </button>
            </form>
          </section>
        ) : null}

        <section className="rounded border border-line bg-white p-5">
          <h2 className="font-semibold">成员</h2>
          <div className="mt-3 space-y-2">
            {project.members.map((member) => (
              <div key={member.id} className="rounded border border-line px-3 py-2 text-sm">
                <div className="font-medium">{member.name ?? member.email}</div>
                <div className="text-stone-500">
                  {member.email} · {member.role === "OWNER" ? "创建者" : "成员"}
                </div>
              </div>
            ))}
          </div>
        </section>
        {message ? <p className="text-sm text-coral">{message}</p> : null}
      </aside>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">视频版本</h2>
          <span className="text-sm text-stone-500">{project.versions.length} 个版本</span>
        </div>
        <div className="grid gap-3">
          {project.versions.length ? (
            project.versions.map((version) => (
              <Link
                key={version.id}
                href={`/review/${version.id}`}
                className="rounded border border-line bg-white p-5 transition hover:border-accent hover:shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded bg-paper">
                      <Video size={20} />
                    </span>
                    <div>
                      <h3 className="font-semibold">
                        v{version.version} · {version.originalName}
                      </h3>
                      <p className="mt-1 text-sm text-stone-500">
                        {formatDuration(version.durationMs)} · {formatSize(version.fileSize)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold">{version.commentCount} 条评论</div>
                    <div className="text-stone-500">
                      {version.status === "READY" ? "可审核" : version.status}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded border border-dashed border-line bg-white p-8 text-center text-stone-500">
              上传第一个视频版本后，这里会出现审核入口。
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDuration(ms: number) {
  if (!ms) return "时长待识别";
  const total = Math.round(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}
