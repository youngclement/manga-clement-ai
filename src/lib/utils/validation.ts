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
  config: z.object({
    style: z.string().optional(),
    inking: z.string().optional(),
    screentone: z.string().optional(),
    layout: z.string().optional(),
    aspectRatio: z.string().optional(),
    useColor: z.boolean().optional(),
    language: z.string().optional(),
    dialogueDensity: z.string().optional(),
    context: z.string().optional(),
    storyDirection: z.string().optional(),
    referenceImages: z.array(z.any()).optional(),
  }).required(),
  sessionHistory: z.array(z.any()).optional(),
  isAutoContinue: z.boolean().optional(),
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
