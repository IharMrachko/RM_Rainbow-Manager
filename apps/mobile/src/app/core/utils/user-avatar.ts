export function userAvatarInitials(
  displayName?: string | null,
  email?: string | null,
): string {
  const name = (displayName || '').trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  const mail = (email || '').trim();
  if (!mail) return '?';
  const local = mail.split('@')[0] || mail;
  const chunks = local.split(/[._\-+]/).filter(Boolean);
  if (chunks.length >= 2) {
    return (chunks[0][0] + chunks[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}
