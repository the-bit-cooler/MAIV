export function getSecureStorageKeyFromEmail(email: string): string {
  return email.replace(/[^a-zA-Z0-9._-]/g, '_'); // replace invalid chars
}
