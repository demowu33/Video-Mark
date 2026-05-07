"use client";

import { useEffect, useRef, useState } from "react";
import type { AnnotationPayload } from "@/lib/annotations";

type Tool = "RECT" | "ARROW" | "FREEHAND";

export function AnnotationCanvas({
  annotation,
  draft,
  tool,
  disabled,
  onDraftChange
}: {
  annotation?: AnnotationPayload | null;
  draft?: AnnotationPayload | null;
  tool: Tool;
  disabled?: boolean;
  onDraftChange: (annotation: AnnotationPayload | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width));
      canvas.height = Math.max(1, Math.round(rect.height));
      draw(canvas, annotation ?? null, draft ?? null);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [annotation, draft]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) draw(canvas, annotation ?? null, draft ?? null);
  }, [annotation, draft]);

  function pointFromEvent(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) / rect.width),
      y: clamp((event.clientY - rect.top) / rect.height)
    };
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    const point = pointFromEvent(event);
    setStart(point);
    setDrawing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (tool === "FREEHAND") {
      onDraftChange({ kind: "FREEHAND", points: [point, point] });
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing || !start || disabled) return;
    const point = pointFromEvent(event);
    if (tool === "RECT") {
      onDraftChange({
        kind: "RECT",
        rect: {
          x: Math.min(start.x, point.x),
          y: Math.min(start.y, point.y),
          width: Math.abs(point.x - start.x),
          height: Math.abs(point.y - start.y)
        }
      });
    }
    if (tool === "ARROW") {
      onDraftChange({ kind: "ARROW", start, end: point });
    }
    if (tool === "FREEHAND") {
      onDraftChange((draft?.kind === "FREEHAND"
        ? { kind: "FREEHAND", points: [...draft.points, point].slice(-500) }
        : { kind: "FREEHAND", points: [start, point] }) as AnnotationPayload);
    }
  }

  function onPointerUp() {
    setDrawing(false);
    setStart(null);
  }

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 h-full w-full ${disabled ? "pointer-events-none" : "cursor-crosshair"}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    />
  );
}

function draw(
  canvas: HTMLCanvasElement,
  annotation: AnnotationPayload | null,
  draft: AnnotationPayload | null
) {
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (annotation) drawAnnotation(context, canvas, annotation, "#d85f45", false);
  if (draft) drawAnnotation(context, canvas, draft, "#0f766e", true);
}

function drawAnnotation(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  annotation: AnnotationPayload,
  color: string,
  dashed: boolean
) {
  context.save();
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = 3;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.setLineDash(dashed ? [7, 7] : []);

  if (annotation.kind === "RECT") {
    const { x, y, width, height } = annotation.rect;
    context.strokeRect(x * canvas.width, y * canvas.height, width * canvas.width, height * canvas.height);
  }

  if (annotation.kind === "ARROW") {
    drawArrow(
      context,
      annotation.start.x * canvas.width,
      annotation.start.y * canvas.height,
      annotation.end.x * canvas.width,
      annotation.end.y * canvas.height
    );
  }

  if (annotation.kind === "FREEHAND") {
    context.beginPath();
    annotation.points.forEach((point, index) => {
      const x = point.x * canvas.width;
      const y = point.y * canvas.height;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
  }

  context.restore();
}

function drawArrow(
  context: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const head = 14;
  context.beginPath();
  context.moveTo(fromX, fromY);
  context.lineTo(toX, toY);
  context.stroke();
  context.beginPath();
  context.moveTo(toX, toY);
  context.lineTo(toX - head * Math.cos(angle - Math.PI / 6), toY - head * Math.sin(angle - Math.PI / 6));
  context.lineTo(toX - head * Math.cos(angle + Math.PI / 6), toY - head * Math.sin(angle + Math.PI / 6));
  context.closePath();
  context.fill();
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}
