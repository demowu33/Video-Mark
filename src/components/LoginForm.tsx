"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestCode() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/auth/request-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(data.error ?? "验证码发送失败");
      return;
    }
    setDevCode(data.devCode ?? "");
    setMessage("验证码已生成，请查看邮件或开发环境提示。");
  }

  async function verify() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code })
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(data.error ?? "登录失败");
      return;
    }
    router.push("/projects");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">邮箱</span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="name@company.com"
          className="focus-ring mt-1 w-full rounded border border-line px-3 py-2"
        />
      </label>
      <button
        type="button"
        disabled={loading || !email}
        onClick={requestCode}
        className="focus-ring w-full rounded bg-ink px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        获取验证码
      </button>
      {devCode ? (
        <div className="rounded border border-line bg-paper p-3 text-sm">
          开发环境验证码：<span className="font-mono font-bold">{devCode}</span>
        </div>
      ) : null}
      <label className="block">
        <span className="text-sm font-medium">验证码</span>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          inputMode="numeric"
          maxLength={6}
          className="focus-ring mt-1 w-full rounded border border-line px-3 py-2"
        />
      </label>
      <button
        type="button"
        disabled={loading || !email || code.length !== 6}
        onClick={verify}
        className="focus-ring w-full rounded bg-accent px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        登录
      </button>
      {message ? <p className="text-sm text-stone-600">{message}</p> : null}
    </div>
  );
}
