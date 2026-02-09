import { z } from 'zod';

export const projectSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
  title: z.string().optional(),
  pages: z.array(z.any()).optional(),
  sessions: z.array(z.any()).optional(),
});

export const imageSchema = z.object({
  id: z.string().min(1, 'Image ID is required'),
  imageData: z.string().min(1, 'Image data is required'),
});

export const batchImagesSchema = z.object({
  images: z.array(imageSchema).min(1, 'At least one image is required'),
});

export const generateRequestSchema = z.object({
  prompt: z.string().optional(),
  // Config is intentionally very permissive – all fields optional.
  // This avoids blocking generation when the client omits any config keys.
  config: z.record(z.any()).optional(),
  sessionHistory: z.array(z.any()).optional(),
  // Accepts true/false, null, or undefined so the client can omit or send null.
  isAutoContinue: z.boolean().optional().nullable(),
});

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
}

export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
  };
}
