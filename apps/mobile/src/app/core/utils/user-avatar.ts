/** Start-page rainbow used when the user has no profile photo. */
export const DEFAULT_USER_AVATAR = 'assets/rainbow.png';

export function userAvatarInitials(
  displayName: string | null | undefined,
  email: string | null | undefined,
): string {
  const name = (displayName ?? '').trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }
  const mail = (email ?? '').trim();
  return mail ? mail.charAt(0).toUpperCase() : '?';
}

export function hasUserPhoto(photoUrl: string | null | undefined): boolean {
  return typeof photoUrl === 'string' && photoUrl.trim().length > 0;
}

/** Profile photo when present; otherwise the app start-page rainbow. */
export function resolveUserAvatarUrl(photoUrl: string | null | undefined): string {
  const trimmed = typeof photoUrl === 'string' ? photoUrl.trim() : '';
  return trimmed || DEFAULT_USER_AVATAR;
}
