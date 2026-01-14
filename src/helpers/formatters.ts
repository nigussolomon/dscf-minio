export function obfuscateSecret(secret: string | null) {
  if (!secret) return null;
  return `${secret.slice(0, 4)}****${secret.slice(-4)}`;
}
