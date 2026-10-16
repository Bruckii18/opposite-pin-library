import { z } from 'zod';
import { validatePinString, type PinString } from '../wcl/pinString';

export const CURRENT_SCHEMA_VERSION = 1;

export const savedPinIdSchema = z.string().min(1).brand<'SavedPinId'>();
export const pinSetIdSchema = z.string().min(1).brand<'PinSetId'>();

export const pinStringSchema = z.string().transform((raw, context): PinString => {
  const validation = validatePinString(raw);
  if (!validation.valid) {
    context.addIssue({ code: 'custom', message: validation.reason });
    return z.NEVER;
  }
  return validation.pinString;
});

const timestampSchema = z.iso.datetime();

export const savedPinSchema = z.object({
  id: savedPinIdSchema,
  name: z.string().min(1),
  description: z.string(),
  tags: z.array(z.string()),
  pinString: pinStringSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const pinSetSchema = z.object({
  id: pinSetIdSchema,
  name: z.string().min(1),
  description: z.string(),
  tags: z.array(z.string()),
  pinIds: z.array(savedPinIdSchema),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const pinLibrarySchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  pins: z.array(savedPinSchema),
  sets: z.array(pinSetSchema),
});

export type SavedPinId = z.infer<typeof savedPinIdSchema>;
export type PinSetId = z.infer<typeof pinSetIdSchema>;
export type SavedPin = z.infer<typeof savedPinSchema>;
export type PinSet = z.infer<typeof pinSetSchema>;
export type PinLibrary = z.infer<typeof pinLibrarySchema>;

export function createEmptyLibrary(): PinLibrary {
  return { schemaVersion: CURRENT_SCHEMA_VERSION, pins: [], sets: [] };
}
