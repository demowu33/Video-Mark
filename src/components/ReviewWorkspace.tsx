"use client";

import { ArrowLeft, Circle, MousePointer2, Pencil, RectangleHorizontal, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnnotationCanvas } from "@/components/AnnotationCanvas";
import type { AnnotationPayload } from "@/lib/annotations";

type CommentStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
type Tool = "RECT" | "ARROW" | "FREEHAND";

type ReviewComment = {
  id: string;
  timeMs: number;
  body: string;
  status: CommentStatus;
  authorId: string;
  createdAt: string;
  author: { email: string; name: string | null };
  annotation: { payload: AnnotationPayload } | null;
  replies: {
    id: string;
    body: string;
    createdAt: string;
    author: { email: string; name: string | null };
  }[];
};

type VersionData = {
  id: string;
  version: number;
  originalName: string;
  durationMs: number;
  videoUrl: string;
  project: { id: string; name: string };
  comments: ReviewComment[];
};

const statusLabels: Record<CommentStatus, string> = {
  OPEN: "待处理",
  IN_PROGRESS: "处理中",
  RESOLVED: "已解决"
};

export function ReviewWorkspace({
  versionId,
  currentUserId
}: {
  versionId: string;
  currentUserId: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [version, setVersion] = useState<VersionData | null>(null);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [timeMs, setTimeMs] = useState(0);
  const [body, setBody] = useState("");
  const [draft, setDraft] = useState<AnnotationPayload | null>(null);
  const [tool, setTool] = useState<Tool>("RECT");
  const [isPaused, setIsPaused] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadVersion();
  }, [versionId]);

  async function loadVersion() {
    const response = await fetch(`/api/videos/${versionId}`);
    const data = await response.json();
    if (response.ok) {
      setVersion(data.version);
      setComments(data.version.comments);
      const target = new URLSearchParams(window.location.search).get("comment");
      if (target) setActiveId(target);
    } else {
      setMessage(data.error ?? "加载失败");
    }
  }

  const activeComment = useMemo(
    () => comments.find((comment) => comment.id === activeId) ?? null,
    [activeId, comments]
  );

  function syncTime() {
    setTimeMs(Math.round((videoRef.current?.currentTime ?? 0) * 1000));
  }

  function jumpTo(comment: ReviewComment) {
    setActiveId(comment.id);
    setDraft(null);
    if (videoRef.current) {
      videoRef.current.currentTime = comment.timeMs / 1000;
      videoRef.current.pause();
    }
  }

  async function createComment(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const response = await fetch(`/api/videos/${versionId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeMs, body, annotation: draft ?? undefined })
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "提交失败");
      return;
    }
    setComments((items) => [...items, data.comment].sort((a, b) => a.timeMs - b.timeMs));
    setBody("");
    setDraft(null);
    setActiveId(data.comment.id);
  }

  async function updateStatus(comment: ReviewComment, status: CommentStatus) {
    const response = await fetch(`/api/comments/${comment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (response.ok) {
      setComments((items) => items.map((item) => (item.id === comment.id ? data.comment : item)));
    }
  }

  async function addReply(comment: ReviewComment) {
    const text = replyText[comment.id]?.trim();
    if (!text) return;
    const response = await fetch(`/api/comments/${comment.id}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text })
    });
    const data = await response.json();
    if (response.ok) {
      setComments((items) =>
        items.map((item) =>
          item.id === comment.id ? { ...item, replies: [...item.replies, data.reply] } : item
        )
      );
      setReplyText((items) => ({ ...items, [comment.id]: "" }));
    }
  }

  if (!version) {
    return (
      <main className="mx-auto max-w-7xl px-5 py-8">
        <p className="rounded border border-line bg-white p-5 text-stone-600">
          {message || "正在加载审核空间"}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/projects/${version.project.id}`}
            className="inline-flex items-center gap-1 text-sm text-stone-600 hover:text-accent"
          >
            <ArrowLeft size={16} />
            {version.project.name}
          </Link>
          <h1 className="mt-1 text-2xl font-bold">
            v{version.version} · {version.originalName}
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded border border-line bg-white px-3 py-2 text-sm">
          <Circle size={12} className="fill-accent text-accent" />
          当前时间 {formatDuration(timeMs)}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <section className="min-w-0">
          <div className="relative overflow-hidden rounded border border-line bg-black">
            <video
              ref={videoRef}
              src={version.videoUrl}
              controls
              className="block aspect-video w-full bg-black"
              onTimeUpdate={syncTime}
              onPause={() => {
                setIsPaused(true);
                syncTime();
              }}
              onPlay={() => setIsPaused(false)}
            />
            <AnnotationCanvas
              annotation={activeComment?.annotation?.payload ?? null}
              draft={draft}
              tool={tool}
              disabled={!isPaused}
              onDraftChange={setDraft}
            />
          </div>

          <form onSubmit={createComment} className="mt-4 rounded border border-line bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex rounded border border-line bg-paper p-1">
                <ToolButton active={tool === "RECT"} onClick={() => setTool("RECT")} title="矩形">
                  <RectangleHorizontal size={17} />
                </ToolButton>
                <ToolButton active={tool === "ARROW"} onClick={() => setTool("ARROW")} title="箭头">
                  <MousePointer2 size={17} />
                </ToolButton>
                <ToolButton active={tool === "FREEHAND"} onClick={() => setTool("FREEHAND")} title="画笔">
                  <Pencil size={17} />
                </ToolButton>
              </div>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="focus-ring flex h-9 w-9 items-center justify-center rounded border border-line bg-white"
                title="清除草稿标注"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={3}
              placeholder={isPaused ? "写下这一帧需要修改或确认的内容" : "暂停视频后可以添加画面标注"}
              className="focus-ring w-full resize-none rounded border border-line px-3 py-2"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm text-stone-500">评论会绑定到 {formatDuration(timeMs)}</span>
              <button
                disabled={!body.trim()}
                className="focus-ring inline-flex items-center gap-2 rounded bg-accent px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                <Send size={17} />
                提交评论
              </button>
            </div>
            {message ? <p className="mt-2 text-sm text-coral">{message}</p> : null}
          </form>
        </section>

        <aside className="min-w-0 rounded border border-line bg-white">
          <div className="border-b border-line p-4">
            <h2 className="font-semibold">审核评论</h2>
            <p className="mt-1 text-sm text-stone-500">{comments.length} 条评论按时间排列</p>
          </div>
          <div className="max-h-[calc(100vh-210px)] overflow-auto p-3">
            {comments.length ? (
              comments.map((comment) => (
                <article
                  key={comment.id}
                  className={`mb-3 rounded border p-3 ${
                    activeId === comment.id ? "border-accent bg-teal-50" : "border-line bg-white"
                  }`}
                >
                  <button
                    onClick={() => jumpTo(comment)}
                    className="mb-2 flex w-full items-center justify-between text-left"
                  >
                    <span className="font-semibold">{formatDuration(comment.timeMs)}</span>
                    <span className="text-sm text-stone-500">
                      {comment.author.name ?? comment.author.email}
                    </span>
                  </button>
                  <p className="whitespace-pre-wrap text-sm leading-6">{comment.body}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <select
                      value={comment.status}
                      onChange={(event) => updateStatus(comment, event.target.value as CommentStatus)}
                      className="focus-ring rounded border border-line bg-white px-2 py-1 text-sm"
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {comment.annotation ? (
                      <span className="text-xs text-stone-500">含画面标注</span>
                    ) : null}
                  </div>
                  {comment.replies.length ? (
                    <div className="mt-3 space-y-2 border-l-2 border-line pl-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="text-sm">
                          <div className="font-medium">{reply.author.name ?? reply.author.email}</div>
                          <p className="text-stone-700">{reply.body}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-3 flex gap-2">
                    <input
                      value={replyText[comment.id] ?? ""}
                      onChange={(event) =>
                        setReplyText((items) => ({ ...items, [comment.id]: event.target.value }))
                      }
                      placeholder="回复"
                      className="focus-ring min-w-0 flex-1 rounded border border-line px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => addReply(comment)}
                      className="focus-ring rounded bg-ink px-3 py-1 text-sm font-semibold text-white"
                    >
                      发送
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded border border-dashed border-line p-8 text-center text-sm text-stone-500">
                暂停视频，在画面上标注并提交第一条评论。
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function ToolButton({
  active,
  title,
  onClick,
  children
}: {
  active: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`focus-ring flex h-9 w-9 items-center justify-center rounded ${
        active ? "bg-ink text-white" : "text-stone-700 hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}

function formatDuration(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}
