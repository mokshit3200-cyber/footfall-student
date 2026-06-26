export function sanitizeText(s: string, maxLen = 500): string {
  return s.replace(/<[^>]*>/g, "").replace(/[<>"'`]/g, "").trim().slice(0, maxLen);
}

export function sanitizeHandle(s: string): string {
  return s.replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 100);
}

export function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
}

export function isValidTime(s: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

export function isSafeUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function isValidImageFile(file: File, maxMb = 5): boolean {
  return file.type.startsWith("image/") && file.size <= maxMb * 1024 * 1024;
}
