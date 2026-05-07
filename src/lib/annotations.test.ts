import { describe, expect, it } from "vitest";
import { annotationPayloadSchema, denormalizePoint, normalizePoint } from "@/lib/annotations";

describe("annotation helpers", () => {
  it("normalizes and restores points", () => {
    const normalized = normalizePoint({ x: 320, y: 180 }, { width: 640, height: 360 });
    expect(normalized).toEqual({ x: 0.5, y: 0.5 });
    expect(denormalizePoint(normalized, { width: 640, height: 360 })).toEqual({
      x: 320,
      y: 180
    });
  });

  it("rejects out-of-frame annotation payloads", () => {
    expect(() =>
      annotationPayloadSchema.parse({
        kind: "RECT",
        rect: { x: 1.2, y: 0, width: 0.2, height: 0.2 }
      })
    ).toThrow();
  });
});
