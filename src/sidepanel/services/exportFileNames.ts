const FILE_NAME_PREFIX = 'opposite-pins';
const JSON_EXTENSION = '.json';
const NON_SLUG_CHARACTERS = /[^a-z0-9]+/g;
const EDGE_DASHES = /^-+|-+$/g;
const ISO_DATE_LENGTH = 'YYYY-MM-DD'.length;

export function libraryExportFileName(exportedAt: string): string {
  return `${FILE_NAME_PREFIX}-library-${exportedAt.slice(0, ISO_DATE_LENGTH)}${JSON_EXTENSION}`;
}

export function setExportFileName(setName: string, exportedAt: string): string {
  return `${FILE_NAME_PREFIX}-set-${slugify(setName)}-${exportedAt.slice(0, ISO_DATE_LENGTH)}${JSON_EXTENSION}`;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(NON_SLUG_CHARACTERS, '-').replace(EDGE_DASHES, '');
}
