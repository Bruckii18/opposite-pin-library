const JSON_MIME_TYPE = 'application/json';
const JSON_INDENTATION = 2;

export function downloadJsonFile(fileName: string, content: unknown): void {
  const blob = new Blob([JSON.stringify(content, null, JSON_INDENTATION)], { type: JSON_MIME_TYPE });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
