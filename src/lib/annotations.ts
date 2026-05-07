import { z } from "zod";

export const pointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1)
});

export const annotationPayloadSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("RECT"),
    rect: z.object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
      width: z.number().min(0).max(1),
      height: z.number().min(0).max(1)
    })
  }),
  z.object({
    kind: z.literal("ARROW"),
    start: pointSchema,
    end: pointSchema
  }),
  z.object({
    kind: z.literal("FREEHAND"),
    points: z.array(pointSchema).min(2).max(500)
  })
]);

export type AnnotationPayload = z.infer<typeof annotationPayloadSchema>;

export function normalizePoint(
  point: { x: number; y: number },
  box: { width: number; height: number }
) {
  return {
    x: clamp(point.x / box.width),
    y: clamp(point.y / box.height)
  };
}

export function denormalizePoint(
  point: { x: number; y: number },
  box: { width: number; height: number }
) {
  return {
    x: point.x * box.width,
    y: point.y * box.height
  };
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}
