import { z } from 'zod';
import { validatePinString, type PinString } from '../wcl/pinString';
import { sanitizeViewParams } from '../wcl/viewParams';

export const CURRENT_SCHEMA_VERSION = 5;

export const libraryEntryIdSchema = z.string().min(1).brand<'LibraryEntryId'>();

export const pinStringSchema = z.string().transform((raw, context): PinString => {
  const validation = validatePinString(raw);
  if (!validation.valid) {
    context.addIssue({ code: 'custom', message: validation.reason });
    return z.NEVER;
  }
  return validation.pinString;
});

export const viewParamsSchema = z.record(z.string(), z.unknown()).transform(sanitizeViewParams);

const timestampSchema = z.iso.datetime();

export const libraryEntrySchema = z.object({
  id: libraryEntryIdSchema,
  name: z.string().min(1),
  description: z.string(),
  tags: z.array(z.string()),
  pins: z.array(pinStringSchema),
  viewParams: viewParamsSchema.optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const pinLibrarySchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  entries: z.array(libraryEntrySchema),
});

export type LibraryEntryId = z.infer<typeof libraryEntryIdSchema>;
export type LibraryEntry = z.infer<typeof libraryEntrySchema>;
export type PinLibrary = z.infer<typeof pinLibrarySchema>;

export function createEmptyLibrary(): PinLibrary {
  return { schemaVersion: CURRENT_SCHEMA_VERSION, entries: [] };
}
